import { fail, redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH } from '$lib/server/auth-flow';
import { normalizeEmail, validateEmailFormat } from '$lib/auth-validation';

export const load = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, DASHBOARD_PATH);
	}

	return {};
};

export const actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const email = normalizeEmail(form.get('email'));
		const emailValidation = validateEmailFormat(email);

		if (!emailValidation.valid) {
			return fail(400, { email, message: emailValidation.message });
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
