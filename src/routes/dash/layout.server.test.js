import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server.js';

function createLocals(getOneImpl) {
	return {
		user: { id: 'user_1' },
		pb: {
			collection: vi.fn(() => ({
				getOne: getOneImpl
			}))
		}
	};
}

describe('GET /dash layout load', () => {
	it('redirects unauthenticated users to login', async () => {
		await expect(
			load({
				locals: {
					user: null,
					pb: {}
				}
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/login'
		});
	});

	it('redirects users without onboarding flag to onboarding', async () => {
		const locals = createLocals(
			vi.fn(async () => ({
				id: 'user_1',
				onboarded: false,
				created: '2026-02-28T00:00:00.000Z',
				updated: '2026-02-28T00:00:00.000Z'
			}))
		);

		await expect(load({ locals })).rejects.toMatchObject({
			status: 302,
			location: '/onboarding'
		});
	});

	it('redirects first-login users when created and updated timestamps are close', async () => {
		const locals = createLocals(
			vi.fn(async () => ({
				id: 'user_1',
				onboarded: true,
				created: '2026-02-28T00:00:00.000Z',
				updated: '2026-02-28T00:00:00.500Z'
			}))
		);

		await expect(load({ locals })).rejects.toMatchObject({
			status: 302,
			location: '/onboarding'
		});
	});

	it('returns user when profile lookup fails', async () => {
		const locals = createLocals(
			vi.fn(async () => {
				throw new Error('temporary failure');
			})
		);

		const result = await load({ locals });
		expect(result).toEqual({ user: locals.user });
	});

	it('returns user when onboarding is already complete', async () => {
		const locals = createLocals(
			vi.fn(async () => ({
				id: 'user_1',
				onboarded: true,
				created: '2026-02-28T00:00:00.000Z',
				updated: '2026-02-28T00:05:00.000Z'
			}))
		);

		const result = await load({ locals });
		expect(result).toEqual({ user: locals.user });
	});
});
