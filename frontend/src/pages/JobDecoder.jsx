import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function JobDecoder() {
  const [apiKey, setApiKey] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleApiKeyChange = (value) => {
    setApiKey(value);
    if (value) localStorage.setItem('gemini_api_key', value);
  };

  const decodeJD = async () => {
    if (!apiKey.trim()) return setError('Please enter your Gemini API key');
    if (!jobDescription.trim()) return setError('Please paste a job description');

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, job_description: jobDescription })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analysis failed');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setJobDescription('');
    setResults(null);
    setError('');
  };

  const copyKeywords = () => {
    if (results?.keywords) {
      navigator.clipboard.writeText(results.keywords.join(', '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-semibold text-foreground tracking-tight">JD Decoder</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Get API Key →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        {/* Hero - Simple and direct */}
        <div className="mb-10">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide">Job DESCRIPTION ANALYZER</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-3">
            What do they actually want?
          </h1>
          <p className="text-muted-foreground">
            Extract must-haves, nice-to-haves, keywords, and red flags from any job posting.
          </p>
        </div>

        {/* API Key Input - Refined */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">API Key</label>
            <button 
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-3 text-sm font-mono bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-accent/30 focus:bg-secondary transition-all"
            />
          </div>
        </div>

        {/* Job Description - Refined */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here..."
            rows={12}
            className="w-full px-4 py-3 text-sm bg-secondary/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-accent/30 focus:bg-secondary transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-must-have-bg rounded-lg text-must-have text-sm font-medium">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-12">
          <button
            onClick={decodeJD}
            disabled={isLoading}
            className="flex-1 px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                <span>Analyzing...</span>
              </>
            ) : (
              'Decode JD'
            )}
          </button>
          {(results || jobDescription) && (
            <button
              onClick={reset}
              className="px-5 py-3 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-5">
            {/* Must-Have */}
            <ResultCard
              title="Must-Have"
              count={results.mustHave?.length || 0}
              items={results.mustHave}
              color="must-have"
            />

            {/* Nice-to-Have */}
            <ResultCard
              title="Nice-to-Have"
              count={results.niceToHave?.length || 0}
              items={results.niceToHave}
              color="nice-to-have"
            />

            {/* Keywords */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">Keywords</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {results.keywords?.length || 0}
                  </span>
                </div>
                {results.keywords?.length > 0 && (
                  <button
                    onClick={copyKeywords}
                    className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {results.keywords?.length > 0 ? (
                  results.keywords.map((item, i) => <Pill key={i} color="keywords">{item}</Pill>)
                ) : (
                  <Empty />
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-semibold text-foreground">Red Flags & Insights</h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {results.insights?.length || 0}
                </span>
              </div>
              {results.insights?.length > 0 ? (
                <ul className="space-y-2.5">
                  {results.insights.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-insights mt-1 text-xs">●</span>
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </div>
          </div>
        )}

        {/* No empty state box - just natural flow */}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-5 text-center text-xs text-muted-foreground">
          API key stored locally · Never sent to our servers
        </div>
      </footer>
    </div>
  );
}

function ResultCard({ title, count, items, color }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.length > 0 ? (
          items.map((item, i) => <Pill key={i} color={color}>{item}</Pill>)
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

function Pill({ children, color }) {
  const colors = {
    'must-have': 'bg-must-have-bg text-must-have',
    'nice-to-have': 'bg-nice-to-have-bg text-nice-to-have',
    'keywords': 'bg-keywords-bg text-keywords',
  };
  return (
    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function Empty() {
  return <span className="text-sm text-muted-foreground">None identified</span>;
}
