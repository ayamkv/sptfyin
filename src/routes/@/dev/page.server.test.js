import { afterEach, describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({ dev: true }));

vi.mock('$app/environment', () => ({
	get dev() {
		return environment.dev;
	}
}));

const { load } = await import('./+page.server.js');

function createContext({ healthCheck, listAuthMethods, user = null } = {}) {
	return {
		locals: {
			user,
			pb: {
				authStore: { isValid: Boolean(user), token: user ? 'token' : '', model: user },
				health: { check: vi.fn(healthCheck ?? (async () => ({ code: 200 }))) },
				collection: vi.fn(() => ({
					listAuthMethods: vi.fn(
						listAuthMethods ??
							(async () => ({ oauth2: { providers: [{ name: 'google' }, { name: 'discord' }] } }))
					)
				}))
			}
		},
		cookies: {
			getAll: () => [
				{ name: 'pb_auth', value: 'secret-auth-token' },
				{ name: 'sptfyin_guest', value: 'secret-guest-proof' }
			]
		}
	};
}

describe('GET /@/dev load', () => {
	afterEach(() => {
		environment.dev = true;
	});

	it('is not found outside dev', async () => {
		environment.dev = false;

		await expect(load(createContext())).rejects.toMatchObject({ status: 404 });
	});

	it('lists cookie names without their values', async () => {
		const data = await load(createContext());

		expect(data.cookieNames).toEqual(['pb_auth', 'sptfyin_guest']);
		expect(JSON.stringify(data)).not.toContain('secret-auth-token');
		expect(JSON.stringify(data)).not.toContain('secret-guest-proof');
	});

	it('reports PocketBase checks', async () => {
		const data = await load(createContext());

		expect(data.checks).toEqual([
			{ name: 'Health check', status: 'success', result: { code: 200 } },
			{ name: 'OAuth providers', status: 'success', result: { providers: ['google', 'discord'] } }
		]);
	});

	it('reports a failing check instead of throwing', async () => {
		const data = await load(
			createContext({
				healthCheck: async () => {
					const err = new Error('connection refused');
					err.status = 0;
					throw err;
				}
			})
		);

		expect(data.checks[0]).toMatchObject({
			name: 'Health check',
			status: 'error',
			error: { message: 'connection refused' }
		});
		expect(data.checks[1].status).toBe('success');
	});

	it('summarises the signed-in user', async () => {
		const data = await load(
			createContext({ user: { id: 'user_1', username: 'alpha', tokenKey: 'should-not-leak' } })
		);

		expect(data.user).toMatchObject({ id: 'user_1', username: 'alpha' });
		expect(data.user).not.toHaveProperty('tokenKey');
		expect(data.authState).toEqual({ isValid: true, hasToken: true, hasModel: true });
	});
});
