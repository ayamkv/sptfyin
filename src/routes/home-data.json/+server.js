import { json } from '@sveltejs/kit';

const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

export async function GET({ fetch, setHeaders }) {
	const [recentRes, clicksRes, topRes] = await Promise.all([
		fetch(
			`${pocketBaseURL}/api/collections/viewList/records?sort=-created&fields=id_url,from,created,subdomain&perPage=2&page=1`
		),
		fetch(`${pocketBaseURL}/api/collections/analytics/records?perPage=1&page=1&fields=id`),
		fetch(
			`${pocketBaseURL}/api/collections/viewList/records?sort=-utm_view&fields=id_url,from,created,subdomain,utm_view&perPage=2&page=1&filter=(utm_view>0)`
		)
	]);

	const [recentData, clicksData, topData] = await Promise.all([
		recentRes.json(),
		clicksRes.json(),
		topRes.json()
	]);

	setHeaders({
		'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
	});

	return json({
		totalLinkCreated: recentData.totalItems || 0,
		totalClicks: clicksData.totalItems || 0,
		recent: (recentData.items || []).slice(0, 2),
		top: (topData.items || []).slice(0, 2)
	});
}
