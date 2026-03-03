const DEFAULT_RANGE_DAYS = 30;
const SUPPORTED_RANGE_DAYS = new Set([0, 7, 30, 90]);
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** @type {Map<number, { data: object, timestamp: number }>} */
const metricsCache = new Map();

/** Clear the metrics cache. Exported for testing. */
export function clearMetricsCache() {
	metricsCache.clear();
}

export function parseDaysParam(value) {
	const number = Number(value);
	if (!SUPPORTED_RANGE_DAYS.has(number)) return DEFAULT_RANGE_DAYS;
	return number;
}

/**
 * Fetch admin metrics from the PocketBase custom endpoint.
 * This replaces the old pagination + JS aggregation approach with a single
 * HTTP call to `/api/admin/stats` which runs SQL aggregation server-side.
 *
 * @param {{ pb: import('pocketbase').default, days?: number }} options
 * @returns {Promise<object>}
 */
export async function buildAdminMetrics({ pb, days = DEFAULT_RANGE_DAYS }) {
	const rangeDays = parseDaysParam(days);

	// Check cache
	const cached = metricsCache.get(rangeDays);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.data;
	}

	const baseUrl = pb.baseUrl.replace(/\/+$/, '');
	const url = `${baseUrl}/api/admin/stats?days=${rangeDays}`;

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`PB admin stats endpoint returned ${response.status}: ${text.slice(0, 200)}`);
	}

	const data = await response.json();

	// Store in cache
	metricsCache.set(rangeDays, { data, timestamp: Date.now() });

	return data;
}
