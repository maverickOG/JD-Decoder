# JD Decoder - AI-Powered Job Description Analyzer

**Decode job descriptions instantly. Cut through corporate jargon and discover what skills are truly required.**

JD Decoder is a web application powered by Google Gemini AI that analyzes job postings to extract critical information, identify nice-to-have skills, provide ATS-friendly keywords, and flag red flags or unrealistic expectations.

## Features

✨ **AI-Powered Analysis** - Uses Google Gemini 2.5 Flash to deeply analyze job descriptions  
🎯 **Must-Have Skills** - Extracts critical required qualifications  
🌟 **Nice-to-Have Skills** - Identifies preferred but optional skills  
🔑 **ATS Keywords** - Generates resume-optimized keywords for each JD  
⚠️ **Red Flag Detection** - Spotlights unrealistic expectations and culture hints  
💾 **Smart Caching** - 1-hour cache with exponential backoff retry logic  
⚡ **Rate Limit Handling** - Automatic retry with intelligent backoff on API limits  

## Tech Stack

### Frontend
- **React 18** with Craco build tool
- **Tailwind CSS** for styling
- **Radix UI** components for accessible UI
- **Sonner** for toast notifications

### Backend
- **FastAPI** with Uvicorn
- **Python 3.x**
- **Google Gemini API (v1beta)**
- **HTTPX** for async HTTP requests

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Google Gemini API key (free at https://aistudio.google.com/app/apikey)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/maverickOG/JD-Decoder.git
cd JD-Decoder
```

**2. Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**3. Setup Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
```

### Running the Application

**Terminal 1 - Start Backend (Port 8000)**
```bash
cd backend
source venv/bin/activate
python server.py
```

**Terminal 2 - Start Frontend (Port 3000)**
```bash
cd frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Get a Gemini API Key**
   - Visit https://aistudio.google.com/app/apikey
   - Copy your API key

2. **Analyze a Job Description**
   - Paste your API key in the app
   - Paste the full job description
   - Click "Decode JD"
   - Review the analysis

3. **Optimize Your Resume**
   - Use the extracted keywords and must-have skills to tailor your resume
   - Watch for red flags to decide if the role is a good fit

## Project Structure

```
JD-Decoder/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # UI components
│   │   └── lib/             # Utilities
│   └── package.json
├── backend/                  # FastAPI server
│   ├── server.py           # Main API logic
│   ├── requirements.txt     # Python dependencies
│   └── venv/               # Virtual environment
├── README.md               # This file
└── .env                    # Environment variables
```

## API Endpoints

### `POST /api/decode`
Analyzes a job description using Gemini AI.

**Request:**
```json
{
  "api_key": "your_gemini_api_key",
  "job_description": "Full job posting text..."
}
```

**Response:**
```json
{
  "mustHave": ["React", "Node.js", "5+ years experience"],
  "niceToHave": ["AWS", "Docker"],
  "keywords": ["Senior Developer", "React", "JavaScript", ...],
  "insights": ["Red flag: unrealistic deadline", "Great benefits: unlimited PTO", ...]
}
```

## Configuration

### Environment Variables

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Backend (.env)**
```
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=*
```

## Performance Features

### Caching
- Results cached for 1 hour by job description hash
- Reduces API calls for duplicate analyses
- LRU eviction for memory efficiency

### Rate Limiting
- Exponential backoff retry on API rate limits
- Automatic retry with 5s, 10s, 20s delays
- Deduplication prevents simultaneous duplicate requests

### Error Handling
- Graceful fallback for API rate limits
- Detailed error messages for debugging
- Request timeout protection

## Troubleshooting

### "Rate limit exceeded" Error
- Google's free Gemini tier has strict limits (~10-15 req/min)
- Wait 1-2 minutes before retrying
- Consider upgrading to Gemini Pro tier for higher limits

### "Model not found" Error
- Verify your Gemini API key is valid at https://aistudio.google.com/app/apikey
- Check available models: `GEMINI_MODEL` in backend/server.py

### Frontend can't reach backend
- Verify backend is running on http://localhost:8000
- Check REACT_APP_BACKEND_URL in frontend/.env
- Ensure CORS is enabled (it is by default)

## Contributing

Found a bug or have an idea? Feel free to:
1. Open an issue on GitHub
2. Fork the repository
3. Submit a pull request

## License

MIT - Feel free to use this project for personal and commercial use.

## Acknowledgments

- **Google Gemini API** for powerful AI analysis
- **Radix UI** for accessible components
- **Tailwind CSS** for modern styling

## Support

Need help? Check the [issues page](https://github.com/maverickOG/JD-Decoder/issues) or create a new issue with details about your problem.

---

**Built with ❤️ to help job seekers decode corporate jargon.**
