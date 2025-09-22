/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Add cache control headers to all responses
	if (event.route.id?.includes('[slug]')) {
		response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
};
