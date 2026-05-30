import { json, error } from '@sveltejs/kit';
import { generateRandomURL } from '$lib/pocketbase';
import { isMaintenanceActive, getMaintenanceState } from '$lib/maintenance';
import {
	buildGuestOwnershipHeaders,
	countGuestOwnedLinks,
	ensureGuestSession,
	hashGuestSessionSecret,
	listOwnedGuestLinks,
	MAX_ACTIVE_GUEST_LINKS
} from '$lib/server/guest-links';
const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

export async function GET({ locals, url, fetch, cookies }) {
	const page = Number(url.searchParams.get('page') || 1);
	const perPage = Math.min(Number(url.searchParams.get('perPage') || 20), 50);

	if (!locals.user) {
		const guestSecret = cookies.get('sptfyin_guest');
		if (!guestSecret) {
			return json({
				items: [],
				page,
				perPage,
				totalPages: 0,
				totalItems: 0
			});
		}

		const ownedLinks = await listOwnedGuestLinks(locals.pb, guestSecret, { page, perPage });
		return json({
			items: ownedLinks.items,
			page: ownedLinks.page,
			perPage: ownedLinks.perPage,
			totalPages: ownedLinks.totalPages,
			totalItems: ownedLinks.totalItems
		});
	}

	console.log('[API Links GET] Fetching links for user:', locals.user.id);

	// Read via viewList to avoid superuser requirement
	const qs = new URLSearchParams({
		page: String(page),
		perPage: String(perPage),
		sort: '-created',
		filter: locals.pb.filter('user.id = {:userId}', { userId: locals.user.id })
	});

	const fetchUrl = `${pocketBaseURL}/api/collections/viewList/records?${qs.toString()}`;
	console.log('[API Links GET] Fetching from:', fetchUrl);

	const resp = await fetch(fetchUrl);
	if (!resp.ok) {
		console.error('[API Links GET] Fetch failed:', resp.status, resp.statusText);
		throw error(resp.status, 'failed to fetch links');
	}

	const data = await resp.json();
	console.log(
		'[API Links GET] Retrieved',
		data.items?.length || 0,
		'links for user:',
		locals.user.id
	);

	return json({
		items: data.items || [],
		page: data.page,
		perPage: data.perPage,
		totalPages: data.totalPages,
		totalItems: data.totalItems
	});
}

export async function POST({ locals, request, cookies, url }) {
	// Check maintenance mode first
	if (isMaintenanceActive()) {
		const state = getMaintenanceState();
		throw error(503, state.message || 'Service temporarily unavailable for maintenance');
	}

	const body = await request.json();
	const { from, slug, subdomain, turnstileToken } = body || {};
	if (!from) throw error(400, 'from is required');

	const id_url = slug || (await generateRandomURL());

	const data = {
		from,
		id_url,
		subdomain: subdomain || 'sptfy.in',
		enable: true
	};
	let headers;

	// Always use authenticated user ID - never trust client-provided value
	// This prevents users from creating links owned by other users
	if (locals.user) {
		data.user = locals.user.id;
	} else {
		const guestSecret = ensureGuestSession(cookies, url);
		let activeGuestLinks;
		try {
			activeGuestLinks = await countGuestOwnedLinks(locals.pb, guestSecret);
		} catch (e) {
			console.error('[API Links POST] Failed to count guest-owned links:', e);
			throw error(500, 'failed to check guest link limit');
		}

		if (activeGuestLinks >= MAX_ACTIVE_GUEST_LINKS) {
			throw error(403, `Guest link limit reached (${MAX_ACTIVE_GUEST_LINKS} active links max)`);
		}

		data.guest_owner_hash = await hashGuestSessionSecret(guestSecret);
		headers = await buildGuestOwnershipHeaders(guestSecret);
	}

	try {
		if (turnstileToken) {
			headers = {
				...(headers || {}),
				'X-Turnstile-Token': turnstileToken
			};
		}

		const record = await locals.pb.collection('random_short').create(data, {
			headers
		});
		delete record.guest_owner_hash;
		return json(record, { status: 201 });
	} catch (e) {
		console.error('[API Links POST] Failed to create link:', e);
		const code = e?.response?.data?.id_url?.code;
		if (code === 'validation_not_unique') throw error(409, 'slug taken');

		const message = e?.response?.message || e?.message || 'create failed';
		throw error(e?.status || 400, message);
	}
}
