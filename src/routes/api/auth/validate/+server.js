import { json } from '@sveltejs/kit';
import { normalizeUsername, validateUsernameFormat } from '$lib/auth-validation';

export async function POST({ locals, request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ valid: false, available: false, message: 'Invalid request.' }, { status: 400 });
	}

	if (body?.field !== 'username') {
		return json(
			{ valid: false, available: false, message: 'Unsupported validation field.' },
			{ status: 400 }
		);
	}

	const username = normalizeUsername(body.value);
	const format = validateUsernameFormat(username, { optional: true });
	if (!format.valid || !username) {
		return json({ ...format, available: Boolean(format.valid), value: username });
	}

	let result;
	try {
		// Users are not publicly listable; PocketBase exposes a yes/no availability route instead.
		result = await locals.pb.send(
			`/api/sptfyin/username-available/${encodeURIComponent(username)}`,
			{ method: 'GET' }
		);
	} catch (error) {
		console.error('[Auth Validate] Username availability check failed', {
			message: error?.message,
			status: error?.status
		});
	}

	// Only an explicit answer counts; anything else must never read as "available".
	if (result?.available === true) {
		return json({
			valid: true,
			available: true,
			value: username,
			message: 'Username is available.'
		});
	}
	if (result?.available === false) {
		return json({ valid: false, available: false, value: username, message: 'Username is taken.' });
	}

	return json(
		{ valid: false, available: false, value: username, message: 'Could not check username.' },
		{ status: 503 }
	);
}
