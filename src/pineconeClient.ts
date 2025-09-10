/**
 * Pinecone client configuration for Agent Stack Overflow
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Get API key from environment (fallback for development)
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pcsk_3veaQa_ELEdEycc7Vpad3KgyLw2CsSZhKppPyzmYBBjnd3QJZFrYe7CQAdTxKzLfaTfvpo';

if (!PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY environment variable not set');
}

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Connect to the existing index
const INDEX_NAME = 'chengisjealous';
const NAMESPACE = 'agent-solutions';

export const pineconeIndex = pc.index(INDEX_NAME);
export const pineconeNamespace = pineconeIndex.namespace(NAMESPACE);

export default {
  index: pineconeIndex,
  namespace: pineconeNamespace,
  indexName: INDEX_NAME,
  namespaceName: NAMESPACE,
};