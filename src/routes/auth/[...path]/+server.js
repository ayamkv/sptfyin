import { redirectRetiredRootRouteWithPath } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRouteWithPath(url, '/auth', '/@/auth');
}

export const GET = fallback;
export const POST = fallback;
