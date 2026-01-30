import { json, error } from '@sveltejs/kit';

/**
 * Expands shortened Spotify URLs (spotify.link, spotify.app.link)
 * by following redirects to get the final open.spotify.com URL.
 *
 * This is needed because mobile Spotify share links use shortened URLs
 * that redirect through multiple hops before reaching the final destination.
 */

// Allowed source domains that we'll expand
const EXPANDABLE_DOMAINS = ['spotify.link', 'spotify.app.link'];

// Allowed destination domains (whitelist for security)
const ALLOWED_DESTINATIONS = ['open.spotify.com', 'spotify.com'];

// Maximum redirects to follow (prevent infinite loops)
const MAX_REDIRECTS = 10;

// Request timeout in milliseconds
const TIMEOUT_MS = 10000;

export async function POST({ request }) {
	const body = await request.json();
	const { url } = body;

	if (!url) {
		throw error(400, 'url is required');
	}

	// Validate the URL is from an expandable domain
	let parsedUrl;
	try {
		parsedUrl = new URL(url);
	} catch {
		throw error(400, 'Invalid URL format');
	}

	const isExpandable = EXPANDABLE_DOMAINS.some(
		(domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
	);

	if (!isExpandable) {
		// If it's already a spotify.com URL, just return it
		const isAlreadySpotify = ALLOWED_DESTINATIONS.some(
			(domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
		);

		if (isAlreadySpotify) {
			return json({
				expanded: url,
				original: url,
				wasExpanded: false
			});
		}

		throw error(400, 'URL is not from a supported Spotify domain');
	}

	try {
		const expandedUrl = await followRedirects(url);

		// Validate the final URL is a legitimate Spotify URL
		const finalParsed = new URL(expandedUrl);
		const isValidDestination = ALLOWED_DESTINATIONS.some(
			(domain) => finalParsed.hostname === domain || finalParsed.hostname.endsWith('.' + domain)
		);

		if (!isValidDestination) {
			console.error('[expand-url] Unexpected destination:', expandedUrl);
			throw error(400, 'Redirect did not lead to a valid Spotify URL');
		}

		return json({
			expanded: expandedUrl,
			original: url,
			wasExpanded: true
		});
	} catch (e) {
		console.error('[expand-url] Failed to expand URL:', e);

		if (e.status) {
			throw e; // Re-throw SvelteKit errors
		}

		throw error(500, `Failed to expand URL: ${e.message}`);
	}
}

/**
 * Follow redirects manually to get the final URL
 * We can't use fetch's automatic redirect following because we need the final URL
 */
async function followRedirects(url, redirectCount = 0) {
	if (redirectCount >= MAX_REDIRECTS) {
		throw new Error('Too many redirects');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			method: 'HEAD', // Use HEAD to avoid downloading body
			redirect: 'manual', // Don't auto-follow redirects
			signal: controller.signal,
			headers: {
				// Mimic a browser to avoid being blocked
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		});

		clearTimeout(timeout);

		// Check if this is a redirect
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');

			if (!location) {
				throw new Error('Redirect without Location header');
			}

			// Handle relative redirects
			const nextUrl = new URL(location, url).href;

			console.log(`[expand-url] Redirect ${redirectCount + 1}: ${url} -> ${nextUrl}`);

			return followRedirects(nextUrl, redirectCount + 1);
		}

		// Check if we got a successful response
		if (response.status >= 200 && response.status < 300) {
			// Some servers return 200 with the final URL
			return url;
		}

		// If HEAD fails, try GET (some servers don't support HEAD)
		if (response.status === 405 || response.status === 404) {
			return followRedirectsWithGet(url, redirectCount);
		}

		throw new Error(`Unexpected status: ${response.status}`);
	} catch (e) {
		clearTimeout(timeout);

		if (e.name === 'AbortError') {
			throw new Error('Request timed out');
		}

		throw e;
	}
}

/**
 * Fallback: Follow redirects using GET request
 */
async function followRedirectsWithGet(url, redirectCount = 0) {
	if (redirectCount >= MAX_REDIRECTS) {
		throw new Error('Too many redirects');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: controller.signal,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		});

		clearTimeout(timeout);

		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');

			if (!location) {
				throw new Error('Redirect without Location header');
			}

			const nextUrl = new URL(location, url).href;
			console.log(`[expand-url] GET Redirect ${redirectCount + 1}: ${url} -> ${nextUrl}`);

			return followRedirectsWithGet(nextUrl, redirectCount + 1);
		}

		if (response.status >= 200 && response.status < 300) {
			return url;
		}

		throw new Error(`Unexpected status: ${response.status}`);
	} catch (e) {
		clearTimeout(timeout);

		if (e.name === 'AbortError') {
			throw new Error('Request timed out');
		}

		throw e;
	}
}
