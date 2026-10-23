import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Playground for tuning the homepage shader. Never served in production.
export const load = () => {
	if (!dev) throw error(404, 'Not found');
};
