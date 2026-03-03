import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	let record;

	try {
		record = await locals.pb.collection('users').getOne(locals.user.id);
		console.log('[Dash] User record', {
			userId: record?.id,
			created: record?.created,
			updated: record?.updated,
			onboarded: record?.onboarded
		});
	} catch (error) {
		console.warn('[Dash] Failed to fetch user record, skipping onboarding redirect', {
			message: error?.message
		});
		return { user: locals.user };
	}

	if (record?.onboarded === false || record?.onboarded === 0) {
		console.log('[Dash] Redirecting to onboarding (flag)');
		throw redirect(302, '/onboarding');
	}

	// fallback tolerance for timestamp differences within 1s
	const createdMs = record?.created ? Date.parse(record.created) : 0;
	const updatedMs = record?.updated ? Date.parse(record.updated) : 0;
	if (createdMs && updatedMs && Math.abs(updatedMs - createdMs) < 1000) {
		console.log('[Dash] Redirecting to onboarding (timestamps close)');
		throw redirect(302, '/onboarding');
	}

	return { user: locals.user };
};
