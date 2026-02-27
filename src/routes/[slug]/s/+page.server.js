import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

const LINK_NOT_FOUND_MESSAGE =
	'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠';

const MOCK_ANALYTICS = [
	{
		utm_country: 'US',
		utm_userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
		created: '2026-02-28T08:00:00.000Z'
	},
	{
		utm_country: 'id',
		utm_userAgent:
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
		created: '2026-02-28T08:15:00.000Z'
	},
	{
		utm_country: 'GB',
		utm_userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
		created: '2026-02-28T08:30:00.000Z'
	},
	{
		utm_country: 'de',
		utm_userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0',
		created: '2026-02-28T08:45:00.000Z'
	},
	{
		utm_country: 'br',
		utm_userAgent:
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/136.0.0.0 Mobile/15E148 Safari/604.1',
		created: '2026-02-28T09:00:00.000Z'
	},
	{
		utm_country: '??',
		utm_userAgent:
			'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/134.0.0.0 Mobile Safari/537.36',
		created: '2026-02-28T09:15:00.000Z'
	},
	{
		utm_country: null,
		utm_userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/137.0.0.0',
		created: '2026-02-28T09:30:00.000Z'
	}
];

export const load = async ({ params, locals, url }) => {
	const { slug } = params;
	const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
	const mockMode = url.searchParams.get('mock') === '1' && (dev || isLocalHost);

	if (mockMode) {
		return {
			utmView: MOCK_ANALYTICS.length,
			from: `https://example.com/${slug}`,
			analytics: MOCK_ANALYTICS
		};
	}

	try {
		const urlData = await locals.pb.collection('viewList').getList(1, 1, {
			filter: `id_url='${slug}'`
		});
		const urlRecord = urlData?.items?.[0];

		if (!urlRecord?.id) {
			throw error(404, LINK_NOT_FOUND_MESSAGE);
		}

		const analyticsData = await locals.pb.collection('analytics').getList(1, 30, {
			filter: `author='${urlRecord.id}'`,
			sort: '-created'
		});

		return {
			utmView: urlRecord.utm_view,
			from: urlRecord.from,
			analytics: analyticsData?.items || []
		};
	} catch (err) {
		if (err?.status === 404) throw err;
		console.error('Error loading data:', err);
		throw error(500, 'Failed to load data');
	}
};
