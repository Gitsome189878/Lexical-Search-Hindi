import { Word } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Volume2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface SearchResultCardProps {
  word: Word;
  onClick: () => void;
  index?: number;
}

export function SearchResultCard({ word, onClick, index = 0 }: SearchResultCardProps) {
  const { toast } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(word.headwordHi);
    toast({
      title: "Copied",
      description: `"${word.headwordHi}" copied to clipboard`,
      duration: 2000,
    });
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder for actual TTS integration
    toast({
      title: "Audio",
      description: "Audio pronunciation coming soon",
      duration: 2000,
    });
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `ShabdSetu: ${word.headwordHi}`,
        text: `Check out the meaning of ${word.headwordHi} on ShabdSetu`,
        url: window.location.href,
      }).catch(console.error);
    } else {
       navigator.clipboard.writeText(window.location.href);
       toast({
        title: "Link Copied",
        description: "Link copied to clipboard",
       });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        onClick={onClick}
        className="group relative overflow-hidden cursor-pointer border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-card/80 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3 className="text-3xl font-bold text-foreground font-sans tracking-wide">
                {word.headwordHi}
              </h3>
              <span className="text-lg text-muted-foreground font-display italic">
                {word.transliteration}
              </span>
              {word.pos && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  {word.pos}
                </Badge>
              )}
            </div>
            
            <p className="text-lg font-medium text-foreground/90 leading-relaxed">
              {word.meaningHi}
            </p>
            
            {word.meaningEn && (
              <p className="text-base text-muted-foreground font-display">
                {word.meaningEn}
              </p>
            )}
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleCopy}
                title="Copy Hindi Word"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleSpeak}
                title="Pronounce"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handleShare}
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="hidden sm:flex justify-end mt-2">
              <span className="group-hover:translate-x-1 transition-transform duration-300 text-primary">
                <ArrowRight className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
