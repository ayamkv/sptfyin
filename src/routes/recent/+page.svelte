<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onMount } from 'svelte';
	import { getRecentRecords } from '$lib/pocketbase';
	import { localizeDate } from '$lib/utils';

	let records = $state([]);
	let currentPage = $state(1);
	let itemsPerPage = 10;
	let totalPages = $state(1);
	let isLoading = $state(true);
	let hasError = $state(false);

	async function fetchData(page = currentPage) {
		isLoading = true;
		hasError = false;
		try {
			const response = await getRecentRecords('viewList', itemsPerPage, page);
			records = response.items || [];
			totalPages = Math.max(
				1,
				response.totalPages || Math.ceil((response.totalItems || 0) / itemsPerPage)
			);
			currentPage = Math.min(Math.max(1, page), totalPages);
		} catch (error) {
			hasError = true;
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	async function nextPage() {
		if (isLoading || currentPage >= totalPages) {
			return;
		}

		await fetchData(currentPage + 1);
	}

	async function previousPage() {
		if (isLoading || currentPage <= 1) {
			return;
		}

		await fetchData(currentPage - 1);
	}

	onMount(() => {
		fetchData();
	});
</script>

<svelte:head>
	<title>recent links - sptfy.in</title>
	<meta name="description" content="view recently created short links on sptfy.in" />
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
						<Card.Title class="text-2xl">recent created links</Card.Title>
						<Card.Description>view recently created short links</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="">
				{#if isLoading}
					<div class="space-y-4">
						{#each Array(10) as _}
							<div class="flex items-center justify-between border-b py-2 last:border-0">
								<div class="mr-4 flex min-w-0 flex-1 items-center gap-1">
									<div class="w-16"><Skeleton class="h-4" /></div>
									<div class="flex-1"><Skeleton class="h-4" /></div>
								</div>
								<div class="w-24">
									<Skeleton class="h-4" />
								</div>
							</div>
						{/each}
						<div class="flex items-center justify-between pt-4">
							<Button variant="ghost2" disabled>prev</Button>
							<span class="text-sm text-muted-foreground"> fresh links incoming~ </span>
							<Button variant="ghost2" disabled>next</Button>
						</div>
					</div>
				{:else if hasError}
					<p class="py-4 text-center text-red-500">Failed to load recent links.</p>
				{:else}
					<div class="space-y-4">
						{#if records.length > 0}
							{#each records as item}
								<div class="flex items-center justify-between border-b py-1 last:border-0">
									<a
										href="https://{item.subdomain === 'sptfy.in'
											? 'sptfy.in'
											: `${item.subdomain}.sptfy.in`}/{item.id_url}"
										class="mr-4 flex min-w-0 flex-1 items-center font-light hover:underline"
										target="_blank"
									>
										<span class="text-muted-foreground"
											>{item.subdomain === 'sptfy.in'
												? 'sptfy.in'
												: `${item.subdomain}.sptfy.in`}/</span
										><span class="inline-block max-w-full truncate">{item.id_url}</span>
									</a>
									<span
										class="ml-2 flex items-center whitespace-nowrap text-sm text-muted-foreground"
									>
										{localizeDate(item.created, true)}
									</span>
								</div>
							{/each}

							<div class="flex items-center justify-between pt-4">
								<Button
									variant="ghost2"
									onclick={previousPage}
									disabled={isLoading || currentPage === 1}
								>
									prev
								</Button>
								<span class="text-sm text-muted-foreground">
									{currentPage} / {totalPages}
								</span>
								<Button
									variant="ghost2"
									onclick={nextPage}
									disabled={isLoading || currentPage === totalPages}
								>
									next
								</Button>
							</div>
						{:else}
							<p class="py-8 text-center text-muted-foreground">No links have been created yet.</p>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
