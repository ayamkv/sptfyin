import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PATCH } from './+server.js';

function createCookies(guestSecret = '') {
	return {
		get: vi.fn((name) => (name === 'sptfyin_guest' ? guestSecret : undefined))
	};
}

function createRequest(body = {}) {
	return {
		json: vi.fn(async () => body)
	};
}

function createLocals(record, userId = null) {
	const deleteRecord = vi.fn(async () => {});
	const getOne = vi.fn(async () => record);
	const getList = vi.fn(async () => ({ items: [{ id: 'link_1' }] }));
	const update = vi.fn(async (id, data) => ({ id, ...record, ...data }));

	return {
		user: userId ? { id: userId } : null,
		pb: {
			collection: vi.fn(() => ({
				getOne,
				getList,
				update,
				delete: deleteRecord
			}))
		},
		getOne,
		getList,
		update,
		deleteRecord
	};
}

describe('PATCH /api/links/[id]', () => {
	it('rejects reserved slug changes server-side', async () => {
		const locals = createLocals({ id: 'link_1', user: 'user_1', id_url: 'old' }, 'user_1');

		await expect(
			PATCH({
				locals,
				params: { id: 'link_1' },
				request: createRequest({ id_url: 'about' })
			})
		).rejects.toMatchObject({
			status: 400,
			body: { message: 'slug reserved' }
		});

		expect(locals.update).not.toHaveBeenCalled();
	});
});

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
			cookies: createCookies('guest-secret'),
			request: createRequest({ turnstileToken: 'turnstile-token' })
		});

		expect(response.status).toBe(204);
		expect(locals.pb.collection).toHaveBeenCalledWith('random_short');
		expect(locals.getOne).not.toHaveBeenCalled();
		expect(locals.getList).toHaveBeenCalledWith(1, 3, {
			sort: '-created,-id',
			filter: 'guest_active = true',
			fields: 'id',
			headers: {
				'X-Sptfyin-Guest-Proof': 'guest-secret',
				'X-Sptfyin-Guest-Hash': 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
		expect(locals.deleteRecord).toHaveBeenCalledWith('link_1', {
			headers: {
				'X-Sptfyin-Guest-Proof': 'guest-secret',
				'X-Sptfyin-Guest-Hash': 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
				'X-Turnstile-Token': 'turnstile-token'
			}
		});
	});

	it('rejects guest deletion without a turnstile token', async () => {
		const locals = createLocals({ id: 'link_1' });

		await expect(
			DELETE({
				locals,
				params: { id: 'link_1' },
				cookies: createCookies('guest-secret'),
				request: createRequest()
			})
		).rejects.toMatchObject({
			status: 400,
			body: { message: 'Turnstile verification required' }
		});
	});

	it('rejects guest deletion outside the 3 most recent owned links', async () => {
		const locals = createLocals({ id: 'old_link' });

		await expect(
			DELETE({
				locals,
				params: { id: 'old_link' },
				cookies: createCookies('guest-secret'),
				request: createRequest({ turnstileToken: 'turnstile-token' })
			})
		).rejects.toMatchObject({
			status: 403,
			body: { message: 'Only your active local links can be deleted' }
		});
	});

	it('rejects guest deletion without a matching guest cookie', async () => {
		const locals = createLocals({ id: 'link_1' });
		locals.deleteRecord.mockRejectedValueOnce({ status: 400 });

		await expect(
			DELETE({
				locals,
				params: { id: 'link_1' },
				cookies: createCookies('guest-secret'),
				request: createRequest({ turnstileToken: 'turnstile-token' })
			})
		).rejects.toMatchObject({
			status: 403,
			body: { message: 'Not authorized to delete this link' }
		});
	});
});
