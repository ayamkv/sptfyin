import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server.js';

function createLocals(getOneImpl, user = { id: 'user_1', username: 'alpha' }) {
	return {
		user,
		pb: {
			collection: vi.fn(() => ({
				getOne: getOneImpl
			}))
		}
	};
}

function createCookies(value) {
	return {
		get: vi.fn(() => value)
	};
}

describe('GET /onboarding load', () => {
	it('redirects unauthenticated users to login', async () => {
		await expect(
			load({
				locals: { user: null, pb: {} },
				cookies: createCookies(undefined)
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/login'
		});
	});

	it('returns onboarding payload when setup is required', async () => {
		const locals = createLocals(
			vi.fn(async () => ({
				id: 'user_1',
				username: 'alpha',
				onboarded: false,
				created: '2026-02-28T00:00:00.000Z',
				updated: '2026-02-28T00:00:00.000Z'
			}))
		);

		const result = await load({
			locals,
			cookies: createCookies(undefined)
		});

		expect(result).toEqual({
			initial: 'alpha',
			canConfirm: true
		});
	});

	it('redirects to dashboard when onboarding is already complete', async () => {
		const locals = createLocals(
			vi.fn(async () => ({
				id: 'user_1',
				username: 'alpha',
				onboarded: true,
				created: '2026-02-28T00:00:00.000Z',
				updated: '2026-02-28T00:05:00.000Z'
			}))
		);

		await expect(
			load({
				locals,
				cookies: createCookies(undefined)
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/dash/links'
		});
	});

	it('falls back to onboarding cookie when record lookup fails', async () => {
		const locals = createLocals(
			vi.fn(async () => {
				throw new Error('db failed');
			})
		);

		const result = await load({
			locals,
			cookies: createCookies('1')
		});

		expect(result).toEqual({
			initial: 'alpha',
			canConfirm: true
		});
	});

	it('redirects to dashboard when record lookup fails and no cookie hint exists', async () => {
		const locals = createLocals(
			vi.fn(async () => {
				throw new Error('db failed');
			})
		);

		await expect(
			load({
				locals,
				cookies: createCookies(undefined)
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/dash/links'
		});
	});
});
