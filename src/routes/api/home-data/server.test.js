import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server.js';

function mockResponse(body, ok = true, status = 200) {
	return {
		ok,
		status,
		json: async () => body
	};
}

function createMockFetch(viewListTotal, analyticsTotal, topItems) {
	return vi.fn(async (url) => {
		const urlStr = typeof url === 'string' ? url : url.toString();

		if (urlStr.includes('viewList') && urlStr.includes('sort=-utm_view')) {
			return mockResponse({
				items: topItems || [],
				totalItems: topItems?.length || 0
			});
		}
		if (urlStr.includes('analytics')) {
			return mockResponse({
				items: [],
				totalItems: analyticsTotal || 0
			});
		}
		// Default: viewList count
		return mockResponse({
			items: [],
			totalItems: viewListTotal || 0
		});
	});
}

describe('GET /api/home-data', () => {
	it('returns counters and top links', async () => {
		const topItems = [
			{
				id_url: 'top1',
				from: 'https://spotify.com/track/3',
				created: '2026-01-01',
				subdomain: 'sptfy.in',
				utm_view: 100
			}
		];

		const mockFetch = createMockFetch(42, 500, topItems);

		const response = await GET({ fetch: mockFetch, setHeaders: vi.fn() });
		const data = await response.json();

		expect(data.totalLinkCreated).toBe(42);
		expect(data.totalClicks).toBe(500);
		expect(data.top).toHaveLength(1);
		expect(data.top[0].utm_view).toBe(100);
	});

	it('does not include recent field', async () => {
		const mockFetch = createMockFetch(0, 0, []);

		const response = await GET({ fetch: mockFetch, setHeaders: vi.fn() });
		const data = await response.json();

		expect(data).not.toHaveProperty('recent');
	});

	it('handles empty state gracefully', async () => {
		const mockFetch = createMockFetch(0, 0, []);

		const response = await GET({ fetch: mockFetch, setHeaders: vi.fn() });
		const data = await response.json();

		expect(data.totalLinkCreated).toBe(0);
		expect(data.totalClicks).toBe(0);
		expect(data.top).toHaveLength(0);
	});

	it('throws 502 on PocketBase failure', async () => {
		await expect(async () => {
			const fetch = vi.fn().mockResolvedValue(mockResponse({}, false, 502));
			await GET({ fetch, setHeaders: vi.fn() });
		}).rejects.toThrow();
	});

	it('sets cache headers', async () => {
		const setHeaders = vi.fn();
		const mockFetch = createMockFetch(0, 0, []);

		await GET({ fetch: mockFetch, setHeaders });

		expect(setHeaders).toHaveBeenCalledWith({
			'Cache-Control': expect.stringContaining('max-age=86400')
		});
	});
});
