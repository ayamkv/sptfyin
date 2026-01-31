import { json, error } from '@sveltejs/kit';

export async function GET({ locals }) {
	return json({ user: locals.user || null });
}

export async function PATCH({ locals, request }) {
	if (!locals.user) throw error(401);
	const body = await request.json();
	const username = body?.username;

	const updateData = { onboarded: true };

	if (username !== undefined) {
		if (!/^[\w][\w.\-]*$/.test(username) || username.length < 3 || username.length > 150) {
			throw error(400, 'invalid username');
		}
		updateData.username = username;
	}

	try {
		const record = await locals.pb.collection('users').update(locals.user.id, updateData);
		return json({ user: record });
	} catch (e) {
		const code = e?.response?.data?.username?.code;
		if (code === 'validation_not_unique') throw error(409, 'username taken');
		throw error(400, 'update failed');
	}
}
