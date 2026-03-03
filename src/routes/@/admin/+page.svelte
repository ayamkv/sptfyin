<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { AreaChart } from 'layerchart';
	import { curveCatmullRom } from 'd3-shape';
	import { scaleTime } from 'd3-scale';

	const { data } = $props();

	const DAY_OPTIONS = [7, 30, 90, 0];
	const getInitialDays = () => data.initialDays ?? 30;
	const getInitialMetrics = () => data.initialMetrics ?? null;
	const getInitialLoadError = () => data.loadError ?? '';

	let selectedDays = $state(getInitialDays());
	let metrics = $state(getInitialMetrics());
	let isLoading = $state(false);
	let errorMessage = $state(getInitialLoadError());

	let summary = $derived(
		metrics?.summary ?? {
			totalLinks: 0,
			linksCreatedInRange: 0,
			clicksInRange: 0,
			avgClicksPerLink: 0
		}
	);
	let aggregation = $derived(metrics?.aggregation ?? 'day');

	let linksByDay = $derived(metrics?.series?.linksByDay ?? []);
	let clicksByDay = $derived(metrics?.series?.clicksByDay ?? []);
	let linksChartData = $derived(
		linksByDay.map((item) => ({ date: parseBucketDate(item.date), count: item.count }))
	);
	let clicksChartData = $derived(
		clicksByDay.map((item) => ({ date: parseBucketDate(item.date), count: item.count }))
	);
	let countryBreakdown = $derived(metrics?.breakdowns?.countries ?? []);
	let browserBreakdown = $derived(metrics?.breakdowns?.browsers ?? []);
	let subdomainBreakdown = $derived(metrics?.breakdowns?.subdomains ?? []);
	let topLinks = $derived(metrics?.leaderboards?.topLinks ?? []);
	let topCreators = $derived(metrics?.leaderboards?.topCreators ?? []);

	let countryMax = $derived(getMaxCount(countryBreakdown));
	let browserMax = $derived(getMaxCount(browserBreakdown));
	let subdomainMax = $derived(getMaxCount(subdomainBreakdown));

	async function loadMetrics(days) {
		if (isLoading) return;

		selectedDays = days;
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/admin/metrics?days=${days}`);

			if (!response.ok) {
				throw new Error('Failed to load admin metrics');
			}

			metrics = await response.json();
		} catch (error) {
			console.error('[Admin Dashboard] Failed to refresh metrics', error);
			errorMessage =
				error instanceof Error ? error.message : 'Something went wrong while loading metrics.';
		} finally {
			isLoading = false;
		}
	}

	function getMaxCount(items) {
		if (!Array.isArray(items) || items.length === 0) return 0;
		return items.reduce((max, item) => {
			const count = Number(item?.count ?? 0);
			return count > max ? count : max;
		}, 0);
	}

	function getBarWidth(value, max) {
		const safeValue = Number(value ?? 0);
		const safeMax = Number(max ?? 0);
		if (safeMax <= 0 || safeValue <= 0) return 0;
		return Math.max(4, Math.round((safeValue / safeMax) * 100));
	}

	function formatNumber(value) {
		const safe = Number(value ?? 0);
		return new Intl.NumberFormat().format(Number.isFinite(safe) ? safe : 0);
	}

	function formatPercentage(value, total) {
		const safeValue = Number(value ?? 0);
		const safeTotal = Number(total ?? 0);
		if (safeTotal <= 0 || safeValue <= 0) return '0%';
		return `${((safeValue / safeTotal) * 100).toFixed(1)}%`;
	}

	function formatDayLabel(value) {
		if (!value) return '-';
		// Week key: "2026-W09"
		if (/^\d{4}-W\d{2}$/.test(value)) return value;
		// Month key: "2026-03"
		if (/^\d{4}-\d{2}$/.test(value)) {
			const [year, month] = value.split('-');
			const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
			return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function parseBucketDate(value) {
		if (!value) return new Date();
		// Week key: "2026-W09" → approximate to Monday of that week
		const weekMatch = value.match(/^(\d{4})-W(\d{2})$/);
		if (weekMatch) {
			const year = Number(weekMatch[1]);
			const week = Number(weekMatch[2]);
			const jan4 = new Date(Date.UTC(year, 0, 4));
			const dayOfWeek = jan4.getUTCDay() || 7;
			const monday = new Date(jan4);
			monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
			return monday;
		}
		// Month key: "2026-03" → first day of month
		if (/^\d{4}-\d{2}$/.test(value)) {
			const [year, month] = value.split('-');
			return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
		}
		return new Date(value);
	}

	function countryFlag(code) {
		if (!code || code.length !== 2) return '';
		return String.fromCodePoint(
			...code
				.toUpperCase()
				.split('')
				.map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
		);
	}

	function browserIcon(name) {
		const key = (name || '').toLowerCase();
		const icons = {
			chrome: 'logos:chrome',
			'mobile chrome': 'logos:chrome',
			chromium: 'logos:chrome',
			firefox: 'logos:firefox',
			safari: 'logos:safari',
			'mobile safari': 'logos:safari',
			edge: 'logos:microsoft-edge',
			opera: 'logos:opera',
			'samsung internet': 'simple-icons:samsung',
			instagram: 'mdi:instagram',
			facebook: 'mdi:facebook',
			unknown: 'mdi:web'
		};
		return icons[key] || 'mdi:web';
	}
</script>

<svelte:head>
	<title>admin dashboard - sptfy.in</title>
	<meta name="description" content="Internal admin metrics dashboard" />
</svelte:head>

<div class="container mx-auto flex min-h-[96vh] flex-col gap-6 py-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
			<p class="text-sm text-muted-foreground md:text-base">
				Overview of link activity, click behavior, and creator performance.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#each DAY_OPTIONS as days (days)}
				<Button
					variant={selectedDays === days ? 'default' : 'outline'}
					onclick={() => loadMetrics(days)}
					disabled={isLoading}
				>
					{days === 0 ? 'All time' : `${days} days`}
				</Button>
			{/each}
		</div>
	</div>

	{#if isLoading}
		<p class="text-sm text-muted-foreground">Loading metrics...</p>
	{/if}

	{#if errorMessage}
		<Card.Root class="border-destructive/40">
			<Card.Content class="pt-6">
				<p class="text-sm text-destructive">{errorMessage}</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Total links</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-semibold">{formatNumber(summary.totalLinks)}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground"
					>Links created in range</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-semibold">{formatNumber(summary.linksCreatedInRange)}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Clicks in range</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-semibold">{formatNumber(summary.clicksInRange)}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground"
					>Avg clicks per link</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-semibold">{formatNumber(summary.avgClicksPerLink)}</p>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Links created per {aggregation}</Card.Title>
				<Card.Description>
					{aggregation === 'day' ? 'Daily' : aggregation === 'week' ? 'Weekly' : 'Monthly'} link creations
					in the selected range.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if linksByDay.length === 0}
					<p class="text-sm text-muted-foreground">No link creation data in this range yet.</p>
				{:else}
					<div class="h-52">
						<AreaChart
							data={linksChartData}
							x="date"
							y="count"
							xScale={scaleTime()}
							yDomain={[0, null]}
							yNice
							axis="x"
							props={{
								area: { curve: curveCatmullRom, class: 'fill-primary/30' },
								line: { curve: curveCatmullRom, class: 'stroke-primary' }
							}}
							tooltip={{ snapToDataX: true }}
						/>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Clicks per {aggregation}</Card.Title>
				<Card.Description>
					{aggregation === 'day' ? 'Daily' : aggregation === 'week' ? 'Weekly' : 'Monthly'} click traffic
					from analytics events.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if clicksByDay.length === 0}
					<p class="text-sm text-muted-foreground">No click events recorded in this range yet.</p>
				{:else}
					<div class="h-52">
						<AreaChart
							data={clicksChartData}
							x="date"
							y="count"
							xScale={scaleTime()}
							yDomain={[0, null]}
							yNice
							axis="x"
							props={{
								area: { curve: curveCatmullRom, class: 'fill-secondary/30' },
								line: { curve: curveCatmullRom, class: 'stroke-secondary' }
							}}
							tooltip={{ snapToDataX: true }}
						/>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Country breakdown</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-[420px] space-y-3 overflow-y-auto">
				{#if countryBreakdown.length === 0}
					<p class="text-sm text-muted-foreground">No country data to show yet.</p>
				{:else}
					{#each countryBreakdown as item (item.key)}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="font-medium">{countryFlag(item.key)} {item.key}</span>
								<span class="text-muted-foreground">
									{formatNumber(item.count)} ({formatPercentage(item.count, summary.clicksInRange)})
								</span>
							</div>
							<div class="h-2 rounded bg-muted">
								<div
									class="h-2 rounded bg-primary/80"
									style={`width: ${getBarWidth(item.count, countryMax)}%`}
								></div>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Browser breakdown</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-[420px] space-y-3 overflow-y-auto">
				{#if browserBreakdown.length === 0}
					<p class="text-sm text-muted-foreground">No browser data to show yet.</p>
				{:else}
					{#each browserBreakdown as item (item.key)}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="flex items-center gap-1.5 font-medium">
									<iconify-icon icon={browserIcon(item.key)} width="14" height="14"></iconify-icon>
									{item.key}
								</span>
								<span class="text-muted-foreground">
									{formatNumber(item.count)} ({formatPercentage(item.count, summary.clicksInRange)})
								</span>
							</div>
							<div class="h-2 rounded bg-muted">
								<div
									class="h-2 rounded bg-secondary"
									style={`width: ${getBarWidth(item.count, browserMax)}%`}
								></div>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Subdomain breakdown</Card.Title>
			</Card.Header>
			<Card.Content class="max-h-[420px] space-y-3 overflow-y-auto">
				{#if subdomainBreakdown.length === 0}
					<p class="text-sm text-muted-foreground">No subdomain activity in this range yet.</p>
				{:else}
					{#each subdomainBreakdown as item (item.key)}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="font-medium">{item.key}</span>
								<span class="text-muted-foreground">
									{formatNumber(item.count)} ({formatPercentage(
										item.count,
										summary.linksCreatedInRange
									)})
								</span>
							</div>
							<div class="h-2 rounded bg-muted">
								<div
									class="h-2 rounded bg-primary/70"
									style={`width: ${getBarWidth(item.count, subdomainMax)}%`}
								></div>
							</div>
						</div>
					{/each}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Top links</Card.Title>
				<Card.Description>Most clicked short links overall.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if topLinks.length === 0}
					<p class="text-sm text-muted-foreground">No links available yet.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Slug</Table.Head>
									<Table.Head>Subdomain</Table.Head>
									<Table.Head class="text-right">Total clicks</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each topLinks as link (link.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{link.id_url}</Table.Cell>
										<Table.Cell>{link.subdomain}</Table.Cell>
										<Table.Cell class="text-right">{formatNumber(link.utm_view)}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Top creators</Card.Title>
				<Card.Description>Creators ranked by links created and clicks.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if topCreators.length === 0}
					<p class="text-sm text-muted-foreground">No creator activity in this range yet.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>User ID</Table.Head>
									<Table.Head class="text-right">Links created</Table.Head>
									<Table.Head class="text-right">Total clicks</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each topCreators as creator (creator.userId)}
									<Table.Row>
										<Table.Cell class="font-medium">{creator.userId}</Table.Cell>
										<Table.Cell class="text-right">
											{formatNumber(creator.linksCreated)}
										</Table.Cell>
										<Table.Cell class="text-right">{formatNumber(creator.totalClicks)}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
