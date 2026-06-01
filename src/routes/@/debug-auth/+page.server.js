export const load = async ({ locals, request, url }) => {
	const cookieHeader = request.headers.get('cookie') || '';

	return {
		user: locals.user
			? {
					id: locals.user.id,
					username: locals.user.username,
					name: locals.user.name,
					email: locals.user.email,
					created: locals.user.created,
					updated: locals.user.updated,
					onboarded: locals.user.onboarded
				}
			: null,
		authState: {
			isValid: locals.pb?.authStore?.isValid || false,
			hasToken: Boolean(locals.pb?.authStore?.token),
			hasModel: Boolean(locals.pb?.authStore?.model)
		},
		cookies: cookieHeader,
		url: url.href,
		timestamp: new Date().toISOString()
	};
};
