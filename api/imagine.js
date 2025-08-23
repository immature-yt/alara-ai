// /api/imagine.js

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
    const { prompt } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // Sanitize and encode the prompt for URL
    const sanitizedPrompt = prompt.slice(0, 500); // Limit prompt length
    const encodedPrompt = encodeURIComponent(sanitizedPrompt);

    // Generate image URL using Pollinations API
    // Pollinations provides a direct URL-based API that doesn't require authentication
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    // Verify the image is accessible by making a HEAD request
    try {
      const checkResponse = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!checkResponse.ok) {
        throw new Error('Image generation failed');
      }

      // Return the image URL
      return res.status(200).json({ 
        imageUrl,
        prompt: sanitizedPrompt
      });

    } catch (fetchError) {
      console.error('Image verification failed:', fetchError);
      
      // Still return the URL as Pollinations generates on-demand
      // The image will be generated when the browser requests it
      return res.status(200).json({ 
        imageUrl,
        prompt: sanitizedPrompt,
        note: 'Image is being generated, may take a moment to load'
      });
    }

  } catch (error) {
    console.error('Image generation error:', error);
    
    return res.status(500).json({ 
      error: 'Failed to generate image. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}