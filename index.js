// index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());

const CONFIG = {
  maxTitleLength: 50,
  apiKey: process.env.GEMINI_API_KEY, // API key from environment variables
  renameInterval: 1800000, // 30 minutes
};

const genAI = new GoogleGenerativeAI(CONFIG.apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const generationConfig = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  
};

async function fetchAITitle(originalTitle) {
  if (!originalTitle || originalTitle.trim().length === 0) {
    return originalTitle;
  }
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    const prompt = `Summarize the following phrase into a concise, meaningful title of fewer than 5 words that preserves its original purpose and key information. Return only the title, without quotation marks or additional formatting. (If the phrase says "New Tab" or "Youtube" or "Google" or "Settings" just simply return with the same word. So if the phrase is for example New Tab just respond with New Tab) (for any links containing the word 'DuckDuckGo', only summarise the web search query and remove the word 'DuckDuckGo' from the renamed title): ${originalTitle}`;
    const result = await chatSession.sendMessage(prompt);
    const aiTitle = result.response.text();
    return aiTitle.trim().substring(0, CONFIG.maxTitleLength);
  } catch (error) {
    console.error('AI Title Fetch Error:', error);
    return originalTitle;
  }
}

// API endpoint to rename a title
app.post('/api/rename', async (req, res) => {
  const originalTitle = req.body.title;
  const newTitle = await fetchAITitle(originalTitle);
  res.json({ newTitle });
});

// (Optional) Define a root route so you don’t get "Cannot GET /" when visiting the base URL.
app.get('/', (req, res) => {
  res.send('Gemini Proxy Server is running!');
});

// Start the server on the port provided by Render (or default 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));