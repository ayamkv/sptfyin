import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRandomURL } from '../pocketbase';
import PocketBase from 'pocketbase';

// Mock PocketBase globally
vi.mock('pocketbase', () => {
	const mockGetList = vi.fn();
	return {
		default: vi.fn(() => ({
			collection: () => ({
				getList: mockGetList
			})
		}))
	};
});

describe('generateRandomURL', () => {
	let mockDb;
	let existingUrls = new Set();
	beforeEach(() => {
		mockDb = new PocketBase();
		// Default mock implementation returns no collisions
		mockDb.collection().getList.mockResolvedValue({ items: [] });
	});

	afterEach(() => {
		existingUrls.clear();
		vi.clearAllMocks();
	});

	it('should generate a 4-character URL when no collisions', async () => {
		const url = await generateRandomURL();
		expect(url).toMatch(/^[0-9a-z]{4}$/);
	});
	it('should increase length when many collisions occur', async () => {
		// Mock PocketBase to simulate collisions for all 4-character URLs
		const mockGetList = mockDb.collection().getList;
		let attemptCount = 0;

		mockGetList.mockImplementation(async (page, perPage, { filter }) => {
			const urlToCheck = filter.split("'")[1];
			attemptCount++;

			// Return collision for all 4-char URLs
			if (urlToCheck.length === 4) {
				return { items: [{ id: 1 }] };
			}

			// Success for longer URLs
			return { items: [] };
		});

		const url = await generateRandomURL();
		expect(url.length).toBe(5);
		expect(attemptCount).toBeGreaterThan(10); // Should have tried multiple times at length 4
	});
	it('should throw error when max length is reached', async () => {
		// Mock PocketBase to always return collisions
		const mockGetList = mockDb.collection().getList;
		let attempts = 0;

		mockGetList.mockImplementation(async () => {
			attempts++;
			return { items: [{ id: 1 }] }; // Always return collision
		});

		// Should throw error after trying all lengths up to maxLength
		await expect(generateRandomURL()).rejects.toThrow();
		// Should have tried multiple attempts at each length from 4 to 8
		expect(attempts).toBeGreaterThan(40); // At least 10 attempts per length
	});

	it('should not generate duplicate URLs', async () => {
		const generatedUrls = new Set();
		const attempts = 100;

		for (let i = 0; i < attempts; i++) {
			const url = await generateRandomURL();
			expect(generatedUrls.has(url)).toBe(false);
			generatedUrls.add(url);
		}
	});

	it('should maintain URL format', async () => {
		const url = await generateRandomURL();
		expect(url).toMatch(/^[0-9a-z]+$/);
		expect(url.length).toBeGreaterThanOrEqual(4);
		expect(url.length).toBeLessThanOrEqual(8);
	});
});
