import { redirectRetiredRootRoute } from '$lib/server/route-redirects';

export function fallback({ url }) {
	redirectRetiredRootRoute(url, '/@/forgot-password');
}

export const GET = fallback;
export const POST = fallback;
