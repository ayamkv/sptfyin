export const LONG_TERM_RESERVED_ROOT_SLUGS = ['api', '@'];

export const COOLDOWN_RESERVED_ROOT_SLUGS = [
	'about',
	'login',
	'auth',
	'dash',
	'onboarding',
	'recent',
	'top',
	'prev',
	'profile',
	'debug',
	'debug-auth',
	'test-pb',
	'home-data.json'
];

export const RESERVED_ROOT_SLUGS = [
	...LONG_TERM_RESERVED_ROOT_SLUGS,
	...COOLDOWN_RESERVED_ROOT_SLUGS
];

const RESERVED_ROOT_SLUG_SET = new Set(RESERVED_ROOT_SLUGS);

export function normalizeSlug(value) {
	return String(value || '')
		.trim()
		.toLowerCase();
}

export function isReservedRootSlug(value) {
	return RESERVED_ROOT_SLUG_SET.has(normalizeSlug(value));
}
