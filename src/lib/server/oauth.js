import { error, redirect } from '@sveltejs/kit';
import { saveOAuthState, takeOAuthVerifier } from '$lib/oauthStateStore.js';
import { redirectAfterAuth } from '$lib/server/auth-flow';

const ALLOWED_OAUTH_PROVIDERS = new Set(['google', 'discord', 'spotify']);

function getAppUrl(url) {
	return import.meta.env.VITE_APP_URL || url.origin;
}

function getCallbackUrl(url, providerName) {
	return `${getAppUrl(url)}/@/auth/${providerName}/callback`;
}

function oauthCookieOptions(url) {
	return {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		maxAge: 600
	};
}

function decodeCookieValue(value) {
	return value?.includes('%') ? decodeURIComponent(value) : value;
}

export async function startOAuthProvider({ locals, params, url, cookies }) {
	const providerName = params.provider;
	if (!ALLOWED_OAUTH_PROVIDERS.has(providerName)) throw error(404, 'OAuth provider not found');

	let provider;
	try {
		const authMethods = await locals.pb.collection('users').listAuthMethods();
		provider = authMethods.oauth2?.providers?.find((p) => p.name === providerName);
	} catch (e) {
		console.error('[OAuth Init] Failed to get auth methods:', e);
		throw error(503, 'Unable to connect to authentication service.');
	}

	if (!provider) throw error(500, `${providerName} OAuth is not configured`);

	const redirectUrl = getCallbackUrl(url, providerName);
	const cookieOptions = oauthCookieOptions(url);
	saveOAuthState(provider.state, provider.codeVerifier);

	cookies.set('pb_oauth_state', provider.state, { ...cookieOptions, sameSite: 'none' });
	cookies.set('pb_oauth_verifier', provider.codeVerifier, { ...cookieOptions, sameSite: 'none' });
	cookies.set('pb_oauth_provider', provider.name, { ...cookieOptions, sameSite: 'none' });
	cookies.set('pb_oauth_state_raw', provider.state, { ...cookieOptions, sameSite: 'lax' });
	cookies.set('pb_oauth_verifier_raw', provider.codeVerifier, {
		...cookieOptions,
		sameSite: 'lax'
	});
	cookies.set('oauth_backup', `${provider.state}|${provider.codeVerifier}|${provider.name}`, {
		...cookieOptions,
		sameSite: 'lax'
	});

	throw redirect(302, provider.authUrl + encodeURIComponent(redirectUrl));
}

export async function finishOAuthProvider({ locals, params, url, cookies }) {
	const providerName = params.provider;
	if (!ALLOWED_OAUTH_PROVIDERS.has(providerName)) throw error(404, 'OAuth provider not found');

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state) throw error(400, 'Missing code/state');

	const storedState = decodeCookieValue(cookies.get('pb_oauth_state'));
	let verifier = takeOAuthVerifier(state) || decodeCookieValue(cookies.get('pb_oauth_verifier'));
	verifier ||= cookies.get('pb_oauth_verifier_raw');

	if (!verifier) {
		const backupData = cookies.get('oauth_backup');
		if (backupData) {
			const [backupState, backupVerifier, backupProvider] = backupData.split('|');
			if (backupState === state && backupProvider === providerName) verifier = backupVerifier;
		}
	}

	const rawState = cookies.get('pb_oauth_state_raw');
	if (storedState !== state && rawState !== state) throw error(400, 'Invalid state');
	if (!verifier) throw error(400, 'Missing verifier');

	const cookieProvider = cookies.get('pb_oauth_provider') || providerName;
	if (cookieProvider !== providerName) throw error(400, 'OAuth provider mismatch');

	try {
		await locals.pb
			.collection('users')
			.authWithOAuth2Code(providerName, code, verifier, getCallbackUrl(url, providerName));
		locals.user = locals.pb.authStore.model;
	} catch (e) {
		console.error('[OAuth] authWithOAuth2 failed', {
			provider: providerName,
			message: e?.message,
			status: e?.response?.status,
			data: e?.response?.data
		});
		throw error(401, 'OAuth failed');
	} finally {
		const secure = url.protocol === 'https:';
		cookies.delete('pb_oauth_state', { path: '/', secure, sameSite: 'none' });
		cookies.delete('pb_oauth_verifier', { path: '/', secure, sameSite: 'none' });
		cookies.delete('pb_oauth_provider', { path: '/', secure, sameSite: 'none' });
		cookies.delete('pb_oauth_state_raw', { path: '/', secure, sameSite: 'lax' });
		cookies.delete('pb_oauth_verifier_raw', { path: '/', secure, sameSite: 'lax' });
		cookies.delete('oauth_backup', { path: '/', secure, sameSite: 'lax' });
	}

	await redirectAfterAuth({ locals, cookies, url });
}
