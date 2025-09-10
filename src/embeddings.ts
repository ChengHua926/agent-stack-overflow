/**
 * OpenAI embedding utilities for Agent Stack Overflow
 */

import OpenAI from 'openai';

/**
 * Create OpenAI client with the provided API key
 */
function createOpenAIClient(apiKey: string): OpenAI {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model with 1024 dimensions
 */
export async function embed(texts: string[], apiKey: string): Promise<number[][]> {
  try {
    const openai = createOpenAIClient(apiKey);
    
    console.log(`Generating embeddings for ${texts.length} texts using text-embedding-3-small with 1024 dimensions`);
    
    const response = await openai.embeddings.create({
      input: texts,
      model: "text-embedding-3-small",
      dimensions: 1024 // Match the Pinecone index dimension
    });
    
    console.log(`Successfully generated ${response.data.length} embeddings`);
    return response.data.map(r => r.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embedding for a single text string
 */
export async function embedSingle(text: string, apiKey: string): Promise<number[]> {
  const embeddings = await embed([text], apiKey);
  return embeddings[0];
}