export const load = async ({ fetch, locals }) => {
	if (!locals.user) {
		return { initial: { items: [] }, user: null };
	}

	try {
		const res = await fetch('/api/links?perPage=50&page=1');
		if (!res.ok) {
			console.error('Failed to fetch links:', res.status, res.statusText);
			return { initial: { items: [] }, user: locals.user };
		}
		const initial = await res.json();
		console.log(
			'[Dashboard] Server-side loaded links for user:',
			locals.user.id,
			'Count:',
			initial.items?.length || 0,
			'Total:',
			initial.totalItems
		);
		return { initial, user: locals.user };
	} catch (error) {
		console.error('[Dashboard] Error loading links:', error);
		return { initial: { items: [] }, user: locals.user };
	}
};
