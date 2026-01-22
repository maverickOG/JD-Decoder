import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
            <span>to help job seekers</span>
          </div>
          
          <div className="flex items-center gap-6">
            <span>Powered by Google Gemini AI</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              Get your free API key
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
