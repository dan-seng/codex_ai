import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🧠 Store chat sessions per sessionId
const chatSessions = {};

// Retry wrapper for 503 errors
async function fetchWithRetry(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      if (err.status === 503 && i < retries - 1) {
        console.log('Model busy, retrying...');
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// GET /
app.get('/', (req, res) => {
  res.status(200).send({ message: 'Hello from Gemini Chatbot!' });
});

// POST / -> chat with memory
app.post('/', async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    if (!prompt || !sessionId) return res.status(400).send({ bot: 'Missing prompt or sessionId.' });

    // Initialize session memory if not exists
    if (!chatSessions[sessionId]) chatSessions[sessionId] = [];

    // Build full prompt with chat history
    const context = chatSessions[sessionId]
      .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.text}`)
      .join('\n');
    const fullPrompt = `${context}\nUser: ${prompt}\nBot:`;

    // Fetch response with retry
    const result = await fetchWithRetry(fullPrompt);

    // Extract clean text
    const responseText = result.response.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join(' ')
      ?.trim() || 'Sorry, I could not generate a response.';

    // Save history
    chatSessions[sessionId].push({ role: 'user', text: prompt });
    chatSessions[sessionId].push({ role: 'bot', text: responseText });

    res.status(200).send({ bot: responseText });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).send({ bot: 'Something went wrong. Please try again.' });
  }
});

// POST /clear -> reset memory for session
app.post('/clear', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && chatSessions[sessionId]) chatSessions[sessionId] = [];
  res.status(200).send({ message: 'Chat memory cleared.' });
});

// Start server
app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));
