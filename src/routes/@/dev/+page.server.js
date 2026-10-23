import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Local setup diagnostics (auth state + PocketBase connection). Never served in production.

async function runCheck(name, fn) {
	try {
		return { name, status: 'success', result: await fn() };
	} catch (err) {
		return {
			name,
			status: 'error',
			error: { message: err?.message, status: err?.status, code: err?.code }
		};
	}
}

export const load = async ({ locals, cookies }) => {
	if (!dev) throw error(404, 'Not found');

	const pb = locals.pb;
	const user = locals.user;

	const checks = [
		await runCheck('Health check', () => pb.health.check()),
		await runCheck('OAuth providers', async () => {
			const authMethods = await pb.collection('users').listAuthMethods();
			return {
				providers: authMethods.oauth2?.providers?.map((provider) => provider.name) ?? []
			};
		})
	];

	return {
		pocketBaseUrl: import.meta.env.VITE_POCKETBASE_URL,
		user: user
			? {
					id: user.id,
					username: user.username,
					name: user.name,
					email: user.email,
					created: user.created,
					updated: user.updated,
					onboarded: user.onboarded
				}
			: null,
		authState: {
			isValid: pb?.authStore?.isValid || false,
			hasToken: Boolean(pb?.authStore?.token),
			hasModel: Boolean(pb?.authStore?.model)
		},
		// Names only: cookie values include the auth token.
		cookieNames: cookies.getAll().map((cookie) => cookie.name),
		checks,
		timestamp: new Date().toISOString()
	};
};
