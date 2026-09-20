import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Helper to generate content with fallback across Gemini models
async function generateWithModelFallback(ai: GoogleGenAI, contents: string) {
  const models = ["gemini-2.5-flash", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err?.message}. Trying fallback model...`);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Server-side AI Translation endpoint using Gemini API
  app.post("/api/ai-translate", async (req, res) => {
    try {
      const { text, context, targetLang = "Arabic" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text to translate" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured. Please check secrets.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `You are a professional video game localization expert specializing in dark sci-fi, horror, and psychological thrillers.
Translate the following game strings or text into ${targetLang} (العربية).
CRITICAL RULES:
1. Preserve all formatting tokens exactly as they are: <cf>, {/n}, [brackets], hex codes, and variables.
2. Translate dialog and narrative with atmospheric, natural, high-literary Arabic tone matching the game's eerie claustrophobic atmosphere.
3. Keep character names consistent (Stepan Adamenko = ستيبان أدامينكو, Viktor Kaminskyi = فيكتور كامينسكي, Petro = بيترو, Bohdan = بوهدان, Hrytsenko = هريتسينكو, Maria = ماريا, Strata = ستراتا, Vostok = فوستوك, M.O.L.E. = إم.أو.إل.إي).
4. Return ONLY the translated text without commentary or conversational filler.

${context ? `Context: ${context}\n` : ""}Text to translate:
${text}`;

      const response = await generateWithModelFallback(ai, prompt);

      const translated = response.text || "";
      return res.json({ translated });
    } catch (err: any) {
      console.error("AI Translation Error:", err);
      return res.status(500).json({ error: err?.message || "Failed to translate with AI" });
    }
  });

  // Batch translation endpoint for game text files (TXT / JSON / XLS)
  app.post("/api/ai-translate-batch", async (req, res) => {
    try {
      const { items, gameContext = "Video game localization (dialogue, menus, lore)", targetLang = "Arabic" } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing or invalid items array" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured. Please check secrets.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Limit to 60 items per batch to stay fast and within tokens
      const itemsToTranslate = items.slice(0, 60);

      const prompt = `You are an elite video game localization engineer.
Translate the following game strings into ${targetLang} (العربية).
STRICT LOCALIZATION RULES:
1. Preserve all formatting tokens, engine tags, and variables EXACTLY without changing or translating them:
   - <cf>, {/n}, \\n, \\r, \\t
   - {0}, {1}, %s, %d, %f, {PLAYER_NAME}, {COUNT}
   - [b], [/b], [color=...], <color=...>
   - XML/HTML tags and code tokens.
2. Translate dialog with natural, immersive, cinematic Arabic suited for video games.
3. Keep character names, ship names, and technical terms consistent.
4. Output MUST be a valid JSON array of objects with the EXACT structure:
[
  {"id": <id>, "translated": "<arabic translation>"}
]
Do NOT include markdown fences, conversational text, or anything other than the JSON array.

Context: ${gameContext}

Strings to translate:
${JSON.stringify(itemsToTranslate.map(i => ({ id: i.id, text: i.text })), null, 2)}`;

      const response = await generateWithModelFallback(ai, prompt);

      let rawOutput = (response.text || "").trim();
      // Remove any code blocks if returned
      if (rawOutput.startsWith("```")) {
        rawOutput = rawOutput.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }

      let parsedResults: Array<{ id: number | string; translated: string }> = [];
      try {
        parsedResults = JSON.parse(rawOutput);
      } catch (parseErr) {
        console.warn("JSON parse failed, attempting regex extraction", rawOutput.slice(0, 200));
        // Fallback simple line extraction if needed
        const match = rawOutput.match(/\[[\s\S]*\]/);
        if (match) {
          parsedResults = JSON.parse(match[0]);
        } else {
          throw new Error("Could not parse AI response as JSON array");
        }
      }

      return res.json({ results: parsedResults });
    } catch (err: any) {
      console.error("AI Batch Translation Error:", err);
      return res.status(500).json({ error: err?.message || "Failed to batch translate with AI" });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MOLE Localization Studio running at http://localhost:${PORT}`);
  });
}

startServer();
