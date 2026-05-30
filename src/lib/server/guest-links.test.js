import { describe, expect, it, vi } from 'vitest';
import {
	buildGuestProofHeaders,
	countGuestOwnedLinks,
	GUEST_HASH_HEADER,
	GUEST_PROOF_HEADER,
	hashGuestSessionSecret,
	transferGuestLinksToUser
} from './guest-links.js';

describe('guest link helpers', () => {
	it('hashes guest secrets deterministically', async () => {
		await expect(hashGuestSessionSecret('guest-secret')).resolves.toBe(
			'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
		);
	});

	it('builds guest proof headers only when a secret exists', () => {
		expect(buildGuestProofHeaders('')).toBeUndefined();
		expect(buildGuestProofHeaders('abc')).toEqual({
			[GUEST_PROOF_HEADER]: 'abc'
		});
	});

	it('counts guest links through guest-scoped collection rules', async () => {
		const getList = vi.fn(async () => ({ items: [{ id: 'link_1' }] }));
		const pb = {
			collection: vi.fn(() => ({ getList }))
		};

		const count = await countGuestOwnedLinks(pb, 'guest-secret');

		expect(count).toBe(1);
		expect(getList).toHaveBeenCalledWith(1, 4, {
			fields: 'id',
			headers: {
				[GUEST_PROOF_HEADER]: 'guest-secret',
				[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
	});

	it('transfers guest links to the authenticated user', async () => {
		const update = vi.fn(async () => ({}));
		const getList = vi.fn(async () => ({
			page: 1,
			perPage: 3,
			totalPages: 1,
			totalItems: 2,
			items: [
				{
					id: 'link_1',
					id_url: 'slug-1',
					from: 'https://open.spotify.com/track/1',
					subdomain: 'sptfy.in',
					created: '2026-05-26T00:00:00.000Z',
					utm_view: 0,
					user: ''
				},
				{
					id: 'link_2',
					id_url: 'slug-2',
					from: 'https://open.spotify.com/track/2',
					subdomain: 'sptfy.in',
					created: '2026-05-26T00:00:00.000Z',
					utm_view: 0,
					user: ''
				}
			]
		}));

		const pb = {
			collection: vi.fn(() => ({
				getList,
				update
			}))
		};

		const transferred = await transferGuestLinksToUser(pb, 'user_1', 'guest-secret');

		expect(transferred).toBe(2);
		expect(update).toHaveBeenCalledTimes(2);
		expect(update).toHaveBeenNthCalledWith(
			1,
			'link_1',
			{ user: 'user_1', guest_owner_hash: '' },
			{
				headers: {
					[GUEST_PROOF_HEADER]: 'guest-secret',
					[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
				}
			}
		);
	});
});
