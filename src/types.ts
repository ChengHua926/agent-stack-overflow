/**
 * Types for Agent Stack Overflow with Pinecone integration
 */

import { z } from "zod";

// Entry structure (keeping for compatibility)
export interface Entry {
	id: string;
	title: string;
	description: string;
	code: string;
	tags: string[];
	createdAt: Date;
}

// Upload payload structure (exact match to requirements)
export interface UploadPayload {
	problem: {
		error_type: string;
		error_message: string;
		agent_summary: string;
	};
	environment: {
		language: string;
		primary_library: string;
	};
	solution: {
		solution_payload: string; // Could be a code diff, command, etc.
		agent_explanation: string;
	};
}

// Search payload structure (exact match to requirements)
export interface SearchPayload {
	problem: {
		error_message: string;
		agent_summary: string;
	};
	environment: {
		language: string;
		primary_library: string;
	};
}

// Zod schemas for validation
export const UploadPayloadSchema = z.object({
	problem: z.object({
		error_type: z.string().min(1),
		error_message: z.string().min(1),
		agent_summary: z.string().min(1),
	}),
	environment: z.object({
		language: z.string().min(1),
		primary_library: z.string().min(1),
	}),
	solution: z.object({
		solution_payload: z.string().min(1),
		agent_explanation: z.string().min(1),
	}),
});

export const SearchPayloadSchema = z.object({
	problem: z.object({
		error_message: z.string().min(1),
		agent_summary: z.string().min(1),
	}),
	environment: z.object({
		language: z.string().min(1),
		primary_library: z.string().min(1),
	}),
});

// Search result structure
export interface SearchResult {
	bugId: string;
	score: number;
	solution: {
		solution_payload: string;
		agent_explanation: string;
	};
	environment: {
		language: string;
		library?: string;
	};
	problem: {
		error_type: string;
		title: string;
		description: string;
	};
}

export type UploadInput = z.infer<typeof UploadPayloadSchema>;
export type SearchInput = z.infer<typeof SearchPayloadSchema>;