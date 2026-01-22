from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
import httpx
import json
import re
import hashlib
import time
import asyncio
from collections import OrderedDict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Gemini model - use gemini-2.5-flash (newest, highest free tier quota)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ CACHING ============
class SimpleCache:
    """Simple in-memory cache with TTL and LRU eviction"""
    def __init__(self, max_size=500, ttl=3600):  # 1 hour cache
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl
    
    def _hash_key(self, job_description: str) -> str:
        """Create a hash key from job description"""
        return hashlib.md5(job_description.strip().lower().encode()).hexdigest()
    
    def get(self, job_description: str):
        key = self._hash_key(job_description)
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry['time'] < self.ttl:
                self.cache.move_to_end(key)
                logger.info(f"Cache HIT for JD hash: {key[:8]}...")
                return entry['data']
            else:
                del self.cache[key]
        return None
    
    def set(self, job_description: str, data):
        key = self._hash_key(job_description)
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
        self.cache[key] = {'data': data, 'time': time.time()}
        logger.info(f"Cached result for JD hash: {key[:8]}...")

# Initialize cache (1 hour TTL, 500 items max)
cache = SimpleCache(max_size=500, ttl=3600)

# Track in-flight requests to prevent duplicates
in_flight_requests = {}  # request_hash -> asyncio.Event

# ============ MODELS ============
class DecodeRequest(BaseModel):
    api_key: str
    job_description: str


class DecodeResponse(BaseModel):
    mustHave: list[str]
    niceToHave: list[str]
    keywords: list[str]
    insights: list[str]


@api_router.get("/")
async def root():
    return {"message": "JD Decoder API"}


async def call_gemini_with_retry(api_key: str, prompt: str, max_retries: int = 3) -> dict:
    """
    Call Gemini API with exponential backoff retry on rate limits.
    """
    gemini_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={api_key}"
    )
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2048
        }
    }
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    gemini_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    return response.json()
                
                if response.status_code == 429:
                    # Rate limited - exponential backoff
                    wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                    logger.warning(f"Rate limited by Gemini API. Attempt {attempt + 1}/{max_retries}. Waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    last_error = HTTPException(
                        status_code=429, 
                        detail=f"Gemini API is busy. Retrying... (attempt {attempt + 1}/{max_retries})"
                    )
                    continue
                
                if response.status_code == 400:
                    logger.error(f"Bad request to Gemini API: {response.text}")
                    raise HTTPException(status_code=400, detail="Invalid API key or malformed request")
                
                if response.status_code == 403:
                    logger.error(f"Permission denied: {response.text}")
                    raise HTTPException(status_code=403, detail="API key does not have permission for this model")
                
                if response.status_code == 404:
                    logger.error(f"Model not found: {response.text}")
                    raise HTTPException(status_code=404, detail=f"Model {GEMINI_MODEL} not found. Try a different model.")
                
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"Gemini API error: {response.status_code}")
                
        except httpx.TimeoutException:
            wait_time = (2 ** attempt) * 2
            logger.warning(f"Timeout. Attempt {attempt + 1}/{max_retries}. Waiting {wait_time}s...")
            await asyncio.sleep(wait_time)
            last_error = HTTPException(status_code=504, detail="Request timed out")
            continue
        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=500, detail="Failed to connect to Gemini API")
    
    # All retries exhausted
    if last_error:
        raise last_error
    raise HTTPException(status_code=429, detail="Gemini API rate limit exceeded after retries. Please wait a minute and try again.")


def parse_gemini_response(response_text: str) -> dict:
    """Parse JSON from Gemini response text"""
    cleaned = response_text.strip()
    cleaned = re.sub(r'^```json\s*', '', cleaned)
    cleaned = re.sub(r'^```\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError(f"Could not parse JSON from response: {response_text[:200]}")


@api_router.post("/decode", response_model=DecodeResponse)
async def decode_job_description(request: DecodeRequest):
    """
    Analyze a job description using Gemini API.
    Features: caching, request deduplication, retry with backoff.
    """
    
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")
    
    if not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")
    
    # Check cache first (uses JD text only, not API key)
    cached_result = cache.get(request.job_description)
    if cached_result:
        logger.info("Returning cached result")
        return DecodeResponse(**cached_result)
    
    # Create request fingerprint for deduplication
    jd_hash = hashlib.md5(request.job_description.strip().lower().encode()).hexdigest()
    
    # Check if same JD is already being processed
    if jd_hash in in_flight_requests:
        logger.info(f"Duplicate request detected for JD hash: {jd_hash[:8]}. Waiting for original...")
        try:
            # Wait for the original request to complete (max 90 seconds)
            await asyncio.wait_for(in_flight_requests[jd_hash].wait(), timeout=90.0)
            # Check cache again after waiting
            cached_result = cache.get(request.job_description)
            if cached_result:
                return DecodeResponse(**cached_result)
        except asyncio.TimeoutError:
            pass
    
    # Mark this JD as being processed
    event = asyncio.Event()
    in_flight_requests[jd_hash] = event
    
    try:
        # Build prompt
        prompt = f"""Analyze the following job description and extract key information.

Return ONLY a valid JSON object with these exact fields:
- mustHave: array of critical required skills and qualifications (be specific)
- niceToHave: array of preferred/optional skills
- keywords: array of important ATS-friendly keywords for resume optimization
- insights: array of observations including red flags, company culture hints, unrealistic expectations, or notable benefits

Be concise, practical, and actionable. No markdown formatting. No explanations outside the JSON.

Job Description:
{request.job_description}"""

        # Call Gemini with retry
        data = await call_gemini_with_retry(request.api_key, prompt)
        
        # Extract text from Gemini response
        if not data.get("candidates") or not data["candidates"][0].get("content"):
            logger.error(f"Unexpected Gemini response structure: {data}")
            raise HTTPException(status_code=500, detail="Unexpected response from Gemini API")
        
        response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Parse JSON
        try:
            parsed = parse_gemini_response(response_text)
        except (ValueError, json.JSONDecodeError) as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            raise HTTPException(status_code=500, detail="Could not parse analysis results")
        
        # Build result
        result_data = {
            "mustHave": parsed.get("mustHave", []),
            "niceToHave": parsed.get("niceToHave", []),
            "keywords": parsed.get("keywords", []),
            "insights": parsed.get("insights", [])
        }
        
        # Cache the result
        cache.set(request.job_description, result_data)
        
        return DecodeResponse(**result_data)
        
    finally:
        # Signal that this request is complete
        event.set()
        # Clean up after a delay to allow other waiters to get the cached result
        await asyncio.sleep(0.1)
        in_flight_requests.pop(jd_hash, None)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    print(f"Starting JD Decoder API with model: {GEMINI_MODEL}")
    print("Cache TTL: 1 hour | Max retries: 3 with exponential backoff")
    uvicorn.run(app, host="0.0.0.0", port=8000)
