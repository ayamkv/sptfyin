import PocketBase from 'pocketbase';
import { dev } from '$app/environment';

const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  const pb = new PocketBase(pocketBaseURL);

  // Load existing auth from cookie
  const cookieHeader = event.request.headers.get('cookie') || '';
  pb.authStore.loadFromCookie(cookieHeader);
  
  console.log('[Auth] Request cookies:', cookieHeader ? 'present' : 'none');
  console.log('[Auth] Auth store valid:', pb.authStore.isValid);
  console.log('[Auth] User ID:', pb.authStore.model?.id || 'none');

  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
      console.log('[Auth] Session refreshed successfully');
    } catch (error) {
      console.log('[Auth] Session refresh failed:', error.message);
      if (error.status === 401 || error.status === 403) {
        console.log('[Auth] Auth invalid, clearing store');
        pb.authStore.clear();
      } else {
        console.log('[Auth] Temporary refresh failure, keeping auth store');
      }
    }
  }

  event.locals.pb = pb;
  event.locals.user = pb.authStore.model;

  const response = await resolve(event);

  const hadPbAuthCookie = cookieHeader.includes('pb_auth=');
  const secureFlag = !dev && event.url.protocol === 'https:';

  // Collect additional Set-Cookie values to append (never overwrite existing ones from routes)
  const extraCookies = [];

  if (pb.authStore.isValid && pb.authStore.token) {
    console.log('[Auth] Appending valid auth cookie');
    const exported = pb.authStore.exportToCookie({
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });
    if (exported) extraCookies.push(exported);
  } else if (!pb.authStore.isValid && hadPbAuthCookie) {
    console.log('[Auth] Appending clear auth cookie');
    extraCookies.push(`pb_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=lax${secureFlag ? '; Secure' : ''}`);
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
