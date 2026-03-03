import { env } from '$env/dynamic/private';

function parseAllowlist(value, lowercase = false) {
	if (!value || typeof value !== 'string') return new Set();

	return new Set(
		value
			.split(/[\n,;]/)
			.map((entry) => entry.trim())
			.filter(Boolean)
			.map((entry) => (lowercase ? entry.toLowerCase() : entry))
	);
}

export function getAdminAllowlist() {
	const emails = parseAllowlist(env.ADMIN_EMAIL_ALLOWLIST, true);
	const userIds = parseAllowlist(env.ADMIN_USER_ID_ALLOWLIST);

	return {
		emails,
		userIds,
		hasEntries: emails.size > 0 || userIds.size > 0
	};
}

export function isAdminAuthorized(locals) {
	const user = locals?.user;
	if (!user) {
		return {
			allowed: false,
			reason: 'not_authenticated'
		};
	}

	const isSuperuser = Boolean(locals?.pb?.authStore?.isSuperuser);
	if (isSuperuser) {
		return {
			allowed: true,
			matchedBy: 'superuser'
		};
	}

	const { emails, userIds, hasEntries } = getAdminAllowlist();
	if (!hasEntries) {
		return {
			allowed: false,
			reason: 'allowlist_not_configured'
		};
	}

	const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
	if (email && emails.has(email)) {
		return {
			allowed: true,
			matchedBy: 'email_allowlist'
		};
	}

	const userId = typeof user.id === 'string' ? user.id.trim() : '';
	if (userId && userIds.has(userId)) {
		return {
			allowed: true,
			matchedBy: 'id_allowlist'
		};
	}

	return {
		allowed: false,
		reason: 'not_allowlisted'
	};
}
