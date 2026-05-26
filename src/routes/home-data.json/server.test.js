import { describe, expect, it, vi } from 'vitest';
import { GET } from './+server.js';

function createMockFetch(recentItems, analyticsTotal, topItems) {
	return vi.fn(async (url) => {
		const urlStr = typeof url === 'string' ? url : url.toString();

		if (urlStr.includes('viewList') && urlStr.includes('sort=-utm_view')) {
			return {
				json: async () => ({
					items: topItems || [],
					totalItems: topItems?.length || 0
				})
			};
		}
		if (urlStr.includes('analytics')) {
			return {
				json: async () => ({
					items: [],
					totalItems: analyticsTotal || 0
				})
			};
		}
		// Default: viewList recent
		return {
			json: async () => ({
				items: recentItems || [],
				totalItems: recentItems?.length || 0
			})
		};
	});
}

describe('GET /home-data.json', () => {
	it('returns combined homepage data', async () => {
		const recentItems = [
			{
				id_url: 'abc1',
				from: 'https://spotify.com/track/1',
				created: '2026-01-01',
				subdomain: 'sptfy.in'
			},
			{
				id_url: 'abc2',
				from: 'https://spotify.com/track/2',
				created: '2026-01-02',
				subdomain: 'sptfy.in'
			}
		];
		const topItems = [
			{
				id_url: 'top1',
				from: 'https://spotify.com/track/3',
				created: '2026-01-01',
				subdomain: 'sptfy.in',
				utm_view: 100
			}
		];

		const mockFetch = createMockFetch(recentItems, 500, topItems);

		const response = await GET({ fetch: mockFetch, setHeaders: vi.fn() });
		const data = await response.json();

		expect(data.totalLinkCreated).toBe(2);
		expect(data.totalClicks).toBe(500);
		expect(data.recent).toHaveLength(2);
		expect(data.top).toHaveLength(1);
		expect(data.recent[0].id_url).toBe('abc1');
		expect(data.top[0].utm_view).toBe(100);
	});

	it('handles empty state gracefully', async () => {
		const mockFetch = createMockFetch([], 0, []);

		const response = await GET({ fetch: mockFetch, setHeaders: vi.fn() });
		const data = await response.json();

		expect(data.totalLinkCreated).toBe(0);
		expect(data.totalClicks).toBe(0);
		expect(data.recent).toHaveLength(0);
		expect(data.top).toHaveLength(0);
	});

	it('sets cache headers', async () => {
		const setHeaders = vi.fn();
		const mockFetch = createMockFetch([], 0, []);

		await GET({ fetch: mockFetch, setHeaders });

		expect(setHeaders).toHaveBeenCalledWith({
			'Cache-Control': expect.stringContaining('max-age=86400')
		});
	});
});
