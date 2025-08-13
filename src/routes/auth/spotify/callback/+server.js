import { redirect, error } from '@sveltejs/kit';
import { takeOAuthVerifier } from '$lib/oauthStateStore.js';

export async function GET({ locals, url, cookies }) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) throw error(400, 'Missing code/state');

  const storedState = cookies.get('pb_oauth_state');
  const decodedState = storedState ? decodeURIComponent(storedState) : undefined;

  // In Cloudflare Pages (stateless), prefer cookies over in-memory store
  let decodedVerifier;
  
  // Try in-memory store first (will be empty in CF Pages but doesn't hurt)
  decodedVerifier = takeOAuthVerifier(state);
  
  // Always fallback to cookie for stateless environments like CF Pages
  if (!decodedVerifier) {
    const fallbackCookieVerifier = cookies.get('pb_oauth_verifier');
    decodedVerifier = fallbackCookieVerifier ? decodeURIComponent(fallbackCookieVerifier) : undefined;
  }
  
  if (!decodedVerifier) {
    console.error('[OAuth] Missing verifier - cookies:', {
      hasState: Boolean(storedState),
      hasVerifier: Boolean(cookies.get('pb_oauth_verifier')),
      allCookies: Object.keys(cookies.getAll())
    });
    throw error(400, 'Missing verifier');
  }
  
  if (!decodedState || decodedState !== state) {
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isLocal) {
      console.error('[OAuth] State mismatch:', { returned: state, stored: decodedState });
      throw error(400, 'Invalid state');
    }
    console.warn('[OAuth] State missing/mismatch in dev, continuing', { returned: state, stored: decodedState });
  }

  const appUrl = import.meta.env.VITE_APP_URL || url.origin;
  const redirectUrl = `${appUrl}/auth/spotify/callback`;

  const provider = cookies.get('pb_oauth_provider') || 'spotify';

  console.log('[OAuth] Attempting authentication with:', {
    provider,
    redirectUrl,
    hasCode: Boolean(code),
    hasVerifier: Boolean(decodedVerifier),
    stateMatch: decodedState === state
  });

  try {
    const result = await locals.pb
      .collection('users')
      .authWithOAuth2Code(provider, code, decodedVerifier, redirectUrl);
    locals.user = locals.pb.authStore.model;
    console.log('[OAuth] Auth success', {
      userId: locals.user?.id,
      username: locals.user?.username
    });
  } catch (e) {
    console.error('[OAuth] authWithOAuth2 failed', {
      message: e?.message,
      status: e?.response?.status,
      data: e?.response?.data,
      redirectUrl,
      hasVerifier: Boolean(decodedVerifier),
      stateEqual: decodedState === state,
      provider
    });
    throw error(401, 'OAuth failed');
  } finally {
    const isSecure = url.protocol === 'https:';
    cookies.delete('pb_oauth_state', { path: '/', secure: isSecure });
    cookies.delete('pb_oauth_verifier', { path: '/', secure: isSecure });
    cookies.delete('pb_oauth_provider', { path: '/', secure: isSecure });
  }

  // Determine first-login by fetching fresh user record
  let record;
  try {
    record = await locals.pb.collection('users').getOne(locals.user.id);
  } catch (e) {
    console.warn('[OAuth] Failed to fetch user record, proceeding to dashboard');
  }

  if (record) {
    const created = record?.created;
    const updated = record?.updated;
    const createdMs = created ? Date.parse(created) : 0;
    const updatedMs = updated ? Date.parse(updated) : 0;
    const isFirstLogin = (record?.onboarded === false || record?.onboarded === 0) || (createdMs && updatedMs && Math.abs(updatedMs - createdMs) < 1000);
    console.log('[OAuth] Post-auth record check', {
      userId: record?.id,
      created,
      updated,
      onboarded: record?.onboarded,
      isFirstLogin
    });
    if (isFirstLogin) {
      const isSecure = url.protocol === 'https:';
      cookies.set('pb_onboarding', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        maxAge: 600
      });
      console.log('[OAuth] Redirecting to onboarding');
      throw redirect(302, '/onboarding');
    }
  }

  console.log('[OAuth] Redirecting to dashboard');
  throw redirect(302, '/dash/links');
}


