import { finishOAuthProvider } from '$lib/server/oauth';

export function GET(event) {
	return finishOAuthProvider({ ...event, params: { provider: 'spotify' } });
}
