<script>
// legacy run not needed with runes; use $effect when needed

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { goto } from '$app/navigation';
	import { localizeDate2 } from '$lib/utils.js';
	import { page } from '$app/stores';
	import { Turnstile } from 'svelte-turnstile';
	import { fly, slide, fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { expoOut } from 'svelte/easing';
	import { scaleWithEase } from '$lib/animations/customSpring';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { onMount } from 'svelte';
		import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';

	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';
	import * as Accordion from '$lib/components/ui/accordion';
	import 'iconify-icon';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { strings } from '$lib/localization/languages/en.json';
	import { get } from 'svelte/store';
	import { toastGroups } from '$lib/debug';
	import { UAParser } from 'ua-parser-js';

	let { data } = $props();
	// analytics and utm view come from load
	let utmView = data.utmView;
	let analytics = data.analytics || [];

	let debugMode = import.meta.env.VITE_DEBUG_MODE;
	let debugToastVisible = $state(false);
	let isQrLoaded = $state(false);
	let visible = $state();
	let scrollHere = $state();
	let isError = $state(false);
	let alertDialogTitle = '';
	let alertDialogDescription = '';
	let errorIconDefault = 'fluent-emoji:crying-cat';
	let errorIcon = errorIconDefault;
	let fullShortURL = $state(true);
	let qrDrawerOpen = $state(false);
    let shortIdDisplay = $state('####');
    let qrUrl = $derived(() => `https://api.qrserver.com/v1/create-qr-code?size=350x350&margin=20&data=https://sptfy.in/${shortIdDisplay}`);
	// --- pagination state for analytics table (client-side over provided analytics array) ---
	let currentPage = $state(1);
	let itemsPerPage = 6; // limit to 3 per page to avoid overflow
	let totalPages = $state(1);

	function computePagination() {
		totalPages = Math.max(1, Math.ceil((analytics?.length || 0) / itemsPerPage));
		if (currentPage > totalPages) currentPage = totalPages;
	}
    $effect(() => { computePagination(); });

	function getCurrentItems(list, page, perPage) {
		const startIndex = (page - 1) * perPage;
		return list.slice(startIndex, startIndex + perPage);
	}

	async function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}
	async function previousPage() {
		if (currentPage > 1) currentPage--;
	}

	function toUpperCase(str) { return (str || '').toUpperCase(); }

    onMount(() => {
		visible = true;
		// derive slug from current path: /{slug}/s
		const path = $page.url.pathname;
		// remove leading '/', trailing '/s'
		shortIdDisplay = path.replace(/^\//, '').replace(/\/s\/?$/, '');
        // qrUrl is derived
	});

	function openShort() {
		window.open(`/${shortIdDisplay}`, '_blank');
	}
	async function handleCopy() {
		try {
			const permission = await navigator.permissions.query({ name: 'clipboard-write' });
			if (permission.state === 'granted' || permission.state === 'prompt') {
				await navigator.clipboard.writeText(`https://sptfy.in/${shortIdDisplay}`);
				toast.success('Success 🥳', { description: 'The link has been copied to your clipboard!' });
			}
		} catch (e) {
			console.error('Failed to write to clipboard: ', e);
		}
	}

	function getBrowserLabel(ua) {
		if (!ua) return 'Unknown';
		const { browser } = new UAParser(ua).getResult();
		const name = browser?.name || 'Unknown';
		// remove the word mobile from the name
		const mobileRegex = /\bMobile\b/i;
		const cleanName = name.replace(mobileRegex, '').trim();
		const major = browser?.version?.split('.')?.[0];
		return major ? `${cleanName}` : cleanName;
	}

	function getOs(ua){
		if (!ua) return 'Unknown';
		const { os } = new UAParser(ua).getResult();
		const name = os?.name || 'Unknown';
		const version = os?.version || '';
		return version ? `${name}` : name;
	}

	// New function to get browser icon
	function getBrowserIcon(ua) {
		if (!ua) return 'mdi:question';
		const { browser } = new UAParser(ua).getResult();
		let name = browser?.name ? browser.name.toLowerCase() : '';
		if(name.includes('chrome')) return 'logos:chrome';
		if(name.includes('firefox')) return 'logos:firefox';
		if(name.includes('safari')) return 'logos:safari';
		if(name.includes('edge')) return 'logos:edge';
		if(name.includes('opera')) return 'logos:opera';
		if(name.includes('brave')) return 'logos:brave';
		if(name.includes('internet explorer') || name.includes('ie')) return 'logos:internet-explorer';
		if(name.includes('microsoft edge')) return 'logos:edge';
		if(name.includes('vivaldi')) return 'logos:vivaldi';
		if(name.includes('samsung')) return 'logos:samsung';
		if(name.includes('instagram')) return 'simple-icons:instagram';
		if(name.includes('facebook')) return 'simple-icons:facebook';
		return 'mdi:help';
	}

	// New function to get OS icon
	function getOsIcon(ua) {
		if (!ua) return 'mdi:question';
		const { os } = new UAParser(ua).getResult();
		let name = os?.name ? os.name.toLowerCase() : '';
		if(name.includes('windows')) return 'logos:microsoft-windows-icon';
		if(name.includes('mac')) return 'simple-icons:apple';
		if(name.includes('linux')) return 'logos:linux';
		if(name.includes('android')) return 'simple-icons:android';
		if(name.includes('ios')) return 'simple-icons:apple';
		return 'mdi:help';
	}


</script>

<div class="mt-0 flex md:min-h-[96vh] flex-col items-center justify-center bg-background/40 border md:rounded-xl sm:pb-0 pb-12" data-vaul-drawer-wrapper>
	<AlertDialog.Root bind:open={isError} class="transition-all">
		<AlertDialog.Trigger></AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<div
					class="align-center m-auto flex min-h-[120px] w-[120px] flex-col justify-center text-center"
				>
					<iconify-icon icon={errorIcon} class="m-auto block text-center" width="120" alt="emoji"
					></iconify-icon>
				</div>
				<AlertDialog.Title class="text-center">{@html alertDialogTitle}</AlertDialog.Title>

				<AlertDialog.Description>
					{@html alertDialogDescription}
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
                <AlertDialog.Action class="min-w-full font-semibold" onclick={() => (isError = false)}
					>okay, got it</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<Dialog.Root class="md:hidden md:flex-none">
		<Dialog.Trigger></Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title></Dialog.Title>
				<Dialog.Description>
					<iframe
						id="kofiframe"
						src="https://ko-fi.com/freqtion/?hidefeed=true&widget=true&embed=true&preview=true"
						style="border:none;width:100%;background:#0A0911;border-radius:0.7em"
						height="400"
						title="freqtion"
					></iframe>
				</Dialog.Description>
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>

	<div class="logo mt-[2em] flex flex-col items-center justify-center">
		<h3
				class="md:text-md text-xs mt-4 flex justify-center rounded-md bg-orange-300 px-4 py-2 align-middle text-black"
			>
				this is an Upcoming Feature! you shouldn't be here (。_。)
			</h3>

		{#if debugMode === 'true'}
			<h3
				class="text-md mt-4 flex justify-center rounded-md bg-orange-300 px-4 py-2 align-middle text-black"
			>
				Debug Mode is Active!
			</h3>
      <div class="button-debug-list">
        	<!-- Button toggle to change fullShortURL to true or false -->
        <div>
          <Label for="fullShortURL" class="my-2"
            >{fullShortURL ? 'fullShortURL ON' : `fullShortURL OFF`}</Label
          >
          <Switch id="fullShortURL" bind:checked={fullShortURL} class="mt-4"></Switch>
        </div>
        <!-- Button toggle to change visible to true or false -->
         <div>
          <Label for="visible" class="my-2">{visible ? 'visible ON' : `visible OFF`}</Label>
          <Switch id="visible" bind:checked={visible} class="mt-4"></Switch>
         </div>
      </div>
		

			<div class="toast-debug mt-2">
				<h3 class="text-lg">
					TOAST <Button
						class="mt-2 pt-1"
						variant="secondary"
						on:click={() => (debugToastVisible = !debugToastVisible)}
					>
						{debugToastVisible ? 'Hide' : 'Show'} Toast
					</Button>
				</h3>

				<div class="flex flex-col items-center justify-center">
					{#if debugToastVisible}
						{#each toastGroups as group}
							<div class="mt-1">
								<h4 class="text-md">{group.title}</h4>
								{#each group.buttons as btn}
									<div class="mx-1 inline-block">
										<Button class={btn.class} on:click={btn.onClick}>
											{btn.label}
										</Button>
									</div>
								{/each}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>

{#if visible}
	<div
  in:fade={{ duration: 200 }}
		class="atas flex
		flex-col
		items-center justify-center
		py-10
		md:ml-0
		md:w-[99vw]
		md:h-[70vh]
		md:flex-row
		md:items-start
		md:px-10
		md:py-10
		[&:not(:first-child)]:gap-6
		"
	>

		<div class="left-card">
	    <Card.Root class="relative w-[20rem] sm:w-[20rem] md:w-[25rem] lg:min-h-[16rem]">
        {#if !visible}
        <div in:fade out:fade={{ duration: 200 }}>
          <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
        </div>
            
        {/if}
				<Card.Header>
					<Card.Title>url stats</Card.Title>
					<Card.Description></Card.Description>
					<Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
						<div
							class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all md:h-28 md:py-2"
						>
							<p class="break-all text-[1.44rem] font-semibold md:text-4xl lg:text-4xl">
								sptfy.in/<span class="text-[#82d1af]">{shortIdDisplay}</span>
							</p>

							<div class="buttons button-copy flex max-h-20 gap-1 md:flex-col-reverse">
                                <Button variant="secondary" class="p-3 hover:bg-primary hover:text-black md:mx-0" onclick={handleCopy}>
									<iconify-icon icon="lucide:copy" class="w-[24px]" width="24" alt="copy"></iconify-icon>
								</Button>
                                <Button variant="secondary" class="p-3 hover:bg-primary hover:text-black md:mx-0" onclick={openShort}>
									<iconify-icon icon="lucide:square-arrow-out-up-right" class="w-[24px]" width="24" alt="open"></iconify-icon>
								</Button>
							</div>
						</div>
						{#if fullShortURL}
							<Drawer.Root shouldScaleBackground bind:open={qrDrawerOpen}>
								<Drawer.Trigger>
									<div
										in:slide|global={{ duration: 800, easing: expoOut }}
										out:slide|global={{ duration: 800, easing: expoOut }}
									>
										<Button variant="secondary" class="button-show-qr w-full">
											<div class="flex-none">
												<iconify-icon
													icon="lucide:qr-code"
													class="m-auto block h-[18px] w-[18px] pr-6 text-center"
													width="18"
													alt="emoji"
												></iconify-icon>
											</div>
											<span>Show QR</span>
										</Button>
									</div>
								</Drawer.Trigger>
								<Drawer.Content>
									<Drawer.Header>
										<Drawer.Title class="my-2 text-center">QR Code</Drawer.Title>
										<Drawer.Description>
											<div class="align-center flex flex-col items-center text-center">
												<div class="relative-wrapper relative inline-block">
													<img
														class="w-[200px] min-w-[50%] rounded-md shadow-md md:w-[350px] md:min-w-[20%]"
														onload={() => (isQrLoaded = true)}
														transition:fade={{ duration: 1200 }}
														src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=https://sptfy.in/{shortIdDisplay}"
														alt="QR Code"
														height="350"
														width="350"
													/>
													{#if !isQrLoaded}
														<Skeleton
															class="absolute left-0 top-0 h-[200px] w-[200px] md:h-[350px] md:w-[350px]"
														/>
													{/if}
												</div>
											</div>
										</Drawer.Description>
									</Drawer.Header>
									<Drawer.Footer>
										<Drawer.Close
											class="flex w-full flex-col items-center justify-center gap-2 align-middle md:flex-row"
										>
											{#if isQrLoaded}
												<div in:scaleWithEase>
													<Button
														variant="default"
														on:click={(event) => {
															qrDrawerOpen = false;
															event.preventDefault();
															async function downloadQRCode() {
																try {
																	toast.loading('Downloading QR code...');
																	const response = await fetch(qrUrl);
																	const blob = await response.blob();
																	const objectUrl = URL.createObjectURL(blob);
																	const anchor = document.createElement('a');
																	anchor.href = objectUrl;
																	anchor.setAttribute(
																		'download',
																		`sptfyin_qr_${shortIdDisplay}.png`
																	);
																	anchor.click();
																	anchor.remove();
																	URL.revokeObjectURL(objectUrl);
																	toast.success('Download successful! 🥳', {
																		description: 'The QR code has been saved to your device.'
																	});
																} catch (e) {
																	console.error('Download failed', e);
																	toast.error('Download failed.');
																}
															}
															downloadQRCode();
															// your code here
														}}
														class="button-download-qr align-center m-auto mb-1 mt-1 flex
												w-[200px] flex-row items-center justify-center text-center transition-all md:w-[360px] "
													>
														<div class="flex-none">
															<iconify-icon
																icon="lucide:download"
																class="m-auto block h-[15px] w-[15px] pr-5 text-center"
																width="15"
																alt="emoji"
															></iconify-icon>
														</div>

														<span>Download</span>
													</Button>
												</div>
											{/if}
											<div in:slide={{ duration: 800 }} class="transition-all">
												<Button
													variant="secondary"
													class="my-1 w-[200px] transition-all md:w-[360px]"
												>
													Close
												</Button>
											</div>
										</Drawer.Close>
									</Drawer.Footer>
								</Drawer.Content>
							</Drawer.Root>
						{/if}
						<div class="scrollhere" bind:this={scrollHere}></div>
						<div class="pt-4 md:pt-2"></div>
					</Card.Content>
				</Card.Header>
			</Card.Root>
			<div class="mt-6 flex h-[10.7rem] w-[20rem] flex-row gap-5 md:w-full">
				<Card.Root class="relative w-1/2">
          {#if !visible}
          <div in:fade out:fade={{ duration: 200 }}>
            <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
          </div>
            
        {/if}
					<Card.Header class="pb-2">
						<Card.Description>interactions</Card.Description>
						<Card.Title class="text-4xl md:text-5xl">{utmView}</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="text-xs text-muted-foreground"></div>
					</Card.Content>
					<Card.Footer>
						<!-- <Progress value={25} aria-label="25% increase" /> -->
					</Card.Footer>
				</Card.Root>
				<Card.Root class="relative w-1/2">
          {#if !visible}
          <div in:fade out:fade={{ duration: 200 }}>
            <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
          </div>
            
        {/if}
					<Card.Header class="pb-2">
						<Card.Description>total Clicks</Card.Description>
						<Card.Title class="text-4xl md:text-5xl">{analytics.length}</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="text-xs text-muted-foreground"></div>
					</Card.Content>
					<Card.Footer>
						<!-- <Progress value={25} aria-label="25% increase" /> -->
					</Card.Footer>
				</Card.Root>
			</div>
		</div>

		<!-- Right column: analytics table with working pagination -->
		<div class="right-card ">
			<Card.Root class="relative min-h-full w-[20rem] transition-all sm:w-[20rem] lg:w-[35rem] flex flex-col place-content-between md:h-full mb-14 md:mb-0">
				{#if !visible}
					<div in:fade out:fade={{ duration: 200 }}>
						<Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
					</div>
				{/if}
				<Card.Header class="pb-2">
					<Card.Title>analytics</Card.Title>
					<!-- <Card.Description>{analytics.length}</Card.Description> -->
					<Card.Content class="grid px-0 pb-0 text-left text-muted-foreground/80 min-h-full overflow-y-auto md:max-h-[26rem]">
						<div class="align-center flex w-full min-w-full items-start justify-between py-2 transition-all md:py-2 ">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="md:w-[90px]   border-white/10 border-r text-left pl-0">country</Table.Head>
										<Table.Head class=" border-white/10 border-r w-[140px]">browser</Table.Head>
										<Table.Head class=" border-white/10 border-r"> os </Table.Head>	
										<Table.Head class="text-right">date</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#if analytics && analytics.length}
										{#each getCurrentItems(analytics, currentPage, itemsPerPage) as v, i (i)}
											<Table.Row>
												<Table.Cell class="font-medium border-white/10 border-r pl-0">
													<img src={`https://www.flagsapi.com/${toUpperCase(v.utm_country || 'UN')}/shiny/64.png`} alt={v.utm_country} class="w-6 h-6 mr-2 inline-block" />
													<span>{v.utm_country || 'Unknown'}</span>
													
												</Table.Cell>
												<!-- Update browser cell to parsed label -->
												<Table.Cell class="border-white/10 border-r">
													<div class="flex items-center">

													
													<iconify-icon
														icon={getBrowserIcon(v.utm_userAgent)}
														class="inline-block mr-2"
														width="18"
														alt="browser icon"></iconify-icon>
													<span>{getBrowserLabel(v.utm_userAgent)}</span>
													</div>
												</Table.Cell>
												<Table.Cell class="border-white/10 border-r">
													<div class="flex items-center">
													
													<iconify-icon
														icon={getOsIcon(v.utm_userAgent)}
														class="inline-block mr-2 {getOs(v.utm_userAgent) === 'Android' ? 'text-[#3ddc84]' : ''}"
														width="18"
														alt="OS icon"></iconify-icon>
													<span>{getOs(v.utm_userAgent)}</span>
													</div>
												</Table.Cell>
												<Table.Cell class="text-right">
													{localizeDate2(v.created)}
												</Table.Cell>
											</Table.Row>
										{/each}
									{:else}
										<Table.Row>
											<Table.Cell colspan="2">No analytics yet.</Table.Cell>
										</Table.Row>
									{/if}
								</Table.Body>
							</Table.Root>
						</div>
					</Card.Content>
				</Card.Header>
				<Card.Footer class="flex justify-between items-center pt-5">
					
                        <Button variant="ghost2" onclick={previousPage} disabled={currentPage === 1}>prev</Button>
						<span class="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                        <Button variant="ghost2" onclick={nextPage} disabled={currentPage === totalPages}>next</Button>
				
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
	{/if}

	<!-- <div class="disclaim text-center mt-4">
		<h4 class="bold text-lg">🫡 disclaimer</h4>
		<p class="text-xs text-foreground/60">
			Spotify® is a registered trademark of Spotify AB.<br />
			this project <b>is NOT AFFILIATED</b> with, endorsed by, or sponsored by Spotify AB.<br />
			<i>(TL;DR: not officialy from spotify)</i>
		</p>
	</div> -->
</div>
