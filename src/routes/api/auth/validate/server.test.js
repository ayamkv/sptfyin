import { describe, expect, it, vi } from 'vitest';
import { POST } from './+server.js';

function createRequest(body) {
	return {
		json: async () => body
	};
}

describe('POST /api/auth/validate', () => {
	it('rejects unsupported fields', async () => {
		const response = await POST({
			locals: { pb: {} },
			request: createRequest({ field: 'email', value: 'a@example.com' })
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ valid: false });
	});

	it('validates username format before checking PocketBase', async () => {
		const getFirstListItem = vi.fn();
		const response = await POST({
			locals: {
				pb: {
					filter: vi.fn(),
					collection: vi.fn(() => ({ getFirstListItem }))
				}
			},
			request: createRequest({ field: 'username', value: 'x' })
		});

		expect(response.status).toBe(200);
		expect(getFirstListItem).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({ valid: false, available: false });
	});

	it('returns available when PocketBase returns 404', async () => {
		const filter = vi.fn(() => 'username = "newuser"');
		const getFirstListItem = vi.fn(async () => {
			const error = new Error('not found');
			error.status = 404;
			throw error;
		});

		const response = await POST({
			locals: {
				pb: {
					filter,
					collection: vi.fn(() => ({ getFirstListItem }))
				}
			},
			request: createRequest({ field: 'username', value: 'NewUser' })
		});

		expect(response.status).toBe(200);
		expect(filter).toHaveBeenCalledWith('username = {:username}', { username: 'newuser' });
		await expect(response.json()).resolves.toMatchObject({
			valid: true,
			available: true,
			value: 'newuser'
		});
	});

	it('returns unavailable when a username exists', async () => {
		const response = await POST({
			locals: {
				pb: {
					filter: vi.fn(() => 'filter'),
					collection: vi.fn(() => ({ getFirstListItem: vi.fn(async () => ({ id: 'user_1' })) }))
				}
			},
			request: createRequest({ field: 'username', value: 'taken' })
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ valid: false, available: false });
	});
});
