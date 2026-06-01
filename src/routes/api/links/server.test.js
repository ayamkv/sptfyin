import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/maintenance', () => ({
	getMaintenanceState: vi.fn(() => ({ message: 'maintenance' })),
	isMaintenanceActive: vi.fn(() => false)
}));

vi.mock('$lib/pocketbase', () => ({
	generateRandomURL: vi.fn(async () => 'rand1234')
}));

import { POST } from './+server.js';

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
