
import { z } from 'zod';
import { words, synonyms, antonyms, relatedWords } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  words: {
    search: {
      method: 'GET' as const,
      path: '/api/search' as const,
      input: z.object({
        q: z.string().min(1),
      }),
      responses: {
        200: z.object({
          words: z.array(z.custom<typeof words.$inferSelect>()),
          matchType: z.enum(["exact", "fuzzy", "transliteration", "none"]),
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/words/:id' as const,
      responses: {
        200: z.custom<typeof words.$inferSelect & {
          synonyms: typeof synonyms.$inferSelect[],
          antonyms: typeof antonyms.$inferSelect[],
          relatedWords: typeof relatedWords.$inferSelect[]
        }>(),
        404: errorSchemas.notFound,
      },
    },
    // Optional: for listing/browsing if needed
    list: {
      method: 'GET' as const,
      path: '/api/words' as const,
      input: z.object({
        page: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof words.$inferSelect>()),
      },
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
