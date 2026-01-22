import React from 'react';
import { FileSearch } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileSearch className="w-6 h-6 text-primary" />
          </div>
          <span className="font-heading font-bold text-xl text-foreground">
            JD Decoder
          </span>
        </div>
        
        <nav className="flex items-center gap-4">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Get API Key
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
