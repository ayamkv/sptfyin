import { describe, expect, it, vi } from 'vitest';
import {
	buildGuestProofHeaders,
	getRecentGuestOwnedLinkIds,
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

	it('returns the newest guest-owned link ids', async () => {
		const getList = vi.fn(async () => ({ items: [{ id: 'link_3' }, { id: 'link_2' }] }));
		const pb = {
			collection: vi.fn(() => ({ getList }))
		};

		const ids = await getRecentGuestOwnedLinkIds(pb, 'guest-secret');

		expect(ids).toEqual(['link_3', 'link_2']);
		expect(getList).toHaveBeenCalledWith(1, 3, {
			sort: '-created,-id',
			filter: 'guest_active = true',
			fields: 'id',
			headers: {
				[GUEST_PROOF_HEADER]: 'guest-secret',
				[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
	});

	it('transfers all guest links to the authenticated user', async () => {
		const update = vi.fn(async () => ({}));
		const getList = vi.fn(async (page) => ({
			page,
			perPage: 100,
			totalPages: 2,
			totalItems: 3,
			items: page === 1 ? [{ id: 'link_1' }, { id: 'link_2' }] : [{ id: 'link_3' }]
		}));

		const pb = {
			filter: vi.fn((expression, params) => `FILTER:${expression}:${JSON.stringify(params)}`),
			collection: vi.fn(() => ({
				getList,
				update
			}))
		};

		const transferred = await transferGuestLinksToUser(pb, 'user_1', 'guest-secret');

		expect(transferred).toBe(3);
		expect(getList).toHaveBeenNthCalledWith(1, 1, 100, {
			sort: '-created,-id',
			filter:
				'FILTER:user = "" && guest_owner_hash = {:guestOwnerHash}:{"guestOwnerHash":"c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a"}',
			fields: 'id',
			headers: {
				[GUEST_PROOF_HEADER]: 'guest-secret',
				[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
		expect(getList).toHaveBeenNthCalledWith(2, 2, 100, {
			sort: '-created,-id',
			filter:
				'FILTER:user = "" && guest_owner_hash = {:guestOwnerHash}:{"guestOwnerHash":"c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a"}',
			fields: 'id',
			headers: {
				[GUEST_PROOF_HEADER]: 'guest-secret',
				[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
			}
		});
		expect(update).toHaveBeenCalledTimes(3);
		expect(update).toHaveBeenNthCalledWith(
			1,
			'link_1',
			{ user: 'user_1' },
			{
				headers: {
					[GUEST_PROOF_HEADER]: 'guest-secret',
					[GUEST_HASH_HEADER]: 'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a'
				}
			}
		);
	});
});
