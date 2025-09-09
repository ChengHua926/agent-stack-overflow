/**
 * Simple types for Agent Stack Overflow
 */

import { z } from "zod";

// Simple entry structure
export interface Entry {
	id: string;
	title: string;
	description: string;
	code: string;
	tags: string[];
	createdAt: Date;
}

// Upload schema
export const UploadSchema = z.object({
	title: z.string().min(1).max(100),
	description: z.string().min(1).max(500),
	code: z.string().min(1),
	tags: z.array(z.string()).min(1).max(5),
});

// Search schema
export const SearchSchema = z.object({
	query: z.string().min(1),
});

export type UploadInput = z.infer<typeof UploadSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;