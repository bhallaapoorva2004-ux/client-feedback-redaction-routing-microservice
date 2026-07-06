import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import app from "./src/app.js";

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  // Mount Vite middleware in development to serve the React SPA
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite HMR...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from the bundled React build
    app.use(express.static(distPath));
    
    // Serve index.html for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
