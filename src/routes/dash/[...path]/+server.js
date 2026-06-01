import { redirectRetiredRootRouteWithPath } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRouteWithPath(url, '/dash', '/@/dash');
}

export const GET = fallback;
export const POST = fallback;
