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

	try {
		await locals.pb
			.collection('users')
			.getFirstListItem(locals.pb.filter('username = {:username}', { username }));
		return json({ valid: false, available: false, value: username, message: 'Username is taken.' });
	} catch (error) {
		if (error?.status === 404) {
			return json({
				valid: true,
				available: true,
				value: username,
				message: 'Username is available.'
			});
		}

		console.error('[Auth Validate] Username availability check failed', {
			message: error?.message,
			status: error?.status
		});
		return json(
			{ valid: false, available: false, value: username, message: 'Could not check username.' },
			{ status: 503 }
		);
	}
}
