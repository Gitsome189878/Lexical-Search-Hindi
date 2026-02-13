
import { supabase } from './supabase';
import Fuse from 'fuse.js';
import { Word, Synonym, Antonym, RelatedWord } from '@shared/schema';

// Internal row type from Supabase (snake_case)
type WordRow = {
  id: number;
  headword_hi: string;
  transliteration: string;
  pos: string;
  meaning_hi: string;
  meaning_en: string;
  input_forms: string[];
  source: string;
  confidence: string;
  usage_count: number;
  fetched_at?: string;
};

export type ConfidenceBand = 'high' | 'medium' | 'low';
export type HitType = 'db_exact' | 'db_input_form' | 'fuzzy' | 'no_hit' | 'fallback';

export type LookupResult = {
  primaryWord: Word | null;
  synonyms: Synonym[];
  antonyms: Antonym[];
  relatedWords: RelatedWord[];
  topCandidates: Array<{ row: Word; score: number }>;
  hitType: HitType;
  confidenceBand: ConfidenceBand;
  errorMessage: string | null;
};

// --- Helper: Map DB Row to Schema Type ---
function mapWordRow(row: WordRow): Word {
  return {
    id: row.id,
    headwordHi: row.headword_hi,
    transliteration: row.transliteration,
    pos: row.pos,
    meaningHi: row.meaning_hi,
    meaningEn: row.meaning_en,
    inputForms: row.input_forms,
    source: row.source,
    confidence: row.confidence,
    usageCount: row.usage_count,
    fetchedAt: row.fetched_at ? new Date(row.fetched_at) : new Date(),
  };
}

function mapSynonym(row: any): Synonym {
  return { id: row.id, wordId: row.word_id, synonymHi: row.synonym_hi };
}

function mapAntonym(row: any): Antonym {
  return { id: row.id, wordId: row.word_id, antonymHi: row.antonym_hi };
}

function mapRelated(row: any): RelatedWord {
  return { id: row.id, wordId: row.word_id, relatedHi: row.related_hi, similarity: row.similarity, reason: row.reason };
}

// --- A) Normalize Query ---
export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

// --- B) Detect Script ---
export function isDevanagari(q: string): boolean {
  return /[\u0900-\u097F]/.test(q);
}

// --- C) Generate Hinglish Candidates ---
export function generateHinglishCandidates(q: string): string[] {
  const candidates = new Set<string>();
  candidates.add(q);

  const replacements: [RegExp, string][] = [
    [/aa/g, 'a'],
    [/ee/g, 'i'],
    [/oo/g, 'u'],
    [/ri/g, 'r'],
    [/kh/g, 'k'],
    [/gh/g, 'g'],
    [/chh/g, 'ch'],
    [/th/g, 't'],
    [/dh/g, 'd'],
    [/ph/g, 'p'],
    [/bh/g, 'b'],
  ];

  let current = q;
  replacements.forEach(([regex, sub]) => {
    const next = current.replace(regex, sub);
    candidates.add(next);
  });
  
  return Array.from(candidates);
}

// --- D) Fetch Exact or Input Forms ---
export async function fetchByExactOrInputForms(query: string): Promise<WordRow[]> {
  const normQuery = normalizeQuery(query);
  
  try {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .or(`headword_hi.ilike.${normQuery},transliteration.ilike.${normQuery},input_forms.cs.{${normQuery}}`);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase Fetch Error (Exact):', err);
    throw err;
  }
}

// --- E) Fetch Relations ---
export async function fetchWordRelations(wordId: number) {
  try {
    const [synRes, antRes, relRes] = await Promise.all([
      supabase.from('synonyms').select('*').eq('word_id', wordId),
      supabase.from('antonyms').select('*').eq('word_id', wordId),
      supabase.from('related_words').select('*').eq('word_id', wordId).order('similarity', { ascending: false })
    ]);

    return {
      synonyms: (synRes.data || []).map(mapSynonym),
      antonyms: (antRes.data || []).map(mapAntonym),
      relatedWords: (relRes.data || []).map(mapRelated)
    };
  } catch (err) {
    console.error('Relation Fetch Error:', err);
    return { synonyms: [], antonyms: [], relatedWords: [] };
  }
}

// --- F) Score Candidates ---
export function scoreCandidates(query: string, rows: WordRow[]): Array<{ row: Word; score: number }> {
  const normQ = normalizeQuery(query);
  
  return rows.map(row => {
    let score = 0;
    const hw = row.headword_hi.toLowerCase();
    const tr = row.transliteration.toLowerCase();
    
    if (hw === normQ) score = 1.0;
    else if (row.input_forms?.some(f => f.toLowerCase() === normQ)) score = 0.9;
    else if (tr === normQ) score = 0.85;
    else if (hw.startsWith(normQ)) score = 0.7;
    else if (tr.startsWith(normQ)) score = 0.6;
    else if (hw.includes(normQ) || tr.includes(normQ)) score = 0.55;
    else score = 0.1;

    return { row: mapWordRow(row), score };
  }).sort((a, b) => b.score - a.score);
}

// --- G) Run Fuzzy Fallback ---
export async function runFuzzyFallback(query: string): Promise<Array<{ row: Word; score: number }>> {
  try {
    const { data: allWords, error } = await supabase
      .from('words')
      .select('*')
      .limit(1500);

    if (error) throw error;
    if (!allWords || allWords.length === 0) return getMockFallback(query);

    const fuse = new Fuse(allWords, {
      keys: [
        { name: 'headword_hi', weight: 0.45 },
        { name: 'transliteration', weight: 0.25 },
        { name: 'input_forms', weight: 0.30 }
      ],
      threshold: 0.3,
      includeScore: true
    });

    const results = fuse.search(query);
    
    return results.map(r => ({
      row: mapWordRow(r.item as WordRow),
      score: 1 - (r.score || 1)
    })).slice(0, 100);

  } catch (err) {
    console.warn('Fuzzy fallback failed, using Mock Data');
    return getMockFallback(query);
  }
}

// --- H) Confidence Band ---
export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.85) return 'high';
  if (score >= 0.65) return 'medium';
  return 'low';
}

// --- Mock Fallback ---
function getMockFallback(query: string): Array<{ row: Word; score: number }> {
  const mockWords: WordRow[] = [
    { id: 1, headword_hi: "नमस्ते", transliteration: "namaste", pos: "interjection", meaning_hi: "अभिवादन", meaning_en: "Greeting", input_forms: ["namaste"], source: "mock", confidence: "high", usage_count: 100 },
    { id: 2, headword_hi: "प्रेम", transliteration: "prem", pos: "noun", meaning_hi: "प्यार", meaning_en: "Love", input_forms: ["prem"], source: "mock", confidence: "high", usage_count: 90 },
    { id: 3, headword_hi: "शांति", transliteration: "shanti", pos: "noun", meaning_hi: "सुकून", meaning_en: "Peace", input_forms: ["shanti"], source: "mock", confidence: "high", usage_count: 80 },
  ];
  return scoreCandidates(query, mockWords);
}

// --- I) Main Lookup Function ---
export async function lookupWord(query: string): Promise<LookupResult> {
  const normQ = normalizeQuery(query);
  if (!normQ) {
    return {
      primaryWord: null, synonyms: [], antonyms: [], relatedWords: [], topCandidates: [],
      hitType: 'no_hit', confidenceBand: 'low', errorMessage: null
    };
  }

  try {
    let rows = await fetchByExactOrInputForms(normQ);
    
    if (rows.length === 0) {
      // If we failed to find exact matches, we could try harder here, 
      // but let's fall through to fuzzy for now.
    }

    if (rows.length > 0) {
      const scored = scoreCandidates(normQ, rows);
      const top = scored[0];
      const relations = await fetchWordRelations(top.row.id);
      
      logSearch(normQ, top.row.id, top.score >= 0.9 ? 'db_exact' : 'db_input_form');
      incrementUsage(top.row.id);

      return {
        primaryWord: top.row,
        ...relations,
        topCandidates: scored.slice(1, 20),
        hitType: top.score >= 0.9 ? 'db_exact' : 'db_input_form',
        confidenceBand: confidenceBand(top.score),
        errorMessage: null
      };
    } else {
      const fuzzyCandidates = await runFuzzyFallback(normQ);
      if (fuzzyCandidates.length > 0) {
        const top = fuzzyCandidates[0];
        const relations = await fetchWordRelations(top.row.id);
        
        logSearch(normQ, top.row.id, 'fuzzy');

        return {
          primaryWord: top.row,
          ...relations,
          topCandidates: fuzzyCandidates.slice(0, 20),
          hitType: 'fuzzy',
          confidenceBand: confidenceBand(top.score),
          errorMessage: null
        };
      }
    }
    
    logSearch(normQ, null, 'no_hit');
    return {
      primaryWord: null, synonyms: [], antonyms: [], relatedWords: [], topCandidates: [],
      hitType: 'no_hit', confidenceBand: 'low', errorMessage: "No results found"
    };

  } catch (err: any) {
    // If real DB fails, try mock fallback one last time
    const mock = getMockFallback(normQ);
    if (mock.length > 0) {
       return {
          primaryWord: mock[0].row,
          synonyms: [], antonyms: [], relatedWords: [],
          topCandidates: mock,
          hitType: 'fallback', confidenceBand: 'low', errorMessage: "Using offline backup"
       };
    }

    return {
      primaryWord: null, synonyms: [], antonyms: [], relatedWords: [], topCandidates: [],
      hitType: 'fallback', confidenceBand: 'low', errorMessage: err.message || "Search failed"
    };
  }
}

async function logSearch(query: string, wordId: number | null, hitType: string) {
  try {
    await supabase.from('search_logs').insert({ query, resolved_word_id: wordId, hit_type: hitType });
  } catch (e) { /* ignore */ }
}

async function incrementUsage(wordId: number) {
  try {
    // Optimistic increment, or RPC if available
  } catch (e) { /* ignore */ }
}
