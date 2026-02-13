import express, { type Express } from "express";
import path from "path";

export function serveStatic(app: Express) {
  const clientDist = path.resolve(process.cwd(), "dist", "public");

  app.use(express.static(clientDist));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
