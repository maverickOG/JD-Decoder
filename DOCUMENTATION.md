# JD Decoder - Complete Technical Documentation

**A comprehensive guide to understanding every part of the JD Decoder application.**

> This documentation is written for your personal reference to understand how this "vibe-coded" project works.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Frontend - Complete Breakdown](#frontend---complete-breakdown)
4. [Backend - Complete Breakdown](#backend---complete-breakdown)
5. [Data Flow](#data-flow)
6. [Technologies & Dependencies](#technologies--dependencies)
7. [Key Concepts](#key-concepts)
8. [Configuration & Environment](#configuration--environment)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Architecture Overview

JD Decoder is a **full-stack web application** with the following high-level architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (Port 3000)                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Frontend (JobDescriptionDecoder.jsx)           │  │
│  │  - User inputs API key                               │  │
│  │  - User pastes job description                       │  │
│  │  - Makes HTTP POST to backend                        │  │
│  │  - Displays results                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                 HTTP POST /api/decode
                    (JSON payload)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/decode endpoint (server.py)                    │  │
│  │  - Validates input                                   │  │
│  │  - Checks cache (1 hour TTL)                         │  │
│  │  - Handles request deduplication                     │  │
│  │  - Calls Gemini API with retry logic                │  │
│  │  - Parses response                                   │  │
│  │  - Caches result                                     │  │
│  │  - Returns JSON to frontend                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                 HTTPS Request with API Key
           (Google Gemini v1beta API endpoint)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Gemini API                                  │
│  generativelanguage.googleapis.com/v1beta/models             │
│                                                               │
│  Model: gemini-2.5-flash                                     │
│  - Analyzes job description                                  │
│  - Returns JSON with analysis                                │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Frontend and backend are **separate processes**
- Frontend makes **API calls** to backend (not direct API calls to Google)
- Backend acts as a **proxy** to Google's Gemini API
- Results are **cached** to reduce API calls and costs
- **Automatic retry** on rate limits with exponential backoff

---

## Project Structure

```
jd-decoder/
│
├── frontend/                          # React web application
│   ├── src/
│   │   ├── App.js                    # Main app component
│   │   ├── index.js                  # React entry point
│   │   ├── App.css                   # Global styles
│   │   ├── index.css                 # Global CSS
│   │   │
│   │   ├── pages/
│   │   │   ├── JobDescriptionDecoder.jsx    # Main page - USER INTERFACE
│   │   │   └── JobDecoder.jsx                # Alternative page (unused)
│   │   │
│   │   ├── components/
│   │   │   ├── Header.jsx            # Top navigation
│   │   │   ├── Footer.jsx            # Bottom footer
│   │   │   ├── LoadingState.jsx      # Loading spinner during analysis
│   │   │   ├── ResultsSection.jsx    # Display analysis results
│   │   │   │
│   │   │   └── ui/                   # Pre-built Radix UI components
│   │   │       ├── button.jsx        # Clickable button
│   │   │       ├── input.jsx         # Text input field
│   │   │       ├── textarea.jsx      # Large text area
│   │   │       ├── card.jsx          # Card container
│   │   │       ├── badge.jsx         # Small label/badge
│   │   │       ├── accordion.jsx     # Expandable sections
│   │   │       └── ... (50+ other UI components)
│   │   │
│   │   ├── hooks/
│   │   │   └── use-toast.js          # Toast notification hook
│   │   │
│   │   └── lib/
│   │       └── utils.js              # Helper functions
│   │
│   ├── public/
│   │   └── index.html                # HTML entry point
│   │
│   ├── .env                          # Environment variables
│   ├── package.json                  # Node dependencies
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── craco.config.js               # Create React App config override
│   ├── jsconfig.json                 # JavaScript config
│   └── postcss.config.js             # CSS processing config
│
├── backend/                          # Python FastAPI server
│   ├── server.py                     # MAIN BACKEND FILE - All API logic
│   ├── requirements.txt              # Python dependencies
│   ├── venv/                         # Virtual environment
│   └── .env                          # Backend environment variables
│
├── README.md                         # Project overview
├── .gitignore                        # Files to ignore in git
└── DOCUMENTATION.md                  # THIS FILE
```

---

## Frontend - Complete Breakdown

### 1. **Main Entry Point: `frontend/src/index.js`**

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**What it does:**
- Finds the HTML element with ID `root` in `public/index.html`
- Renders the React `App` component into that element
- This is the **entry point** for the entire React application

**Why no React.StrictMode?**
- We removed it because it was causing **double API calls** during development
- React.StrictMode intentionally runs effects twice to catch bugs, but it was making duplicate API requests

---

### 2. **Main App Component: `frontend/src/App.js`**

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobDescriptionDecoder from './pages/JobDescriptionDecoder';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JobDescriptionDecoder />} />
      </Routes>
    </Router>
  );
}
```

**What it does:**
- Sets up **routing** for the application (React Router)
- Currently only has **one route**: `/` (home page)
- When you visit `localhost:3000/`, it shows the `JobDescriptionDecoder` page
- Acts as the **main wrapper** for the entire app

---

### 3. **Main Page: `frontend/src/pages/JobDescriptionDecoder.jsx`**

This is the **heart of the frontend**. It's where users interact with the app.

#### **Component State Management**

```javascript
const [apiKey, setApiKey] = useState('');                    // User's Gemini API key
const [jobDescription, setJobDescription] = useState('');    // The JD text
const [isLoading, setIsLoading] = useState(false);           // Loading spinner state
const [results, setResults] = useState(null);                // Analysis results
const [showApiKey, setShowApiKey] = useState(false);         // Show/hide API key
const [hasConsented, setHasConsented] = useState(false);     // Privacy checkbox
const isRequestInFlight = useRef(false);                     // Prevent duplicate requests
```

**What each state does:**
- **apiKey**: Stores the user's Google Gemini API key
- **jobDescription**: Stores the JD text they paste
- **isLoading**: True while waiting for API response (shows spinner)
- **results**: Stores the analysis response from backend
- **showApiKey**: Whether to show the API key as text or hidden as password
- **hasConsented**: Whether they've checked "remember me"
- **isRequestInFlight**: Prevents sending duplicate requests if user clicks button twice

#### **useEffect - Run on Component Mount**

```javascript
useEffect(() => {
  const savedApiKey = localStorage.getItem('gemini_api_key');
  const savedConsent = localStorage.getItem('api_key_consent');
  if (savedApiKey) {
    setApiKey(savedApiKey);
  }
  if (savedConsent === 'true') {
    setHasConsented(true);
  }
}, []);
```

**What it does:**
- Runs **once when page loads**
- Checks browser's `localStorage` for a saved API key
- If found, loads it into the form (so user doesn't have to paste it again)
- Also loads the "remember me" checkbox state

#### **localStorage - Browser Storage**

LocalStorage is like the browser's **tiny database**. It persists data even after closing the browser.

```javascript
localStorage.setItem('gemini_api_key', value);      // Save API key
localStorage.getItem('gemini_api_key');              // Retrieve API key
localStorage.removeItem('gemini_api_key');           // Delete API key
```

**Security Note:** API keys in localStorage aren't encrypted. They're visible to JavaScript if someone hacks the page. This is why the app shows a note: "Your key is stored locally and never sent to our servers."

#### **The Main Function: `analyzeJobDescription()`**

This is triggered when user clicks "Decode JD" button.

```javascript
const analyzeJobDescription = async () => {
  // Step 1: Prevent duplicate requests
  if (isRequestInFlight.current) {
    console.log('Request already in flight, ignoring');
    return;
  }
  
  // Step 2: Validate inputs
  if (!apiKey.trim()) {
    toast.error('Please enter your Gemini API key');
    return;
  }

  if (!jobDescription.trim()) {
    toast.error('Please paste a job description to analyze');
    return;
  }

  // Step 3: Set loading state
  isRequestInFlight.current = true;
  setIsLoading(true);
  setResults(null);

  try {
    // Step 4: Make API call to backend
    const response = await fetch(`${BACKEND_URL}/api/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        job_description: jobDescription
      })
    });
    
    // Step 5: Check if response is OK
    console.log('API response status:', response);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze job description');
    }

    // Step 6: Parse response
    const data = await response.json();
    setResults(data);
    toast.success('Job description analyzed successfully!');

  } catch (error) {
    console.error('Analysis error:', error);
    toast.error(error.message || 'Failed to analyze job description. Please try again.');
  } finally {
    // Step 7: Clean up loading state
    setIsLoading(false);
    isRequestInFlight.current = false;
  }
};
```

**Step-by-step breakdown:**

1. **Prevent Duplicates:** `isRequestInFlight.useRef()` prevents sending the same request twice if user clicks button rapidly
2. **Validate:** Check that API key and JD aren't empty
3. **Set Loading:** Show spinner, clear previous results
4. **Make Request:** POST to backend with API key and JD text
5. **Check Status:** If `response.ok` is false (error), throw error
6. **Parse:** Convert response to JSON and store in state
7. **Cleanup:** Hide spinner, reset `isRequestInFlight`

**Key HTTP Details:**
- **Method:** POST (sending data to server)
- **URL:** `http://localhost:8000/api/decode` (backend endpoint)
- **Body:** JSON with `api_key` and `job_description`

#### **Try/Catch/Finally Pattern**

```javascript
try {
  // Code that might fail
} catch (error) {
  // Handle errors
} finally {
  // Always runs - cleanup
}
```

- **try**: Attempt to fetch and parse response
- **catch**: If anything throws an error, show error toast
- **finally**: Always reset `isLoading` and `isRequestInFlight` to clean up UI state

#### **UI Components - The Visual Part**

The component returns JSX (looks like HTML):

```javascript
return (
  <div className="min-h-screen flex flex-col">
    <Header />
    
    <main className="flex-1 container mx-auto px-4 py-8">
      {/* Hero section with title */}
      {/* API Key input card */}
      {/* Job description input card */}
      {/* Loading spinner (if isLoading) */}
      {/* Results section (if results exist) */}
    </main>

    <Footer />
  </div>
);
```

**Classes are Tailwind CSS:**
- `min-h-screen` = minimum height 100vh (full screen)
- `flex flex-col` = flexbox column layout
- `container mx-auto` = centered container with max width
- `px-4 py-8` = padding (x=horizontal, y=vertical)

---

### 4. **Components: Header, Footer, LoadingState, ResultsSection**

#### **Header.jsx**
```javascript
export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">JD Decoder</h1>
        <p className="text-muted-foreground">AI-Powered Job Description Analyzer</p>
      </div>
    </header>
  );
}
```
- Displays the app **title** and **tagline**
- Appears at the **top** of every page
- Has a **bottom border** to separate from content

#### **Footer.jsx**
- Displays **copyright** and **links**
- Appears at the **bottom** of the page
- Contains social links and attribution

#### **LoadingState.jsx**
```javascript
export default function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin mb-4">⏳</div>
        <p className="text-muted-foreground">Analyzing job description...</p>
      </div>
    </div>
  );
}
```
- Shows a **spinning emoji** while waiting for API response
- Only renders if `isLoading === true`

#### **ResultsSection.jsx**
```javascript
export default function ResultsSection({ results }) {
  return (
    <div className="space-y-6">
      {/* Must-Have Skills Card */}
      {/* Nice-To-Have Skills Card */}
      {/* ATS Keywords Card */}
      {/* Insights Card */}
    </div>
  );
}
```
- **Receives** results as props from parent component
- Displays analysis in **organized cards**
- Shows:
  - Must-have skills (critical)
  - Nice-to-have skills (optional)
  - Keywords (for resume)
  - Insights (red flags, culture hints)

---

### 5. **UI Components: The Radix UI Library**

The `components/ui/` folder contains **pre-built components**:

- **button.jsx**: Clickable button with variants
- **input.jsx**: Text input field
- **textarea.jsx**: Multi-line text input
- **card.jsx**: Card container with header/content/footer
- **badge.jsx**: Small label/tag
- **dropdown-menu.jsx**: Menu that opens on click
- **dialog.jsx**: Modal popup

**Why use Radix UI?**
- **Accessibility**: Built-in keyboard navigation
- **Customizable**: Works with Tailwind CSS
- **No JS needed**: Pure HTML semantics
- **Already styled**: Comes with basic styling

Example of using card:
```javascript
<Card>
  <CardHeader>
    <CardTitle>Must-Have Skills</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Card content goes here */}
  </CardContent>
``` 

---

### 6. **Styling: Tailwind CSS**

Tailwind is a **utility-first CSS framework**. Instead of writing CSS files, you use class names.

**Common Tailwind classes:**
- `flex`: Use flexbox layout
- `grid`: Use CSS Grid
- `gap-4`: Space between items (1rem)
- `mb-4`: Margin bottom (1rem)
- `px-4 py-8`: Padding horizontal and vertical
- `text-center`: Center text
- `bg-blue-500`: Blue background
- `hover:bg-blue-600`: Darker on hover
- `dark:bg-gray-900`: Different color in dark mode
- `text-gradient`: Custom gradient text (defined in config)

**No CSS files needed** - styling is done entirely in JSX:
```javascript
<div className="flex flex-col gap-4 bg-white rounded-lg p-6 shadow">
  {/* Content */}
</div>
```

---

### 7. **Environment Variables: `.env`**

```
REACT_APP_BACKEND_URL=http://localhost:8000
```

**What is this?**
- **Stored** in `frontend/.env` file
- **Loaded by React** during build time
- **Accessed** as `process.env.REACT_APP_BACKEND_URL`

**Why needed?**
- In development: Backend at `localhost:8000`
- In production: Backend at `example.com/api`
- Without `.env`, you'd have to edit code for each environment

---

## Backend - Complete Breakdown

### 1. **Main Backend File: `backend/server.py`**

This is the **entire backend logic** in one file. It's a FastAPI application.

#### **Imports - What we're using**

```python
from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os, logging, httpx, json, re, hashlib, time, asyncio
from collections import OrderedDict
from pydantic import BaseModel
```

**What each import does:**
- **FastAPI**: Web framework for building APIs
- **APIRouter**: Groups related endpoints
- **HTTPException**: Raise HTTP errors (404, 500, etc.)
- **CORSMiddleware**: Allow frontend to make requests (Cross-Origin Resource Sharing)
- **load_dotenv**: Load `.env` file variables
- **os**: Access environment variables
- **httpx**: Make HTTP requests (to Gemini API)
- **json/re**: Parse and clean JSON
- **hashlib**: Create MD5 hashes
- **asyncio**: Async/await for concurrent requests
- **OrderedDict**: Dictionary that remembers order (for cache)
- **BaseModel**: Create request/response data types

#### **Configuration**

```python
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
```

**What it does:**
- **load_dotenv**: Load variables from `.env` file
- **FastAPI()**: Create the web application
- **APIRouter**: Create a router for `/api/*` endpoints
- **GEMINI_MODEL**: Get model name from `.env` or default to `gemini-2.5-flash`

#### **Caching: The SimpleCache Class**

This is **custom caching logic** - not a library, but code we wrote.

```python
class SimpleCache:
    def __init__(self, max_size=500, ttl=3600):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl  # Time To Live - 3600 seconds = 1 hour
    
    def _hash_key(self, job_description: str) -> str:
        """Create a hash key from job description"""
        return hashlib.md5(job_description.strip().lower().encode()).hexdigest()
```

**How caching works:**

1. **Hash the JD**: Convert the job description text to a fixed-length hash (MD5)
   - Same JD always produces same hash
   - Different JD produces different hash
   
2. **Store in OrderedDict**: 
   ```
   cache = {
     "a1b2c3d4e5f6...": {
       "data": {...analysis results...},
       "time": 1705948000.123  # timestamp
     }
   }
   ```

3. **When getting from cache**:
   ```python
   def get(self, job_description: str):
       key = self._hash_key(job_description)
       if key in self.cache:
           entry = self.cache[key]
           if time.time() - entry['time'] < self.ttl:  # Not expired?
               self.cache.move_to_end(key)  # Mark as recently used
               return entry['data']
   ```
   - Check if hash exists in cache
   - Check if **not expired** (less than 1 hour old)
   - Move to end (LRU - Least Recently Used)
   - Return the cached data

4. **When setting cache**:
   ```python
   def set(self, job_description: str, data):
       key = self._hash_key(job_description)
       if len(self.cache) >= self.max_size:  # Too many?
           self.cache.popitem(last=False)     # Remove oldest
       self.cache[key] = {'data': data, 'time': time.time()}
   ```
   - If cache is full (500 items), remove the oldest one
   - Add new item with current timestamp

**Benefits of caching:**
- Same JD analyzed twice? Use cached result (instant)
- Reduces API calls to Google (saves money)
- Reduces rate limit issues (fewer API calls)

---

#### **Rate Limiting & Retry Logic**

Google's API has rate limits:
- Free tier: ~10-15 requests per minute
- When limit hit: Returns 429 "Too Many Requests"

Our code **handles this automatically**:

```python
async def call_gemini_with_retry(api_key: str, prompt: str, max_retries: int = 3) -> dict:
    """Call Gemini API with exponential backoff retry on rate limits."""
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(gemini_url, json=payload)
                
                if response.status_code == 200:
                    return response.json()  # Success!
                
                if response.status_code == 429:
                    # Rate limited - wait and retry
                    wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                    await asyncio.sleep(wait_time)
                    continue  # Retry
                
                # Handle other errors...
```

**Exponential Backoff:**
- Attempt 1: Wait 2^0 * 5 = 5 seconds
- Attempt 2: Wait 2^1 * 5 = 10 seconds
- Attempt 3: Wait 2^2 * 5 = 20 seconds

**Why exponential?**
- If API is slammed, don't hammer it
- Gradually increase wait time
- Gives Google's servers time to recover

---

#### **Request Deduplication**

If user clicks "Analyze" twice quickly, we prevent duplicate requests:

```python
in_flight_requests = {}  # jd_hash -> asyncio.Event

# In the endpoint:
jd_hash = hashlib.md5(job_description.strip().lower().encode()).hexdigest()

if jd_hash in in_flight_requests:
    # Same JD is already being processed
    await in_flight_requests[jd_hash].wait()  # Wait for first request
    # Use cached result
```

**Flow:**
1. Request 1 arrives → Start processing → Mark as in-flight
2. Request 2 arrives (same JD) → Wait for Request 1 to finish → Use cached result
3. Request 1 finishes → Cache result → Signal event
4. Request 2 wakes up → Gets cached result instantly

---

#### **Main API Endpoint: `/api/decode`**

```python
@api_router.post("/decode", response_model=DecodeResponse)
async def decode_job_description(request: DecodeRequest):
    """Analyze a job description using Gemini API."""
```

**Route explanation:**
- **@api_router.post()**: This is a POST endpoint
- **"/decode"**: Full path is `/api/decode` (router prefix `/api` + `/decode`)
- **response_model=DecodeResponse**: Response must match this format
- **async**: This is an async function (can handle many requests at once)

**Request/Response Models (Pydantic):**

```python
class DecodeRequest(BaseModel):
    api_key: str
    job_description: str

class DecodeResponse(BaseModel):
    mustHave: list[str]
    niceToHave: list[str]
    keywords: list[str]
    insights: list[str]
```

**What Pydantic does:**
- **Validates** incoming JSON matches structure
- **Converts** JSON to Python objects
- **Validates** outgoing data before sending to client
- **Generates** OpenAPI docs automatically

**Example:**
```python
# Frontend sends this JSON:
{
  "api_key": "AIzaSy...",
  "job_description": "Senior Developer..."
}

# Pydantic converts to:
DecodeRequest(api_key="AIzaSy...", job_description="Senior Developer...")

# Backend must return JSON like:
{
  "mustHave": ["React", "Node.js"],
  "niceToHave": ["AWS"],
  "keywords": ["Senior", "Developer", ...],
  "insights": ["Some red flag...", ...]
}
```

#### **The Complete Endpoint Logic**

```python
@api_router.post("/decode", response_model=DecodeResponse)
async def decode_job_description(request: DecodeRequest):
    # 1. Validate inputs
    if not request.api_key.strip():
        raise HTTPException(status_code=400, detail="API key is required")
    
    if not request.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")
    
    # 2. Check cache first
    cached_result = cache.get(request.job_description)
    if cached_result:
        return DecodeResponse(**cached_result)
    
    # 3. Handle request deduplication
    jd_hash = hashlib.md5(request.job_description.strip().lower().encode()).hexdigest()
    
    if jd_hash in in_flight_requests:
        await in_flight_requests[jd_hash].wait()
        cached_result = cache.get(request.job_description)
        if cached_result:
            return DecodeResponse(**cached_result)
    
    # 4. Mark request as in-flight
    event = asyncio.Event()
    in_flight_requests[jd_hash] = event
    
    try:
        # 5. Build prompt for Gemini
        prompt = f"""Analyze the job description...
        {request.job_description}"""
        
        # 6. Call Gemini with retry
        data = await call_gemini_with_retry(request.api_key, prompt)
        
        # 7. Extract and parse response
        response_text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = parse_gemini_response(response_text)
        
        # 8. Build result
        result_data = {
            "mustHave": parsed.get("mustHave", []),
            "niceToHave": parsed.get("niceToHave", []),
            "keywords": parsed.get("keywords", []),
            "insights": parsed.get("insights", [])
        }
        
        # 9. Cache the result
        cache.set(request.job_description, result_data)
        
        # 10. Return to frontend
        return DecodeResponse(**result_data)
    
    finally:
        # 11. Signal completion and cleanup
        event.set()
        await asyncio.sleep(0.1)
        in_flight_requests.pop(jd_hash, None)
```

---

#### **Calling Gemini API**

```python
gemini_url = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={request.api_key}"
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

async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(
        gemini_url,
        json=payload,
        headers={"Content-Type": "application/json"}
    )
```

**Breakdown:**

- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`
  - Domain: Google's Generative AI API
  - Path: `/v1beta/models/{model}:generateContent`
  - Query param: `key=` your API key

- **Payload**: 
  - `contents`: The actual text to analyze
  - `parts`: Array of content (text, images, etc.)
  - `generationConfig`:
    - `temperature: 0.3`: Low randomness (0=deterministic, 1=creative)
    - `maxOutputTokens: 2048`: Max length of response

- **async with**: Opens connection, closes automatically after use
- **timeout=60.0**: Wait max 60 seconds for response

---

#### **Parsing Gemini Response**

Gemini returns JSON like this:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "{\"mustHave\": [...], \"niceToHave\": [...], ...}"
      }]
    }
  }]
}
```

Our code extracts the text and parses JSON:

```python
def parse_gemini_response(response_text: str) -> dict:
    cleaned = response_text.strip()
    cleaned = re.sub(r'^```json\s*', '', cleaned)  # Remove ```json
    cleaned = re.sub(r'^```\s*', '', cleaned)      # Remove ```
    cleaned = re.sub(r'\s*```$', '', cleaned)      # Remove closing ```
    cleaned = cleaned.strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            return json.loads(json_match.group())
```

**Why all the regex?**
- Gemini sometimes wraps JSON in markdown code blocks
- We remove the ` ```json ` markers
- Then parse the clean JSON
- If parsing fails, use regex to find JSON braces and extract it

---

### 2. **CORS Configuration**

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What is CORS?**
- Browser security feature
- Prevents JavaScript on one domain from accessing another domain
- Example: `http://localhost:3000` can't call `http://localhost:8000` without CORS

**Our config:**
- `allow_origins=["*"]`: Allow requests from ANY origin
- `allow_methods=["*"]`: Allow GET, POST, PUT, DELETE, etc.
- `allow_headers=["*"]`: Allow any headers

**In production**, you'd change this to:
```python
allow_origins=["https://jd-decoder.com"]  # Only your frontend
```

---

### 3. **Server Startup**

```python
if __name__ == "__main__":
    import uvicorn
    print(f"Starting JD Decoder API with model: {GEMINI_MODEL}")
    print("Cache TTL: 1 hour | Max retries: 3 with exponential backoff")
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**What it does:**
- `if __name__ == "__main__"`: Only runs when script is executed directly (not imported)
- **uvicorn**: ASGI server that runs FastAPI
- `host="0.0.0.0"`: Listen on all network interfaces (localhost, 192.168.x.x, etc.)
- `port=8000`: Listen on port 8000

**To start backend:**
```bash
python server.py
```

---

## Data Flow

### **Complete Request-Response Cycle**

```
1. USER TYPES IN FRONTEND
   ├─ Pastes API key
   ├─ Pastes job description
   └─ Clicks "Decode JD" button

2. FRONTEND VALIDATES
   ├─ Check API key not empty
   ├─ Check JD not empty
   └─ Check request not already in-flight

3. FRONTEND MAKES API CALL
   └─ POST http://localhost:8000/api/decode
      {
        "api_key": "AIzaSy...",
        "job_description": "Senior..."
      }

4. BACKEND RECEIVES REQUEST
   ├─ FastAPI validates using Pydantic
   └─ Converts JSON to DecodeRequest object

5. BACKEND CHECKS CACHE
   ├─ Hash the job description
   ├─ Look up hash in cache
   └─ If found and not expired → RETURN CACHED RESULT (skip to 15)

6. BACKEND CHECKS FOR DUPLICATE
   ├─ If same JD already being processed
   └─ Wait for that request to finish, then return cached result

7. BACKEND MARKS REQUEST AS IN-FLIGHT
   └─ Add jd_hash to in_flight_requests

8. BACKEND BUILDS PROMPT
   └─ Creates a text prompt for Gemini AI

9. BACKEND CALLS GEMINI API (WITH RETRY)
   ├─ Make HTTPS POST to Google
   ├─ If 429 (rate limit):
   │  ├─ Wait 5 seconds
   │  ├─ Retry (attempt 2)
   │  ├─ If 429 again: Wait 10 seconds, retry (attempt 3)
   │  └─ If 429 again: Wait 20 seconds, give up
   └─ If 200 (success): Parse response

10. GEMINI ANALYZES JD
    ├─ Uses AI to understand requirements
    ├─ Extracts skills, red flags, keywords
    └─ Returns JSON response

11. BACKEND PARSES GEMINI RESPONSE
    ├─ Extract text from nested JSON structure
    ├─ Remove markdown code block markers
    ├─ Parse JSON into Python dict
    └─ Validate structure matches DecodeResponse

12. BACKEND STORES IN CACHE
    ├─ Hash the job description
    ├─ Add result to OrderedDict cache
    ├─ If cache full, remove oldest entry
    └─ Result cached for 1 hour

13. BACKEND SIGNALS COMPLETION
    ├─ Set asyncio event (wake up waiters)
    ├─ Remove from in_flight_requests
    └─ Remove from in-flight tracking

14. BACKEND RETURNS TO FRONTEND
    └─ HTTP 200 with JSON:
       {
         "mustHave": ["React", "Node.js", ...],
         "niceToHave": ["AWS", ...],
         "keywords": ["Senior Developer", ...],
         "insights": ["Red flag: ...", ...]
       }

15. FRONTEND RECEIVES RESPONSE
    ├─ Parse JSON
    ├─ Update results state
    ├─ Hide loading spinner
    └─ Show success toast

16. REACT RE-RENDERS
    ├─ ResultsSection now renders
    └─ User sees analysis

17. USER VIEWS RESULTS
    ├─ Sees must-have skills
    ├─ Sees nice-to-have skills
    ├─ Sees ATS keywords
    └─ Sees insights and red flags
```

---

## Technologies & Dependencies

### **Frontend Dependencies** (`frontend/package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.1",                    // UI library
    "react-dom": "^18.3.1",                // React for web
    "react-router-dom": "^6.x",            // URL routing
    "@radix-ui/react-*": "various",        // Accessible UI components
    "class-variance-authority": "^0.7.0",  // Class merging utility
    "clsx": "^2.0.0",                      // Conditional classes
    "lucide-react": "^0.x.x",              // Icons
    "sonner": "^1.x.x",                    // Toast notifications
    "tailwindcss": "^3.x.x",               // Utility CSS
    "postcss": "^8.x.x",                   // CSS processing
    "autoprefixer": "^10.x.x"              // Add vendor prefixes
  },
  "devDependencies": {
    "craco": "^7.x.x"                      // Override CRA config
  }
}
```

**Key libraries explained:**

1. **React 18**: UI rendering library
   - Components, hooks, state management
   - JSX syntax

2. **React Router**: Navigation between pages
   - `<Routes>`, `<Route>`
   - Single Page App (SPA) routing

3. **Radix UI**: Accessible component library
   - Pre-built, unstyled components
   - Keyboard navigation, ARIA labels
   - Works perfectly with Tailwind

4. **Tailwind CSS**: Utility-first styling
   - No CSS files needed
   - Classes like `flex`, `mb-4`, `text-xl`
   - Customizable with config file

5. **Sonner**: Toast notifications
   - `toast.success()`, `toast.error()`
   - Auto-dismissing popups

6. **Lucide React**: SVG icons
   - `<Sparkles />`, `<FileText />`, etc.

7. **Craco**: Override Create React App config
   - CRA doesn't expose webpack config
   - Craco lets us customize it

---

### **Backend Dependencies** (`backend/requirements.txt`)

```
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
httpx==0.25.0
pydantic==2.5.0
```

**Each dependency:**

1. **FastAPI**: Web framework for building APIs
   - Fast, modern, automatic OpenAPI docs
   - Built on Starlette
   - Type hints for validation

2. **Uvicorn**: ASGI server
   - Runs FastAPI application
   - Async/await support
   - Like nginx but for Python

3. **python-dotenv**: Load `.env` files
   - `load_dotenv()` function
   - Reads `.env` and puts into `os.environ`

4. **httpx**: HTTP client
   - Modern async-friendly version of `requests`
   - `async def` + `await` compatible
   - Makes requests to Gemini API

5. **Pydantic**: Data validation
   - Converts JSON to Python objects
   - Type checking
   - Automatic error messages

---

## Key Concepts

### **1. Async/Await**

```python
async def decode_job_description(request: DecodeRequest):
    # Can't use regular requests here
    # Must use async-compatible libraries like httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(...)
    # await pauses execution until response received
```

**Why async?**
- Handle many requests concurrently
- Don't block while waiting for Gemini API
- While one request waits for API, handle other requests
- Multiple users can use app simultaneously

**Without async:**
```python
# This BLOCKS - locks entire server
response = requests.post(url)  # Waits 2 seconds
# Next request waits 2 seconds too
```

**With async:**
```python
# This doesn't block
response = await client.post(url)  # Waiting...
# Can handle other requests while waiting
```

---

### **2. Hashing - MD5**

```python
hashlib.md5(job_description.strip().lower().encode()).hexdigest()
```

**What it does:**
- Takes a string
- Produces a fixed-length hash (always 32 characters)
- Same input → same hash
- Different input → different hash
- One-way: Can't reverse the hash

**Example:**
```
Input:  "Senior React Developer"
Output: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

Input:  "Senior React Developer"
Output: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"  (same!)

Input:  "Junior Python Developer"
Output: "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4"  (different!)
```

**Why use hashing for caching?**
- Job descriptions can be very long (thousands of characters)
- Hash is always 32 characters
- Faster to store/lookup in cache
- Safely anonymizes the JD text

---

### **3. Context Managers: `async with`**

```python
async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(url)
    # client is open here
# client is automatically closed here
```

**What it does:**
- **Setup**: Opens connection
- **Code block**: Your code runs
- **Cleanup**: Closes connection (even if error happens)

**Without context manager:**
```python
client = httpx.AsyncClient()
try:
    response = await client.post(url)
finally:
    await client.aclose()  # Have to remember to close!
```

---

### **4. Middleware - CORS**

Middleware is code that runs **before/after** every request.

```
REQUEST → CORS Middleware → FastAPI Endpoint → Response → CORS Middleware → CLIENT
```

**CORS middleware:**
- Checks if request origin is allowed
- Adds CORS headers to response
- Allows browser to use the response

Without CORS, browser blocks the response:
```
Frontend: POST http://localhost:8000/api/decode
Backend: 200 OK (response sent)
Browser: BLOCKED! Different domain!
```

---

### **5. Type Hints & Pydantic**

```python
def decode_job_description(request: DecodeRequest) -> DecodeResponse:
    # request must be DecodeRequest
    # function must return DecodeResponse
```

**Benefits:**
- IDE autocomplete works
- Catches type errors early
- Generates API documentation
- Validates at runtime

**Pydantic validation:**
```python
# Frontend sends:
{"api_key": 123}  # oops, number not string!

# Pydantic error:
{
  "detail": [
    {
      "loc": ["body", "api_key"],
      "msg": "Input should be a valid string [type=string_type]",
    }
  ]
}
```

---

## Configuration & Environment

### **Frontend Configuration Files**

#### **`frontend/.env`**
```
REACT_APP_BACKEND_URL=http://localhost:8000
```
- Variables must start with `REACT_APP_`
- Accessed as `process.env.REACT_APP_BACKEND_URL`
- Loaded at **build time**, not runtime

#### **`frontend/tailwind.config.js`**
```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Custom colors, fonts, spacing
    }
  }
}
```
- Tells Tailwind which files to scan for classes
- Customization for your app's theme

#### **`frontend/craco.config.js`**
```javascript
module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
}
```
- Tells Create React App to use Tailwind
- CRA normally doesn't allow config changes
- Craco overrides that

---

### **Backend Configuration Files**

#### **`backend/.env`** (if it exists)
```
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=*
```
- Loaded at **runtime** (not build time)
- Can be changed without rebuilding

#### **`backend/requirements.txt`**
```
fastapi==0.104.1
uvicorn==0.24.0
python-dotenv==1.0.0
httpx==0.25.0
pydantic==2.5.0
```
- Lists all Python dependencies
- With specific versions for reproducibility
- Install with: `pip install -r requirements.txt`

---

## Common Issues & Solutions

### **Issue 1: "Cannot find module 'react'"**

**Cause:** Dependencies not installed

**Solution:**
```bash
cd frontend
npm install --legacy-peer-deps
```

---

### **Issue 2: "Connection refused - http://localhost:8000"**

**Cause:** Backend not running

**Solution:**
```bash
cd backend
. venv/bin/activate
python server.py
```

---

### **Issue 3: "429 Too Many Requests"**

**Cause:** Gemini API rate limit

**Solution:**
- Backend automatically retries 3 times with backoff
- If still failing: Wait 1-2 minutes before retrying
- Or create a new API key at https://aistudio.google.com/app/apikey

---

### **Issue 4: "Model gemini-2.5-flash not found"**

**Cause:** API key doesn't have access to that model

**Solution:**
1. Generate new API key from https://aistudio.google.com/app/apikey
2. Or check available models:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY" | jq
   ```

---

### **Issue 5: React components not displaying**

**Cause:** Missing Radix UI components or Tailwind not loaded

**Solution:**
```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

---

### **Issue 6: API key leaking/exposed**

**Cause:** API keys in localStorage are accessible to JavaScript

**Solution:**
- This is by design - only you should use this locally
- In production, never send API keys from frontend
- Backend should have its own authenticated API key

---

## How Everything Works Together

### **The Big Picture**

```
User (Browser)
    ↓
Frontend (React)
├─ Collects user input (API key, JD text)
├─ Makes HTTP request to backend
└─ Displays results

    ↓

Backend (FastAPI)
├─ Receives request
├─ Checks cache (avoid API call if possible)
├─ Validates input
├─ Removes duplicates
└─ Calls Gemini API with retry logic

    ↓

Google Gemini API
├─ Analyzes job description
└─ Returns JSON with insights

    ↓

Backend Response
├─ Stores in cache
├─ Sends to frontend
└─ Signals completion

    ↓

Frontend Display
├─ Shows loading spinner
├─ Shows results when ready
└─ User sees analysis
```

---

## Summary

**JD Decoder consists of:**

1. **Frontend (React)**
   - User interface for pasting API key and job description
   - Makes API calls to backend
   - Displays analysis results
   - Handles loading states and errors

2. **Backend (FastAPI)**
   - Receives requests from frontend
   - Caches results to save API calls
   - Retries on rate limits with exponential backoff
   - Prevents duplicate requests
   - Calls Google's Gemini API
   - Returns parsed results to frontend

3. **External API (Google Gemini)**
   - Analyzes job descriptions
   - Returns structured JSON with insights
   - Subject to rate limiting on free tier

4. **Key Features**
   - **Caching**: 1-hour cache prevents redundant API calls
   - **Retry Logic**: Automatic retry with exponential backoff on 429 errors
   - **Deduplication**: Prevents duplicate simultaneous requests
   - **CORS Enabled**: Frontend can communicate with backend
   - **Type Safety**: Pydantic validates all data
   - **Async**: Backend handles concurrent requests

---

**Good luck understanding your vibe-coded masterpiece!** 🚀
