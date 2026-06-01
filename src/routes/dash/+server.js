import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRoute(url, '/@/dash/links');
}

export const GET = fallback;
export const POST = fallback;
