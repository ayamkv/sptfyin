<script>
import * as Card from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';
import { goto } from '$app/navigation';
import { slide } from 'svelte/transition';
import { getRecentRecords } from '$lib/pocketbase';
import { localizeDate } from '$lib/utils';

let records = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalLinkCreated;

async function fetchData() {
    try {
        const response = await getRecentRecords();
        records = response.items;
        totalLinkCreated = response.totalItems;
    } catch (error) {
        console.error(error);
    }
}

$: totalPages = Math.ceil(records.length / itemsPerPage);
$: startIndex = (currentPage - 1) * itemsPerPage;
$: endIndex = startIndex + itemsPerPage;
$: currentPageItems = records.slice(startIndex, endIndex);

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
    }
}
</script>

<svelte:head>
    <title>recent links - sptfy.in</title>
    <meta name="description" content="view recently created short links on sptfy.in" />
</svelte:head>
<div
	class="mt-0 flex  md:min-h-[96vh] flex-col items-center justify-center bg-background border md:rounded-xl sm:pb-0 pb-12"
	data-vaul-drawer-wrapper
>
<div class="container py-6 flex-1 min-h-full">
    <Card.Root class="w-full h-full max-w-2xl mx-auto">
        <Card.Header>
            <div class="flex justify-between items-center">
                <div>
                    <Card.Title class="text-2xl">recent created links</Card.Title>
                    <Card.Description>view recently created short links</Card.Description>
                </div>
            
            </div>
        </Card.Header>
        <Card.Content>            {#await fetchData()}
                <p class="text-center py-4">loading...</p>
            {:then}
                <div class="space-y-4">
                    {#if records.length > 0}
                        {#each currentPageItems as item}
                            <div class="flex justify-between items-center py-1 border-b last:border-0" transition:slide>
                                <a href="/{item.id_url}" class="font-light hover:underline" target="_blank">
                                    <span class="text-muted-foreground">{item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/</span><span>{item.id_url}</span>
                                </a>                                <span class="text-sm text-muted-foreground">
                                    {localizeDate(item.created, true)}
                                </span>
                            </div>
                        {/each}
                        
                        <div class="flex justify-between items-center pt-4">
                            <Button 
                                variant="ghost2" 
                                on:click={previousPage}
                                disabled={currentPage === 1}
                            >
                                prev
                            </Button>
                            <span class="text-sm text-muted-foreground">
                                page {currentPage} of {totalPages}
                            </span>
                            <Button 
                                variant="ghost2"
                                on:click={nextPage}
                                disabled={currentPage === totalPages}
                            >
                                next
                            </Button>
                        </div>
                    {:else}
                        <p class="text-center py-8 text-muted-foreground">No links have been created yet.</p>
                    {/if}
                </div>
            {:catch error}
                <p class="text-center py-4 text-red-500">Failed to load recent links.</p>
            {/await}
        </Card.Content>
    </Card.Root>
</div>
</div>