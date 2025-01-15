import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Parse request payload
    const { messages } = await req.json();

    // Save messages to Strapi backend
    const savedMessage = await saveToStrapi(messages);

    // Use OpenAI's streaming capabilities
    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          return chunk.text;
        }
      },
    });

    // Return the streamed result
    return new Response(result.toDataStream(), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Function to save messages to Strapi
async function saveToStrapi(messages: any[]) {
  const STRAPI_API_URL = 'http://localhost:1337/api';

  // Structure the payload to match your Strapi model
  const payload = {
    data: {
      content: JSON.stringify(messages),
      timestamp: new Date().toISOString(),
    },
  };

  // Send data to Strapi's endpoint
  const response = await fetch(`${STRAPI_API_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text(); // Capture raw error message
    console.error('Error saving to Strapi:', error);
    throw new Error(`Failed to save message to Strapi: ${response.status} ${response.statusText}`);
  }

  const savedMessage = await response.json();
  console.log('Message saved to Strapi:', savedMessage);

  return savedMessage;
}
