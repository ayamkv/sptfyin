<script>
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Turnstile } from 'svelte-turnstile';
	import { fly, slide, fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { expoOut } from 'svelte/easing';
	import { scaleWithEase } from '$lib/animations/customSpring';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Pagination from '$lib/components/ui/pagination';
	import {
		getRecords,
		createRecord,
		generateRandomURL,
		getRecentRecords,
		validateToken
	} from '$lib/pocketbase';
	// import { generateRandomURL } from "$lib/utils";
	import { localizeDate, findUrl, createLoadObserver } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Card from '$lib/components/ui/card';
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
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { toastGroups } from '$lib/debug';

	export let data;



	let utmView = data.utmView
	let analytics = data.analytics
	console.log('analytics: ', data.analytics);

	let debugMode = import.meta.env.VITE_DEBUG_MODE;
	console.log('debugMode: ', debugMode);
  // if (debugMode === 'true') {
  //   alert('Debug Mode is Active!');
  // }
	let debugToastVisible = false;
	let isQrLoaded = false;
	let visible = false;
	let scrollHere;
	let accordionValue = 'one';
	let customShortId;
	let turnstileResponse;
	let isIOS, isAndroid, isMobile, isSafari, isFirefox, isOldFirefox;
	let records = [];
	let rrecords;
	let recordsPromise;
	let error = null;
	let recentLoading = true;
	let currentItems = 4;
	let turnstileKey = import.meta.env.VITE_CF_SITE_KEY;
	let reset;
	let shortIdDisplay = '####';
	let qrUrl = `https://api.qrserver.com/v1/create-qr-code?size=350x350&margin=20&data=https://sptfy.in/${shortIdDisplay}`;
	let inputText = null;
	let isError = false;
	let alertDialogTitle = '';
	let alertDialogDescription = '';
	let errorIconDefault = 'fluent-emoji:crying-cat';
	let errorIcon = errorIconDefault;
	let focus1 = false;
	let theButton;
	let fullShortURL = true;
	let qrDrawerOpen = false;
	let recent = [];
	let actions = [
		{
			icon: 'lucide:copy',
			click: () => handleCopy()
		},
		{
			icon: 'lucide:square-arrow-out-up-right',
			click: () => window.open(`/${shortIdDisplay}`, '_blank')
		}
	];

	$: isInputTextEmpty = true;

	const onload = createLoadObserver(() => {
		isQrLoaded = true;
		console.log('loaded!!!');
	});

	function scrollToBottom() {
		scrollHere.scrollIntoView();
	}

	function setAccordionValue(newValue) {
		accordionValue = newValue;
	}

	async function fetchData() {
		recentLoading = true;
		try {
			const response = await getRecentRecords();
			records = response.items;
		} catch (error) {
			console.error(error);
		} finally {
			recentLoading = false;
		}
	}
	function toUpperCase(str) {
		return str.toUpperCase();
	}
	let currentPage = 1;

	function getCurrentItems(list, page, perPage) {
		const startIndex = (page - 1) * perPage;
		return list.slice(startIndex, startIndex + perPage);
	}

	function getBrowserName() {
		const userAgent = navigator.userAgent;

		switch (true) {
			case userAgent.includes('Chrome') && !userAgent.includes('Edg'):
				return 'Chrome';
			case userAgent.includes('Firefox'):
				return 'Firefox';
			case userAgent.includes('Safari') && !userAgent.includes('Chrome'):
				return 'Safari';
			case userAgent.includes('Edg'):
				return 'Edge';
			case userAgent.includes('Trident'):
				return 'Internet Explorer';
			case userAgent.includes('OPR'):
				return 'Opera';
			default:
				return 'Unknown Browser';
		}
	}
	onMount(() => {
		visible = true;
		const ua = navigator.userAgent.toLowerCase();
		isIOS = ua.includes('iphone os') || (ua.includes('mac os') && navigator.maxTouchPoints > 0);
		isAndroid = ua.includes('android');
		isMobile = ua.includes('android') || isIOS;
		isSafari = ua.includes('safari/');
		isFirefox = ua.includes('firefox/');
		isOldFirefox = ua.includes('firefox/') && ua.split('firefox/')[1].split('.')[0] < 103;
		// console log the ua user is using
		console.log(getBrowserName());
	});

	let promiseResolve, promiseReject;

	const placeholderList = [
		{
			country: 'indonesia',
			country_flag: 'id',
			browser: 'Chrome',
			os: 'Mobile/Android'
		},
		{
			country: 'philiphines',
			country_flag: 'ph',
			browser: 'Safari',
			os: 'Mobile/iOS'
		},
		{
			country: 'united states',
			country_flag: 'us',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'united kingdom',
			country_flag: 'gb',
			browser: 'Firefox',
			os: 'Desktop/Windows'
		},
		{
			country: 'australia',
			country_flag: 'au',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'canada',
			country_flag: 'ca',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'germany',
			country_flag: 'de',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'france',
			country_flag: 'fr',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'japan',
			country_flag: 'jp',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'south korea',
			country_flag: 'kr',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		


	];

	async function handleCopy(event) {
		try {
			// Request permission to access the clipboard
			const permission = await navigator.permissions.query({ name: 'clipboard-write' });

			if (permission.state === 'granted' || permission.state === 'prompt') {
				// Write to the clipboard
				await navigator.clipboard.writeText(fullShortURL);
				toast.success('Success 🥳', {
					description: 'The link has been copied to your clipboard!',
					action: {
						label: 'Okay',
						onClick: () => console.info('Copy')
					}
				});
			} else {
				alert('Clipboard access denied');
			}
		} catch (e) {
			let error = String(e).toLowerCase();

			if (error.includes('denied')) alert('Clipboard access denied');
			console.error('Failed to write to clipboard: ', error);
		}
	}

</script>


<div
	class="mt-0 flex min-h-[100vh] w-[99vw] flex-col items-center justify-center bg-background"
	data-vaul-drawer-wrapper
>
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
				<AlertDialog.Action class="min-w-full font-semibold" on:click={() => (isError = false)}
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

	<div class="logo mt-[5em] flex flex-col items-center justify-center">
		<h1
			class="ss03 font-jak-display text-6xl font-bold text-primary md:text-8xl
		"
		>
			Sptfy.in
		</h1>
		<h3
			class="text-md mt-4
		text-white
		"
		>
			by <a href="https://instagram.com/raaharja" target="_blank">raaharja</a>
		</h3>
		<h3
				class="text-md mt-4 flex justify-center rounded-md bg-orange-300 px-4 py-2 align-middle text-black"
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
	    <Card.Root class="relative w-[20rem] transition-all sm:w-[20rem] md:w-[35rem]">
        {#if !visible}
        <div in:fade out:fade={{ duration: 200 }}>
          <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
        </div>
            
        {/if}
				<Card.Header>
					<Card.Title>url stats</Card.Title>
					<Card.Description>here's how your URL will look like</Card.Description>
					<Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
						<div
							class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all md:h-28 md:py-2"
						>
							<p class="break-all text-[1.44rem] font-semibold md:text-3xl lg:text-5xl">
								sptfy.in/<span class="text-[#82d1af]">{$page.url.pathname.slice(1, -2)}</span>
							</p>

							<div class="buttons button-copy flex max-h-20 gap-1 md:flex-col-reverse">
								{#each actions as action, i}
									<div
										class=""
										in:scaleWithEase|global={{ delay: (i + 1) * 100 }}
										out:fade|global={{ duration: 200 }}
									>
										<Button
											variant="secondary"
											class="p-3 hover:bg-primary hover:text-black md:mx-0"
											on:click={action.click}
										>
											<iconify-icon
												icon={action.icon}
												class="w-[24px]"
												width="24"
												alt={action.icon}
											>
											</iconify-icon>
										</Button>
									</div>
								{/each}
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
														on:load={() => (isQrLoaded = true)}
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
						<Card.Description>Total Clicks</Card.Description>
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
						<Card.Description>Unique Visitors</Card.Description>
						<Card.Title class="text-4xl md:text-5xl">89</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="text-xs text-muted-foreground"></div>
					</Card.Content>
					<Card.Footer>
						<!-- <Progress value={25} aria-label="25% increase" /> -->
					</Card.Footer>
				</Card.Root>
			</div>
			<Card.Root class="relative mt-5 h-full w-full">
        {#if !visible}
        <div in:fade out:fade={{ duration: 200 }}>
          <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
        </div>
        {/if}
				<Card.Header class="pb-2 flex flex-row gap-6 ">
					<Avatar.Root class="w-16 h-16">
						<Avatar.Image src="https://api.dicebear.com/9.x/glass/svg" alt="Anonymous" />
						<Avatar.Fallback>?</Avatar.Fallback>
					  </Avatar.Root>
					<div>
						<Card.Description>User</Card.Description>
						<Card.Title class="text-4xl">Anonymous</Card.Title>
					</div>
					
				</Card.Header>
				<Card.Content class="">
					
				</Card.Content>
				<Card.Footer>
					<!-- <Progress value={25} aria-label="25% increase" /> -->
				</Card.Footer>
			</Card.Root>
		</div>
		<!-- Card for table with pagination -->
    <div class="right-card h-full">
      <Card.Root class="relative min-h-full w-[20rem] transition-all  sm:w-[20rem] md:w-[23rem] flex flex-col place-content-between">
        {#if !visible}
        <div in:fade out:fade={{ duration: 200 }}>
          <Skeleton class="absolute top-0 left-0 z-10 h-full w-full rounded-lg" />
        </div>
        {/if}
        <Card.Header class="pb-2">
          <Card.Title>analytics</Card.Title>
          <Card.Description>here's how your URL will look like</Card.Description>
          <Card.Content class="grid px-0 pb-0 text-left text-muted-foreground/80 min-h-full">
            <div
              class="align-center flex w-full min-w-full h-full items-center justify-between py-2 transition-all md:py-2 "
            >
              <Table.Root class="">
               
                <Table.Header>
                  <Table.Row>
                    <Table.Head class="w-[70px]">Country</Table.Head>
                    <Table.Head>browser</Table.Head>
                    <Table.Head>OS</Table.Head>
                    
                  </Table.Row>
                </Table.Header>
                <Table.Body class="">
				{#each getCurrentItems(analytics, currentPage, 10) as v, i (i)}
                    <Table.Row>
                      <Table.Cell class="font-medium">
						<img src={`https://www.flagsapi.com/${toUpperCase(v.utm_country)}/shiny/64.png`} alt={v.utm_country} class="w-6 h-6 mr-2" />
					  </Table.Cell>
                      <Table.Cell>{v.utm_userAgent}</Table.Cell>
                      <!-- <Table.Cell>{v.os}</Table.Cell>
                      -->
                    </Table.Row>
                {/each}
                </Table.Body>
              </Table.Root>
            </div>
          </Card.Content>
        </Card.Header>
        <Card.Footer>
          <Pagination.Root count={100} perPage={10} let:pages let:currentPage class="">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.PrevButton />
              </Pagination.Item>
              {#each pages as page (page.key)}
                {#if page.type === 'ellipsis'}
                  <Pagination.Item>
                    <Pagination.Ellipsis />
                  </Pagination.Item>
                {:else}
                  <Pagination.Item isVisible={currentPage == page.value}>
                    <Pagination.Link {page} isActive={currentPage == page.value}>
                      {page.value}
                    </Pagination.Link>
                  </Pagination.Item>
                {/if}
              {/each}
              <Pagination.Item>
                <Pagination.NextButton />
              </Pagination.Item>
            </Pagination.Content>
          </Pagination.Root>
        </Card.Footer>
      </Card.Root>

    </div>
		
		<!-- Card for table with pagination -->
    
	</div>
  {/if}
	<div class="disclaim text-center mt-4">
		<h4 class="bold text-lg">🫡 disclaimer</h4>
		<p class="text-xs text-foreground/60">
			Spotify® is a registered trademark of Spotify AB.<br />
			this project <b>is NOT AFFILIATED</b> with, endorsed by, or sponsored by Spotify AB.<br />
			<i>(TL;DR: not officialy from spotify)</i>
		</p>
	</div>
	
</div>
