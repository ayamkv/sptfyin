import { json, error } from '@sveltejs/kit';

/**
 * Expands shortened Spotify URLs (spotify.link, spotify.app.link)
 * using Microlink API to follow redirects and get the final open.spotify.com URL.
 *
 * Two-step process:
 * 1. Call Microlink with spotify.link URL -> get spotify.app.link from redirects
 * 2. Call Microlink with spotify.app.link URL -> get final open.spotify.com URL
 */

// Allowed source domains that we'll expand
const EXPANDABLE_DOMAINS = ['spotify.link', 'spotify.app.link'];

// Allowed destination domains (whitelist for security)
const ALLOWED_DESTINATIONS = ['open.spotify.com', 'spotify.com'];

// Request timeout in milliseconds
const TIMEOUT_MS = 10000;

// Microlink API base URL
const MICROLINK_API = 'https://api.microlink.io';

/**
 * Check if a hostname matches any domain in the list
 */
function matchesDomain(hostname, domains) {
	return domains.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
}

/**
 * Check if URL is a Spotify short link that needs expansion
 */
function isShortLink(url) {
	try {
		const parsed = new URL(url);
		return matchesDomain(parsed.hostname, EXPANDABLE_DOMAINS);
	} catch {
		return false;
	}
}

/**
 * Check if URL is a valid Spotify destination URL
 */
function isSpotifyDestination(url) {
	try {
		const parsed = new URL(url);
		return matchesDomain(parsed.hostname, ALLOWED_DESTINATIONS);
	} catch {
		return false;
	}
}

/**
 * Call Microlink API with timeout
 */
async function callMicrolink(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const microlinkUrl = `${MICROLINK_API}/?url=${encodeURIComponent(url)}`;
		console.log('[expand-url] Calling Microlink:', microlinkUrl);

		const response = await fetch(microlinkUrl, {
			signal: controller.signal
		});

		clearTimeout(timeout);

		if (!response.ok) {
			throw new Error(`Microlink API error: ${response.status}`);
		}

		const data = await response.json();

		if (data.status !== 'success') {
			throw new Error(`Microlink returned status: ${data.status}`);
		}

		return data;
	} catch (e) {
		clearTimeout(timeout);

		if (e.name === 'AbortError') {
			throw new Error('Microlink request timed out');
		}

		throw e;
	}
}

/**
 * Extract the best URL from Microlink response
 * Priority: last redirect URL > data.url > original URL
 */
function extractUrlFromResponse(microlinkResponse, originalUrl) {
	// Check redirects array for the last redirect
	if (microlinkResponse.redirects && microlinkResponse.redirects.length > 0) {
		const lastRedirect = microlinkResponse.redirects[microlinkResponse.redirects.length - 1];
		if (lastRedirect.url) {
			console.log('[expand-url] Found last redirect:', lastRedirect.url);
			return lastRedirect.url;
		}
	}

	// Fall back to data.url
	if (microlinkResponse.data?.url) {
		console.log('[expand-url] Using data.url:', microlinkResponse.data.url);
		return microlinkResponse.data.url;
	}

	// Return original as last resort
	return originalUrl;
}

export async function POST({ request }) {
	const body = await request.json();
	const { url } = body;

	if (!url) {
		throw error(400, 'url is required');
	}

	// Validate URL format
	let parsedUrl;
	try {
		parsedUrl = new URL(url);
	} catch {
		throw error(400, 'Invalid URL format');
	}

	// If it's already a spotify.com URL, just return it
	if (isSpotifyDestination(url)) {
		return json({
			expanded: url,
			original: url,
			wasExpanded: false
		});
	}

	// Check if it's an expandable short link
	if (!isShortLink(url)) {
		throw error(400, 'URL is not from a supported Spotify domain');
	}

	try {
		console.log('[expand-url] Starting expansion for:', url);

		// Step 1: First Microlink call to get redirect chain
		const firstResponse = await callMicrolink(url);
		let currentUrl = extractUrlFromResponse(firstResponse, url);

		// Check if we already got a Spotify destination URL
		if (isSpotifyDestination(currentUrl)) {
			console.log('[expand-url] Got destination URL on first call:', currentUrl);
			return json({
				expanded: currentUrl,
				original: url,
				wasExpanded: true
			});
		}

		// Step 2: If still a short link, call Microlink again
		if (isShortLink(currentUrl)) {
			console.log('[expand-url] Still a short link, making second call:', currentUrl);

			const secondResponse = await callMicrolink(currentUrl);
			currentUrl = extractUrlFromResponse(secondResponse, currentUrl);

			// Check data.url specifically for the final destination
			if (secondResponse.data?.url && isSpotifyDestination(secondResponse.data.url)) {
				currentUrl = secondResponse.data.url;
			}
		}

		// Validate the final URL
		if (!isSpotifyDestination(currentUrl)) {
			console.error('[expand-url] Failed to resolve to Spotify URL. Final URL:', currentUrl);
			throw error(400, 'Could not resolve to a valid Spotify URL');
		}

		console.log('[expand-url] Successfully expanded to:', currentUrl);

		return json({
			expanded: currentUrl,
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
