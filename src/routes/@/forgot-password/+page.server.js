import { fail, redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH } from '$lib/server/auth-flow';

function normalizeFormString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

export const load = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, DASHBOARD_PATH);
	}

	return {};
};

export const actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const email = normalizeFormString(form.get('email')).toLowerCase();

		if (!email) {
			return fail(400, { email, message: 'Email is required.' });
		}

		try {
			await locals.pb.collection('users').requestPasswordReset(email);
		} catch (error) {
			console.error('[Forgot Password] Password reset request failed', {
				message: error?.message,
				data: error?.response?.data
			});
		}

		return {
			email,
			success: true,
			message: 'If that email exists, a reset link is on the way.'
		};
	}
};
