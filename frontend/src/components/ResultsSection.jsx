import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ThumbsUp, 
  Tag, 
  Lightbulb, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ResultCard = ({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  bgColor, 
  items, 
  variant,
  showCopy = false 
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const copyToClipboard = () => {
    const text = items.join(', ');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Keywords copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  return (
    <Card className="shadow-elegant border-border/50 overflow-hidden animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${bgColor}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showCopy && items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <Badge 
                  key={index} 
                  variant={variant}
                  className="text-sm py-1.5 px-3"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No items identified in this category
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const ResultsSection = ({ results }) => {
  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm font-medium text-muted-foreground px-2">
          Analysis Results
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Must-Have Skills */}
      <ResultCard
        title="Must-Have Skills"
        description={`${results.mustHave?.length || 0} critical requirements identified`}
        icon={AlertTriangle}
        iconColor="text-destructive"
        bgColor="bg-destructive/10"
        items={results.mustHave || []}
        variant="mustHave"
      />

      {/* Nice-to-Have Skills */}
      <ResultCard
        title="Nice-to-Have Skills"
        description={`${results.niceToHave?.length || 0} preferred qualifications`}
        icon={ThumbsUp}
        iconColor="text-primary"
        bgColor="bg-primary/10"
        items={results.niceToHave || []}
        variant="niceToHave"
      />

      {/* Keywords for Resume */}
      <ResultCard
        title="Keywords for Your Resume"
        description={`${results.keywords?.length || 0} terms for ATS optimization`}
        icon={Tag}
        iconColor="text-success"
        bgColor="bg-success/10"
        items={results.keywords || []}
        variant="keywords"
        showCopy={true}
      />

      {/* Insights & Red Flags */}
      <Card className="shadow-elegant border-border/50 overflow-hidden animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10">
              <Lightbulb className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">Red Flags & Insights</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {results.insights?.length || 0} observations about this role
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {results.insights && results.insights.length > 0 ? (
            <ul className="space-y-3">
              {results.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="mt-0.5">
                    {insight.toLowerCase().includes('red flag') || 
                     insight.toLowerCase().includes('warning') ||
                     insight.toLowerCase().includes('concern') ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : insight.toLowerCase().includes('positive') ||
                         insight.toLowerCase().includes('good') ||
                         insight.toLowerCase().includes('benefit') ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">
                    {insight}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No specific insights identified
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card className="shadow-elegant border-primary/20 bg-primary/5 animate-slide-up">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                Quick Summary
              </h3>
              <p className="text-sm text-muted-foreground">
                This role requires <strong className="text-foreground">{results.mustHave?.length || 0} must-have skills</strong> and 
                lists <strong className="text-foreground">{results.niceToHave?.length || 0} nice-to-haves</strong>. 
                Consider adding <strong className="text-foreground">{results.keywords?.length || 0} keywords</strong> to 
                your resume for better ATS matching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsSection;
