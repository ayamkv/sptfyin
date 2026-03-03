import { UAParser } from 'ua-parser-js';

const DEFAULT_RANGE_DAYS = 30;
const SUPPORTED_RANGE_DAYS = new Set([0, 7, 30, 90]);
const MAX_PER_PAGE = 500;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** @type {Map<number, { data: object, timestamp: number }>} */
const metricsCache = new Map();

/** Clear the metrics cache. Exported for testing. */
export function clearMetricsCache() {
	metricsCache.clear();
}

function toIsoDay(date) {
	return date.toISOString().slice(0, 10);
}

function normalizeCountry(countryCode) {
	const value = String(countryCode || '')
		.trim()
		.toUpperCase();

	if (!/^[A-Z]{2}$/.test(value)) return 'UN';
	return value;
}

function normalizeBrowser(userAgent) {
	if (!userAgent) return 'Unknown';

	const parser = new UAParser(userAgent);
	const browserName = parser.getBrowser().name;
	return browserName || 'Unknown';
}

function toDate(value) {
	if (!value) return null;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed;
}

function buildDateRangeDays(days) {
	const now = new Date();
	const since = new Date(now);
	since.setUTCDate(since.getUTCDate() - (days - 1));
	since.setUTCHours(0, 0, 0, 0);

	const dayKeys = [];
	for (let i = 0; i < days; i++) {
		const date = new Date(since);
		date.setUTCDate(since.getUTCDate() + i);
		dayKeys.push(toIsoDay(date));
	}

	return { now, since, dayKeys };
}

/**
 * Get the ISO week key for a date: "2026-W09"
 */
function toIsoWeek(date) {
	const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
	return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get the ISO month key for a date: "2026-03"
 */
function toIsoMonth(date) {
	return date.toISOString().slice(0, 7);
}

/**
 * Determine aggregation mode based on total day span.
 * Returns 'day' | 'week' | 'month'
 */
function getAggregationMode(totalDays) {
	if (totalDays > 365) return 'month';
	if (totalDays > 90) return 'week';
	return 'day';
}

/**
 * Build bucket keys for a date range with the given aggregation mode.
 */
function buildBucketKeys(since, until, mode) {
	const keys = [];
	const seen = new Set();
	const current = new Date(since);

	while (current <= until) {
		let key;
		if (mode === 'month') key = toIsoMonth(current);
		else if (mode === 'week') key = toIsoWeek(current);
		else key = toIsoDay(current);

		if (!seen.has(key)) {
			seen.add(key);
			keys.push(key);
		}
		current.setUTCDate(current.getUTCDate() + 1);
	}

	return keys;
}

/**
 * Get the bucket key for a date based on aggregation mode.
 */
function toBucketKey(date, mode) {
	if (mode === 'month') return toIsoMonth(date);
	if (mode === 'week') return toIsoWeek(date);
	return toIsoDay(date);
}

function toSortedCountEntries(counterMap, limit = 10) {
	return [...counterMap.entries()]
		.map(([key, count]) => ({ key, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
}

/**
 * Paginate through filtered records from PocketBase.
 * Uses MAX_PER_PAGE (500) to minimize round-trips.
 */
async function fetchAllRecords(pb, collectionName, options = {}) {
	const records = [];
	let page = 1;
	let totalPages = 1;

	while (page <= totalPages) {
		const response = await pb.collection(collectionName).getList(page, MAX_PER_PAGE, options);
		records.push(...(response.items || []));
		totalPages = response.totalPages || 1;
		page += 1;
	}

	return records;
}

function toNumber(value) {
	const number = Number(value || 0);
	return Number.isFinite(number) ? number : 0;
}

function round(number, precision = 2) {
	const factor = 10 ** precision;
	return Math.round(number * factor) / factor;
}

export function parseDaysParam(value) {
	const number = Number(value);
	if (!SUPPORTED_RANGE_DAYS.has(number)) return DEFAULT_RANGE_DAYS;
	return number;
}

export async function buildAdminMetrics({ pb, days = DEFAULT_RANGE_DAYS }) {
	const rangeDays = parseDaysParam(days);

	// Check cache
	const cached = metricsCache.get(rangeDays);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.data;
	}

	const isAllTime = rangeDays === 0;

	// Build filter — for all-time, no date filter
	let sinceFilter = null;
	let dateRange = null;

	if (!isAllTime) {
		dateRange = buildDateRangeDays(rangeDays);
		sinceFilter = pb.filter('created >= {:since}', { since: dateRange.since.toISOString() });
	}

	const fetchOptions = (extra = {}) => ({
		requestKey: null,
		...(sinceFilter ? { filter: sinceFilter } : {}),
		...extra
	});

	// Fetch data with targeted queries instead of full-table scan.
	// 1. totalLinks count — single request, just read totalItems
	// 2. linksInRange — only records created within the range (or all for all-time)
	// 3. topLinks — top 10 sorted by utm_view, single request
	// 4. analyticsInRange — filtered by range (or all for all-time), page size 500
	const [totalLinksResult, linksInRange, topLinksResult, analyticsInRange] = await Promise.all([
		pb.collection('viewList').getList(1, 1, { fields: 'id', requestKey: null }),
		fetchAllRecords(
			pb,
			'viewList',
			fetchOptions({
				fields: 'id,id_url,subdomain,created,user,utm_view',
				sort: '-created'
			})
		),
		pb.collection('viewList').getList(1, 10, {
			fields: 'id,id_url,subdomain,utm_view,created',
			sort: '-utm_view',
			requestKey: null
		}),
		fetchAllRecords(
			pb,
			'analytics',
			fetchOptions({
				fields: 'id,created,utm_country,utm_userAgent,author,url_id',
				sort: '-created'
			})
		)
	]);

	const totalLinks = totalLinksResult.totalItems || 0;

	// Determine bucket keys and aggregation mode
	let bucketKeys;
	let aggregation = 'day';

	if (isAllTime) {
		// Find earliest date from both datasets
		let earliest = new Date();
		for (const record of [...linksInRange, ...analyticsInRange]) {
			const d = toDate(record.created);
			if (d && d < earliest) earliest = d;
		}
		earliest.setUTCHours(0, 0, 0, 0);
		const now = new Date();
		const totalSpanDays = Math.ceil((now - earliest) / 86400000) + 1;
		aggregation = getAggregationMode(totalSpanDays);
		bucketKeys = buildBucketKeys(earliest, now, aggregation);
	} else {
		bucketKeys = dateRange.dayKeys;
	}

	const linksByBucketCounter = new Map(bucketKeys.map((key) => [key, 0]));
	const clicksByBucketCounter = new Map(bucketKeys.map((key) => [key, 0]));
	const countryCounter = new Map();
	const browserCounter = new Map();
	const subdomainCounter = new Map();
	const creatorsCounter = new Map();

	for (const link of linksInRange) {
		const created = toDate(link.created);
		if (created) {
			const key = toBucketKey(created, aggregation);
			linksByBucketCounter.set(key, (linksByBucketCounter.get(key) || 0) + 1);
		}

		const subdomain = String(link.subdomain || 'sptfy.in').trim() || 'sptfy.in';
		subdomainCounter.set(subdomain, (subdomainCounter.get(subdomain) || 0) + 1);

		const creatorKey = String(link.user || 'guest').trim() || 'guest';
		const currentCreator = creatorsCounter.get(creatorKey) || {
			userId: creatorKey,
			linksCreated: 0,
			totalClicks: 0
		};
		currentCreator.linksCreated += 1;
		currentCreator.totalClicks += toNumber(link.utm_view);
		creatorsCounter.set(creatorKey, currentCreator);
	}

	for (const click of analyticsInRange) {
		const created = toDate(click.created);
		if (created) {
			const key = toBucketKey(created, aggregation);
			clicksByBucketCounter.set(key, (clicksByBucketCounter.get(key) || 0) + 1);
		}

		const country = normalizeCountry(click.utm_country);
		countryCounter.set(country, (countryCounter.get(country) || 0) + 1);

		const browser = normalizeBrowser(click.utm_userAgent);
		browserCounter.set(browser, (browserCounter.get(browser) || 0) + 1);
	}

	const linksCreatedInRange = linksInRange.length;
	const clicksInRange = analyticsInRange.length;
	const avgClicksPerLink =
		linksCreatedInRange > 0 ? round(clicksInRange / linksCreatedInRange, 2) : 0;

	const topLinks = (topLinksResult.items || []).map((link) => ({
		id: link.id,
		id_url: link.id_url,
		subdomain: link.subdomain || 'sptfy.in',
		utm_view: toNumber(link.utm_view),
		created: link.created || null
	}));

	const topCreators = [...creatorsCounter.values()]
		.sort((a, b) => {
			if (b.linksCreated !== a.linksCreated) return b.linksCreated - a.linksCreated;
			return b.totalClicks - a.totalClicks;
		})
		.slice(0, 10);

	const result = {
		rangeDays,
		aggregation,
		generatedAt: new Date().toISOString(),
		summary: {
			totalLinks,
			linksCreatedInRange,
			clicksInRange,
			avgClicksPerLink
		},
		series: {
			linksByDay: bucketKeys.map((key) => ({
				date: key,
				count: linksByBucketCounter.get(key) || 0
			})),
			clicksByDay: bucketKeys.map((key) => ({
				date: key,
				count: clicksByBucketCounter.get(key) || 0
			}))
		},
		breakdowns: {
			countries: toSortedCountEntries(countryCounter, 10),
			browsers: toSortedCountEntries(browserCounter, 10),
			subdomains: toSortedCountEntries(subdomainCounter, 10)
		},
		leaderboards: {
			topLinks,
			topCreators
		}
	};

	// Store in cache
	metricsCache.set(rangeDays, { data: result, timestamp: Date.now() });

	return result;
}
