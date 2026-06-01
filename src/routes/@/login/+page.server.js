import { fail, redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH, redirectAfterAuth } from '$lib/server/auth-flow';
import { GUEST_SESSION_COOKIE } from '$lib/server/guest-links';
import { normalizeEmail, validateEmailFormat, validatePassword } from '$lib/auth-validation';

function normalizeFormString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

export const load = async ({ locals, cookies }) => {
	if (locals.user) {
		throw redirect(302, DASHBOARD_PATH);
	}

	return {
		hasGuestSession: Boolean(cookies.get(GUEST_SESSION_COOKIE))
	};
};

export const actions = {
	login: async ({ locals, request, cookies, url }) => {
		const form = await request.formData();
		const email = normalizeEmail(form.get('email'));
		const password = normalizeFormString(form.get('password'));
		const emailValidation = validateEmailFormat(email);
		const passwordValidation = validatePassword(password);

		if (!emailValidation.valid) {
			return fail(400, { mode: 'login', email, message: emailValidation.message });
		}

		if (!passwordValidation.valid) {
			return fail(400, { mode: 'login', email, message: passwordValidation.message });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
			locals.user = locals.pb.authStore.model;
		} catch (error) {
			console.error('[Login] Password auth failed', { message: error?.message });
			return fail(400, { mode: 'login', email, message: 'Invalid email or password.' });
		}

		await redirectAfterAuth({ locals, cookies, url });
	}
};
