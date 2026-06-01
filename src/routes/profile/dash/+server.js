import { redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH, LOGIN_PATH } from '$lib/server/auth-flow';

export const GET = async ({ locals }) => {
	if (!locals.user) throw redirect(302, LOGIN_PATH);
	throw redirect(302, DASHBOARD_PATH);
};
