/**
 * Simple storage for Agent Stack Overflow
 */

import type { Entry, UploadInput } from "./types";

export class SimpleStorage {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	/**
	 * Store an entry
	 */
	async store(input: UploadInput): Promise<Entry> {
		const entry: Entry = {
			id: this.generateId(),
			title: input.title,
			description: input.description,
			code: input.code,
			tags: input.tags,
			createdAt: new Date(),
		};

		await this.storage.put(`entry:${entry.id}`, entry);
		return entry;
	}

	/**
	 * Search entries with simple string matching
	 */
	async search(query: string): Promise<Entry[]> {
		const entries: Entry[] = [];
		const list = await this.storage.list({ prefix: "entry:" });

		for (const [, entry] of list) {
			const e = entry as Entry;
			// Convert date string back to Date if needed
			if (typeof e.createdAt === "string") {
				e.createdAt = new Date(e.createdAt);
			}

			// Simple string search in title, description, code, and tags
			const searchText = `${e.title} ${e.description} ${e.code} ${e.tags.join(" ")}`.toLowerCase();
			if (searchText.includes(query.toLowerCase())) {
				entries.push(e);
			}
		}

		return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}

	private generateId(): string {
		return Date.now().toString() + Math.random().toString(36).substr(2, 5);
	}
}