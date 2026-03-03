import { json, error } from '@sveltejs/kit';
import { isAdminAuthorized } from '$lib/server/admin-auth';
import { buildAdminMetrics, parseDaysParam } from '$lib/server/admin-metrics';

export async function GET({ locals, url }) {
	if (!locals.user) throw error(401, 'Authentication required');

	const adminCheck = isAdminAuthorized(locals);
	if (!adminCheck.allowed) {
		throw error(403, 'Admin access required');
	}

	const rangeDays = parseDaysParam(url.searchParams.get('days'));

	try {
		const metrics = await buildAdminMetrics({
			pb: locals.pb,
			days: rangeDays
		});

		return json(metrics);
	} catch (err) {
		console.error('[Admin Metrics API] Failed to build metrics', {
			message: err?.message
		});
		throw error(500, 'Failed to load admin metrics');
	}
}
