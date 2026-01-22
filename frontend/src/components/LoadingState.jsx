import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, FileText, Search, Lightbulb } from 'lucide-react';

const LoadingState = () => {
  return (
    <Card className="shadow-elegant border-border/50 animate-fade-in overflow-hidden">
      <CardContent className="py-16">
        <div className="text-center space-y-6">
          {/* Animated Icons */}
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 animate-bounce" style={{ animationDelay: '0ms' }}>
              <FileText className="w-6 h-6 text-destructive" />
            </div>
            <div className="p-3 rounded-xl bg-primary/10 animate-bounce" style={{ animationDelay: '150ms' }}>
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div className="p-3 rounded-xl bg-success/10 animate-bounce" style={{ animationDelay: '300ms' }}>
              <Sparkles className="w-6 h-6 text-success" />
            </div>
            <div className="p-3 rounded-xl bg-warning/10 animate-bounce" style={{ animationDelay: '450ms' }}>
              <Lightbulb className="w-6 h-6 text-warning" />
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              Analyzing Job Description...
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our AI is identifying required skills, nice-to-haves, keywords, and potential red flags.
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-xs mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full animate-pulse"
                style={{ 
                  width: '100%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 50%, hsl(var(--primary)) 100%)',
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
