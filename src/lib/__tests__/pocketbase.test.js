import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRandomURL, isSlugAvailable } from '../pocketbase';
import PocketBase from 'pocketbase';

const nanoidState = vi.hoisted(() => ({
	queue: [],
	counters: new Map()
}));

// Mock PocketBase globally
vi.mock('pocketbase', () => {
	const mockGetList = vi.fn();
	const mockFilter = vi.fn((expression, params = {}) =>
		expression.replace(/\{:(\w+)\}/g, (_, key) => `'${String(params[key] ?? '')}'`)
	);
	return {
		default: vi.fn(() => ({
			collection: () => ({
				getList: mockGetList
			}),
			filter: mockFilter
		}))
	};
});

vi.mock('nanoid', () => ({
	customAlphabet: vi.fn((_alphabet, length) => {
		return () => {
			if (nanoidState.queue.length > 0) {
				return nanoidState.queue.shift();
			}

			const nextCount = (nanoidState.counters.get(length) ?? 0) + 1;
			nanoidState.counters.set(length, nextCount);
			return nextCount.toString(36).padStart(length, '0').slice(-length);
		};
	})
}));

describe('generateRandomURL', () => {
	let mockDb;

	beforeEach(() => {
		nanoidState.queue = [];
		nanoidState.counters.clear();
		mockDb = new PocketBase();
		// Default mock implementation returns no collisions
		mockDb.collection().getList.mockResolvedValue({ items: [] });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should generate a 4-character URL when no collisions', async () => {
		const url = await generateRandomURL();
		expect(url).toBe('0001');
		expect(mockDb.collection().getList).toHaveBeenCalledWith(1, 1, {
			filter: "id_url = '0001'"
		});
	});

	it('should skip reserved root slugs before checking PocketBase', async () => {
		nanoidState.queue = ['api', 'ok01'];

		const url = await generateRandomURL();

		expect(url).toBe('ok01');
		expect(mockDb.collection().getList).toHaveBeenCalledTimes(1);
		expect(mockDb.collection().getList).toHaveBeenCalledWith(1, 1, {
			filter: "id_url = 'ok01'"
		});
	});

	it('should increase length when many collisions occur', async () => {
		// Mock PocketBase to simulate collisions for all 4-character URLs
		const mockGetList = mockDb.collection().getList;
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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

		try {
			const url = await generateRandomURL();
			expect(url).toBe('00001');
			expect(attemptCount).toBe(11);
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'URL generation with length 4 exhausted, increasing length'
			);
		} finally {
			consoleWarnSpy.mockRestore();
		}
	});

	it('should throw error when max length is reached', async () => {
		// Mock PocketBase to always return collisions
		const mockGetList = mockDb.collection().getList;
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		let attempts = 0;

		mockGetList.mockImplementation(async () => {
			attempts++;
			return { items: [{ id: 1 }] }; // Always return collision
		});

		try {
			// Should throw error after trying all lengths up to maxLength
			await expect(generateRandomURL()).rejects.toThrow(
				'Failed to generate unique URL even with maximum length of 8'
			);
			expect(attempts).toBe(50);
			expect(consoleWarnSpy).toHaveBeenCalledTimes(5);
			expect(consoleErrorSpy).toHaveBeenCalledOnce();
		} finally {
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		}
	});

	it('should maintain URL format', async () => {
		nanoidState.queue = ['abc123'];

		const url = await generateRandomURL();
		expect(url).toMatch(/^[0-9a-z]+$/);
		expect(url.length).toBeGreaterThanOrEqual(4);
		expect(url.length).toBeLessThanOrEqual(8);
	});
});

describe('isSlugAvailable', () => {
	let mockDb;

	beforeEach(() => {
		mockDb = new PocketBase();
		mockDb.collection().getList.mockResolvedValue({ items: [] });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('rejects reserved root slugs before querying PocketBase', async () => {
		await expect(isSlugAvailable('login')).resolves.toBe(false);
		expect(mockDb.collection().getList).not.toHaveBeenCalled();
	});
});
