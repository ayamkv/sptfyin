<script>
	import { Button } from '$lib/components/ui/button';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { Turnstile } from 'svelte-turnstile';
	import { fly, slide, fade, scale } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { expoOut } from 'svelte/easing';
	import { scaleWithEase } from '$lib/animations/customSpring';
	import { MetaTags } from 'svelte-meta-tags';
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

	let debugMode = import.meta.env.VITE_DEBUG_MODE;
	console.log('debugMode: ', debugMode);
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
	let loading = false;
	let recentLoading = true;
	let currentItems = 4;
	let turnstileKey = import.meta.env.VITE_CF_SITE_KEY;
	let reset;
	let shortIdDisplay = '****';
	let qrUrl = `https://api.qrserver.com/v1/create-qr-code?size=350x350&margin=20&data=https://sptfy.in/${shortIdDisplay}`;
	let inputText = null;
	let isError = false;
	let alertDialogTitle = '';
	let alertDialogDescription = '';
	let errorIconDefault = 'fluent-emoji:crying-cat';
	let errorIcon = errorIconDefault;
	let errorCode;
	let focus1 = false;
	let theButton;
	let fullShortURL;
	let qrDrawerOpen = false;
	let recent = [];
	let urlInput;
	let errorMessage;
	let preGeneratedUrlId
	$: console.log('errorMessage var: ', errorMessage);
	let actions = [
		{
			icon: 'lucide:copy',
			click: () => handleCopy()
		},
		{
			icon: 'lucide:square-arrow-out-up-right',
			click: () => window.open(`${fullShortURL}`, '_blank')
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
	let totalLinkCreated;
	
	function formatNumber(num) {
	  if (!num) return 'counting';
	  if (num >= 1000) {
	    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
	  }
	  return num;
	}
	async function fetchData() {
		recentLoading = true;
		try {
			const response = await getRecentRecords();
			records = response.items;
			totalLinkCreated = response.totalItems
			
		} catch (error) {
			console.error(error);
			errorMessage = 'An error occurred while fetching data.'; // Added error message handling
		} finally {
			recentLoading = false;
		}
	}	
	onMount(async () => {
		// Generate random URL on page load
		preGeneratedUrlId = await generateRandomURL();
		console.log(preGeneratedUrlId)
		shortIdDisplay = preGeneratedUrlId;
		
		recordsPromise = await fetchData();
		rrecords = records;
	});
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
	if (inputText !== null) {
		isInputTextEmpty = false;
	}

	// const allowedLinkTypes = new Set(["text/plain", "text/uri-list"]);
	async function handlePaste(event) {
		try {
			// Request permission to access the clipboard
			const permission = await navigator.permissions.query({ name: 'clipboard-read' });

			if (permission.state === 'granted' || permission.state === 'prompt') {
				// Read from the clipboard
				const text = await navigator.clipboard.readText();
				let clipboardContent = text;

				// console.log(clipboardContent);
				// console.log(findUrl(clipboardContent));
				setTimeout(() => {
					inputText = findUrl(clipboardContent);
					isInputTextEmpty = false;
					setAccordionValue('item-1');

					if (inputText === null) {
						setTimeout(() => {
							focus1 = false;
							// alert('No Spotify URL found in clipboard');
							isError = true;
							alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
							alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
							errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
							console.log(alertDialogTitle, alertDialogDescription);
						}, 1);
					}
					focus1 = true;
				}, 4);
			} else {
				errorIcon = errorIconDefault;
				alertDialogTitle = strings.ErrorClipboardPermTitle;
				alertDialogDescription = strings.ErrorClipboardPermissionDesc;
				isError = true;
				// alert('Clipboard access denied');
			}
		} catch (e) {
			let error = String(e).toLowerCase();

			if (error.includes('denied')) isError = true;
			console.error('Failed to read clipboard: ', error);
			if (error.includes('function') && isFirefox)
				alert('Firefox does not support clipboard access');
			if (error.includes('dismissed') || isIOS)
				alert('Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔');
		}
	}


	// onMount(() => {
	//     console.log(strings)
	// });



	async function handleInputOnPaste(event) {
		// handle paste event only for the input field not the paste button itself 
		// and can work with ctrl + v or right click paste, on ios or android or pc
		
		try {
			const text = await navigator.clipboard.readText();
			console.log( text );
			inputText = findUrl(text);
			setTimeout(() => {
	
					isInputTextEmpty = false;
					setAccordionValue('item-1');
				
					if (inputText === null) {
						setTimeout(() => {
							focus1 = false;
							// alert('No Spotify URL found in clipboard');
							isError = true;
							alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
							alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
							errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
							console.log(alertDialogTitle, alertDialogDescription);
						}, 1);
					}

				}, 4);
		} catch (error) {
			console.error(error);
		}
		
	}

	function escapeSelectHandle() {
		onMount(() => {
			setTimeout(() => {
				theButton.focus();
			}, 100);
		});
		console.log('something is selected');
	}

	// onMount(() => {
	//   escapeSelectHandle();
	// })

	let promiseResolve, promiseReject;

	let selected = { value: 'sptfy.in', label: 'default: sptfy.in' };
	const domainList = [
		{ value: 'sptfy.in', label: 'sptfy.in' },
		{ value: 'artist', label: 'artist.sptfy.in', disabled: false },
		{ value: 'profile', label: 'profile.sptfy.in', disabled: false },
		{ value: 'playlist', label: 'playlist.sptfy.in', disabled: false },

		{ value: 'track', label: 'track.sptfy.in', disabled: false },
		{ value: 'COMING SOON', label: '--- COMING SOON ---', disabled: true },
		
		{ value: 'album', label: 'album.sptfy.in', disabled: true }
		
	];

	$: console.log('domain selected: ', selected)
	function handleCustomUrl() {
		const value = customShortId;
		const modifiedValue = value.toLocaleLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
		customShortId = modifiedValue;
		shortIdDisplay = modifiedValue;
		qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=https://sptfy.in/${shortIdDisplay}`;
	}
	const protectedRoutes = ['recent', 'about', 'terms', 'privacy'];
	const handleSubmit = async (e) => {
		const promise = new Promise(function (resolve, reject) {
			promiseResolve = resolve;
			promiseReject = reject;
		});
		loading = true;
		
		if (protectedRoutes.includes(customShortId)) {
			isError = true;
			alertDialogTitle = strings.ErrorCustomShortIdRouteTitle;
			alertDialogDescription = strings.ErrorCustomShortIdRouteDesc;
			errorIcon = strings.ErrorCustomShortIdRouteIcon;
			loading = false;
			return;
		}
		
		let url_id = customShortId;

		if (!customShortId) {
			url_id = preGeneratedUrlId;
			// Generate next random URL for future use
			preGeneratedUrlId = await generateRandomURL();
		}
		inputText = findUrl(inputText); //make sure safari got this sh*t 
		let dataForm = {
			from: inputText,
			id_url: url_id,
			subdomain: selected.value,
			enable: true
		};
		try {
			console.log(url_id);
			const response = await createRecord('random_short', dataForm, turnstileResponse);
			console.log('Record created');
			shortIdDisplay = url_id;
			qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=https://sptfy.in/${shortIdDisplay}`;
			inputText = '';
			customShortId = '';

			toast.promise(promise, {
				class: 'my-toast',
				description: 'The link has been shortened!',
				loading: 'Loading...',
				success: (data) => {
					return 'Success 🥳 ';
				},
				error: (err) => {
					return 'Error... :( Try again!';
				}
			});
			reset?.();
			promiseResolve();
			loading = false;
			fullShortURL = `https://${selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`}/${url_id}`;
			if (isMobile) {
				scrollToBottom();
			}
		} catch (err) {
			loading = false;
			errorMessage = err.response?.data;
			errorCode = err.response?.status;
			console.log('Error status:', err.response?.status);
			console.log('Error data:', err.response?.data);

			// default error fallback
			alertDialogTitle = strings.ErrorCreateRecordTitle;
			alertDialogDescription = strings.ErrorCreateRecordDesc;

			if (err.response?.status === 400) {
				const errorData = err.response?.data;
				console.log('Error data:', errorData);
				console.log('why')
				// Handle turnstile verification error
				if (errorData?.verification) {
					const verification = errorData.verification;
					errorIcon = strings.ErrorTurnstileValidationIcon;
					alertDialogTitle = strings.ErrorTurnstileValidationTitle;
					alertDialogDescription = strings.ErrorTurnstileValidationDesc;
					reset?.(); // Reset the turnstile widget
				}
				// Handle duplicate short URL error
				else if (errorData.id_url?.code === 'validation_not_unique') {
					errorIcon = strings.ErrorCustomShortIdExistsIcon;
					alertDialogTitle = strings.ErrorCustomShortIdExistsTitle;
					alertDialogDescription = strings.ErrorCustomShortIdExistsDesc;
				}
				// Handle empty input error
				else if (isInputTextEmpty) {
					alertDialogTitle = strings.ErrorCreatedRecordNoInputTitle;
					alertDialogDescription = strings.ErrorCreatedRecordNoInputDesc;
				}		
			} else if (err.response?.status === 429) {
				// Handle rate limiting error
				errorIcon = strings.ErrorRateLimitIcon;
				alertDialogTitle = strings.ErrorRateLimitTitle;
				alertDialogDescription = strings.ErrorRateLimitDesc;
			}

			isError = true;
		}
	};

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
	// const handleKeydown = (e) => {
       
    //     if (e.metaKey || e.ctrlKey || e.key === "/") {
    //         urlInput.focus();
    //     }


    //     if (e.target === urlInput) {
    //         return;
    //     }


    // };

	// $: console.log('isDrawer open' + qrDrawerOpen);
	// console.log(generateRandomURL());
	// $: console.log(selected.value)
	// $: console.log(turnstileResponse)
	// $: console.log('isInput: ' + isInputTextEmpty)
</script>

<!-- <div class="flex flex-col items-center justify-center">
	<h1
		class="ss03 hidden translate-y-[12rem] font-jak-display text-8xl font-bold text-primary
    lg:block 
    lg:flex-none"
	>
		Sptfy.in
	</h1>
	<h3 class="text-lg hidden translate-y-[12rem] pt-5 text-white 
  lg:block 
  lg:flex-none">
		by <a href="https://instagram.com/raaharja" target="_blank">raaharja</a>
	</h3>
</div> -->

<svelte:head>
	<!-- <title>
		sptfy.in - free spotify link shortener
	</title>	 -->
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:image" content="https://raw.githubusercontent.com/ayamkv/sptfyin/refs/heads/main/src/lib/images/og/og.png">
	<meta name="twitter:creator" content="@sptfyin">
	<meta name="twitter:description" content="make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸">
	<meta name="twitter:title" content="sptfyin - free spotify link shortener">
	<meta name="twitter:image:alt" content="sptfyin - free spotify link shortener">
	

	<MetaTags
  title="free spotify link shortener"
  titleTemplate="sptfy.in - %s"
  description="make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸"
  canonical="https://www.sptfy.in/"
  openGraph={{
	type: 'website',
    url: 'https://www.sptfy.in/',
    title: 'free spotify link shortener',
    description: "make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸",
    images: [
      {
        url: 'https://raw.githubusercontent.com/ayamkv/sptfyin/refs/heads/main/src/lib/images/og/og.png',
        width: 800,
        height: 600,
        alt: 'sptfyin - free spotify link shortener'
      }
    ],
    siteName: 'sptfyin'
  }}

/>
</svelte:head>


{#if browser}
 <script src="https://uptime.betterstack.com/widgets/announcement.js" data-id="207251" async="async" type="text/javascript"></script>
{/if}
<!-- 
<svelte:window on:keydown={handleKeydown} /> -->
<div
	class="mt-0 flex md:min-h-[96vh] flex-col items-center justify-center bg-background border md:rounded-xl sm:pb-0 pb-12"
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
				<AlertDialog.Title class="text-center">
					{#if (errorMessage)}
						{#each Object.entries(errorMessage) as [key, value]}
						   {typeof value === 'object' ? JSON.stringify(value.message).slice(1, -1) : alertDialogTitle}
					   
					  {/each}
					{:else}
						{@html alertDialogTitle}
					{/if}
					
				</AlertDialog.Title>

				<AlertDialog.Description>
					{@html alertDialogDescription}
					<!-- iterate errorMessage
					using something along the lines of
					
for (var key in object) {
  if (object.hasOwnProperty(key)) {
    alert(key); // 'a'
    alert(object[key]); // 'hello'
  }
}   
  in a svelte way 


					-->
					<p class="mt-2 text-xs text-foreground/60">
						{#if (errorMessage)}
						 {#each Object.entries(errorMessage) as [key, value]}
   
						    <b>error id: </b>{typeof value === 'object' ? JSON.stringify(value.code) : value} <br>
						       <b>error message: </b>{typeof value === 'object' ? JSON.stringify(value.message) : value}
						   
						  {/each}
						<span><b>error code: </b> {errorCode ? errorCode : ''}</span>
						{/if}
						<br>
					</p>
					
					
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Action class="min-w-full font-semibold" on:click={() => (isError = false)}
					>okay, got it</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<Dialog.Root class="lg:hidden lg:flex-none">
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
		<h1
			class="ss03 font-jak-display text-2xl font-bold text-primary lg:block lg:text-8xl
		"
		>
			Sptfy.in
		</h1>
		<h3
			class="text-xs lg:text-lg mt-2 lg:mt-4
		text-white
		"
		>
		₍^. .^₎⟆ {formatNumber(totalLinkCreated)} links created
			<!-- by <a href="https://instagram.com/raaharja" target="_blank">raaharja</a> -->
		</h3>

		{#if debugMode === 'true'}
			<h3
				class="text-lg mt-4 flex justify-center rounded-lg bg-orange-300 px-4 py-2 align-middle text-black"
			>
				Debug Mode is Active!
			</h3>

			<!-- Button toggle to change fullShortURL to true or false -->
			<div>
				<Label for="fullShortURL" class="my-2"
					>{fullShortURL ? 'fullShortURL ON' : `fullShortURL OFF`}</Label
				>
				<Switch id="fullShortURL" bind:checked={fullShortURL} class="mt-4"></Switch>
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
								<h4 class="text-lg">{group.title}</h4>
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

	<div
		class="flex
		lg:w-full
		w-[23rem]
		flex-col items-center
		justify-center
		px-6
		py-6

		lg:ml-0
		lg:mr-4
		lg:flex-row
		lg:items-start
		lg:px-0
		lg:py-10
		[&:not(:first-child)]:gap-6
		
		"
	>
		<!-- <div class="mobile flex flex-col gap-4 lg:gap-0"> -->
			<Card.Root class="w-[23rem] md:h-[33rem]   lg:w-[25rem]">

				<Card.Content class="grid gap-4 pb-0 pt-6">
					<div>
						<form on:submit|preventDefault={handleSubmit} class="flex w-[8rem] min-w-full flex-col">
							<Label for="url" class="my-2">paste your long ass URL here</Label>
							<div class="align-center mb-2 flex w-full min-w-full items-center space-x-3">
								<Input
									type="url"
									on:paste={handleInputOnPaste}
									id="url"
									placeholder="https://open.spotify.com/xxxx...."
									bind:value={inputText}
									class="placeholder:translate-y-[2px]"
									required
									autofocus
								/>
								<Button
									type="button"
									id="paste"
									class="paste-button hover:bg-primary hover:text-black hover:from-[#afffdc]/20"
									variant="ghost2"
									on:click={() => handlePaste()}
								>
									<iconify-icon width="20" class="w-[20px]" icon="lucide:clipboard-copy">
									</iconify-icon>
								</Button>
							</div>

							<Label for="domainSelect" class="my-2">select domain</Label>
							<Select.Root
								portal={null}
								id="domainSelect"
								name="domainSelect"
								bind:selected
								asChild
							>
							<!-- bind:open={focus1} -->
								<Select.Trigger class="">
									<Select.Value placeholder="domain: sptfy.in" selected="sptfy.in" />
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>select domain</Select.Label>
										{#each domainList as domain}
											<Select.Item
												value={domain.value}
												label={domain.label}
												on:click={() => escapeSelectHandle()}
												disabled={domain.disabled}>{domain.label}</Select.Item
											>
										{/each}
									</Select.Group>
								</Select.Content>
								<Select.Input name="sptfy.in" />
							</Select.Root>
							<!-- <Separator class="my-2"/> -->

							<Accordion.Root class="" value={accordionValue} onValueChange={setAccordionValue}>
								<Accordion.Item value="item-1" class>
									<Accordion.Trigger>customize slug / back-half <i class="text-foreground/80">(optional)</i></Accordion.Trigger>
									<Accordion.Content>
										
										<div
											class="align-center mb-4 flex w-full max-w-[25rem] flex-col items-center space-x-2"
										>
											<!-- custom url -->
											<Input
												minlength="4"
												maxlength="80"
												type="text"
												id="short_id"
												placeholder="coolplaylist4"
												bind:value={customShortId}
												on:input={handleCustomUrl}
											/>
										</div>
									</Accordion.Content>
								</Accordion.Item>
							</Accordion.Root>

							<div class="max-h-[64px] max-w-[300px]">
								{#if !visible}
									<Skeleton class="h-[64px] w-[300px]" />
								{:else}
									<Turnstile
										class="relative inline-block h-[64px] w-[300px]"
										siteKey={turnstileKey}
										theme="dark"
										retry="auto"
										bind:reset
										on:callback={(event) => {
											turnstileResponse = event.detail.token;
											//  validateToken(turnstileResponse)
										}}
									/>
								{/if}
							</div>
							<div class="mt-4">
								<Button
								class="submit-button align-center m-auto flex w-full flex-row items-center justify-center text-center
								{loading ? 'bg-secondary text-foreground shadow-lg':''}
								transition-all"
								type="submit"
								bind:this={theButton}
								disabled={loading}
								>
								<div class="flex-none flex items-center justify-center pr-2">
								<iconify-icon
								icon={loading ? "lucide:loader" : "lucide:scissors"}
								class="m-auto block h-[18px] w-[18px] text-center {loading ? 'animate-spin [transform-origin:center]' : ''}"
								width="18"
								alt="emoji"
								></iconify-icon>
								</div>
								<span>{loading ? "loading..." : "short It!"}</span>
								</Button>
							</div>
						</form>
						<div class="continue mt-4">
							
							<p class="text-xs text-foreground/60">
								by continuing, you agree to 
								<a href="/about/privacy" >privacy policy</a> and 
								<a href="/about/terms" >terms of ethical use</a>.
							</p>
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex-col"></Card.Footer>
			</Card.Root>
			<div class="right-cards flex flex-col w-[23rem] lg:w-[25rem] gap-6 ">
			<Card.Root class="w-[23rem]   lg:w-[25rem]">
				<Card.Header>
					<Card.Title>url preview</Card.Title>
					<Card.Description>here's how your URL will look like</Card.Description>
					<Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
						<div
							class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all lg:h-28 lg:py-2"
						>
							<p class="break-all text-[1.44rem] font-semibold lg:text-5xl">
							{selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`}/<span class="text-[#82d1af]">{shortIdDisplay}</span>
							</p>
							{#if fullShortURL}
								<div class="buttons button-copy flex max-h-20 gap-1 lg:flex-col-reverse">
									{#each actions as action, i}
										<div
											in:scaleWithEase|global={{ delay: (i + 1) * 100 }}
											out:fade|global={{ duration: 200 }}
										>
											<Button
												variant="secondary"
												class="p-3 hover:bg-primary hover:text-black lg:mx-0"
												on:click={action.click}
											>
												<iconify-icon icon={action.icon} class="w-[24]" width="24"> </iconify-icon>
											</Button>
										</div>
									{/each}
								</div>
							{/if}
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
														class="w-[200px] min-w-[50%] rounded-lg shadow-lg lg:w-[350px] lg:min-w-[20%]"
														on:load={() => (isQrLoaded = true)}
														transition:fade={{ duration: 1200 }}
														src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=https://sptfy.in/{shortIdDisplay}"
														alt="QR Code"
														height="350"
														width="350"
													/>
													{#if !isQrLoaded}
														<Skeleton
															class="absolute left-0 top-0 h-[200px] w-[200px] lg:h-[350px] lg:w-[350px]"
														/>
													{/if}
												</div>
											</div>
										</Drawer.Description>
									</Drawer.Header>
									<Drawer.Footer>
										<Drawer.Close
											class="flex w-full flex-col items-center justify-center gap-2 align-middle lg:flex-row"
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
																	anchor.setAttribute('download', `sptfyin_qr_${shortIdDisplay}.png`);
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
													w-[200px] flex-row items-center justify-center text-center transition-all lg:w-[360px] "
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
													class="my-1 w-[200px] transition-all lg:w-[360px]"
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
						
					</Card.Content>
					<div class="disclaim">
						<h4 class="bold text-lg">🫡 disclaimer</h4>
						<p class="text-xs text-foreground/60">
							Spotify® is a registered trademark of Spotify AB.<br />
							this project <b>is NOT AFFILIATED</b> with, endorsed by, or sponsored by Spotify AB.<br
							/>
							<i>(TL;DR: not officialy from spotify)</i>
						</p>
					</div>
					<div class="footer text-left mt-4">
						<p class="text-xs text-foreground/60 flex flex-row gap-4">
							<a href="/about/terms">terms of ethical use</a> | <a href="/about/privacy">privacy policy</a> | <a href="/about/socials">socials / contact</a> | <a href="https://status.sptfy.in" target="_blank">server status</a>
						</p>
					</div>
				</Card.Header>
			</Card.Root>
			
					<Card.Root class="w-[23rem] lg:w-[25rem] lg:h-[9.8rem] h-[10rem]">
				<Card.Content>
					<div class="pt-6 flex justify-between items-center">
						<h3 class="text-lg font-bold">🔗 recent created links</h3>
						<Button variant="ghost2" on:click={() => goto('/recent')}>
							view all
						</Button>
					</div>
					<div class="mt-2">
						{#await records}
							<p>awaiting...</p>
						{:then records}
							<div class="max-h-fit break-all">
								{#each records.slice(0, 2) as item}
									<li class="align-center my-1 flex justify-between pl-1" in:slide|global>
										<a href='/{item.id_url}' class="font-thin" target="_blank">
											<span class="text-muted-foreground/70 px-0">
												{item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/</span><span>{item.id_url}</span>
										</a>
										<span class="ml-2 text-muted-foreground/70">
											{localizeDate(item.created)}
										</span>
									</li>
								{/each}
							</div>
						{:catch error}
							<p>error</p>
						{/await}
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>


<style>
	:global(.betteruptime-announcement) {
		border-radius: 0.7em !important;
		background: rgba(20 17 34 / 0.43) !important;
		color: #FFFFFF !important;
		font-size: 14px !important;
		line-height: 1.5 !important;
		padding: 14px 16px !important;
		/* m */
		top: 0 !important;
		margin-top: 2em !important;
		text-align: left !important;
		padding: 1.5em !important;
		left: 10% !important;
		right: 2% !important;
		backdrop-filter: blur(10px) !important;
		outline: 1px solid rgba(255, 255, 255, 0.178) !important;
		width: 80% !important;
		max-width: 80% !important;
		z-index: 999999 !important;
		font-family: inherit !important;
	}

	:global(.betteruptime-announcement__message) {
		text-align: left !important;
		padding-left: 4px !important;
		padding-right: 45px !important;
	}

	:global(.betteruptime-announcement a) {
		color: rgba(255 255 255 / 0.43) !important;	
		outline: 1px solid rgba(255, 255, 255, 0.178) !important;
		backdrop-filter: blur(10px) !important;
		text-decoration: underline !important;
	}

	:global(.betteruptime-announcement a:hover) {
		color: black !important;
		background: rgb(255, 255, 255) !important;
		outline: 1px solid rgba(255, 255, 255, 0.178) !important;
		backdrop-filter: blur(10px) !important;
		text-decoration: underline !important;
	}

	:global(.betteruptime-announcement__close) {
		position: absolute;
		top: 0;
		right: 0;
		margin-top: 1em;
		margin-right: 1em;
		padding: 0.5em !important;
		z-index: 10;
	}
</style>