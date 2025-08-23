// /api/generate.js
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Alara's personality and system prompt
const SYSTEM_PROMPT = `You are Alara, an intelligent and helpful AI assistant. You are friendly, knowledgeable, and adaptive to the user's communication style. You provide clear, concise, and helpful responses while maintaining a warm and approachable personality. You can help with a wide range of topics including writing, coding, analysis, creative tasks, and general conversation. Always be respectful and considerate in your responses.`;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Extract the response
    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Send response
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Please check your configuration.' });
    }
    
    // Generic error response
    return res.status(500).json({ 
      error: 'Failed to generate response. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}