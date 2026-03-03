/// <reference path="../pb_data/types.d.ts" />

// Admin stats endpoint — returns pre-computed analytics via SQL aggregation.
// Auth is enforced at the SvelteKit layer, not here.

routerAdd('GET', '/api/admin/stats', (e) => {
	const daysParam = e.request.url.query().get('days') || '30';
	const days = parseInt(daysParam, 10);
	const validDays = [0, 7, 30, 90];
	const rangeDays = validDays.includes(days) ? days : 30;
	const isAllTime = rangeDays === 0;

	// Build date filter for SQL
	let sinceISO = null;
	if (!isAllTime) {
		const since = new Date();
		since.setUTCDate(since.getUTCDate() - (rangeDays - 1));
		since.setUTCHours(0, 0, 0, 0);
		sinceISO = since.toISOString().replace('T', ' ').replace('Z', '');
	}

	// ------------------------------------------------------------------
	// 1. Total links count (all-time, regardless of range)
	// ------------------------------------------------------------------
	const totalLinksResult = arrayOf(new DynamicModel({ count: 0 }));
	$app.db().newQuery('SELECT COUNT(*) AS count FROM random_short').all(totalLinksResult);
	const totalLinks = totalLinksResult.length > 0 ? totalLinksResult[0].count : 0;

	// ------------------------------------------------------------------
	// 2. Links created in range
	// ------------------------------------------------------------------
	const linksInRangeResult = arrayOf(new DynamicModel({ count: 0 }));
	if (isAllTime) {
		$app.db().newQuery('SELECT COUNT(*) AS count FROM random_short').all(linksInRangeResult);
	} else {
		$app
			.db()
			.newQuery('SELECT COUNT(*) AS count FROM random_short WHERE created >= {:since}')
			.bind({ since: sinceISO })
			.all(linksInRangeResult);
	}
	const linksCreatedInRange = linksInRangeResult.length > 0 ? linksInRangeResult[0].count : 0;

	// ------------------------------------------------------------------
	// 3. Clicks in range
	// ------------------------------------------------------------------
	const clicksInRangeResult = arrayOf(new DynamicModel({ count: 0 }));
	if (isAllTime) {
		$app.db().newQuery('SELECT COUNT(*) AS count FROM analytics').all(clicksInRangeResult);
	} else {
		$app
			.db()
			.newQuery('SELECT COUNT(*) AS count FROM analytics WHERE created >= {:since}')
			.bind({ since: sinceISO })
			.all(clicksInRangeResult);
	}
	const clicksInRange = clicksInRangeResult.length > 0 ? clicksInRangeResult[0].count : 0;

	// ------------------------------------------------------------------
	// 4. Determine aggregation mode for time series
	// ------------------------------------------------------------------
	let aggregation = 'day';
	let groupByExpr = 'date(created)';
	let bucketFormat = null;

	if (isAllTime) {
		// Find the earliest record date to determine span
		const earliestResult = arrayOf(new DynamicModel({ earliest: '' }));
		$app
			.db()
			.newQuery(
				'SELECT MIN(created) AS earliest FROM (' +
					'SELECT MIN(created) AS created FROM random_short ' +
					'UNION ALL ' +
					'SELECT MIN(created) AS created FROM analytics' +
					')'
			)
			.all(earliestResult);

		let totalSpanDays = 30; // fallback
		if (earliestResult.length > 0 && earliestResult[0].earliest) {
			const earliest = new Date(earliestResult[0].earliest);
			const now = new Date();
			totalSpanDays = Math.ceil((now - earliest) / 86400000) + 1;
		}

		if (totalSpanDays > 365) {
			aggregation = 'month';
			groupByExpr = "strftime('%Y-%m', created)";
		} else if (totalSpanDays > 90) {
			aggregation = 'week';
			groupByExpr = "strftime('%Y-W%W', created)";
		}
	}

	// ------------------------------------------------------------------
	// 5. Links per bucket (time series)
	// ------------------------------------------------------------------
	const linksByBucket = arrayOf(new DynamicModel({ bucket: '', count: 0 }));
	if (isAllTime) {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					groupByExpr +
					' AS bucket, COUNT(*) AS count ' +
					'FROM random_short ' +
					'GROUP BY bucket ORDER BY bucket'
			)
			.all(linksByBucket);
	} else {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					groupByExpr +
					' AS bucket, COUNT(*) AS count ' +
					'FROM random_short WHERE created >= {:since} ' +
					'GROUP BY bucket ORDER BY bucket'
			)
			.bind({ since: sinceISO })
			.all(linksByBucket);
	}

	// ------------------------------------------------------------------
	// 6. Clicks per bucket (time series)
	// ------------------------------------------------------------------
	const clicksByBucket = arrayOf(new DynamicModel({ bucket: '', count: 0 }));
	if (isAllTime) {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					groupByExpr +
					' AS bucket, COUNT(*) AS count ' +
					'FROM analytics ' +
					'GROUP BY bucket ORDER BY bucket'
			)
			.all(clicksByBucket);
	} else {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					groupByExpr +
					' AS bucket, COUNT(*) AS count ' +
					'FROM analytics WHERE created >= {:since} ' +
					'GROUP BY bucket ORDER BY bucket'
			)
			.bind({ since: sinceISO })
			.all(clicksByBucket);
	}

	// ------------------------------------------------------------------
	// 7. Country breakdown (top 10)
	// ------------------------------------------------------------------
	const countryBreakdown = arrayOf(new DynamicModel({ key: '', count: 0 }));
	if (isAllTime) {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(UPPER(TRIM(utm_country)), 'UN') AS key, COUNT(*) AS count " +
					'FROM analytics GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.all(countryBreakdown);
	} else {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(UPPER(TRIM(utm_country)), 'UN') AS key, COUNT(*) AS count " +
					'FROM analytics WHERE created >= {:since} ' +
					'GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.bind({ since: sinceISO })
			.all(countryBreakdown);
	}

	// ------------------------------------------------------------------
	// 8. Browser breakdown (top 10)
	// ------------------------------------------------------------------
	const browserBreakdown = arrayOf(new DynamicModel({ key: '', count: 0 }));
	const browserCaseExpr =
		'CASE ' +
		"WHEN utm_userAgent LIKE '%Instagram%' THEN 'Instagram' " +
		"WHEN utm_userAgent LIKE '%FBAN%' OR utm_userAgent LIKE '%FBAV%' THEN 'Facebook' " +
		"WHEN utm_userAgent LIKE '%Edg%' THEN 'Edge' " +
		"WHEN utm_userAgent LIKE '%Chrome%' AND utm_userAgent NOT LIKE '%Edg%' THEN 'Chrome' " +
		"WHEN utm_userAgent LIKE '%Safari%' AND utm_userAgent NOT LIKE '%Chrome%' AND utm_userAgent NOT LIKE '%Edg%' THEN 'Safari' " +
		"WHEN utm_userAgent LIKE '%Firefox%' THEN 'Firefox' " +
		"WHEN utm_userAgent IS NULL OR utm_userAgent = '' THEN 'Unknown' " +
		"ELSE 'Other' " +
		'END';

	if (isAllTime) {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					browserCaseExpr +
					' AS key, COUNT(*) AS count ' +
					'FROM analytics GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.all(browserBreakdown);
	} else {
		$app
			.db()
			.newQuery(
				'SELECT ' +
					browserCaseExpr +
					' AS key, COUNT(*) AS count ' +
					'FROM analytics WHERE created >= {:since} ' +
					'GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.bind({ since: sinceISO })
			.all(browserBreakdown);
	}

	// ------------------------------------------------------------------
	// 9. Subdomain breakdown (top 10)
	// ------------------------------------------------------------------
	const subdomainBreakdown = arrayOf(new DynamicModel({ key: '', count: 0 }));
	if (isAllTime) {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(NULLIF(TRIM(subdomain), ''), 'sptfy.in') AS key, COUNT(*) AS count " +
					'FROM random_short GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.all(subdomainBreakdown);
	} else {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(NULLIF(TRIM(subdomain), ''), 'sptfy.in') AS key, COUNT(*) AS count " +
					'FROM random_short WHERE created >= {:since} ' +
					'GROUP BY key ORDER BY count DESC LIMIT 10'
			)
			.bind({ since: sinceISO })
			.all(subdomainBreakdown);
	}

	// ------------------------------------------------------------------
	// 10. Top links (by utm_view, all-time regardless of range)
	// ------------------------------------------------------------------
	const topLinks = arrayOf(
		new DynamicModel({ id: '', id_url: '', subdomain: '', utm_view: 0, created: '' })
	);
	$app
		.db()
		.newQuery(
			"SELECT id, id_url, COALESCE(NULLIF(TRIM(subdomain), ''), 'sptfy.in') AS subdomain, " +
				'COALESCE(utm_view, 0) AS utm_view, created ' +
				'FROM random_short ORDER BY utm_view DESC LIMIT 10'
		)
		.all(topLinks);

	// ------------------------------------------------------------------
	// 11. Top creators (top 10 by links created in range)
	// ------------------------------------------------------------------
	const topCreators = arrayOf(new DynamicModel({ userId: '', linksCreated: 0, totalClicks: 0 }));
	if (isAllTime) {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(NULLIF(TRIM(\"user\"), ''), 'guest') AS userId, " +
					'COUNT(*) AS linksCreated, COALESCE(SUM(utm_view), 0) AS totalClicks ' +
					'FROM random_short GROUP BY userId ORDER BY linksCreated DESC, totalClicks DESC LIMIT 10'
			)
			.all(topCreators);
	} else {
		$app
			.db()
			.newQuery(
				"SELECT COALESCE(NULLIF(TRIM(\"user\"), ''), 'guest') AS userId, " +
					'COUNT(*) AS linksCreated, COALESCE(SUM(utm_view), 0) AS totalClicks ' +
					'FROM random_short WHERE created >= {:since} ' +
					'GROUP BY userId ORDER BY linksCreated DESC, totalClicks DESC LIMIT 10'
			)
			.bind({ since: sinceISO })
			.all(topCreators);
	}

	// ------------------------------------------------------------------
	// Build fill maps for time series (fill gaps with 0s)
	// ------------------------------------------------------------------
	function buildFilledSeries(bucketData, rangeDays, aggregation, sinceISO) {
		const dataMap = {};
		for (let i = 0; i < bucketData.length; i++) {
			dataMap[bucketData[i].bucket] = bucketData[i].count;
		}

		// For ranged queries, generate all day keys to fill gaps
		if (rangeDays > 0) {
			const since = new Date(sinceISO + 'Z');
			const result = [];
			for (let i = 0; i < rangeDays; i++) {
				const d = new Date(since);
				d.setUTCDate(since.getUTCDate() + i);
				const key = d.toISOString().slice(0, 10);
				result.push({ date: key, count: dataMap[key] || 0 });
			}
			return result;
		}

		// For all-time, just return what we have (no gap-filling needed
		// since buckets are weeks/months)
		const result = [];
		for (let i = 0; i < bucketData.length; i++) {
			result.push({ date: bucketData[i].bucket, count: bucketData[i].count });
		}
		return result;
	}

	// ------------------------------------------------------------------
	// Format breakdowns into [{key, count}]
	// ------------------------------------------------------------------
	function formatBreakdown(data) {
		const result = [];
		for (let i = 0; i < data.length; i++) {
			result.push({ key: data[i].key, count: data[i].count });
		}
		return result;
	}

	function formatTopLinks(data) {
		const result = [];
		for (let i = 0; i < data.length; i++) {
			result.push({
				id: data[i].id,
				id_url: data[i].id_url,
				subdomain: data[i].subdomain,
				utm_view: data[i].utm_view,
				created: data[i].created
			});
		}
		return result;
	}

	function formatTopCreators(data) {
		const result = [];
		for (let i = 0; i < data.length; i++) {
			result.push({
				userId: data[i].userId,
				linksCreated: data[i].linksCreated,
				totalClicks: data[i].totalClicks
			});
		}
		return result;
	}

	// ------------------------------------------------------------------
	// Compute derived metrics
	// ------------------------------------------------------------------
	const avgClicksPerLink =
		linksCreatedInRange > 0 ? Math.round((clicksInRange / linksCreatedInRange) * 100) / 100 : 0;

	// ------------------------------------------------------------------
	// Assemble response
	// ------------------------------------------------------------------
	const response = {
		rangeDays: rangeDays,
		aggregation: aggregation,
		generatedAt: new Date().toISOString(),
		summary: {
			totalLinks: totalLinks,
			linksCreatedInRange: linksCreatedInRange,
			clicksInRange: clicksInRange,
			avgClicksPerLink: avgClicksPerLink
		},
		series: {
			linksByDay: buildFilledSeries(linksByBucket, rangeDays, aggregation, sinceISO),
			clicksByDay: buildFilledSeries(clicksByBucket, rangeDays, aggregation, sinceISO)
		},
		breakdowns: {
			countries: formatBreakdown(countryBreakdown),
			browsers: formatBreakdown(browserBreakdown),
			subdomains: formatBreakdown(subdomainBreakdown)
		},
		leaderboards: {
			topLinks: formatTopLinks(topLinks),
			topCreators: formatTopCreators(topCreators)
		}
	};

	return e.json(200, response);
});
