import { error } from '@sveltejs/kit';

const LINK_NOT_FOUND_MESSAGE =
	'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠';

export const load = async ({ params, locals }) => {
	const { slug } = params;

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
