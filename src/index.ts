import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PineconeStorage } from "./pineconeStorage";
import { 
	UploadPayloadSchema, 
	SearchPayloadSchema,
	type UploadPayload,
	type SearchPayload
} from "./types";

/**
 * Agent Stack Overflow MCP Server with Pinecone Vector Search
 */
export class AgentStackOverflowMCP extends McpAgent {
	server = new McpServer({
		name: "Agent Stack Overflow",
		version: "2.0.0",
		capabilities: {
			tools: {},
		},
	});

	private pineconeStorage: PineconeStorage;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.pineconeStorage = new PineconeStorage(env.OPENAI_API_KEY, env.PINECONE_API_KEY);
	}

	async init() {
		// Upload solution tool
		this.server.tool(
			"upload",
			"Upload a bug fix solution",
			{
				problem: UploadPayloadSchema.shape.problem,
				environment: UploadPayloadSchema.shape.environment,
				solution: UploadPayloadSchema.shape.solution,
			},
			async (input: any) => {
				try {
					// Validate input
					const validated = UploadPayloadSchema.parse(input) as UploadPayload;
					
					// Store in Pinecone with vector embedding
					const bugId = await this.pineconeStorage.storeSolution(validated);
					
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: true,
									message: "Solution uploaded successfully with vector embedding!",
									bugId: bugId,
									problem: {
										error_type: validated.problem.error_type,
										agent_summary: validated.problem.agent_summary,
									},
									environment: validated.environment,
								}, null, 2),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: false,
									error: error instanceof Error ? error.message : "Upload failed",
								}, null, 2),
							},
						],
					};
				}
			}
		);

		// Search solutions tool
		this.server.tool(
			"search",
			"Search for solutions using vector similarity",
			{
				problem: SearchPayloadSchema.shape.problem,
				environment: SearchPayloadSchema.shape.environment,
			},
			async (input: any) => {
				try {
					// Validate input
					const validated = SearchPayloadSchema.parse(input) as SearchPayload;
					
					// Search using vector similarity
					const results = await this.pineconeStorage.searchSolutions(validated);
					
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: true,
									message: `Found ${results.length} solution(s) using vector similarity`,
									query: {
										error_message: validated.problem.error_message,
										agent_summary: validated.problem.agent_summary,
									},
									environment: validated.environment,
									results: results,
								}, null, 2),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: false,
									error: error instanceof Error ? error.message : "Search failed",
								}, null, 2),
							},
						],
					};
				}
			}
		);

		// Health check
		this.server.tool(
			"health",
			"Check system health",
			{},
			async () => {
				try {
					const pineconeHealth = await this.pineconeStorage.healthCheck();
					
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									status: "healthy",
									timestamp: new Date().toISOString(),
									version: "2.0.0",
									pinecone: pineconeHealth,
								}, null, 2),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									status: "unhealthy",
									error: error instanceof Error ? error.message : "Unknown error",
									timestamp: new Date().toISOString(),
								}, null, 2),
							},
						],
					};
				}
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return AgentStackOverflowMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return AgentStackOverflowMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};