import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// 🧠 Store chat sessions per sessionId
const chatSessions = {};
const REALTIME_UNAVAILABLE_MESSAGE =
  "I don’t have access to real-time data. Please check a reliable live source.";

const systemPromptTemplate = `You are an AI assistant inside a production web application.

Capabilities:
- You generate text responses.
- You rely only on information explicitly provided in the conversation.

Limitations:
- You do NOT have access to a system clock.
- You do NOT have access to live internet data.
- You do NOT know real-time political updates unless provided.
- You cannot verify current events.

Rules:
- Never claim access to real-time systems.
- Never fabricate current dates or live facts.
- If real-time data is required and not provided, clearly state that you do not have access to it.

Current Date (ISO format):
{{CURRENT_DATE}}

If current date is provided in context, use it strictly.
If not provided, say you don’t know.`;

const TIME_QUESTION_RE =
  /\b(date|time|today|what day is it|current date|current time|right now|now)\b/i;
const REALTIME_DATA_RE =
  /\b(current|latest|today|as of|right now|president|prime minister|ceo|coach|manager|news|score|weather|stock|price|election)\b/i;
const PREDEFINED_RESPONSES = [
  {
    patterns: [
      /\bwho\s+(built|made|created|developed)\s+you\b/i,
      /\bwho\s+is\s+your\s+developer\b/i,
      /\bwho\s+developed\s+this\s+app\b/i,
      /\bwho\s+(built|made|created|developed)\s+this\b/i,
      /\bwho\s+made\s+this\s+(chat|bot|app|application)\b/i,
      /\bwho\s+is\s+behind\s+this\b/i,
      /\bwho\s+is\s+your\s+(creator|maker|owner)\b/i,
      /\bwho\s+owns\s+this\s+(chat|bot|app|application)\b/i,
      /\bwho\s+maintains\s+this\b/i,
      /\bwho\s+coded\s+this\b/i,
      /\bwho\s+designed\s+this\b/i,
      /\babout\s+the\s+developer\b/i,
      /\bdeveloper\s+info\b/i,
      /\bcreator\s+info\b/i,
      /\byour\s+developer\b/i,
      /\byour\s+creator\b/i,
    ],
    text: "I was developed by Daniel Gidey. You can connect with him here: [GitHub](https://github.com/dan-seng) | [LinkedIn](https://linkedin.com/in/danielgidey)",
  },
  {
    patterns: [/\bwhat\s+can\s+you\s+do\b/i, /\byour\s+capabilities\b/i],
    text: "I can help with writing, brainstorming, explaining concepts, code guidance, and general Q&A.",
  },
  {
    patterns: [/\bhow\s+do\s+i\s+clear\b.*\bchat\b/i, /\bclear\s+chat\b/i],
    text: "Use the trash icon at the top-right of the chat to clear this conversation.",
  },
  {
    patterns: [/\b(can|do)\s+you\s+(access|get)\s+real[- ]?time\b/i],
    text: REALTIME_UNAVAILABLE_MESSAGE,
  },
];

const buildSystemPrompt = () =>
  systemPromptTemplate.replace("{{CURRENT_DATE}}", new Date().toISOString());

const isTimeQuestion = (message) => TIME_QUESTION_RE.test(message);
const isRealtimeDataQuestion = (message) => REALTIME_DATA_RE.test(message);
const getPredefinedResponse = (message) => {
  for (const item of PREDEFINED_RESPONSES) {
    if (item.patterns.some((re) => re.test(message))) return item.text;
  }
  return null;
};
const buildContext = (history) =>
  history
    .slice(-12)
    .map((m) => `${m.role === "user" ? "User" : "Bot"}: ${m.text}`)
    .join("\n");

const addHistory = (sessionId, userText, botText) => {
  chatSessions[sessionId].push({ role: "user", text: userText });
  chatSessions[sessionId].push({ role: "bot", text: botText });
};

// Retry wrapper for 503 errors
async function fetchWithRetry(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      if (err.status === 503 && i < retries - 1) {
        console.log("Model busy, retrying...");
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// GET /
app.get("/", (req, res) => {
  res.status(200).send({ message: "Hello from Gemini Chatbot!" });
});

// POST / -> chat with memory
app.post("/", async (req, res) => {
  try {
    const { prompt: rawPrompt, sessionId } = req.body;
    const prompt = rawPrompt?.trim();
    if (!prompt || !sessionId)
      return res.status(400).send({ bot: "Missing prompt or sessionId." });

    // Initialize session memory if not exists
    if (!chatSessions[sessionId]) chatSessions[sessionId] = [];

    const predefined = getPredefinedResponse(prompt);
    if (predefined) {
      addHistory(sessionId, prompt, predefined);
      return res.status(200).send({ bot: predefined });
    }

    // Prefer deterministic backend response for direct date/time requests
    if (isTimeQuestion(prompt)) {
      const bot = `Current Date (ISO): ${new Date().toISOString()}`;
      addHistory(sessionId, prompt, bot);
      return res.status(200).send({ bot });
    }

    // Guard for live/current-event requests to prevent hallucinated "latest" facts
    if (isRealtimeDataQuestion(prompt)) {
      addHistory(sessionId, prompt, REALTIME_UNAVAILABLE_MESSAGE);
      return res.status(200).send({ bot: REALTIME_UNAVAILABLE_MESSAGE });
    }

    // Build full prompt with chat history
    const context = buildContext(chatSessions[sessionId]);
    const systemPrompt = buildSystemPrompt();
    const fullPrompt = `${systemPrompt}\n${context}\nUser: ${prompt}\nBot:`;

    // Fetch response with retry
    const result = await fetchWithRetry(fullPrompt);

    // Extract clean text
    const responseText =
      result.response.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join(" ")
        ?.trim() || "Sorry, I could not generate a response.";

    // Save history
    addHistory(sessionId, prompt, responseText);

    res.status(200).send({ bot: responseText });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send({ bot: "Something went wrong. Please try again." });
  }
});

// POST /clear -> reset memory for session
app.post("/clear", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && chatSessions[sessionId]) chatSessions[sessionId] = [];
  res.status(200).send({ message: "Chat memory cleared." });
});

// Start server
app.listen(5000, () =>
  console.log("✅ Server running on http://localhost:5000"),
);
