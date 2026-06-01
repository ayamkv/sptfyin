import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function GET({ url }) {
	redirectRetiredRootRoute(url, '/api/home-data');
}
