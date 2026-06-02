import { redirect, error } from '@sveltejs/kit';

const LINK_NOT_FOUND_MESSAGE =
	'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠';

// Function to check if user agent is a bot or crawler
function isBot(userAgent) {
	const botPatterns = [
		'whatsapp',
		'telegram',
		'twitter',
		'bot',
		'crawler',
		'spider',
		'slurp',
		'mediapartners-google',
		'facebookexternalhit',
		'telegrambot',
		'google-safety',
		'google-firebase',
		'unknown',
		'okhttp',
		'python-requests/2.32.3',
		'node-fetch',
		'node',
		'help@dataminr.com',
		'axios',
		'dub.co',
		'iframe',
		'siteinfo'
	];

	userAgent = userAgent.toLowerCase();
	return botPatterns.some((pattern) => userAgent.includes(pattern));
}

export const prerender = false;

export const load = async ({ params, request, locals }) => {
	const slug = params.slug;
	let record;

	try {
		const data = await locals.pb.collection('viewList').getList(1, 1, {
			filter: locals.pb.filter('id_url = {:slug}', { slug })
		});

		record = data?.items?.[0];
	} catch {
		throw error(503, 'Link lookup is temporarily unavailable.');
	}

	const recordId = record?.id;
	const link = record?.from;

	if (!recordId || !link) {
		throw error(404, LINK_NOT_FOUND_MESSAGE);
	}

	const userAgent = request.headers.get('user-agent') || 'Unknown';
	const botRequest = isBot(userAgent);

	if (!botRequest) {
		const cf_ipcountry = request.headers.get('CF-IPCountry');

		try {
			await locals.pb.collection('analytics').create({
				author: recordId,
				utm_userAgent: userAgent,
				utm_country: cf_ipcountry,
				url_id: recordId,
				rawData: cf_ipcountry,
				created: new Date().toISOString()
			});
		} catch {
			// Analytics writes are best-effort and must never block redirects.
		}

		try {
			await locals.pb.collection('random_short').update(recordId, {
				'utm_view+': 1
			});
		} catch {
			// View count updates are best-effort and must never block redirects.
		}
	}

	redirect(301, link);
};
