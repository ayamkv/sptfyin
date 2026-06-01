import { describe, expect, it } from 'vitest';
import { load } from './+page.server.js';

describe('GET /@/register load', () => {
	it('redirects authenticated users to dashboard', async () => {
		await expect(
			load({
				locals: {
					user: { id: 'user_1' }
				},
				cookies: { get: () => undefined }
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/@/dash/links'
		});
	});

	it('returns normally for unauthenticated users', async () => {
		const result = await load({
			locals: {
				user: null
			},
			cookies: { get: () => undefined }
		});

		expect(result).toEqual({ hasGuestSession: false });
	});

	it('returns guest session hint when present', async () => {
		const result = await load({
			locals: {
				user: null
			},
			cookies: { get: (name) => (name === 'sptfyin_guest' ? 'guest-secret' : undefined) }
		});

		expect(result).toEqual({ hasGuestSession: true });
	});
});
