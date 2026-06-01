import { env } from '$env/dynamic/private';

const PREVIEW_TARGET_URL = 'sptfy.in';
const PREVIEW_BASE_URL = 'https://api.screenshotmachine.com/';

export const GET = async () => {
	const screenshotApiKey = env.SCREENSHOTMACHINE_API_KEY;

	if (!screenshotApiKey) {
		return new Response(
			JSON.stringify({
				error: 'Preview screenshot is unavailable. Missing SCREENSHOTMACHINE_API_KEY.'
			}),
			{
				status: 503,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}

	const previewUrl = new URL(PREVIEW_BASE_URL);
	previewUrl.search = new URLSearchParams({
		key: screenshotApiKey,
		url: PREVIEW_TARGET_URL,
		device: 'phone',
		dimension: '480x800',
		format: 'jpg',
		cacheLimit: '14'
	}).toString();

	try {
		const res = await fetch(previewUrl.toString());
		if (!res.ok) {
			throw new Error(`Preview provider request failed (${res.status})`);
		}

		const blob = await res.blob();
		return new Response(blob, {
			headers: {
				'Content-Type': 'image/jpeg'
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
