import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  // Try common Vite output locations
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist"),
  ];

  const clientDir = candidates.find((dir) => fs.existsSync(path.join(dir, "index.html")));

  if (!clientDir) {
    console.error("Could not find built client index.html in dist/public or dist");
    return;
  }

  app.use(express.static(clientDir));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

