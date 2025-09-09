import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimpleStorage } from "./storage";
import { UploadSchema, SearchSchema, type UploadInput, type SearchInput } from "./types";

/**
 * Simple Agent Stack Overflow MCP Server
 */
export class AgentStackOverflowMCP extends McpAgent {
	server = new McpServer({
		name: "Agent Stack Overflow",
		version: "1.0.0",
		capabilities: {
			tools: {},
		},
	});

	private storage: SimpleStorage;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.storage = new SimpleStorage(state.storage);
	}

	async init() {
		// Upload tool - store code solutions
		this.server.tool(
			"upload",
			"Upload a code solution",
			{
				title: UploadSchema.shape.title,
				description: UploadSchema.shape.description,
				code: UploadSchema.shape.code,
				tags: UploadSchema.shape.tags,
			},
			async (input: any) => {
				try {
					// Basic validation
					const validated = UploadSchema.parse(input) as UploadInput;
					
					// Store the entry
					const entry = await this.storage.store(validated);
					
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: true,
									message: "Code solution uploaded successfully!",
									id: entry.id,
									title: entry.title,
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

		// Search tool - find code solutions
		this.server.tool(
			"search",
			"Search for code solutions",
			{
				query: SearchSchema.shape.query,
			},
			async (input: any) => {
				try {
					// Basic validation
					const validated = SearchSchema.parse(input) as SearchInput;
					
					// Search entries
					const results = await this.storage.search(validated.query);
					
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									success: true,
									message: `Found ${results.length} solution(s) for "${validated.query}"`,
									results: results.map(r => ({
										id: r.id,
										title: r.title,
										description: r.description,
										code: r.code,
										tags: r.tags,
										createdAt: r.createdAt,
									})),
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