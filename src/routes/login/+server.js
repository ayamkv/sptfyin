import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRoute(url, '/@/login');
}

export const GET = fallback;
export const POST = fallback;
