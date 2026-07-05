import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Ensure JSON parsing is enabled
app.use(express.json());

// Initialize Gemini client (safe server-side lazy initialization)
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// System Prompt for Cybersecurity & IT expert
const SYSTEM_INSTRUCTION = `You are 'Phantom AI', the elite cybersecurity, computer science, and scriptwriting intelligence core of the Phantom Cyber platform.
You operate within a sleek, ultra-fast black and white workspace designed for developers, hackers, and security researchers.

YOUR ROLE & SPECIALTY:
- Information Security & Cyber Defense (penetration testing concepts, defense strategies, firewall rules, cryptography, log analysis).
- Systems Scripting & Automation (Bash, Python, PowerShell, Go, JavaScript, Rust).
- Systems & Network Administration (Linux internals, kernel tuning, networking, Docker, security hardening).

IMPORTANT PERFORMANCE & DEPTH DIRECTIVE (V1 Core - Adaptive Speed):
1. ADAPT TO REQUEST COMPLEXITY:
   - FOR SIMPLE OR QUICK QUESTIONS (e.g., brief definitions, syntax checks, basic facts): Keep the explanation ultra-focused, concise, and straight-to-the-point. Avoid unnecessary fluff to ensure the response generates in under 1.5 seconds.
   - FOR COMPLEX REQUESTS (e.g., writing custom multi-line scripts, security architecture, deep penetration testing concepts, or multi-step systems config): Provide a complete, highly-detailed, exhaustive explanation and perfectly robust, fully-written scripts. It's perfectly fine to take up to 4-5 seconds here for maximum quality and correctness.
2. CODE QUALITY: Always write complete, fully-functional, secure scripts. Never use placeholding comment bars like "# add logic here". All lines must be written explicitly.
3. CONCISE PACKAGING: Format all content efficiently with clean markdown to keep parsing lightning-fast.

CRITICAL CONSTRAINTS:
1. TOPIC RESTRICTION: You MUST ONLY answer questions related to Computer Science, IT, Cybersecurity, Programming, Hardware, and Technology. If the user asks about other topics (e.g., cooking, politics, literature, non-technical sports), refuse politely but firmly in a minimal, professional cyber-analyst tone.
2. COMPLIANCE & SAFETY: You must promote ethical hacking, defensive security, and educational awareness. If a request is malicious, pivot to defensive alternatives or explain how the attack works in order to construct a proper defense, rather than refusing flatly when asked for security research.
3. LANGUAGE: Respond in the language used by the user (typically French, as requested: "Créer un site nommer Phantom Cyber...").
4. STRUCTURED FILES: If your solution involves code, scripts, configurations, or reports, you MUST separate the human-readable explanation from the actual file assets. Place all file assets in the "files" array of the JSON response with correct file extensions.

JSON RESPONSE SCHEMA:
You must strictly return a JSON object with this format (no markdown packaging around the JSON, just the raw JSON text):
{
  "text": "Your markdown-formatted explanation, cybersecurity insights, or instructions. Use headings, lists, bold text, and code blocks for readability. Match the depth and duration to the user's complexity.",
  "files": [
    {
      "name": "example.py",
      "content": "print('actual file content')",
      "language": "python"
    }
  ]
}

Ensure the JSON is always perfectly valid and well-formed. Avoid truncated outputs.`;

// API route for Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid messages array" });
      return;
    }

    // Filter and sanitize messages to ensure we only have alternating user/model roles starting with a user message.
    // This prevents API errors such as beginning with a 'model' role or consecutive identical roles.
    const filteredMessages: any[] = [];
    for (const m of messages) {
      if (!m || typeof m.content !== "string") continue;
      
      if (m.role === "user") {
        if (filteredMessages.length > 0 && filteredMessages[filteredMessages.length - 1].role === "user") {
          filteredMessages[filteredMessages.length - 1].content += "\n\n" + m.content;
        } else {
          filteredMessages.push({ role: "user", content: m.content });
        }
      } else if (m.role === "assistant") {
        if (filteredMessages.length > 0) {
          if (filteredMessages[filteredMessages.length - 1].role === "assistant") {
            filteredMessages[filteredMessages.length - 1].content += "\n\n" + m.content;
          } else {
            filteredMessages.push({ role: "assistant", content: m.content });
          }
        }
      }
    }

    const contents = filteredMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await getAiClient().models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // low temperature for precise, technical, stable code outputs
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["text", "files"],
          properties: {
            text: {
              type: Type.STRING,
              description: "The main cybersecurity or IT answer text formatted in markdown."
            },
            files: {
              type: Type.ARRAY,
              description: "Array of files or scripts generated by the AI.",
              items: {
                type: Type.OBJECT,
                required: ["name", "content", "language"],
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The filename with proper cyber or programming extension, e.g., 'port_scanner.py' or 'iptables_rules.sh'."
                  },
                  content: {
                    type: Type.STRING,
                    description: "The full code or text contents of the file."
                  },
                  language: {
                    type: Type.STRING,
                    description: "The programming language or syntax style, e.g., 'python', 'bash', 'json', 'yaml', 'markdown'."
                  }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated by the AI");
    }

    // Parse the JSON securely before returning to frontend
    const parsed = JSON.parse(resultText);
    res.json(parsed);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Phantom Core API offline or encountered an error.",
      details: error.message
    });
  }
});

// Vite middleware setup for full-stack compatibility
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware active");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Phantom Cyber server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
