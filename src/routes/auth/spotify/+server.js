import { redirect, error } from '@sveltejs/kit';
import { saveOAuthState } from '$lib/oauthStateStore.js';

export async function GET({ locals, url, cookies }) {
  const pb = locals.pb;
  
  console.log('[OAuth Init] Starting Spotify OAuth flow');
  console.log('[OAuth Init] PocketBase URL:', import.meta.env.VITE_POCKETBASE_URL);
  
  let authMethods, provider;
  try {
    authMethods = await pb.collection('users').listAuthMethods();
    console.log('[OAuth Init] Auth methods retrieved successfully');
    
    provider = authMethods.oauth2?.providers?.find((p) => p.name === 'spotify');
    if (!provider) {
      console.error('[OAuth Init] Spotify provider not found in:', authMethods.oauth2?.providers);
      throw error(500, 'Spotify OAuth is not configured');
    }
    
    console.log('[OAuth Init] Spotify provider found:', provider.name);
  console.log('[OAuth Init] Provider authUrl:', provider.authUrl);
  console.log('[OAuth Init] State:', provider.state);
  console.log('[OAuth Init] Code verifier length:', provider.codeVerifier?.length);
  } catch (e) {
    console.error('[OAuth Init] Failed to get auth methods:', {
      message: e.message,
      status: e.status,
      url: e.url,
      response: e.response
    });
    
    if (e.message?.includes('fetch failed') || e.message?.includes('timeout')) {
      throw error(503, 'Unable to connect to authentication service. Please check your PocketBase connection.');
    }
    
    throw error(500, `Authentication setup failed: ${e.message}`);
  }

  const appUrl = import.meta.env.VITE_APP_URL || url.origin;
  const redirectUrl = `${appUrl}/auth/spotify/callback`;
  const isSecure = url.protocol === 'https:';

  // save state and PKCE verifier for the callback step (both in memory and cookie)
  saveOAuthState(provider.state, provider.codeVerifier);
  cookies.set('pb_oauth_state', encodeURIComponent(provider.state), {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: isSecure,
    maxAge: 600
  });
  cookies.set('pb_oauth_provider', provider.name, {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: isSecure,
    maxAge: 600
  });
  // also persist verifier in a cookie to survive dev server reloads
  cookies.set('pb_oauth_verifier', encodeURIComponent(provider.codeVerifier), {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: isSecure,
    maxAge: 600
  });

  console.log('[OAuth Init] Cookies set, redirecting to:', provider.authUrl + encodeURIComponent(redirectUrl));
  console.log('[OAuth Init] Setting cookies with values:', {
    state: provider.state,
    verifier: provider.codeVerifier?.substring(0, 10) + '...',
    provider: provider.name,
    isSecure
  });
  
  // Important: encode the redirect URL passed to Spotify
  throw redirect(302, provider.authUrl + encodeURIComponent(redirectUrl));
}


