
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed data on startup
  await storage.seedData();

  app.get(api.words.search.path, async (req, res) => {
    try {
      const { q } = api.words.search.input.parse(req.query);
      const result = await storage.searchWords(q);
      
      // Log the search (fire and forget)
      if (result.words.length > 0) {
        storage.logSearch({
          query: q,
          resolvedWordId: result.words[0].id,
          hitType: result.matchType
        });
      } else {
        storage.logSearch({
          query: q,
          resolvedWordId: null,
          hitType: "no_hit"
        });
      }

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search query" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.words.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const word = await storage.getWord(id);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }

      res.json(word);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.words.list.path, async (req, res) => {
     // Basic implementation for listing, could be expanded for pagination
     const result = await storage.searchWords(""); // Empty search might return defaults or we can implement getWords()
     res.json(result.words);
  });

  return httpServer;
}
