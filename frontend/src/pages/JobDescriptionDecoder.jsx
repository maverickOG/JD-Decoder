import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResultsSection from '@/components/ResultsSection';
import LoadingState from '@/components/LoadingState';
import { FileText, Sparkles, Key, ExternalLink, Eye, EyeOff } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SAMPLE_JD = `Senior Full-Stack Developer

We're looking for a passionate Senior Full-Stack Developer to join our growing team!

Required Qualifications:
- 5+ years of experience with React, Node.js, and TypeScript
- Strong understanding of RESTful APIs and GraphQL
- Experience with PostgreSQL or MongoDB
- Bachelor's degree in Computer Science or equivalent experience
- Excellent problem-solving skills

Nice to Have:
- Experience with AWS or GCP
- Knowledge of Docker and Kubernetes
- Familiarity with CI/CD pipelines
- Experience mentoring junior developers
- Open source contributions

Responsibilities:
- Design and implement scalable web applications
- Collaborate with cross-functional teams
- Participate in code reviews and technical discussions
- Mentor junior team members

Benefits:
- Competitive salary (range not disclosed)
- Unlimited PTO
- Remote-first culture
- Health, dental, and vision insurance
- 401k matching

We're a fast-paced startup looking for rockstar ninjas who can wear many hats and thrive in ambiguity!`;

const JobDescriptionDecoder = () => {
  const [apiKey, setApiKey] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  
  // Ref to prevent duplicate requests
  const isRequestInFlight = useRef(false);

  // Load API key from localStorage on mount
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

  // Save API key to localStorage when it changes (with consent)
  const handleApiKeyChange = (value) => {
    setApiKey(value);
    if (hasConsented && value) {
      localStorage.setItem('gemini_api_key', value);
    }
  };

  const handleConsentChange = (checked) => {
    setHasConsented(checked);
    localStorage.setItem('api_key_consent', checked.toString());
    if (checked && apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else if (!checked) {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const loadSampleJD = () => {
    setJobDescription(SAMPLE_JD);
    toast.success('Sample job description loaded!');
  };

  const analyzeJobDescription = async () => {
    // Prevent duplicate requests
    if (isRequestInFlight.current) {
      console.log('Request already in flight, ignoring');
      return;
    }
    
    if (!apiKey.trim()) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please paste a job description to analyze');
      return;
    }

    isRequestInFlight.current = true;
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          job_description: jobDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze job description');
      }

      const data = await response.json();
      setResults(data);
      toast.success('Job description analyzed successfully!');

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze job description. Please try again.');
    } finally {
      setIsLoading(false);
      isRequestInFlight.current = false;
    }
  };

  const resetAnalysis = () => {
    setJobDescription('');
    setResults(null);
    toast.info('Ready for a new analysis');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-10 md:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Google Gemini AI</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            Decode Any{' '}
            <span className="text-gradient">Job Description</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cut through the corporate jargon. Instantly discover what skills are truly required, 
            which are just nice-to-have, and spot red flags before you apply.
          </p>
        </section>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* API Key Card */}
          <Card className="shadow-elegant border-border/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading">Gemini API Key</CardTitle>
                  <CardDescription className="text-sm">
                    Your key is stored locally and never sent to our servers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your Gemini API key..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="pr-12 h-12 text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConsented}
                    onChange={(e) => handleConsentChange(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Remember my API key in this browser</span>
                </label>
                
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Get your free API key
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Job Description Input Card */}
          <Card className="shadow-elegant border-border/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-heading">Job Description</CardTitle>
                    <CardDescription className="text-sm">
                      Paste the full job posting text below
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleJD}
                  className="text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Sample JD
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the job description here...&#10;&#10;Include all the details: required skills, nice-to-haves, responsibilities, benefits, company description - everything you see in the job posting."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] md:min-h-[280px] text-base leading-relaxed resize-y"
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={analyzeJobDescription}
                  disabled={isLoading || !apiKey || !jobDescription}
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Decode JD
                    </>
                  )}
                </Button>
                
                {(results || jobDescription) && (
                  <Button
                    variant="outline"
                    onClick={resetAnalysis}
                    className="h-12 px-6"
                    size="lg"
                  >
                    Try Another
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && <LoadingState />}

          {/* Results */}
          {results && !isLoading && <ResultsSection results={results} />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobDescriptionDecoder;
