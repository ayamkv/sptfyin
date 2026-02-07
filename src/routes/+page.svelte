<script>
	import { preventDefault } from 'svelte/legacy';

	import { Button } from '$lib/components/ui/button';
	import { browser } from '$app/environment';
	import { Turnstile } from 'svelte-turnstile';
	import { fade, slide } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { expoOut } from 'svelte/easing';
	import {
		createRecord,
		getTotalClicks,
		getRecentRecords,
		getTopLinks,
		generateRandomURL,
		isSlugAvailable
	} from '$lib/pocketbase';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	// import { generateRandomURL } from "$lib/utils";
	import {
		localizeDate,
		findUrl,
		createLoadObserver,
		isSpotifyShortLink,
		formatNumber
	} from '$lib/utils';
	import { WithEase } from '$lib/animations/customSpring';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';

	import * as Accordion from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import 'iconify-icon';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { strings } from '$lib/localization/languages/en.json';
	import { onMount } from 'svelte';

	import { toastGroups } from '$lib/debug';
	import BackgroundNoise from '$lib/components/BackgroundNoise.svelte';

	let debugMode = import.meta.env.VITE_DEBUG_MODE;
	console.log('debugMode: ', debugMode);
	let debugToastVisible = $state(false);
	let isQrLoaded = $state(false);
	let visible = $state(false);
	let scrollHere = $state();
	let accordionValue = $state('one');
	let customShortId = $state();
	let turnstileResponse = $state();
	let isIOS, isAndroid, isMobile, isSafari, isFirefox, isOldFirefox;
	let records = $state([]);
	let topRecords = $state([]);
	let activeTab = $state('recent');
	let rrecords;
	let recordsPromise;
	let error = null;
	let loading = $state(false);
	let recentLoading = $state(true);
	let topLoading = $state(false);
	let currentItems = 4;
	let turnstileKey = import.meta.env.VITE_CF_SITE_KEY;
	let reset = $state();
	let preGeneratedUrlId = $state();
	let lastCreatedShortId = $state();

	// Domain selection must be defined before QR derivations
	let selected = $state({ value: 'sptfy.in', label: 'default: sptfy.in/' });
	const domainList = [
		{ value: 'sptfy.in', label: 'sptfy.in' },
		{ value: 'artist', label: 'artist.sptfy.in', disabled: false },
		{ value: 'profile', label: 'profile.sptfy.in', disabled: false },
		{ value: 'playlist', label: 'playlist.sptfy.in', disabled: false },
		{ value: 'track', label: 'track.sptfy.in', disabled: false },
		{ value: 'COMING SOON', label: '--- COMING SOON ---', disabled: true },
		{ value: 'album', label: 'album.sptfy.in', disabled: true }
	];
	$effect(() => {
		console.log('domain selected: ', selected);
	});

	// Make shortIdDisplay reactive to show either custom slug or generated URL
	let shortIdDisplay = $derived(
		customShortId && customShortId.length > 0
			? customShortId
			: lastCreatedShortId || preGeneratedUrlId || '****'
	);

	// Reactive slug sanitization - automatically sanitizes customShortId when it changes
	let sanitizedCustomShortId = $derived(
		!customShortId
			? ''
			: customShortId
					.toLowerCase()
					.replace(/[^a-zA-Z0-9\-_]/g, '-')
					// Remove multiple consecutive hyphens/underscores
					.replace(/[-_]{2,}/g, '-')
					// Remove leading/trailing hyphens/underscores
					.replace(/^[-_]+|[-_]+$/g, '')
	);

	// Function to update customShortId with sanitized value
	function updateCustomShortId(value) {
		if (!value) {
			customShortId = '';
			return;
		}

		const sanitized = value
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\-_]/g, '-')
			// Remove multiple consecutive hyphens/underscores
			.replace(/[-_]{2,}/g, '-')
			// Remove leading/trailing hyphens/underscores
			.replace(/^[-_]+|[-_]+$/g, '');

		customShortId = sanitized;
	}
	let qrDomain = $derived(
		selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`
	);
	let qrUrl = $derived(
		`https://api.qrserver.com/v1/create-qr-code?size=350x350&margin=20&data=https://${qrDomain}/${shortIdDisplay}`
	);
	let inputText = $state(null);
	let isError = $state(false);
	let alertDialogTitle = $state('');
	let alertDialogDescription = $state('');
	let errorIconDefault = 'fluent-emoji:crying-cat';
	let errorIcon = $state(errorIconDefault);
	let errorCode = $state();
	let focus1 = false;
	let theButton = $state();
	let fullShortURL = $state();
	let qrDrawerOpen = $state(false);
	let recent = [];
	let urlInput;
	let errorMessage = $state();
	let isExpandingUrl = $state(false);
	$effect(() => {
		console.log('errorMessage var: ', errorMessage);
	});

	// Debug inputText reactivity
	$effect(() => {
		console.log('inputText changed:', inputText, 'isEmpty:', isInputTextEmpty);
	});
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

	let isInputTextEmpty = $derived(
		inputText === null || inputText === '' || inputText === undefined
	);

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
	let totalLinkCreated = $state();
	let totalClicks = $state();

	async function fetchData() {
		recentLoading = true;
		try {
			const response = await getRecentRecords();
			records = response.items;
			totalLinkCreated = response.totalItems;
		} catch (error) {
			console.error(error);
			errorMessage = 'An error occurred while fetching data.'; // Added error message handling
		} finally {
			recentLoading = false;
		}

		try {
			const cresponse = await getTotalClicks();
			totalClicks = cresponse.totalItems;

			console.log('Analytics Records: ', cresponse);
		} catch (error) {
			console.error(error);
			errorMessage = 'An error occurred while fetching data.'; // Added error message handling
		}
	}

	async function fetchTopLinks() {
		topLoading = true;
		try {
			const response = await getTopLinks(2, 1);
			topRecords = response.items;
		} catch (error) {
			console.error('Error fetching top links:', error);
		} finally {
			topLoading = false;
		}
	}
	onMount(async () => {
		// Generate random URL on page load
		preGeneratedUrlId = await generateRandomURL();
		console.log(preGeneratedUrlId);

		recordsPromise = await fetchData();
		rrecords = records;

		// Fetch top links for the leaderboard tab
		await fetchTopLinks();
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

	/**
	 * Expand a shortened Spotify URL (spotify.link) to the full open.spotify.com URL
	 * @param {string} url - The URL to expand
	 * @returns {Promise<string|null>} - The expanded URL or null if expansion failed
	 */
	async function expandSpotifyUrl(url) {
		if (!isSpotifyShortLink(url)) {
			return url; // Not a short link, return as-is
		}

		console.log('[Main] Expanding spotify.link URL:', url);
		isExpandingUrl = true;

		try {
			const response = await fetch('/api/expand-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[Main] URL expansion failed:', error);
				toast.error('Failed to expand link', {
					description: error.message || 'Could not resolve the Spotify link'
				});
				return null;
			}

			const data = await response.json();
			console.log('[Main] URL expanded:', data);

			if (data.wasExpanded) {
				toast.success('Link expanded!', {
					description: 'Spotify short link resolved successfully'
				});
			}

			return data.expanded;
		} catch (error) {
			console.error('[Main] URL expansion error:', error);
			toast.error('Failed to expand link', {
				description: 'Network error while resolving the link'
			});
			return null;
		} finally {
			isExpandingUrl = false;
		}
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

				let extractedUrl = findUrl(clipboardContent);

				// Check if it's a spotify.link that needs expansion
				if (extractedUrl && isSpotifyShortLink(extractedUrl)) {
					inputText = extractedUrl; // Show the short link while expanding
					setAccordionValue('item-1');
					focus1 = true;

					const expandedUrl = await expandSpotifyUrl(extractedUrl);
					if (expandedUrl) {
						inputText = expandedUrl;
					} else {
						// Expansion failed, clear the input
						inputText = null;
					}
					return;
				}

				setTimeout(() => {
					inputText = extractedUrl;
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
				alert(
					'Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔'
				);
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
			console.log(text);
			let extractedUrl = findUrl(text);

			// Check if it's a spotify.link that needs expansion
			if (extractedUrl && isSpotifyShortLink(extractedUrl)) {
				inputText = extractedUrl; // Show the short link while expanding
				setAccordionValue('item-1');

				const expandedUrl = await expandSpotifyUrl(extractedUrl);
				if (expandedUrl) {
					inputText = expandedUrl;
				} else {
					// Expansion failed, show error
					inputText = null;
					isError = true;
					alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
					alertDialogDescription = 'Could not resolve the Spotify short link';
					errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
				}
				return;
			}

			inputText = extractedUrl;
			setTimeout(() => {
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

	const protectedRoutes = [
		'recent',
		'top',
		'about',
		'terms',
		'privacy',
		'login',
		'prev',
		'dash',
		'debug',
		'api',
		'admin'
	];

	// Realtime slug availability state and helpers
	let slugAvailable = $state(null);
	let slugChecking = $state(false);
	let slugCheckError = $state('');
	let lastSlugCheckId = 0;
	let slugCheckTimeout;

	let isCustomSlugProvided = $derived(
		!!sanitizedCustomShortId && sanitizedCustomShortId.length > 0
	);
	let reservedSlug = $derived(
		isCustomSlugProvided && protectedRoutes.includes(sanitizedCustomShortId)
	);

	let slugInputClass = $derived(
		!isCustomSlugProvided
			? ''
			: sanitizedCustomShortId.length < 4 || reservedSlug || slugAvailable === false
				? 'border-red-500 focus-visible:ring-red-500'
				: slugChecking
					? 'border-yellow-400 focus-visible:ring-yellow-400'
					: slugAvailable === true
						? 'border-emerald-400 focus-visible:ring-emerald-400'
						: ''
	);

	let customSlugInvalidOrChecking = $derived(
		isCustomSlugProvided &&
			(sanitizedCustomShortId.length < 4 ||
				reservedSlug ||
				slugChecking ||
				slugAvailable === false ||
				!!slugCheckError)
	);
	let buttonDisabled = $derived(loading || customSlugInvalidOrChecking);

	// Debounced availability check when sanitizedCustomShortId changes
	$effect(() => {
		const slug = sanitizedCustomShortId;

		if (slugCheckTimeout) {
			clearTimeout(slugCheckTimeout);
			slugCheckTimeout = null;
		}

		slugCheckError = '';

		if (!slug) {
			slugAvailable = null;
			slugChecking = false;
			return;
		}

		if (slug.length < 4) {
			slugAvailable = null;
			slugChecking = false;
			return;
		}

		if (protectedRoutes.includes(slug)) {
			slugAvailable = false;
			slugChecking = false;
			return;
		}

		const runId = ++lastSlugCheckId;
		slugChecking = true;
		slugCheckTimeout = setTimeout(async () => {
			try {
				const available = await isSlugAvailable(slug);
				if (runId !== lastSlugCheckId) return;
				slugAvailable = available;
			} catch (err) {
				if (runId !== lastSlugCheckId) return;
				console.error('slug check failed', err);
				slugCheckError = 'check_failed';
				slugAvailable = null;
			} finally {
				if (runId === lastSlugCheckId) {
					slugChecking = false;
				}
			}
		}, 350);
	});

	const handleSubmit = async (e) => {
		const promise = new Promise(function (resolve, reject) {
			promiseResolve = resolve;
			promiseReject = reject;
		});
		loading = true;

		// Use sanitized version for validation and submission
		const finalCustomShortId = sanitizedCustomShortId;

		if (protectedRoutes.includes(finalCustomShortId)) {
			isError = true;
			alertDialogTitle = strings.ErrorCustomShortIdRouteTitle;
			alertDialogDescription = strings.ErrorCustomShortIdRouteDesc;
			errorIcon = strings.ErrorCustomShortIdRouteIcon;
			loading = false;
			return;
		}

		let url_id = finalCustomShortId;

		if (!finalCustomShortId) {
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
			const originalInputText = inputText; // Store before clearing
			const response = await createRecord('random_short', dataForm, turnstileResponse);
			console.log('Record created');
			inputText = '';
			customShortId = '';
			lastCreatedShortId = url_id;

			// Add newly created link to recent records (prepend and keep only 2)
			const newRecord = {
				id_url: url_id,
				from: originalInputText,
				created: new Date().toISOString(),
				subdomain: selected.value
			};
			records = [newRecord, ...records].slice(0, 2);
			totalLinkCreated = (totalLinkCreated || 0) + 1;

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
				console.log('why');
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
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:image"
		content="https://raw.githubusercontent.com/ayamkv/sptfyin/refs/heads/main/src/lib/images/og/og.png"
	/>
	<meta name="twitter:creator" content="@sptfyin" />
	<meta
		name="twitter:description"
		content="make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸"
	/>
	<meta name="twitter:title" content="sptfyin - free spotify link shortener" />
	<meta name="twitter:image:alt" content="sptfyin - free spotify link shortener" />

	<!-- svelte-meta-tags is not yet Svelte 5-ready; inline basic SEO instead -->
	<title>sptfy.in - free spotify link shortener</title>
	<meta
		name="description"
		content="make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸"
	/>
	<link rel="canonical" href="https://www.sptfy.in/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.sptfy.in/" />
	<meta property="og:title" content="free spotify link shortener" />
	<meta
		property="og:description"
		content="make your Spotify URLs looks clean with sptfy.in, without ads, paywalls or other nonsense. just paste the link and you're done!😸"
	/>
	<meta
		property="og:image"
		content="https://raw.githubusercontent.com/ayamkv/sptfyin/refs/heads/main/src/lib/images/og/og.png"
	/>
</svelte:head>

{#if browser}
	<script
		src="https://uptime.betterstack.com/widgets/announcement.js"
		data-id="207251"
		async="async"
		type="text/javascript"
	></script>
{/if}
<!-- 
<svelte:window on:keydown={handleKeydown} /> -->
<div
	class=" flex h-[85vh] flex-col items-center justify-center overflow-auto rounded-2xl border-b-4 bg-background/50 pb-0 md:mt-0 md:rounded-xl md:border md:pb-0 lg:min-h-[96vh] lg:overflow-hidden"
	data-vaul-drawer-wrapper
>
	<!-- Background decorations applied to the drawer wrapper -->

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
					{#if errorMessage}
						{#each Object.entries(errorMessage) as [key, value] (key)}
							{typeof value === 'object'
								? JSON.stringify(value.message).slice(1, -1)
								: alertDialogTitle}
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
						{#if errorMessage}
							{#each Object.entries(errorMessage) as [key, value] (key)}
								<b>error id: </b>{typeof value === 'object' ? JSON.stringify(value.code) : value}
								<br />
								<b>error message: </b>{typeof value === 'object'
									? JSON.stringify(value.message)
									: value}
							{/each}
							<span><b>error code: </b> {errorCode ? errorCode : ''}</span>
						{/if}
						<br />
					</p>
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Action class="min-w-full font-semibold" onclick={() => (isError = false)}
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

	<div class="logo mt-[20em] flex flex-col items-center justify-center md:mt-[2em]">
		<!-- Sticker-style stats badges positioned around the title -->
		<div class="relative">
			<!-- Cat sticker - top left -->
			<Badge
				variant="outline"
				class="absolute -left-8 -top-10 rotate-[-8deg] border-primary/50 bg-background/80 text-base backdrop-blur-sm transition-transform hover:rotate-[-4deg] hover:skew-x-6 hover:scale-110 md:-left-12 md:top-5 md:text-lg"
			>
				₍^. .^₎⟆
			</Badge>

			<!-- Links created sticker - top right -->
			<Badge
				variant="outline"
				class="absolute -right-4 -top-1 rotate-[6deg] border-primary/50 bg-background/80 backdrop-blur-sm transition-transform hover:rotate-[2deg] hover:-skew-x-6 hover:scale-110 md:-right-12 md:top-4"
			>
				<iconify-icon icon="lucide:link" class="mr-1 size-3 md:size-4"></iconify-icon>
				<span class="text-xs md:text-sm">{formatNumber(totalLinkCreated)}</span>
			</Badge>

			<!-- Main title -->
			<h1 class="ss03 font-jak-display text-2xl font-bold text-primary lg:block lg:text-8xl">
				sptfy.in
			</h1>

			<!-- Links clicked sticker - bottom left -->
			<Badge
				variant="outline"
				class="transform-flat skew-0 hover:skew-12 absolute -bottom-3 -left-2 rotate-[-4deg] 
				border-primary/50
				bg-background/80 
				backdrop-blur-sm
				transition-transform
				hover:rotate-3 hover:scale-110 md:-bottom-4 md:left-20"
			>
				<iconify-icon icon="lucide:pointer" class="mr-1 size-3 md:size-4"></iconify-icon>
				<span class="text-xs md:text-sm">{formatNumber(totalClicks)}</span>
			</Badge>
		</div>

		{#if debugMode === 'true'}
			<h3
				class="mt-4 flex justify-center rounded-lg bg-orange-300 px-4 py-2 align-middle text-lg text-black"
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
						onclick={() => (debugToastVisible = !debugToastVisible)}
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
										<Button class={btn.class} onclick={btn.onClick}>
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
		w-[23rem]
		flex-col
		items-center justify-center
		px-6
		py-6
		lg:ml-0

		lg:mr-4
		lg:w-full
		lg:flex-row
		lg:items-start
		lg:px-0
		lg:py-10
		[&:not(:first-child)]:gap-6
		
		"
	>
		<!-- <div class="mobile flex flex-col gap-4 lg:gap-0"> -->
		<Card.Root class="w-[23rem] md:min-h-[22rem]   lg:w-[25rem]">
			<Card.Content class="grid gap-4 pb-0 pt-6">
				<div>
					<form onsubmit={preventDefault(handleSubmit)} class="flex w-[8rem] min-w-full flex-col">
						<Label for="url" class="my-2">paste your long ass URL here</Label>
						<div class="align-center mb-2 flex w-full min-w-full items-center space-x-3">
							<Input
								type="url"
								on:paste={handleInputOnPaste}
								id="url"
								placeholder={isExpandingUrl
									? 'Expanding link...'
									: 'https://open.spotify.com/xxxx....'}
								bind:value={inputText}
								class="placeholder:translate-y-[2px]"
								required
								autofocus
								disabled={isExpandingUrl}
							/>
							<Button
								type="button"
								id="paste"
								class="paste-button hover:bg-primary hover:from-[#afffdc]/20 hover:text-black"
								variant="ghost2"
								onclick={() => handlePaste()}
								disabled={isExpandingUrl}
							>
								<iconify-icon width="20" class="w-[20px]" icon="lucide:clipboard-copy">
								</iconify-icon>
							</Button>
						</div>

						<!-- <Separator class="my-2"/> -->

						<Accordion.Root class="" value={accordionValue} onValueChange={setAccordionValue}>
							<Accordion.Item value="item-1" class>
								<Accordion.Trigger>
									<p>customize <i class="text-foreground/80">(optional)</i></p></Accordion.Trigger
								>
								<Accordion.Content>
									<div class="grid grid-cols-2 grid-rows-1 gap-1">
										<Select.Root portal={null} name="domainSelect" bind:value={selected}>
											<!-- bind:open={focus1} -->
											<Select.Trigger class="">
												{selected?.label || 'domain: sptfy.in/'}
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													<Select.Label>select domain :</Select.Label>
													{#each domainList as domain}
														<Select.Item
															value={domain}
															label="{domain.label}/"
															onclick={() => escapeSelectHandle()}
															disabled={domain.disabled}>{domain.label}</Select.Item
														>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
										<div
											class="align-center mb-4 flex w-full max-w-[25rem] flex-col items-center space-x-2"
										>
											<!-- custom url -->
											<Input
												minlength="4"
												maxlength="80"
												type="text"
												id="short_id"
												placeholder={shortIdDisplay}
												bind:value={customShortId}
												on:input={(e) => updateCustomShortId(e.currentTarget.value)}
												class={'placeholder:translate-y-[2px] ' + slugInputClass}
											/>
											{#if isCustomSlugProvided}
												<p class="mt-1 w-full text-left text-xs">
													{#if sanitizedCustomShortId.length < 4}
														<span class="text-red-400">{strings.SlugMinChars}</span>
													{:else if reservedSlug}
														<span class="text-red-400">{strings.SlugReserved}</span>
													{:else if slugChecking}
														<span class="text-yellow-300">{strings.SlugChecking}</span>
													{:else if slugCheckError}
														<span class="text-yellow-300">{strings.SlugCheckFailed}</span>
													{:else if slugAvailable === true}
														<span class="text-emerald-400">{strings.SlugAvailable}</span>
													{:else if slugAvailable === false}
														<span class="text-red-400">{strings.SlugTaken}</span>
													{/if}
												</p>
											{/if}
										</div>
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
								{loading ? 'bg-secondary text-foreground shadow-lg' : ''}
								transition-all"
								type="submit"
								bind:this={theButton}
								disabled={buttonDisabled}
							>
								<div class="flex flex-none items-center justify-center pr-2">
									<iconify-icon
										icon={loading ? 'lucide:loader' : 'lucide:scissors'}
										class="m-auto block h-[18px] w-[18px] text-center {loading
											? 'animate-spin [transform-origin:center]'
											: ''}"
										width="18"
										alt="emoji"
									></iconify-icon>
								</div>
								<span>{loading ? 'loading...' : 'short It!'}</span>
							</Button>
						</div>
					</form>
					<div class="continue mt-4">
						<p class="text-xs text-foreground/60">
							by continuing, you agree to
							<a href="/about/privacy">privacy policy</a> and
							<a href="/about/terms">terms of ethical use</a>.
						</p>
					</div>
				</div>
			</Card.Content>
			<Card.Footer class="flex-col"></Card.Footer>
		</Card.Root>
		<div class="right-cards flex w-[23rem] flex-col gap-6 lg:w-[25rem]">
			<Card.Root class="w-[23rem]   lg:w-[25rem]">
				<Card.Header>
					<Card.Title>url preview</Card.Title>
					<Card.Description>here's how your URL will look like</Card.Description>
					<Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
						<div
							class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all lg:h-28 lg:py-2"
						>
							<p class="break-all text-[1.44rem] font-semibold lg:text-5xl">
								{selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`}/<span
									class="text-[#82d1af]">{shortIdDisplay}</span
								>
							</p>
							{#if fullShortURL}
								<div class="buttons button-copy flex max-h-20 gap-1 lg:flex-col-reverse">
									{#each actions as action, i}
										<div
											in:WithEase|global={{ delay: (i + 1) * 100 }}
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
							<div class="grid w-full grid-cols-2 gap-2">
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
															class="w-[200px] min-w-[50%] rounded-b-lg shadow-lg lg:w-[350px] lg:min-w-[20%]"
															onload={() => (isQrLoaded = true)}
															transition:fade={{ duration: 1200 }}
															src={qrUrl}
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
													<div in:WithEase>
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
								<Button
									variant="secondary"
									class="button-show-clicks w-full"
									on:click={() => window.open(`${fullShortURL}/s`, '_blank')}
								>
									<div class="flex-none">
										<iconify-icon
											icon="lucide:mouse-pointer-click"
											class="m-auto block h-[18px] w-[18px] pr-6 text-center"
											width="18"
											alt="emoji"
										></iconify-icon>
									</div>
									<span>Show Clicks</span>
								</Button>
							</div>
						{/if}
						<div class="scrollhere" bind:this={scrollHere}></div>
					</Card.Content>
					<div class="disclaim">
						<h4 class="bold text-md">🫡 disclaimer</h4>
						<p class="text-[10px] text-foreground/60">
							Spotify® is a registered trademark of Spotify AB.<br />
							this project <b>is NOT AFFILIATED</b> with, endorsed by, or sponsored by Spotify AB.
							<i>(TL;DR: not officialy from spotify)</i>
						</p>
					</div>
					<div class="footer mt-4 text-left">
						<p class="flex flex-row gap-4 text-xs text-foreground/60">
							<a href="/about/terms">terms of ethical use</a> |
							<a href="/about/privacy">privacy policy</a>
							| <a href="/about/socials">socials / contact</a> |
							<a href="https://status.sptfy.in" target="_blank">server status</a>
						</p>
					</div>
				</Card.Header>
			</Card.Root>

			<Card.Root
				class="mb-4 h-auto min-h-[10rem] w-[23rem] font-thin md:mb-0 lg:min-h-[9.8rem] lg:w-[25rem]"
			>
				<Card.Content>
					<div class="flex items-center justify-between pt-6">
						<ToggleGroup.Root type="single" bind:value={activeTab} variant="ghost2" class="gap-0">
							<ToggleGroup.Item
								value="recent"
								class="rounded-r-none border border-r-0 px-3 py-1 text-sm "
							>
								recent
							</ToggleGroup.Item>
							<ToggleGroup.Item value="top" class="rounded-l-none border px-3 py-1 text-sm">
								top
							</ToggleGroup.Item>
						</ToggleGroup.Root>
						<a
							href={activeTab === 'recent' ? '/recent' : '/top'}
							class="highlightSecondary hover:inverseShadow inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border-t bg-gradient-to-br from-[#38334f] via-30% px-4 py-2 text-sm font-thin text-secondary-foreground no-underline transition-all hover:bg-secondary/80 hover:text-accent-foreground active:scale-95 active:from-[#afffdc] active:via-primary active:to-primary active:text-secondary"
						>
							view all
						</a>
					</div>
					<div class="mt-2">
						{#if activeTab === 'recent'}
							{#if recentLoading}
								<p class="text-muted-foreground/70">loading...</p>
							{:else if records.length === 0}
								<p class="text-muted-foreground/70">no links yet</p>
							{:else}
								<div class="max-h-fit break-all">
									{#each records.slice(0, 2) as item (item.id_url)}
										<li class="align-center my-1 flex justify-between pl-1" in:slide|global>
											<a href="/{item.id_url}" class="font-thin" target="_blank">
												<span class="px-0 text-muted-foreground/70">
													{item.subdomain === 'sptfy.in'
														? 'sptfy.in'
														: `${item.subdomain}.sptfy.in`}/</span
												><span>{item.id_url}</span>
											</a>
											<span class="ml-2 text-muted-foreground/70">
												{localizeDate(item.created)}
											</span>
										</li>
									{/each}
								</div>
							{/if}
						{:else if topLoading}
							<p class="text-muted-foreground/70">loading...</p>
						{:else if topRecords.length === 0}
							<p class="text-muted-foreground/70">no top links yet</p>
						{:else}
							<div class="max-h-fit break-all">
								{#each topRecords.slice(0, 2) as item, i (item.id_url)}
									<li class="align-center my-1 flex justify-between pl-1" in:slide|global>
										<a href="/{item.id_url}" class="font-thin" target="_blank">
											<span class="px-0 text-muted-foreground/70">
												{item.subdomain === 'sptfy.in'
													? 'sptfy.in'
													: `${item.subdomain}.sptfy.in`}/</span
											><span>{item.id_url}</span>
										</a>
										<span class="ml-2 flex items-center gap-1 text-primary/80">
											<iconify-icon icon="lucide:mouse-pointer-click" width="14"></iconify-icon>
											{formatNumber(item.utm_view)}
										</span>
									</li>
								{/each}
							</div>
						{/if}
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
		color: #ffffff !important;
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
