<script>
	import * as Card from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { getTopLinks } from '$lib/pocketbase';
	import { formatNumber } from '$lib/utils';
	import 'iconify-icon';

	let records = $state([]);
	let itemsPerPage = 10;

	async function fetchData() {
		try {
			const response = await getTopLinks(itemsPerPage, 1);
			records = response.items;
		} catch (error) {
			console.error(error);
		}
	}

	function getRankDisplay(index) {
		const rank = index + 1;
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}
</script>

<svelte:head>
	<title>top links - sptfy.in</title>
	<meta name="description" content="view the most clicked short links on sptfy.in" />
</svelte:head>
<div
	class="mt-0 flex flex-col items-center justify-center border bg-background/40 pb-12 sm:pb-0 md:min-h-[96vh] md:rounded-xl"
	data-vaul-drawer-wrapper
>
	<div class="container min-h-full flex-1 py-6">
		<Card.Root class="mx-auto w-full max-w-2xl lg:h-[42rem]">
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-2xl">🔥 top links leaderboard</Card.Title>
						<Card.Description>most clicked short links of all time</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="">
				{#await fetchData()}
					<div class="space-y-4">
						{#each Array(10) as _}
							<div class="flex items-center justify-between border-b py-2 last:border-0">
								<div class="mr-4 flex min-w-0 flex-1 items-center gap-3">
									<div class="w-8"><Skeleton class="h-4" /></div>
									<div class="flex-1"><Skeleton class="h-4" /></div>
								</div>
								<div class="w-20">
									<Skeleton class="h-4" />
								</div>
							</div>
						{/each}
						<p class="pt-4 text-center text-sm text-muted-foreground">loading top links~</p>
					</div>
				{:then}
					<div class="space-y-4">
						{#if records.length > 0}
							{#each records as item, i}
								<div class="flex items-center justify-between border-b py-1 last:border-0">
									<div class="mr-4 flex min-w-0 flex-1 items-center gap-3">
										<span class="w-8 text-center font-semibold">{getRankDisplay(i)}</span>
										<a
											href="https://{item.subdomain === 'sptfy.in'
												? 'sptfy.in'
												: `${item.subdomain}.sptfy.in`}/{item.id_url}"
											class="flex min-w-0 flex-1 items-center font-light hover:underline"
											target="_blank"
										>
											<span class="text-muted-foreground"
												>{item.subdomain === 'sptfy.in'
													? 'sptfy.in'
													: `${item.subdomain}.sptfy.in`}/</span
											><span class="inline-block max-w-full truncate">{item.id_url}</span>
										</a>
									</div>
									<span
										class="ml-2 flex items-center gap-1 whitespace-nowrap text-sm font-medium text-primary"
									>
										<iconify-icon icon="lucide:mouse-pointer-click" width="14"></iconify-icon>
										{formatNumber(item.utm_view)}
									</span>
								</div>
							{/each}
						{:else}
							<p class="py-8 text-center text-muted-foreground">No links with clicks yet.</p>
						{/if}
					</div>
				{:catch error}
					<p class="py-4 text-center text-red-500">Failed to load top links.</p>
				{/await}
			</Card.Content>
		</Card.Root>
	</div>
</div>
