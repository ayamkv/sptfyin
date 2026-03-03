import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		ADMIN_EMAIL_ALLOWLIST: '',
		ADMIN_USER_ID_ALLOWLIST: ''
	}
}));

import { env } from '$env/dynamic/private';
import { getAdminAllowlist, isAdminAuthorized } from './admin-auth.js';

function createLocals({ user = null, isSuperuser = false } = {}) {
	return {
		user,
		pb: {
			authStore: {
				isSuperuser
			}
		}
	};
}

describe('admin-auth', () => {
	beforeEach(() => {
		env.ADMIN_EMAIL_ALLOWLIST = '';
		env.ADMIN_USER_ID_ALLOWLIST = '';
	});

	it('denies unauthenticated users', () => {
		const result = isAdminAuthorized(createLocals());
		expect(result).toMatchObject({
			allowed: false,
			reason: 'not_authenticated'
		});
	});

	it('allows superusers', () => {
		const result = isAdminAuthorized(
			createLocals({
				user: { id: 'u_1', email: 'owner@sptfy.in' },
				isSuperuser: true
			})
		);

		expect(result).toMatchObject({
			allowed: true,
			matchedBy: 'superuser'
		});
	});

	it('allows users by email allowlist', () => {
		env.ADMIN_EMAIL_ALLOWLIST = 'owner@sptfy.in, admin@sptfy.in';

		const result = isAdminAuthorized(
			createLocals({
				user: { id: 'u_2', email: 'OWNER@sptfy.in' }
			})
		);

		expect(result).toMatchObject({
			allowed: true,
			matchedBy: 'email_allowlist'
		});
	});

	it('allows users by id allowlist', () => {
		env.ADMIN_USER_ID_ALLOWLIST = 'u_7, u_8';

		const result = isAdminAuthorized(
			createLocals({
				user: { id: 'u_8', email: 'user@sptfy.in' }
			})
		);

		expect(result).toMatchObject({
			allowed: true,
			matchedBy: 'id_allowlist'
		});
	});

	it('parses allowlists from env', () => {
		env.ADMIN_EMAIL_ALLOWLIST = 'a@sptfy.in\n b@sptfy.in';
		env.ADMIN_USER_ID_ALLOWLIST = 'u_1;u_2';

		const allowlist = getAdminAllowlist();
		expect(allowlist.emails.has('a@sptfy.in')).toBe(true);
		expect(allowlist.emails.has('b@sptfy.in')).toBe(true);
		expect(allowlist.userIds.has('u_1')).toBe(true);
		expect(allowlist.userIds.has('u_2')).toBe(true);
		expect(allowlist.hasEntries).toBe(true);
	});
});
