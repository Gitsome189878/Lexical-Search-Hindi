
import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  headwordHi: text("headword_hi").notNull(), // The main Hindi word
  transliteration: text("transliteration").notNull(), // Romanized Hindi (e.g., "namaste")
  pos: text("pos"), // Part of speech (noun, verb, etc.)
  meaningHi: text("meaning_hi").notNull(),
  meaningEn: text("meaning_en"),
  inputForms: text("input_forms").array(), // Variations for search matching
  source: text("source").default("dictionary"),
  confidence: text("confidence").default("high"), // high, medium, low
  usageCount: integer("usage_count").default(0),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const synonyms = pgTable("synonyms", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").notNull().references(() => words.id),
  synonymHi: text("synonym_hi").notNull(),
});

export const antonyms = pgTable("antonyms", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").notNull().references(() => words.id),
  antonymHi: text("antonym_hi").notNull(),
});

export const relatedWords = pgTable("related_words", {
  id: serial("id").primaryKey(),
  wordId: integer("word_id").notNull().references(() => words.id),
  relatedHi: text("related_hi").notNull(),
  similarity: real("similarity").default(0.0), // 0.0 to 1.0
  reason: text("reason"),
});

export const searchLogs = pgTable("search_logs", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  resolvedWordId: integer("resolved_word_id").references(() => words.id),
  hitType: text("hit_type"), // exact, fuzzy, transliteration, no_hit
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const wordsRelations = relations(words, ({ many }) => ({
  synonyms: many(synonyms),
  antonyms: many(antonyms),
  relatedWords: many(relatedWords),
}));

export const synonymsRelations = relations(synonyms, ({ one }) => ({
  word: one(words, {
    fields: [synonyms.wordId],
    references: [words.id],
  }),
}));

export const antonymsRelations = relations(antonyms, ({ one }) => ({
  word: one(words, {
    fields: [antonyms.wordId],
    references: [words.id],
  }),
}));

export const relatedWordsRelations = relations(relatedWords, ({ one }) => ({
  word: one(words, {
    fields: [relatedWords.wordId],
    references: [words.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertWordSchema = createInsertSchema(words).omit({ id: true, usageCount: true, fetchedAt: true });
export const insertSynonymSchema = createInsertSchema(synonyms).omit({ id: true });
export const insertAntonymSchema = createInsertSchema(antonyms).omit({ id: true });
export const insertRelatedWordSchema = createInsertSchema(relatedWords).omit({ id: true });
export const insertSearchLogSchema = createInsertSchema(searchLogs).omit({ id: true, createdAt: true });

// === EXPLICIT TYPES ===

export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;

export type Synonym = typeof synonyms.$inferSelect;
export type InsertSynonym = z.infer<typeof insertSynonymSchema>;

export type Antonym = typeof antonyms.$inferSelect;
export type InsertAntonym = z.infer<typeof insertAntonymSchema>;

export type RelatedWord = typeof relatedWords.$inferSelect;
export type InsertRelatedWord = z.infer<typeof insertRelatedWordSchema>;

// Detailed response type including relations
export type WordDetailResponse = Word & {
  synonyms: Synonym[];
  antonyms: Antonym[];
  relatedWords: RelatedWord[];
};

export type SearchResult = {
  words: Word[];
  matchType: "exact" | "fuzzy" | "transliteration" | "none";
};
