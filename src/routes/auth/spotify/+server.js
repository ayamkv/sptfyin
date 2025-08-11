import { redirect, error } from '@sveltejs/kit';
import { saveOAuthState } from '$lib/oauthStateStore.js';

export async function GET({ locals, url, cookies }) {
  const pb = locals.pb;
  const authMethods = await pb.collection('users').listAuthMethods();
  const provider = authMethods.oauth2?.providers?.find((p) => p.name === 'spotify');
  if (!provider) throw error(500, 'Spotify OAuth is not configured');

  const appUrl = import.meta.env.VITE_APP_URL || url.origin;
  const redirectUrl = `${appUrl}/auth/spotify/callback`;
  const isSecure = url.protocol === 'https:';

  // save state and PKCE verifier for the callback step (both in memory and cookie)
  saveOAuthState(provider.state, provider.codeVerifier);
  cookies.set('pb_oauth_state', encodeURIComponent(provider.state), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 600
  });
  cookies.set('pb_oauth_provider', provider.name, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 600
  });
  // also persist verifier in a cookie to survive dev server reloads
  cookies.set('pb_oauth_verifier', encodeURIComponent(provider.codeVerifier), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 600
  });

  // Important: encode the redirect URL passed to Spotify
  throw redirect(302, provider.authUrl + encodeURIComponent(redirectUrl));
}


