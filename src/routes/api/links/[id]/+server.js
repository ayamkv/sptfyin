import { json, error } from '@sveltejs/kit';
import { buildGuestOwnershipHeaders, getRecentGuestOwnedLinkIds } from '$lib/server/guest-links';
import { isReservedRootSlug } from '$lib/reserved-slugs';

export async function PATCH({ locals, params, request }) {
	if (!locals.user) throw error(401);
	const id = params.id;
	const { from, id_url, subdomain } = await request.json();

	let record;
	try {
		record = await locals.pb.collection('random_short').getOne(id);
	} catch {
		throw error(404, 'not found');
	}

	if (record.user !== locals.user.id) throw error(403);

	const update = {};
	if (from) update.from = from;
	if (id_url) {
		if (isReservedRootSlug(id_url)) throw error(400, 'slug reserved');
		update.id_url = id_url;
	}
	if (subdomain) update.subdomain = subdomain;

	try {
		const updated = await locals.pb.collection('random_short').update(id, update);
		return json(updated);
	} catch (e) {
		const code = e?.response?.data?.id_url?.code;
		if (code === 'validation_not_unique') throw error(409, 'slug taken');
		throw error(400, 'update failed');
	}
}

export async function DELETE({ locals, params, cookies, request }) {
	const id = params.id;
	const guestSecret = cookies.get('sptfyin_guest') || '';
	const body = await request.json().catch(() => ({}));
	const turnstileToken = body?.turnstileToken;

	if (!locals.user) {
		if (!guestSecret) {
			throw error(401, 'Authentication required');
		}

		if (!turnstileToken) {
			throw error(400, 'Turnstile verification required');
		}

		try {
			const recentOwnedIds = await getRecentGuestOwnedLinkIds(locals.pb, guestSecret);
			if (!recentOwnedIds.includes(id)) {
				throw error(403, 'Only your active local links can be deleted');
			}

			await locals.pb.collection('random_short').delete(id, {
				headers: {
					...(await buildGuestOwnershipHeaders(guestSecret)),
					'X-Turnstile-Token': turnstileToken
				}
			});
			return new Response(null, { status: 204 });
		} catch (e) {
			if (e?.body?.message === 'Only your active local links can be deleted') throw e;
			console.error('[API Links DELETE] Failed to delete guest-owned link:', e);
			if (e?.status === 404) throw error(404, 'Link not found');
			throw error(403, 'Not authorized to delete this link');
		}
	}

	let record;
	try {
		record = await locals.pb.collection('random_short').getOne(id);
	} catch {
		throw error(404, 'Link not found');
	}

	const isAuthenticatedOwner = Boolean(locals.user && record.user === locals.user.id);

	if (!isAuthenticatedOwner) {
		throw error(403, 'Not authorized to delete this link');
	}

	try {
		await locals.pb.collection('random_short').delete(id);
		return new Response(null, { status: 204 });
	} catch (e) {
		console.error('[API Links DELETE] Failed to delete:', e);
		throw error(500, 'Failed to delete link');
	}
}
