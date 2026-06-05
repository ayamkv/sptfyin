import PocketBase from 'pocketbase';
import { dev } from '$app/environment';
import {
	clearGuestSession,
	getGuestSessionSecret,
	transferGuestLinksToUser
} from '$lib/server/guest-links';

const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
const authDebug = import.meta.env.VITE_AUTH_DEBUG === 'true';

function debugAuth(...args) {
	if (authDebug) console.log(...args);
}

function shouldRefreshAuth(event) {
	const { pathname } = event.url;
	const accept = event.request.headers.get('accept') || '';
	const isHtmlNavigation = accept.includes('text/html');
	const isApiRequest = pathname.startsWith('/api/');
	const isAuthRequest = pathname.startsWith('/auth/') || pathname.startsWith('/@/auth/');

	return isHtmlNavigation || isApiRequest || isAuthRequest;
}

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
	const pb = new PocketBase(pocketBaseURL);

	// Load existing auth from cookie
	const cookieHeader = event.request.headers.get('cookie') || '';
	pb.authStore.loadFromCookie(cookieHeader);

	debugAuth('[Auth] Request cookies:', cookieHeader ? 'present' : 'none');
	debugAuth('[Auth] Auth store valid:', pb.authStore.isValid);
	debugAuth('[Auth] User ID:', pb.authStore.model?.id || 'none');

	if (pb.authStore.isValid && shouldRefreshAuth(event)) {
		try {
			await pb.collection('users').authRefresh();
			debugAuth('[Auth] Session refreshed successfully');
		} catch (error) {
			debugAuth('[Auth] Session refresh failed:', error.message);
			if (error.status === 401 || error.status === 403) {
				debugAuth('[Auth] Auth invalid, clearing store');
				pb.authStore.clear();
			} else {
				debugAuth('[Auth] Temporary refresh failure, keeping auth store');
			}
		}
	}

	event.locals.pb = pb;
	event.locals.user = pb.authStore.model;

	const response = await resolve(event);

	if (pb.authStore.isValid && pb.authStore.model?.id) {
		const guestSecret = getGuestSessionSecret(event.cookies);

		if (guestSecret) {
			try {
				const transferredCount = await transferGuestLinksToUser(
					pb,
					pb.authStore.model.id,
					guestSecret
				);

				if (transferredCount > 0) {
					debugAuth('[Guest Links] Transferred guest links:', transferredCount);
				}
				clearGuestSession(event.cookies, event.url);
			} catch (error) {
				console.error('[Guest Links] Failed to transfer guest links:', error);
			}
		}
	}

	const hadPbAuthCookie = cookieHeader.includes('pb_auth=');
	const secureFlag = !dev && event.url.protocol === 'https:';

	// Collect additional Set-Cookie values to append (never overwrite existing ones from routes)
	const extraCookies = [];

	if (pb.authStore.isValid && pb.authStore.token) {
		debugAuth('[Auth] Appending valid auth cookie');
		const exported = pb.authStore.exportToCookie({
			httpOnly: true,
			secure: secureFlag,
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60
		});
		if (exported) extraCookies.push(exported);
	} else if (!pb.authStore.isValid && hadPbAuthCookie) {
		debugAuth('[Auth] Appending clear auth cookie');
		extraCookies.push(
			`pb_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=lax${secureFlag ? '; Secure' : ''}`
		);
	}

	for (const c of extraCookies) {
		response.headers.append('set-cookie', c);
	}

	if (event.route.id?.includes('[slug]')) {
		response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
};
