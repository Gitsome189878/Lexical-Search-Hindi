
import { db } from "./db";
import {
  words,
  synonyms,
  antonyms,
  relatedWords,
  searchLogs,
  type Word,
  type InsertWord,
  type InsertSynonym,
  type InsertAntonym,
  type InsertRelatedWord,
  type InsertSearchLog,
  type WordDetailResponse,
  type SearchResult,
} from "@shared/schema";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
// We will use a simple in-memory implementation of Fuse.js for the MVP seed data
// In a real production app with millions of rows, we'd use pg_trgm
import Fuse from "fuse.js";

export interface IStorage {
  searchWords(query: string): Promise<SearchResult>;
  getWord(id: number): Promise<WordDetailResponse | undefined>;
  logSearch(log: InsertSearchLog): Promise<void>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Simple in-memory cache for Fuse.js since we have a small seed dataset
  private fuseIndex: Fuse<Word> | null = null;

  async searchWords(query: string): Promise<SearchResult> {
    const normalizedQuery = query.trim().toLowerCase();

    // 1. Exact Match (Headword or Input Forms)
    // We use array_position to check if query is in input_forms array
    const exactMatches = await db
      .select()
      .from(words)
      .where(
        or(
          eq(words.headwordHi, query), // Exact Hindi match
          eq(words.transliteration, normalizedQuery), // Exact transliteration match
          sql`${query} = ANY(${words.inputForms})` // Match in input_forms array
        )
      )
      .limit(10);

    if (exactMatches.length > 0) {
      return { words: exactMatches, matchType: "exact" };
    }

    // 2. Fuzzy Match (Fallback)
    // For MVP, we'll fetch all words and use Fuse.js. 
    // optimization: In production, use pg_trgm or only fetch a subset.
    if (!this.fuseIndex) {
      const allWords = await db.select().from(words);
      this.fuseIndex = new Fuse(allWords, {
        keys: ["headwordHi", "transliteration", "inputForms"],
        threshold: 0.3,
        distance: 100,
      });
    }

    const fuzzyResults = this.fuseIndex.search(normalizedQuery);
    const fuzzyMatches = fuzzyResults.map((r) => r.item).slice(0, 10);

    if (fuzzyMatches.length > 0) {
      return { words: fuzzyMatches, matchType: "fuzzy" };
    }

    return { words: [], matchType: "none" };
  }

  async getWord(id: number): Promise<WordDetailResponse | undefined> {
    const word = await db.query.words.findFirst({
      where: eq(words.id, id),
    });

    if (!word) return undefined;

    // Increment usage count
    await db
      .update(words)
      .set({ usageCount: (word.usageCount || 0) + 1 })
      .where(eq(words.id, id));

    const wordSynonyms = await db
      .select()
      .from(synonyms)
      .where(eq(synonyms.wordId, id));
    
    const wordAntonyms = await db
      .select()
      .from(antonyms)
      .where(eq(antonyms.wordId, id));

    const wordRelated = await db
      .select()
      .from(relatedWords)
      .where(eq(relatedWords.wordId, id));

    return {
      ...word,
      synonyms: wordSynonyms,
      antonyms: wordAntonyms,
      relatedWords: wordRelated,
    };
  }

  async logSearch(log: InsertSearchLog): Promise<void> {
    await db.insert(searchLogs).values(log);
  }

  async seedData(): Promise<void> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(words);
    if (Number(count[0].count) > 0) return;

    console.log("Seeding database...");

    const seedWords: InsertWord[] = [
      {
        headwordHi: "नमस्ते",
        transliteration: "namaste",
        pos: "interjection",
        meaningHi: "अभिवादन करने का एक तरीका",
        meaningEn: "A respectful greeting",
        inputForms: ["namaste", "namaskar", "namasthe"],
        confidence: "high",
        usageCount: 100,
      },
      {
        headwordHi: "प्रेम",
        transliteration: "prem",
        pos: "noun",
        meaningHi: "गहरा स्नेह या लगाव",
        meaningEn: "Love, affection",
        inputForms: ["prem", "pyar", "love"],
        confidence: "high",
        usageCount: 85,
      },
      {
        headwordHi: "शांति",
        transliteration: "shanti",
        pos: "noun",
        meaningHi: "मन की स्थिरता और सुकून",
        meaningEn: "Peace, tranquility",
        inputForms: ["shanti", "peace", "sukoon"],
        confidence: "high",
        usageCount: 70,
      },
      {
        headwordHi: "विश्वास",
        transliteration: "vishwas",
        pos: "noun",
        meaningHi: "किसी पर भरोसा करना",
        meaningEn: "Trust, belief",
        inputForms: ["vishwas", "trust", "bharosa"],
        confidence: "high",
        usageCount: 60,
      },
      {
        headwordHi: "मित्र",
        transliteration: "mitra",
        pos: "noun",
        meaningHi: "दोस्त, सखा",
        meaningEn: "Friend",
        inputForms: ["mitra", "dost", "friend"],
        confidence: "high",
        usageCount: 90,
      },
       {
        headwordHi: "किताब",
        transliteration: "kitab",
        pos: "noun",
        meaningHi: "पुस्तक, पोथी",
        meaningEn: "Book",
        inputForms: ["kitab", "pustak", "book"],
        confidence: "high",
        usageCount: 50,
      },
      {
        headwordHi: "सपना",
        transliteration: "sapna",
        pos: "noun",
        meaningHi: "स्वप्न, ख्याली पुलाव",
        meaningEn: "Dream",
        inputForms: ["sapna", "dream", "swapan"],
        confidence: "high",
        usageCount: 45,
      }
    ];

    const insertedWords = await db.insert(words).values(seedWords).returning();

    // Add related data for "नमस्ते" (Index 0)
    await db.insert(synonyms).values([
      { wordId: insertedWords[0].id, synonymHi: "नमस्कार" },
      { wordId: insertedWords[0].id, synonymHi: "प्रणाम" },
    ]);
    
    // Add related data for "प्रेम" (Index 1)
    await db.insert(synonyms).values([
      { wordId: insertedWords[1].id, synonymHi: "प्यार" },
      { wordId: insertedWords[1].id, synonymHi: "स्नेह" },
      { wordId: insertedWords[1].id, synonymHi: "मोहब्बत" },
      { wordId: insertedWords[1].id, synonymHi: "अनुराग" },
    ]);
    await db.insert(antonyms).values([
      { wordId: insertedWords[1].id, antonymHi: "घृणा" },
      { wordId: insertedWords[1].id, antonymHi: "नफरत" },
    ]);
    await db.insert(relatedWords).values([
      { wordId: insertedWords[1].id, relatedHi: "दिल", similarity: 0.8, reason: "Contextual" },
      { wordId: insertedWords[1].id, relatedHi: "भावना", similarity: 0.6, reason: "Category" },
    ]);

    // Add related data for "मित्र" (Index 4)
    await db.insert(synonyms).values([
        { wordId: insertedWords[4].id, synonymHi: "दोस्त" },
        { wordId: insertedWords[4].id, synonymHi: "सखा" },
        { wordId: insertedWords[4].id, synonymHi: "यार" },
    ]);
     await db.insert(antonyms).values([
      { wordId: insertedWords[4].id, antonymHi: "शत्रु" },
      { wordId: insertedWords[4].id, antonymHi: "दुश्मन" },
    ]);
    
    console.log("Seeding complete.");
  }
}

export const storage = new DatabaseStorage();
