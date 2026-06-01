import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRoute(url, '/@/register');
}

export const GET = fallback;
export const POST = fallback;
