import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WordDetailResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Copy, ExternalLink, Network, RefreshCw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrosswordHelper } from "./CrosswordHelper";
import { useToast } from "@/hooks/use-toast";

interface WordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: WordDetailResponse | null;
  isLoading: boolean;
}

export function WordDetailModal({ isOpen, onClose, word, isLoading }: WordDetailModalProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (word) {
      navigator.clipboard.writeText(word.headwordHi);
      toast({
        title: "Copied",
        description: `"${word.headwordHi}" copied to clipboard`,
      });
    }
  };

  if (!word && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading word details...</p>
          </div>
        ) : word ? (
          <>
            {/* Header Section */}
            <div className="p-6 md:p-8 bg-gradient-to-b from-primary/10 to-transparent border-b">
              <DialogHeader>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-4xl md:text-5xl font-bold text-foreground font-sans">
                        {word.headwordHi}
                      </DialogTitle>
                      {word.pos && (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-3 py-1">
                          {word.pos}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xl text-muted-foreground font-display flex items-center gap-2">
                      <span>{word.transliteration}</span>
                      <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Primary Meaning</h4>
                  <p className="text-lg font-medium">{word.meaningHi}</p>
                </div>
                {word.meaningEn && (
                  <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">English Meaning</h4>
                    <p className="text-lg font-display text-muted-foreground">{word.meaningEn}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="flex-1 overflow-hidden flex flex-col bg-background">
              <Tabs defaultValue="related" className="flex-1 flex flex-col h-full">
                <div className="px-6 border-b bg-muted/20">
                  <TabsList className="bg-transparent p-0 h-12 w-full justify-start gap-6 overflow-x-auto">
                    <TabsTrigger 
                      value="related" 
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                    >
                      <Network className="w-4 h-4 mr-2" />
                      Related & Synonyms
                    </TabsTrigger>
                    <TabsTrigger 
                      value="antonyms" 
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Antonyms
                    </TabsTrigger>
                    <TabsTrigger 
                      value="crossword" 
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 font-medium text-primary"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Crossword Helper
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 p-6 md:p-8">
                  <TabsContent value="related" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Synonyms */}
                    <section>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Synonyms (Paryayvachi)
                      </h3>
                      {word.synonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {word.synonyms.map((syn) => (
                            <Badge 
                              key={syn.id} 
                              variant="outline" 
                              className="text-base py-1.5 px-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                              {syn.synonymHi}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No synonyms found.</p>
                      )}
                    </section>
                    
                    {/* Related Words */}
                    <section>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Network className="w-5 h-5 text-primary" />
                        Related Concepts
                      </h3>
                      {word.relatedWords.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {word.relatedWords.map((rel) => (
                            <div key={rel.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                              <span className="font-medium text-lg">{rel.relatedHi}</span>
                              {rel.reason && (
                                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                  {rel.reason}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No related words found.</p>
                      )}
                    </section>
                  </TabsContent>

                  <TabsContent value="antonyms" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <section>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        Antonyms (Vilom)
                      </h3>
                      {word.antonyms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {word.antonyms.map((ant) => (
                            <Badge 
                              key={ant.id} 
                              variant="destructive" 
                              className="text-base py-1.5 px-4 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                            >
                              {ant.antonymHi}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No antonyms found.</p>
                      )}
                    </section>
                  </TabsContent>

                  <TabsContent value="crossword" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CrosswordHelper 
                      candidates={[
                        word.headwordHi, 
                        ...word.synonyms.map(s => s.synonymHi),
                        ...word.antonyms.map(a => a.antonymHi),
                        ...word.relatedWords.map(r => r.relatedHi)
                      ]} 
                    />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            Word details not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
