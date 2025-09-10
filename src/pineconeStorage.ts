/**
 * Pinecone-based storage for Agent Stack Overflow
 */

import { v4 as uuidv4 } from 'uuid';
import { Pinecone } from '@pinecone-database/pinecone';
import type { UploadPayload, SearchPayload, SearchResult } from './types';
import { embedSingle } from './embeddings';

export class PineconeStorage {
	private namespace: any;
	private openaiApiKey: string;
	private indexName = 'chengisjealous';
	private namespaceName = 'agent-solutions';

	constructor(openaiApiKey: string, pineconeApiKey: string) {
		this.openaiApiKey = openaiApiKey;
		
		// Initialize Pinecone client
		const pc = new Pinecone({ apiKey: pineconeApiKey });
		const index = pc.index(this.indexName);
		this.namespace = index.namespace(this.namespaceName);
	}

	/**
	 * Store a solution in Pinecone with vector embedding
	 */
	async storeSolution(input: UploadPayload): Promise<string> {
		try {
			// Generate unique ID
			const bugId = uuidv4();
			console.log(`Starting solution storage for ID: ${bugId}`);

			// Prepare text for embedding - this is key for semantic search
			const embeddingText = `${input.problem.error_type} ${input.problem.error_message} ${input.problem.agent_summary} ${input.solution.agent_explanation}`;
			console.log(`Embedding text length: ${embeddingText.length} characters`);

			// Generate embedding using OpenAI
			console.log('Generating embedding with OpenAI...');
			const embedding = await embedSingle(embeddingText, this.openaiApiKey);
			console.log(`Generated embedding with ${embedding.length} dimensions`);

			// Structure data for Pinecone with manual embedding
			const vectorToUpsert = {
				id: bugId,
				values: embedding, // Manual embedding values
				metadata: {
					// Metadata fields for filtering and retrieval
					error_type: input.problem.error_type,
					error_message: input.problem.error_message,
					agent_summary: input.problem.agent_summary,
					solution_payload: input.solution.solution_payload,
					agent_explanation: input.solution.agent_explanation,
					language: input.environment.language.toLowerCase(),
					library: input.environment.primary_library.toLowerCase(),
					created_at: new Date().toISOString(),
				}
			};

			// Upsert to Pinecone using standard format
			console.log(`Upserting vector to Pinecone index: ${this.indexName}, namespace: ${this.namespaceName}`);
			const upsertResponse = await this.namespace.upsert([vectorToUpsert]);
			console.log('Pinecone upsert response:', JSON.stringify(upsertResponse, null, 2));

			console.log(`Successfully stored solution with ID: ${bugId}`);
			return bugId;

		} catch (error) {
			console.error('Error storing solution in Pinecone:', error);
			throw new Error(`Failed to store solution: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Search for solutions using vector similarity and metadata filtering
	 */
	async searchSolutions(input: SearchPayload): Promise<SearchResult[]> {
		try {
			// Prepare search text for embedding
			const searchText = `${input.problem.error_message} ${input.problem.agent_summary}`;
			console.log(`Searching with query: "${searchText}"`);

			// Generate embedding for search query using OpenAI
			console.log('Generating query embedding...');
			const queryEmbedding = await embedSingle(searchText, this.openaiApiKey);
			console.log(`Query embedding has ${queryEmbedding.length} dimensions`);

			// Perform vector search with manual embedding
			console.log('Performing Pinecone vector search (no filters)');
			const searchResult = await this.namespace.query({
				vector: queryEmbedding,
				topK: 5, // Return top 5 most relevant results
				includeMetadata: true,
			});
			console.log('Pinecone search response:', JSON.stringify(searchResult, null, 2));

			// Format results
			const formattedResults: SearchResult[] = searchResult.matches?.map((match: any) => ({
				bugId: match.id,
				score: match.score || 0,
				solution: {
					solution_payload: match.metadata?.solution_payload || '',
					agent_explanation: match.metadata?.agent_explanation || '',
				},
				environment: {
					language: match.metadata?.language || '',
					library: match.metadata?.library || undefined,
				},
				problem: {
					error_type: match.metadata?.error_type || '',
					title: match.metadata?.agent_summary || '',
					description: match.metadata?.error_message || '',
				},
			})) || [];

			console.log(`Found ${formattedResults.length} solutions for query: "${searchText}"`);
			return formattedResults;

		} catch (error) {
			console.error('Error searching solutions in Pinecone:', error);
			throw new Error(`Failed to search solutions: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get solution by ID
	 */
	async getSolution(id: string): Promise<SearchResult | null> {
		try {
			// Fetch vector by ID
			const fetchResult = await this.namespace.fetch([id]);

			if (!fetchResult.records || !fetchResult.records[id]) {
				return null;
			}

			const record = fetchResult.records[id];
			return {
				bugId: record.id,
				score: 1.0, // No score for direct fetch
				solution: {
					solution_payload: record.metadata?.solution_payload as string || '',
					agent_explanation: record.metadata?.agent_explanation as string || '',
				},
				environment: {
					language: record.metadata?.language as string || '',
					library: record.metadata?.library as string || undefined,
				},
				problem: {
					error_type: record.metadata?.error_type as string || '',
					title: record.metadata?.agent_summary as string || '',
					description: record.metadata?.error_message as string || '',
				},
			};

		} catch (error) {
			console.error('Error getting solution from Pinecone:', error);
			return null;
		}
	}

	/**
	 * Health check for Pinecone connection
	 */
	async healthCheck(): Promise<{ status: string; indexName: string; namespace: string }> {
		try {
			// Generate a test embedding and try a simple search
			const testEmbedding = await embedSingle('test connectivity', this.openaiApiKey);
			await this.namespace.query({
				vector: testEmbedding,
				topK: 1,
				includeMetadata: false,
			});

			return {
				status: 'healthy',
				indexName: this.indexName,
				namespace: this.namespaceName,
			};

		} catch (error) {
			console.error('Pinecone health check failed:', error);
			return {
				status: 'unhealthy',
				indexName: this.indexName,
				namespace: this.namespaceName,
			};
		}
	}
}