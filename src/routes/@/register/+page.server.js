import { fail, redirect } from '@sveltejs/kit';
import { DASHBOARD_PATH, redirectAfterAuth } from '$lib/server/auth-flow';
import { GUEST_SESSION_COOKIE } from '$lib/server/guest-links';

function normalizeFormString(value) {
	return typeof value === 'string' ? value.trim() : '';
}

function usernameFromEmail(email) {
	const localPart = email.split('@')[0] || 'user';
	const username = localPart
		.toLowerCase()
		.replace(/[^a-z0-9_.-]/g, '-')
		.replace(/^[^a-z0-9_]+/, '')
		.slice(0, 40);

	return username.length >= 3 ? username : `user${Math.floor(100000 + Math.random() * 900000)}`;
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
	default: async ({ locals, request, cookies, url }) => {
		const form = await request.formData();
		const email = normalizeFormString(form.get('email')).toLowerCase();
		const password = normalizeFormString(form.get('password'));
		const username = normalizeFormString(form.get('username')) || usernameFromEmail(email);

		if (!email || !password) {
			return fail(400, {
				email,
				username,
				message: 'Email and password are required.'
			});
		}

		if (password.length < 8) {
			return fail(400, {
				email,
				username,
				message: 'Password must be at least 8 characters.'
			});
		}

		try {
			await locals.pb.collection('users').create({
				email,
				password,
				passwordConfirm: password,
				username,
				onboarded: false
			});
			await locals.pb.collection('users').authWithPassword(email, password);
			locals.user = locals.pb.authStore.model;
		} catch (error) {
			console.error('[Register] Signup failed', {
				message: error?.message,
				data: error?.response?.data
			});
			const data = error?.response?.data || {};
			const message =
				data.email?.message || data.username?.message || 'Could not create that account.';
			return fail(error?.status || 400, { email, username, message });
		}

		await redirectAfterAuth({ locals, cookies, url });
	}
};
