import { redirect, error } from '@sveltejs/kit';
import { isAdminAuthorized } from '$lib/server/admin-auth';
import { buildAdminMetrics, parseDaysParam } from '$lib/server/admin-metrics';

export const load = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const adminCheck = isAdminAuthorized(locals);
	if (!adminCheck.allowed) {
		throw error(403, 'Admin access required');
	}

	const initialDays = parseDaysParam(url.searchParams.get('days'));

	try {
		const initialMetrics = await buildAdminMetrics({
			pb: locals.pb,
			days: initialDays
		});

		return {
			initialDays,
			initialMetrics
		};
	} catch (err) {
		console.error('[Admin Dashboard] Failed to load initial metrics', {
			message: err?.message
		});

		return {
			initialDays,
			initialMetrics: null,
			loadError: 'Failed to load admin metrics'
		};
	}
};
