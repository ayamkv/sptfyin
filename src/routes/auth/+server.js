import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRoute(url, '/@/auth');
}

export const GET = fallback;
export const POST = fallback;
