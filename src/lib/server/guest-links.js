import { dev } from '$app/environment';

export const GUEST_SESSION_COOKIE = 'sptfyin_guest';
export const GUEST_PROOF_HEADER = 'X-Sptfyin-Guest-Proof';
export const GUEST_HASH_HEADER = 'X-Sptfyin-Guest-Hash';
export const MAX_ACTIVE_GUEST_LINKS = 3;

const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const GUEST_ACTIVE_FILTER = 'guest_active = true';
const GUEST_TRANSFER_PAGE_SIZE = 100;

function getGuestCookieOptions(url) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev && url.protocol === 'https:',
		maxAge: GUEST_COOKIE_MAX_AGE
	};
}

function bytesToHex(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateGuestSecret() {
	const bytes = new Uint8Array(32);
	globalThis.crypto.getRandomValues(bytes);
	return bytesToHex(bytes);
}

export async function hashGuestSessionSecret(secret) {
	const data = new TextEncoder().encode(secret);
	const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
	return bytesToHex(new Uint8Array(digest));
}

export function getGuestSessionSecret(cookies) {
	return cookies.get(GUEST_SESSION_COOKIE) || '';
}

export function ensureGuestSession(cookies, url) {
	const existing = getGuestSessionSecret(cookies);
	if (existing) return existing;

	const secret = generateGuestSecret();
	cookies.set(GUEST_SESSION_COOKIE, secret, getGuestCookieOptions(url));
	return secret;
}

export function clearGuestSession(cookies, url) {
	cookies.delete(GUEST_SESSION_COOKIE, getGuestCookieOptions(url));
}

export function buildGuestProofHeaders(secret) {
	if (!secret) return undefined;

	return {
		[GUEST_PROOF_HEADER]: secret
	};
}

export async function buildGuestOwnershipHeaders(secret) {
	if (!secret) return undefined;

	return {
		[GUEST_PROOF_HEADER]: secret,
		[GUEST_HASH_HEADER]: await hashGuestSessionSecret(secret)
	};
}

function serializeOwnedLink(record) {
	return {
		id: record.id,
		id_url: record.id_url,
		from: record.from,
		subdomain: record.subdomain,
		created: record.created,
		utm_view: record.utm_view,
		user: record.user || ''
	};
}

export async function getRecentGuestOwnedLinkIds(pb, guestSecret) {
	const result = await pb.collection('random_short').getList(1, MAX_ACTIVE_GUEST_LINKS, {
		sort: '-created,-id',
		filter: GUEST_ACTIVE_FILTER,
		fields: 'id',
		headers: await buildGuestOwnershipHeaders(guestSecret)
	});

	return result.items.map((item) => item.id);
}

export async function listOwnedGuestLinks(pb, guestSecret, { page = 1, perPage = 10 } = {}) {
	const result = await pb.collection('random_short').getList(page, perPage, {
		sort: '-created,-id',
		filter: GUEST_ACTIVE_FILTER,
		fields: 'id,id_url,from,subdomain,created,utm_view,user',
		headers: await buildGuestOwnershipHeaders(guestSecret)
	});

	return {
		...result,
		items: result.items.map(serializeOwnedLink)
	};
}

async function listAllGuestOwnedLinks(pb, guestSecret) {
	const headers = await buildGuestOwnershipHeaders(guestSecret);
	const guestOwnerHash = await hashGuestSessionSecret(guestSecret);
	const filter = pb.filter('user = "" && guest_owner_hash = {:guestOwnerHash}', { guestOwnerHash });
	const items = [];
	let page = 1;
	let totalPages = 1;

	do {
		const result = await pb.collection('random_short').getList(page, GUEST_TRANSFER_PAGE_SIZE, {
			sort: '-created,-id',
			filter,
			fields: 'id',
			headers
		});

		items.push(...result.items);
		totalPages = result.totalPages || 0;
		page += 1;
	} while (page <= totalPages);

	return items;
}

export async function transferGuestLinksToUser(pb, userId, guestSecret) {
	if (!userId || !guestSecret) return 0;

	const guestLinks = await listAllGuestOwnedLinks(pb, guestSecret);

	if (!guestLinks.length) return 0;

	const headers = await buildGuestOwnershipHeaders(guestSecret);

	for (const link of guestLinks) {
		await pb.collection('random_short').update(
			link.id,
			{
				user: userId
			},
			{ headers }
		);
	}

	return guestLinks.length;
}
