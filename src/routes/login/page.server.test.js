import { describe, expect, it } from 'vitest';
import { load } from './+page.server.js';

describe('GET /login load', () => {
	it('redirects authenticated users to dashboard', async () => {
		await expect(
			load({
				locals: {
					user: { id: 'user_1' }
				}
			})
		).rejects.toMatchObject({
			status: 302,
			location: '/dash/links'
		});
	});

	it('returns normally for unauthenticated users', async () => {
		const result = await load({
			locals: {
				user: null
			}
		});

		expect(result).toEqual({});
	});
});
