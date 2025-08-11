import PocketBase from 'pocketbase';

const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  const pb = new PocketBase(pocketBaseURL);

  // Load existing auth from cookie
  pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

  // Try to refresh session if valid to keep cookie fresh
  try {
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh();
    }
  } catch {
    pb.authStore.clear();
  }

  // Expose PocketBase and user on locals for server routes
  event.locals.pb = pb;
  event.locals.user = pb.authStore.model;

  const response = await resolve(event);

  // Persist the auth cookie
  response.headers.set(
    'set-cookie',
    pb.authStore.exportToCookie({
      httpOnly: true,
      secure: event.url.protocol === 'https:',
      sameSite: 'lax',
      path: '/'
    })
  );

  // Keep no-cache headers for slug routes
  if (event.route.id?.includes('[slug]')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
};
