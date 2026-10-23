import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/maintenance', () => ({
	getMaintenanceState: vi.fn(() => ({ message: 'maintenance' })),
	isMaintenanceActive: vi.fn(() => false)
}));

vi.mock('$lib/pocketbase', () => ({
	generateRandomURL: vi.fn(async () => 'rand1234')
}));

import { GET, POST } from './+server.js';

function createRequest(body) {
	return {
		json: async () => body
	};
}

function createCookies(guestSecret = '') {
	const store = new Map();
	if (guestSecret) store.set('sptfyin_guest', guestSecret);

	return {
		get: vi.fn((name) => store.get(name)),
		set: vi.fn((name, value) => store.set(name, value)),
		delete: vi.fn((name) => store.delete(name))
	};
}

describe('POST /api/links', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates a guest-owned link with server-managed ownership fields', async () => {
		const create = vi.fn(async (data) => ({ id: 'rec_1', ...data }));
		const update = vi.fn(async () => ({}));
		const locals = {
			user: null,
			pb: {
				collection: vi.fn(() => ({
					getList: vi.fn(async () => ({ items: [] })),
					create,
					update
				}))
			}
		};
		const cookies = createCookies('guest-secret');

		const response = await POST({
			locals,
			request: createRequest({
				from: 'https://open.spotify.com/track/abc',
				slug: 'guestslug',
				subdomain: 'sptfy.in',
				turnstileToken: 'turnstile-token'
			}),
			cookies,
			url: new URL('https://sptfy.in/')
		});

		expect(response.status).toBe(201);
		expect(create).toHaveBeenCalledWith(
			{
				from: 'https://open.spotify.com/track/abc',
				id_url: 'guestslug',
				subdomain: 'sptfy.in',
				enable: true,
				guest_active: true,
				guest_owner_hash: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			},
			{
				headers: {
					'X-Sptfyin-Guest-Proof': 'guest-secret',
					'X-Sptfyin-Guest-Hash':
						'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
					'X-Turnstile-Token': 'turnstile-token'
				}
			}
		);
	});

	it('creates a new active guest link without pre-counting existing links', async () => {
		const create = vi.fn(async (data) => ({ id: 'new_link', ...data }));
		const update = vi.fn(async () => ({}));
		const getList = vi.fn(async () => ({ items: [] }));
		const locals = {
			user: null,
			pb: {
				collection: vi.fn(() => ({
					getList,
					create,
					update
				}))
			}
		};

		const response = await POST({
			locals,
			request: createRequest({
				from: 'https://open.spotify.com/track/abc',
				turnstileToken: 'turnstile-token'
			}),
			cookies: createCookies('guest-secret'),
			url: new URL('https://sptfy.in/')
		});

		expect(response.status).toBe(201);
		expect(getList).not.toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
		expect(create).toHaveBeenCalledWith(
			{
				from: 'https://open.spotify.com/track/abc',
				id_url: 'rand1234',
				subdomain: 'sptfy.in',
				enable: true,
				guest_owner_hash: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
				guest_active: true
			},
			{
				headers: {
					'X-Sptfyin-Guest-Proof': 'guest-secret',
					'X-Sptfyin-Guest-Hash':
						'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
					'X-Turnstile-Token': 'turnstile-token'
				}
			}
		);
	});

	it('rejects reserved slugs server-side', async () => {
		const create = vi.fn(async (data) => ({ id: 'rec_1', ...data }));
		const locals = {
			user: { id: 'user_1' },
			pb: {
				collection: vi.fn(() => ({ create }))
			}
		};

		await expect(
			POST({
				locals,
				request: createRequest({
					from: 'https://open.spotify.com/track/abc',
					slug: 'login'
				}),
				cookies: createCookies(),
				url: new URL('https://sptfy.in/')
			})
		).rejects.toMatchObject({
			status: 400,
			body: { message: 'slug reserved' }
		});

		expect(create).not.toHaveBeenCalled();
	});
});

describe('GET /api/links', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function createSignedInLocals(getList) {
		const filter = vi.fn((expression, params) => `${expression} ${JSON.stringify(params)}`);
		const collection = vi.fn(() => ({ getList }));
		return { user: { id: 'user_1' }, pb: { filter, collection } };
	}

	it("reads the signed-in user's links from random_short with their own auth", async () => {
		const getList = vi.fn(async () => ({
			items: [{ id: 'rec_1', id_url: 'abcd', utm_view: 3 }],
			page: 2,
			perPage: 10,
			totalPages: 3,
			totalItems: 25
		}));
		const locals = createSignedInLocals(getList);

		const response = await GET({
			locals,
			url: new URL('https://sptfy.in/api/links?page=2&perPage=10'),
			cookies: createCookies()
		});

		expect(locals.pb.collection).toHaveBeenCalledWith('random_short');
		expect(locals.pb.filter).toHaveBeenCalledWith('user = {:userId}', { userId: 'user_1' });
		expect(getList).toHaveBeenCalledWith(2, 10, {
			sort: '-created',
			filter: 'user = {:userId} {"userId":"user_1"}',
			fields: 'id,id_url,from,subdomain,utm_view,created,user'
		});
		await expect(response.json()).resolves.toEqual({
			items: [{ id: 'rec_1', id_url: 'abcd', utm_view: 3 }],
			page: 2,
			perPage: 10,
			totalPages: 3,
			totalItems: 25
		});
	});

	it('caps perPage at 50', async () => {
		const getList = vi.fn(async () => ({ items: [] }));

		await GET({
			locals: createSignedInLocals(getList),
			url: new URL('https://sptfy.in/api/links?perPage=500'),
			cookies: createCookies()
		});

		expect(getList).toHaveBeenCalledWith(1, 50, expect.any(Object));
	});

	it('returns an error status when PocketBase fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const getList = vi.fn(async () => {
			const err = new Error('forbidden');
			err.status = 403;
			throw err;
		});

		await expect(
			GET({
				locals: createSignedInLocals(getList),
				url: new URL('https://sptfy.in/api/links'),
				cookies: createCookies()
			})
		).rejects.toMatchObject({ status: 403 });

		vi.restoreAllMocks();
	});

	it('returns an empty list for guests without a guest cookie', async () => {
		const collection = vi.fn();

		const response = await GET({
			locals: { user: null, pb: { collection } },
			url: new URL('https://sptfy.in/api/links'),
			cookies: createCookies()
		});

		expect(collection).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toEqual({
			items: [],
			page: 1,
			perPage: 20,
			totalPages: 0,
			totalItems: 0
		});
	});
});
