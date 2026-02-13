import { useState, useEffect } from "react";
import { useSearchWords, useWordDetails } from "@/hooks/use-words";
import { SearchResultCard } from "@/components/SearchResultCard";
import { WordDetailModal } from "@/components/WordDetailModal";
import { Input } from "@/components/ui/input";
import { Search, Languages, Sparkles, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Word } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export default function Home() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading: isSearching } = useSearchWords(debouncedQuery);
  const { data: wordDetails, isLoading: isLoadingDetails } = useWordDetails(selectedWordId);

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Sticky Header with Search */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                clearSearch();
                setLocation("/");
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                श
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
                Shabd<span className="text-primary">Setu</span>
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in English, Hindi, or Hinglish..."
                className="w-full h-12 pl-12 pr-12 rounded-full border-2 border-border/60 bg-white/50 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-lg transition-all shadow-sm hover:shadow-md"
              />
              {query && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Actions (Desktop) */}
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" size="icon" title="Language settings">
                <Languages className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" title="Filter preferences">
                <Filter className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {debouncedQuery ? (
            /* Search Results View */
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <span>
                      Found {searchResults?.words.length || 0} results for <span className="text-foreground">"{debouncedQuery}"</span>
                    </span>
                  )}
                </h2>
                {searchResults?.matchType === "transliteration" && (
                  <Badge variant="outline" className="text-xs bg-accent/10 border-accent/20 text-accent-foreground">
                    Transliteration Match
                  </Badge>
                )}
              </div>

              <div className="grid gap-4">
                {isSearching ? (
                  // Skeleton Loading
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border shadow-sm space-y-4 animate-pulse">
                      <div className="h-8 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))
                ) : searchResults?.words.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No words found matching your query.</p>
                  </div>
                ) : (
                  searchResults?.words.map((word, index) => (
                    <SearchResultCard 
                      key={word.id} 
                      word={word} 
                      onClick={() => setSelectedWordId(word.id)}
                      index={index}
                    />
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            /* Empty State / Word of the Day */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-8"
            >
              <div className="text-center space-y-4 max-w-2xl">
                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-0 px-4 py-1.5 rounded-full font-medium">
                  <Sparkles className="w-3 h-3 mr-2 fill-current" />
                  Word Intelligence Engine
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold font-sans text-foreground">
                  Explore the Depth of <br/>
                  <span className="text-primary bg-clip-text">Hindi Vocabulary</span>
                </h2>
                <p className="text-lg text-muted-foreground font-display max-w-lg mx-auto leading-relaxed">
                  Instant search, precise meanings, synonyms, and powerful crossword tools for Hindi enthusiasts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
                <FeatureCard 
                  icon="🕉️" 
                  title="Hindi-First" 
                  desc="Designed natively for Devanagari script nuances and grammar." 
                />
                <FeatureCard 
                  icon="🎯" 
                  title="Smart Search" 
                  desc="Type in Hinglish ('namaste') and get the correct Hindi word (नमस्ते)." 
                />
                <FeatureCard 
                  icon="🧩" 
                  title="Crossword Helper" 
                  desc="Filter words by length and patterns to solve puzzles effortlessly." 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Word Details Modal */}
      <WordDetailModal 
        isOpen={!!selectedWordId} 
        onClose={() => setSelectedWordId(null)}
        word={wordDetails || null}
        isLoading={isLoadingDetails}
      />
      
      {/* Footer */}
      <footer className="border-t py-8 mt-auto bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ShabdSetu. Built for the love of language.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2 font-display">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
