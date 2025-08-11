import { redirect } from '@sveltejs/kit';

/**
 * Manual auth clearing endpoint for debugging
 */
export async function GET({ locals, cookies }) {
  console.log('[Auth Clear] Clearing authentication state');
  
  // Clear server-side auth
  if (locals.pb) {
    locals.pb.authStore.clear();
  }
  locals.user = null;
  
  // Clear all auth-related cookies
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0
  };
  
  cookies.delete('pb_auth', cookieOptions);
  cookies.delete('pb_oauth_state', cookieOptions);
  cookies.delete('pb_oauth_verifier', cookieOptions);
  cookies.delete('pb_oauth_provider', cookieOptions);
  cookies.delete('pb_onboarding', cookieOptions);
  
  console.log('[Auth Clear] All auth state cleared, redirecting to login');
  throw redirect(302, '/login');
}
