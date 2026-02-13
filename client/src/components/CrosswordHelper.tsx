import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface CrosswordHelperProps {
  candidates: string[];
}

export function CrosswordHelper({ candidates }: CrosswordHelperProps) {
  const [pattern, setPattern] = useState("");
  const [lengthFilter, setLengthFilter] = useState<number[]>([0]); // 0 means any
  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");

  // Remove duplicates
  const uniqueCandidates = Array.from(new Set(candidates));

  const filteredWords = uniqueCandidates.filter(word => {
    // 1. Length Filter
    if (lengthFilter[0] !== 0 && word.length !== lengthFilter[0]) {
      return false;
    }

    // 2. Starts/Ends With
    if (startsWith && !word.startsWith(startsWith)) return false;
    if (endsWith && !word.endsWith(endsWith)) return false;

    // 3. Pattern Match (e.g., "क_ल" matches "कमल")
    if (pattern) {
      if (word.length !== pattern.length) return false;
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== word[i]) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
        <h3 className="font-semibold text-lg text-primary mb-1">Crossword Filters</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Filter synonyms and related words to fit your puzzle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pattern Match (Use _ for unknown)</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. क_ल" 
                className="pl-9 bg-white"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Exact Length</Label>
              <span className="text-sm font-medium text-primary">
                {lengthFilter[0] === 0 ? "Any" : lengthFilter[0]}
              </span>
            </div>
            <Slider 
              value={lengthFilter} 
              onValueChange={setLengthFilter} 
              max={15} 
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Starts With</Label>
            <Input 
              placeholder="First letter..." 
              className="bg-white"
              value={startsWith}
              onChange={(e) => setStartsWith(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ends With</Label>
            <Input 
              placeholder="Last letter..." 
              className="bg-white"
              value={endsWith}
              onChange={(e) => setEndsWith(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium flex items-center gap-2">
            <Search className="w-4 h-4" />
            Matching Words
            <Badge variant="secondary" className="ml-2">
              {filteredWords.length}
            </Badge>
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredWords.length > 0 ? (
              filteredWords.map((word, i) => (
                <motion.div
                  key={word}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-3 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
                    <span className="text-lg font-medium">{word}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {word.length} letters
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="col-span-full py-8 text-center text-muted-foreground flex flex-col items-center gap-2"
              >
                <AlertCircle className="w-8 h-8 opacity-50" />
                No words match your filters.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
