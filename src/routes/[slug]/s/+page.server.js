import { error } from '@sveltejs/kit';
import { getFilteredRecords } from '$lib/pocketbase';

export const load = async ({ params }) => {
    const { slug } = params;

    try {
        const urlData = await getFilteredRecords('random_short', `(id_url='${slug}')`);
        const urlRecord = urlData[0];

        if (!urlRecord?.id) {
            throw error(404, 'Link does not exist, but may be available in the future. <br>yeehaw 🔍🤠');
        }

        const analytics = await getFilteredRecords('analytics', `(author='${urlRecord.id}')`, '-created');

        return {
            utmView: urlRecord.utm_view,
            from: urlRecord.from,
            analytics
        };
    } catch (err) {
        if (err.status === 404) throw err;
        console.error('Error loading data:', err);
        throw error(500, 'Failed to load data');
    }
};