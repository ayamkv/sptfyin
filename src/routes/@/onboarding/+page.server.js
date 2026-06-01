import { redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH, LOGIN_PATH } from '$lib/server/auth-flow';

export const load = async ({ locals, cookies }) => {
	if (!locals.user) throw redirect(302, LOGIN_PATH);

	let record;
	try {
		record = await locals.pb.collection('users').getOne(locals.user.id);
	} catch (error) {
		// Fallback to cookie hint set during callback
		console.warn('[Onboarding] Record fetch failed, fallback to cookie', {
			message: error?.message
		});
		if (cookies.get('pb_onboarding') === '1') {
			return { initial: locals.user?.username || '', canConfirm: true };
		}
		throw redirect(302, DASHBOARD_PATH);
	}

	const createdMs = record?.created ? Date.parse(record.created) : 0;
	const updatedMs = record?.updated ? Date.parse(record.updated) : 0;
	const needsSetup =
		record?.onboarded === false ||
		record?.onboarded === 0 ||
		(createdMs && updatedMs && Math.abs(updatedMs - createdMs) < 1000);

	console.log('[Onboarding] Load', {
		userId: record?.id,
		created: record?.created,
		updated: record?.updated,
		needsSetup
	});

	if (!needsSetup) {
		throw redirect(302, DASHBOARD_PATH);
	}

	return { initial: record?.username || '', canConfirm: true };
};
