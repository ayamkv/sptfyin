import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/admin-metrics', () => ({
	parseDaysParam: vi.fn(() => 30),
	buildAdminMetrics: vi.fn(async () => ({
		rangeDays: 30,
		summary: {
			totalLinks: 25,
			linksCreatedInRange: 12,
			clicksInRange: 80,
			avgClicksPerLink: 3.2
		}
	}))
}));

import { load } from './+page.server.js';
import * as metricsModule from '$lib/server/admin-metrics';

function createLocals({ user, isSuperuser = false } = {}) {
	return {
		user: user || null,
		pb: {
			authStore: {
				isSuperuser
			}
		}
	};
}

describe('GET /@/admin load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects unauthenticated users to login', async () => {
		await expect(
			load({
				locals: createLocals(),
				url: new URL('https://sptfy.in/@/admin')
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/login'
		});
	});

	it('rejects authenticated non-admin users', async () => {
		await expect(
			load({
				locals: createLocals({
					user: { id: 'u_1', email: 'user@sptfy.in' }
				}),
				url: new URL('https://sptfy.in/@/admin')
			})
		).rejects.toMatchObject({
			status: 403
		});
	});

	it('returns initial metrics for admin users', async () => {
		const result = await load({
			locals: createLocals({
				user: { id: 'admin_1', email: 'admin@sptfy.in' },
				isSuperuser: true
			}),
			url: new URL('https://sptfy.in/@/admin?days=90')
		});

		expect(metricsModule.parseDaysParam).toHaveBeenCalledWith('90');
		expect(metricsModule.buildAdminMetrics).toHaveBeenCalled();
		expect(result.initialDays).toBe(30);
		expect(result.initialMetrics.summary.totalLinks).toBe(25);
	});
});
