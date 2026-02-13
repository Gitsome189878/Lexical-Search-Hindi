import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {
  const clientDist = path.resolve(process.cwd(), "dist", "public");
  const indexFile = path.join(clientDist, "index.html");

  if (!fs.existsSync(indexFile)) {
    console.error("Static index not found at:", indexFile);
    return;
  }

  app.use(express.static(clientDist));

  app.get("*", (_req, res) => {
    res.sendFile(indexFile);
  });
}


