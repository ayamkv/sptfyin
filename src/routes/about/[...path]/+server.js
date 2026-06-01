import { redirectRetiredRootRouteWithPath } from '$lib/server/route-redirects';

export function GET({ url }) {
	redirectRetiredRootRouteWithPath(url, '/about', '/@/about');
}
