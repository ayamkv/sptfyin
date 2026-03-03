import { redirect } from '@sveltejs/kit';

export async function POST({ locals, cookies }) {
	if (locals.pb) {
		locals.pb.authStore.clear();
	}

	locals.user = null;

	cookies.delete('pb_auth', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0
	});

	throw redirect(302, '/login');
}

export const GET = POST;
