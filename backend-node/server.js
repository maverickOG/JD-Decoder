const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/', (req, res) => {
  res.json({ message: 'JD Decoder API' });
});

// Decode endpoint - thin proxy to Gemini
app.post('/api/decode', async (req, res) => {
  const { api_key, job_description } = req.body;

  if (!api_key || !api_key.trim()) {
    return res.status(400).json({ detail: 'API key is required' });
  }

  if (!job_description || !job_description.trim()) {
    return res.status(400).json({ detail: 'Job description is required' });
  }

  const prompt = `Analyze this job description and return ONLY a valid JSON object (no markdown, no code blocks, no additional text) with these exact fields:
- "mustHave": array of strings - critical required skills/qualifications that are explicitly stated as required or must-have
- "niceToHave": array of strings - preferred but not required skills, often indicated by "preferred", "bonus", "nice to have", or "plus"
- "keywords": array of strings - important technical terms, tools, technologies, and buzzwords to include in resume for ATS optimization
- "insights": array of strings - observations about company culture, potential red flags (like unrealistic requirements, no salary transparency, overused buzzwords), and noteworthy details that could help in interview preparation

Be specific, practical, and thorough. Focus on what will genuinely help a job seeker prepare their application. Look for red flags like: "rockstar/ninja" language, excessive requirements for the role level, lack of salary transparency, "wear many hats", "fast-paced environment", unrealistic tech stack combinations, etc.

Job Description:
${job_description}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${api_key}`;

  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 400) {
        return res.status(400).json({ detail: 'Invalid API key. Please check your Gemini API key and try again.' });
      } else if (status === 429) {
        return res.status(429).json({ detail: 'Rate limit exceeded. Please wait a moment and try again.' });
      } else if (status === 403) {
        return res.status(403).json({ detail: 'API key does not have permission. Please check your API key settings.' });
      } else {
        return res.status(500).json({ detail: 'Failed to analyze job description' });
      }
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({ detail: 'Unexpected response from Gemini API' });
    }

    let responseText = data.candidates[0].content.parts[0].text;

    // Clean the response
    let cleaned = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Try to extract JSON
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ detail: 'Could not parse analysis results. Please try again.' });
      }
    }

    // Return structured response
    res.json({
      mustHave: parsed.mustHave || [],
      niceToHave: parsed.niceToHave || [],
      keywords: parsed.keywords || [],
      insights: parsed.insights || []
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ detail: 'Failed to connect to Gemini API. Please try again.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
