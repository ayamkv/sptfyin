import { json, error } from '@sveltejs/kit';
import { generateRandomURL } from '$lib/pocketbase';
import { isMaintenanceActive, getMaintenanceState } from '$lib/maintenance';
import { isReservedRootSlug } from '$lib/reserved-slugs';
import {
	buildGuestOwnershipHeaders,
	ensureGuestSession,
	hashGuestSessionSecret,
	listOwnedGuestLinks
} from '$lib/server/guest-links';

export async function GET({ locals, url, cookies }) {
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

	// random_short's list rule lets a signed-in user read their own links.
	let data;
	try {
		data = await locals.pb.collection('random_short').getList(page, perPage, {
			sort: '-created',
			filter: locals.pb.filter('user = {:userId}', { userId: locals.user.id }),
			fields: 'id,id_url,from,subdomain,utm_view,created,user'
		});
	} catch (e) {
		console.error('[API Links GET] Failed to fetch links:', e?.status, e?.message);
		throw error(e?.status >= 400 ? e.status : 502, 'failed to fetch links');
	}

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
	const { from, id_url: requestedIdUrl, slug, subdomain, turnstileToken } = body || {};
	if (!from) throw error(400, 'from is required');

	const id_url = requestedIdUrl || slug || (await generateRandomURL());
	if (isReservedRootSlug(id_url)) throw error(400, 'slug reserved');

	const data = {
		from,
		id_url,
		subdomain: subdomain || 'sptfy.in',
		enable: true
	};
	let headers;
	let guestSecret = '';

	// Always use authenticated user ID - never trust client-provided value
	// This prevents users from creating links owned by other users
	if (locals.user) {
		data.user = locals.user.id;
	} else {
		guestSecret = ensureGuestSession(cookies, url);
		data.guest_owner_hash = await hashGuestSessionSecret(guestSecret);
		data.guest_active = true;
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
		delete record.guest_active;
		return json(record, { status: 201 });
	} catch (e) {
		console.error('[API Links POST] Failed to create link:', e);
		const code = e?.response?.data?.id_url?.code;
		if (code === 'validation_not_unique') throw error(409, 'slug taken');

		const message = e?.response?.message || e?.message || 'create failed';
		throw error(e?.status || 400, message);
	}
}
