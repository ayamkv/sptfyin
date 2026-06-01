import { redirect } from '@sveltejs/kit';

export function redirectWithQuery(status, url, pathname) {
	throw redirect(status, `${pathname}${url.search}`);
}

export function redirectRetiredRootRoute(url, targetBase) {
	redirectWithQuery(307, url, targetBase);
}

export function redirectRetiredRootRouteWithPath(url, oldPrefix, targetPrefix) {
	const suffix = url.pathname.slice(oldPrefix.length);
	redirectWithQuery(307, url, `${targetPrefix}${suffix}`);
}
