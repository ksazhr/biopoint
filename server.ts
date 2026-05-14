import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "biopori_data.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure data file exists
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }

  // API Routes
  app.get("/api/biopori", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      try {
        res.json(JSON.parse(data));
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        res.json([]); // Return empty array if file is corrupted
      }
    } catch (error) {
      console.error("Read File Error:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/biopori", async (req, res) => {
    try {
      // Basic auth header check for demo purposes
      const authHeader = req.headers.authorization;
      if (authHeader !== "Bearer admin-secret-123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, description, lat, lng } = req.body;
      if (!name || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rawData = await fs.readFile(DATA_FILE, "utf-8");
      const data = JSON.parse(rawData);
      
      const newPoint = {
        id: Date.now().toString(),
        name,
        description,
        lat,
        lng,
        createdAt: new Date().toISOString()
      };

      data.push(newPoint);
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
      
      res.status(201).json(newPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.delete("/api/biopori/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader !== "Bearer admin-secret-123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const rawData = await fs.readFile(DATA_FILE, "utf-8");
      let data = JSON.parse(rawData);
      
      data = data.filter((p: any) => p.id !== id);
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
      
      res.status(200).json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
