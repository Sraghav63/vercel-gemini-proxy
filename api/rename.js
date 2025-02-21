const { GoogleGenerativeAI } = require('@google/generative-ai');

const CONFIG = {
  maxTitleLength: 50,
  apiKey: process.env.GEMINI_API_KEY, 
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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title } = req.body;
  const newTitle = await fetchAITitle(title);
  res.json({ newTitle });
};
