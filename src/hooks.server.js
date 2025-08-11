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

  // Try to refresh session if valid to keep cookie fresh
  let refreshFailed = false;
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
      console.log('[Auth] Session refreshed successfully');
    } catch (error) {
      console.log('[Auth] Session refresh failed:', error.message);
      refreshFailed = true;
      
      // Only clear auth store for definitive auth failures
      if (error.status === 401 || error.status === 403) {
        console.log('[Auth] Auth invalid, clearing store');
        pb.authStore.clear();
      } else {
        console.log('[Auth] Temporary refresh failure, keeping auth store');
      }
    }
  }

  // Expose PocketBase and user on locals for server routes
  event.locals.pb = pb;
  event.locals.user = pb.authStore.model;

  const response = await resolve(event);

  // Only persist auth cookie if we have a valid auth state
  if (pb.authStore.isValid && pb.authStore.token) {
    const authCookie = pb.authStore.exportToCookie({
      httpOnly: true,
      secure: !dev && event.url.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    console.log('[Auth] Setting valid cookie');
    if (authCookie) {
      response.headers.set('set-cookie', authCookie);
    }
  } else if (!pb.authStore.isValid) {
    // Clear the cookie if auth is definitely invalid
    console.log('[Auth] Clearing invalid cookie');
    const isSecure = !dev && event.url.protocol === 'https:';
    const cookieValue = `pb_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=lax${isSecure ? '; Secure' : ''}`;
    response.headers.set('set-cookie', cookieValue);
  }

  // Keep no-cache headers for slug routes
  if (event.route.id?.includes('[slug]')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
};
