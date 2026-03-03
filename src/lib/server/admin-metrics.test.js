import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAdminMetrics, parseDaysParam, clearMetricsCache } from './admin-metrics.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function createPb(baseUrl = 'https://pb.sptfy.in') {
	return { baseUrl };
}

const MOCK_RESPONSE = {
	rangeDays: 30,
	aggregation: 'day',
	generatedAt: '2026-03-04T00:00:00.000Z',
	summary: {
		totalLinks: 100,
		linksCreatedInRange: 20,
		clicksInRange: 150,
		avgClicksPerLink: 7.5
	},
	series: {
		linksByDay: [{ date: '2026-03-01', count: 5 }],
		clicksByDay: [{ date: '2026-03-01', count: 10 }]
	},
	breakdowns: {
		countries: [{ key: 'US', count: 50 }],
		browsers: [{ key: 'Chrome', count: 80 }],
		subdomains: [{ key: 'sptfy.in', count: 90 }]
	},
	leaderboards: {
		topLinks: [
			{
				id: 'abc',
				id_url: 'https://spotify.com',
				subdomain: 'sptfy.in',
				utm_view: 99,
				created: '2026-01-01'
			}
		],
		topCreators: [{ userId: 'user1', linksCreated: 10, totalClicks: 200 }]
	}
};

describe('parseDaysParam', () => {
	it('returns valid day values', () => {
		expect(parseDaysParam(0)).toBe(0);
		expect(parseDaysParam(7)).toBe(7);
		expect(parseDaysParam(30)).toBe(30);
		expect(parseDaysParam(90)).toBe(90);
	});

	it('returns default 30 for invalid values', () => {
		expect(parseDaysParam(undefined)).toBe(30);
		expect(parseDaysParam('abc')).toBe(30);
		expect(parseDaysParam(15)).toBe(30);
		expect(parseDaysParam(-1)).toBe(30);
	});

	it('treats null as 0 (all-time) since Number(null) === 0', () => {
		expect(parseDaysParam(null)).toBe(0);
	});

	it('handles string numbers', () => {
		expect(parseDaysParam('7')).toBe(7);
		expect(parseDaysParam('0')).toBe(0);
	});
});

describe('buildAdminMetrics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearMetricsCache();
	});

	afterEach(() => {
		clearMetricsCache();
	});

	it('fetches from PB admin stats endpoint', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => MOCK_RESPONSE
		});

		const result = await buildAdminMetrics({ pb: createPb(), days: 30 });

		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockFetch).toHaveBeenCalledWith(
			'https://pb.sptfy.in/api/admin/stats?days=30',
			expect.objectContaining({ method: 'GET' })
		);
		expect(result.summary.totalLinks).toBe(100);
		expect(result.rangeDays).toBe(30);
	});

	it('strips trailing slash from baseUrl', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => MOCK_RESPONSE
		});

		await buildAdminMetrics({ pb: createPb('https://pb.sptfy.in/'), days: 7 });

		expect(mockFetch).toHaveBeenCalledWith(
			'https://pb.sptfy.in/api/admin/stats?days=7',
			expect.any(Object)
		);
	});

	it('uses cache on repeated calls', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => MOCK_RESPONSE
		});

		const result1 = await buildAdminMetrics({ pb: createPb(), days: 30 });
		const result2 = await buildAdminMetrics({ pb: createPb(), days: 30 });

		expect(mockFetch).toHaveBeenCalledOnce();
		expect(result1).toBe(result2);
	});

	it('does not share cache across different day ranges', async () => {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...MOCK_RESPONSE, rangeDays: 7 })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ ...MOCK_RESPONSE, rangeDays: 90 })
			});

		const r1 = await buildAdminMetrics({ pb: createPb(), days: 7 });
		const r2 = await buildAdminMetrics({ pb: createPb(), days: 90 });

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(r1.rangeDays).toBe(7);
		expect(r2.rangeDays).toBe(90);
	});

	it('throws on non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: async () => 'Internal Server Error'
		});

		await expect(buildAdminMetrics({ pb: createPb(), days: 30 })).rejects.toThrow(
			'PB admin stats endpoint returned 500'
		);
	});

	it('defaults to 30 days when invalid days param is given', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => MOCK_RESPONSE
		});

		await buildAdminMetrics({ pb: createPb(), days: 999 });

		expect(mockFetch).toHaveBeenCalledWith(
			'https://pb.sptfy.in/api/admin/stats?days=30',
			expect.any(Object)
		);
	});

	it('passes days=0 for all-time', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ ...MOCK_RESPONSE, rangeDays: 0 })
		});

		await buildAdminMetrics({ pb: createPb(), days: 0 });

		expect(mockFetch).toHaveBeenCalledWith(
			'https://pb.sptfy.in/api/admin/stats?days=0',
			expect.any(Object)
		);
	});
});
