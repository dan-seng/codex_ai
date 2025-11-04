

import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send({ message: 'Hello from Gemini!' });
});

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text(); // <-- FIXED

    res.status(200).send({
      bot: responseText
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Something went wrong');
  }
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
