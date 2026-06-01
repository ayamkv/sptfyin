import { error, json } from '@sveltejs/kit';

const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

export async function GET({ fetch, setHeaders }) {
	const [countRes, clicksRes, topRes] = await Promise.all([
		fetch(`${pocketBaseURL}/api/collections/viewList/records?perPage=1&page=1&fields=id`),
		fetch(`${pocketBaseURL}/api/collections/analytics/records?perPage=1&page=1&fields=id`),
		fetch(
			`${pocketBaseURL}/api/collections/viewList/records?sort=-utm_view&fields=id_url,from,created,subdomain,utm_view&perPage=2&page=1&filter=(utm_view>0)`
		)
	]);

	if (!countRes.ok || !clicksRes.ok || !topRes.ok) {
		error(502, 'Failed to fetch data from PocketBase');
	}

	const [countData, clicksData, topData] = await Promise.all([
		countRes.json(),
		clicksRes.json(),
		topRes.json()
	]);

	setHeaders({
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
	});

	return json({
		totalLinkCreated: countData.totalItems || 0,
		totalClicks: clicksData.totalItems || 0,
		top: (topData.items || []).slice(0, 2)
	});
}
