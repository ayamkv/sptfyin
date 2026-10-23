import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { checkLinkUpdate } = require('../pb_hooks/lib/link-update-policy.cjs');

const anonymous = { isOwner: false, canClaimGuestLink: false };
const owner = { isOwner: true, canClaimGuestLink: false };
const guestClaimer = { isOwner: false, canClaimGuestLink: true };

function check(changedFields, actor, views = { originalViews: 4, nextViews: 4 }) {
	return checkLinkUpdate({ changedFields, ...views, ...actor });
}

describe('checkLinkUpdate', () => {
	it('allows anyone to increment the view counter by one', () => {
		expect(check(['utm_view'], anonymous, { originalViews: 4, nextViews: 5 })).toBeNull();
	});

	it('rejects view counter changes other than +1', () => {
		expect(check(['utm_view'], anonymous, { originalViews: 4, nextViews: 100 })).toMatch(
			/incremented by 1/
		);
		expect(check(['utm_view'], owner, { originalViews: 4, nextViews: 3 })).toMatch(
			/incremented by 1/
		);
	});

	it('allows an update that changes nothing', () => {
		expect(check([], anonymous)).toBeNull();
	});

	it('rejects non-owner changes to link fields', () => {
		for (const field of ['from', 'id_url', 'subdomain', 'user', 'enable']) {
			expect(check([field], anonymous)).toBe(`Field "${field}" cannot be updated`);
		}
	});

	it('rejects guest ownership hash changes from anyone', () => {
		for (const actor of [anonymous, owner, guestClaimer]) {
			expect(check(['guest_owner_hash'], actor)).toBe('Field "guest_owner_hash" cannot be updated');
		}
	});

	it('rejects fields it has never heard of', () => {
		expect(check(['some_future_field'], anonymous)).toMatch(/cannot be updated/);
	});

	it('lets owners edit destination, slug and subdomain', () => {
		expect(check(['from', 'id_url', 'subdomain'], owner)).toBeNull();
	});

	it('does not let owners change other fields', () => {
		expect(check(['user'], owner)).toMatch(/cannot be updated/);
		expect(check(['guest_active'], owner)).toMatch(/cannot be updated/);
	});

	it('lets a proven guest claim a link by setting only the user field', () => {
		expect(check(['user'], guestClaimer)).toBeNull();
		expect(check(['user', 'from'], guestClaimer)).toBe('Field "from" cannot be updated');
	});

	it('rejects the whole update when any field is disallowed', () => {
		expect(check(['utm_view', 'from'], anonymous, { originalViews: 1, nextViews: 2 })).toBe(
			'Field "from" cannot be updated'
		);
	});
});
