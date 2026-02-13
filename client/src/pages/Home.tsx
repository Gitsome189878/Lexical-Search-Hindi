
import { useState, useEffect, useMemo } from "react";
import { lookupWord, LookupResult, WordRow, ConfidenceBand } from "@/lib/searchPipeline";
import { applyAllWordFilters, FilterOpts } from "@/lib/filters";
import { SearchResultCard } from "@/components/SearchResultCard";
import { WordDetailModal } from "@/components/WordDetailModal";
import { Input } from "@/components/ui/input";
import { Search, Languages, Sparkles, Filter, X, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import debounce from "lodash/debounce";
import clsx from "clsx";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterOpts, setFilterOpts] = useState<FilterOpts>({
    sortMode: 'alpha-hi',
    lengthBucket: 'all',
    multiWordOnly: false,
    startsWith: '',
    endsWith: '',
    contains: '',
    pattern: ''
  });

  const [, setLocation] = useLocation();

  // Search Logic
  const performSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q.trim()) {
          setResult(null);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);
        try {
          const res = await lookupWord(q);
          setResult(res);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    performSearch(query);
    return () => performSearch.cancel();
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery("");
    setResult(null);
  };

  // Filtered Synonyms
  const filteredSynonyms = useMemo(() => {
    if (!result?.synonyms) return [];
    return applyAllWordFilters(result.synonyms.map(s => s.synonym_hi), filterOpts);
  }, [result?.synonyms, filterOpts]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => { clearSearch(); setLocation("/"); }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">श</div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Shabd<span className="text-primary">Setu</span></h1>
            </div>

            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
                <Search className="w-5 h-5" />
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in English, Hindi, or Hinglish..."
                className="w-full h-12 pl-12 pr-12 rounded-full border-2 border-border/60 bg-white/50 focus:bg-white focus:border-primary/50 text-lg shadow-sm"
              />
              {query && (
                <button onClick={clearSearch} className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <Button 
              variant={showFilters ? "secondary" : "ghost"} 
              size="icon" 
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Crossword & Filters"
            >
              <Grid className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 flex gap-8">
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-muted-foreground">
                    {isSearching ? (
                      <span className="flex items-center gap-2">Searching...</span>
                    ) : (
                      <span>Found result for <span className="text-foreground">"{query}"</span></span>
                    )}
                  </h2>
                  {result.hitType !== 'no_hit' && (
                    <Badge variant={result.hitType === 'fuzzy' ? 'secondary' : 'default'}>
                      {result.hitType === 'db_exact' ? 'Database Result' : 
                       result.hitType === 'db_input_form' ? 'Input Match' : 'Fuzzy Match'}
                    </Badge>
                  )}
                </div>

                {result.primaryWord ? (
                  <div className="space-y-8">
                    {/* Primary Word Card */}
                    <SearchResultCard 
                      word={result.primaryWord} 
                      onClick={() => setSelectedWordId(result.primaryWord!.id)}
                      index={0}
                    />

                    {/* Filtered Synonyms / Crossword Results */}
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <List className="w-5 h-5" />
                          Synonyms & Related ({filteredSynonyms.length})
                        </h3>
                        {showFilters && <Badge variant="outline">Filters Active</Badge>}
                      </div>
                      
                      {filteredSynonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {filteredSynonyms.map((syn, i) => (
                            <Badge key={i} variant="secondary" className="text-lg px-3 py-1 hover:bg-primary/20 cursor-pointer">
                              {syn}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">No synonyms match your filters.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No direct match found.</p>
                    {result.topCandidates.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-sm font-medium mb-4">Did you mean?</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {result.topCandidates.map((c, i) => (
                            <Button key={i} variant="outline" onClick={() => setQuery(c.row.headword_hi)}>
                              {c.row.headword_hi}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Empty State */
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Hindi Word Intelligence</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Type in Hindi, English, or Hinglish. Use the grid icon to access Crossword Mode filters.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Filters (Crossword Mode) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-card/50 backdrop-blur overflow-hidden"
            >
              <div className="p-6 space-y-8 w-80">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Crossword Mode
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Length Bucket</Label>
                      <div className="flex gap-2">
                         {['all', '2-3', '4', '5+'].map((b) => (
                           <Button 
                             key={b}
                             size="sm"
                             variant={filterOpts.lengthBucket === b ? 'default' : 'outline'}
                             onClick={() => setFilterOpts(p => ({...p, lengthBucket: b as any}))}
                             className="flex-1"
                           >
                             {b}
                           </Button>
                         ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Pattern (Use _ for unknown)</Label>
                      <Input 
                        placeholder="e.g. क_ता_" 
                        value={filterOpts.pattern}
                        onChange={e => setFilterOpts(p => ({...p, pattern: e.target.value}))}
                        className="font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Starts with</Label>
                        <Input 
                          value={filterOpts.startsWith}
                          onChange={e => setFilterOpts(p => ({...p, startsWith: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ends with</Label>
                        <Input 
                          value={filterOpts.endsWith}
                          onChange={e => setFilterOpts(p => ({...p, endsWith: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Contains</Label>
                      <Input 
                        value={filterOpts.contains}
                        onChange={e => setFilterOpts(p => ({...p, contains: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Sorting</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={filterOpts.sortMode === 'alpha-hi' ? 'default' : 'outline'}
                      onClick={() => setFilterOpts(p => ({...p, sortMode: 'alpha-hi'}))}
                    >
                      Alphabetical
                    </Button>
                    <Button 
                      size="sm" 
                      variant={filterOpts.sortMode === 'vowel' ? 'default' : 'outline'}
                      onClick={() => setFilterOpts(p => ({...p, sortMode: 'vowel'}))}
                    >
                      Vowel Order
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <WordDetailModal 
        isOpen={!!selectedWordId} 
        onClose={() => setSelectedWordId(null)}
        word={result?.primaryWord?.id === selectedWordId ? result.primaryWord as any : null}
        isLoading={false}
      />
    </div>
  );
}
