import { startOAuthProvider } from '$lib/server/oauth';

export function GET(event) {
	return startOAuthProvider({ ...event, params: { provider: 'spotify' } });
}
