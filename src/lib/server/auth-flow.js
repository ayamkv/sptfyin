import { redirect } from '@sveltejs/kit';

export const LOGIN_PATH = '/@/login';
export const REGISTER_PATH = '/@/register';
export const DASHBOARD_PATH = '/@/dash/links';
export const ONBOARDING_PATH = '/@/onboarding';

export function needsOnboarding(record) {
	const createdMs = record?.created ? Date.parse(record.created) : 0;
	const updatedMs = record?.updated ? Date.parse(record.updated) : 0;

	return (
		record?.onboarded === false ||
		record?.onboarded === 0 ||
		(createdMs && updatedMs && Math.abs(updatedMs - createdMs) < 1000)
	);
}

export async function getPostAuthPath({ locals, cookies, url }) {
	let record;
	try {
		record = await locals.pb.collection('users').getOne(locals.user.id);
	} catch (error) {
		console.warn('[Auth] Failed to fetch user record, proceeding to dashboard', {
			message: error?.message
		});
	}

	if (record && needsOnboarding(record)) {
		cookies.set('pb_onboarding', '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 600
		});
		return ONBOARDING_PATH;
	}

	return DASHBOARD_PATH;
}

export async function redirectAfterAuth({ locals, cookies, url }) {
	const destination = await getPostAuthPath({ locals, cookies, url });

	throw redirect(302, destination);
}
