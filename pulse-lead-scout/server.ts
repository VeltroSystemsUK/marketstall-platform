import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json({ limit: "10mb" }));

// Lead Evaluation System Prompt
const SYSTEM_PROMPT = `You are an advanced Backend Data Architect and Lead Generation Engineer specializing in local B2B customer acquisition. Your objective is to process raw data batches retrieved from the Google Places API (New), filter for high-value local business leads, assess their current digital presence, and output a structured, prioritized lead pipeline ready for instant AI website demo generation.

---

## 1. Input Data Structure
You will be provided with a raw payload of local businesses matching a specific sector and geographic area.

---

## 2. Core Execution Logic & Evaluation Pipeline

For every business object inside the places array, you must execute a strict 3-tiered triage process:

### Tier 1: Digital Presence Classification
Analyze the websiteUri field and classify:
1. NO_WEBSITE: websiteUri is null, empty, or missing. (Priority: CRITICAL)
2. OUTDATED_UNSECURE: uses http:// instead of https://. (Priority: HIGH)
3. STANDARD_WEBSITE: uses https://. Pass to Tier 2.

### Tier 2: The "Prehistoric Footprint" Heuristic Check
Flag as OUTDATED if:
- Domain contains /index.html, /home.php (OUTDATED_STATIC)
- Redirects to Facebook, Instagram, Yell instead of a standalone domain.
- Uses personal email (@gmail.com, @hotmail.co.uk etc) instead of branded domain.

### Tier 3: Engagement & Reputation Weighting
- The "Hidden Gem" Formula: High rating (>= 4.0) and high review count (>= 15) with NO_WEBSITE or OUTDATED classification = top priority.

---

## 3. Output Format Requirements
Output ONLY a clean JSON array of objects for EVERY business provided in the input batch.
Do NOT filter any businesses out.
Sort the final list by Lead Score (1-100) descending.
Leads with modern, secure websites should be included but assigned a lower Lead Score (e.g., 0-20) and classified as MODERN_RETAIN.

## 4. framework_type and website_url rules

For framework_type in ai_demo_generation_parameters, you MUST use exactly one of these three values — no other values are valid:
- "trades" — plumbers, electricians, builders, roofers, heating engineers, handymen, decorators, landscapers, locksmiths, pest control
- "wellness" — hair salons, barbers, beauty salons, spas, gyms, yoga studios, personal trainers, therapists, massage, nail bars, tattoo studios
- "hospitality" — restaurants, cafes, pubs, bars, hotels, B&Bs, takeaways, bakeries, food vans, catering

For website_url: extract the business websiteUri from the input data exactly as provided. If websiteUri is null, empty, or missing, set website_url to an empty string "".`;

app.post("/api/analyze-leads", async (req, res) => {
  try {
    const { places, modelId = "gemini-3-flash-preview" } = req.body;

    if (!places || !Array.isArray(places)) {
      return res.status(400).json({ error: "Invalid places data" });
    }

    const generateWithRetry = async (
      placesInput: any,
      selectedModel: string,
      attempt = 1,
    ): Promise<any> => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 60_000),
        );
        return await Promise.race([
          ai.models.generateContent({
            model: selectedModel,
            contents: JSON.stringify({ places: placesInput }),
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lead_id: { type: Type.STRING },
                    business_name: { type: Type.STRING },
                    lead_score: { type: Type.NUMBER },
                    current_digital_status: { type: Type.STRING },
                    contact_details: {
                      type: Type.OBJECT,
                      properties: {
                        address: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                      },
                      required: ["address"],
                    },
                    pitch_hook_angle: { type: Type.STRING },
                    website_url: { type: Type.STRING },
                    ai_demo_generation_parameters: {
                      type: Type.OBJECT,
                      properties: {
                        framework_type: { type: Type.STRING },
                        suggested_primary_keyword: { type: Type.STRING },
                        recommended_placeholders: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: [
                        "framework_type",
                        "suggested_primary_keyword",
                        "recommended_placeholders",
                      ],
                    },
                  },
                  required: [
                    "lead_id",
                    "business_name",
                    "lead_score",
                    "current_digital_status",
                    "contact_details",
                    "pitch_hook_angle",
                    "ai_demo_generation_parameters",
                  ],
                },
              },
              systemInstruction: SYSTEM_PROMPT,
            },
          }),
          timeoutPromise,
        ]);
      } catch (err: any) {
        const isUnavailable =
          err.message?.includes("503") ||
          err.message?.includes("UNAVAILABLE") ||
          err.message?.includes("high demand") ||
          err.message?.includes("busy");
        if (isUnavailable && attempt <= 5) {
          const waitTime = Math.pow(2, attempt) * 500 + Math.random() * 1000;
          console.warn(
            `Gemini (${selectedModel}) 503/Busy (Attempt ${attempt}/5). Retrying in ${Math.round(waitTime)}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return generateWithRetry(placesInput, selectedModel, attempt + 1);
        }
        throw err;
      }
    };

    const response = await generateWithRetry(places, modelId);

    const responseText = response.text;

    // Sanitize response: remove markdown code blocks if they exist
    const sanitizedText =
      responseText?.replace(/```json\n?|```/g, "").trim() || "[]";

    try {
      const leads = JSON.parse(sanitizedText);
      res.json(leads);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", responseText);
      res.status(500).json({
        error: "Failed to parse AI response",
        raw: responseText,
      });
    }
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({
      error: error.message,
      details: error.stack,
      raw: error,
    });
  }
});

// Vite middleware setup
async function startServer() {
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
