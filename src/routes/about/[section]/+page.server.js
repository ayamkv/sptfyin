import { error } from '@sveltejs/kit';
import { ABOUT_SECTION_IDS } from '$lib/about/sections';

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
	if (!ABOUT_SECTION_IDS.includes(params.section)) {
		error(404, 'Not found');
	}

	return {
		section: params.section
	};
}
