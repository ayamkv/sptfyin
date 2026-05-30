import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from './+server.js';

function createCookies(guestSecret = '') {
	return {
		get: vi.fn((name) => (name === 'sptfyin_guest' ? guestSecret : undefined))
	};
}

function createLocals(record, userId = null) {
	const deleteRecord = vi.fn(async () => {});
	const getOne = vi.fn(async () => record);

	return {
		user: userId ? { id: userId } : null,
		pb: {
			collection: vi.fn(() => ({
				getOne,
				delete: deleteRecord
			}))
		},
		getOne,
		deleteRecord
	};
}

describe('DELETE /api/links/[id]', () => {
	let consoleErrorSpy;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it('allows the guest owner to delete their link', async () => {
		const locals = createLocals({
			id: 'link_1',
			user: '',
			guest_owner_hash: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
		});

		const response = await DELETE({
			locals,
			params: { id: 'link_1' },
			cookies: createCookies('guest-secret')
		});

		expect(response.status).toBe(204);
		expect(locals.pb.collection).toHaveBeenCalledWith('random_short');
		expect(locals.getOne).not.toHaveBeenCalled();
		expect(locals.deleteRecord).toHaveBeenCalledWith('link_1', {
			headers: {
				'X-Sptfyin-Guest-Proof': 'guest-secret',
				'X-Sptfyin-Guest-Hash': 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
	});

	it('rejects guest deletion without a matching guest cookie', async () => {
		const locals = createLocals({ id: 'link_1' });
		locals.deleteRecord.mockRejectedValueOnce({ status: 400 });

		await expect(
			DELETE({
				locals,
				params: { id: 'link_1' },
				cookies: createCookies('guest-secret')
			})
		).rejects.toMatchObject({
			status: 403,
			body: { message: 'Not authorized to delete this link' }
		});
	});
});
