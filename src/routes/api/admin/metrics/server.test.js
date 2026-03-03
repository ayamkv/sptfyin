import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server.js';
import * as metricsModule from '$lib/server/admin-metrics';

vi.mock('$lib/server/admin-metrics', () => ({
	parseDaysParam: vi.fn(() => 30),
	buildAdminMetrics: vi.fn(async () => ({
		rangeDays: 30,
		summary: {
			totalLinks: 10,
			linksCreatedInRange: 5,
			clicksInRange: 20,
			avgClicksPerLink: 2
		}
	}))
}));

function createContext({ user, isSuperuser = false, days = null } = {}) {
	return {
		locals: {
			user: user || null,
			pb: {
				authStore: {
					isSuperuser
				}
			}
		},
		url: new URL(`https://sptfy.in/api/admin/metrics${days ? `?days=${days}` : ''}`)
	};
}

describe('GET /api/admin/metrics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects unauthenticated requests', async () => {
		await expect(GET(createContext())).rejects.toMatchObject({
			status: 401
		});
	});

	it('rejects non-admin authenticated users', async () => {
		await expect(
			GET(
				createContext({
					user: { id: 'user_1', email: 'not-admin@sptfy.in' }
				})
			)
		).rejects.toMatchObject({
			status: 403
		});
	});

	it('returns metrics payload for admins', async () => {
		const response = await GET(
			createContext({
				user: { id: 'admin_1', email: 'admin@sptfy.in' },
				isSuperuser: true,
				days: 90
			})
		);

		expect(metricsModule.parseDaysParam).toHaveBeenCalledWith('90');
		expect(metricsModule.buildAdminMetrics).toHaveBeenCalledWith(
			expect.objectContaining({
				days: 30
			})
		);
		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.summary.totalLinks).toBe(10);
	});
});
