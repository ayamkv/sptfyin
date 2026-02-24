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
	import { isMaintenanceActive } from '$lib/maintenance';
	import { WithEase } from '$lib/animations/customSpring';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';

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
	let customizeExpanded = $state(false);
	let customShortId = $state();
	let turnstileResponse = $state();
	let turnstileStatus = $state('pending'); // 'pending' | 'verifying' | 'verified' | 'error' | 'expired'
	let footerHeight = $state(0);
	let cornerSize = $derived(footerHeight / 2);
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
	let maintenanceNow = $state(Date.now());
	let maintenanceActive = $derived(isMaintenanceActive(maintenanceNow));

	// Domain selection must be defined before QR derivations
	let selected = $state('sptfy.in');
	const domainList = [
		{ value: 'sptfy.in', label: 'sptfy.in' },
		{ value: 'artist', label: 'artist.sptfy.in', disabled: false },
		{ value: 'profile', label: 'profile.sptfy.in', disabled: false },
		{ value: 'playlist', label: 'playlist.sptfy.in', disabled: false },
		{ value: 'track', label: 'track.sptfy.in', disabled: false },
		{ value: 'COMING SOON', label: '--- COMING SOON ---', disabled: true },
		{ value: 'album', label: 'album.sptfy.in', disabled: true }
	];
	let selectedLabel = $derived(domainList.find((d) => d.value === selected)?.label ?? 'sptfy.in');
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
	let qrDomain = $derived(selected === 'sptfy.in' ? 'sptfy.in' : `${selected}.sptfy.in`);
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

	function toggleCustomize() {
		customizeExpanded = !customizeExpanded;
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

	onMount(() => {
		const interval = setInterval(() => {
			maintenanceNow = Date.now();
		}, 1000);

		return () => clearInterval(interval);
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
	let buttonDisabled = $derived(loading || customSlugInvalidOrChecking || maintenanceActive);

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

		// Check if Turnstile verification is complete
		if (!turnstileResponse) {
			isError = true;
			alertDialogTitle = strings.ErrorTurnstilePendingTitle;
			alertDialogDescription = strings.ErrorTurnstilePendingDesc;
			errorIcon = strings.ErrorTurnstilePendingIcon;
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
			subdomain: selected,
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
				subdomain: selected
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
			turnstileStatus = 'pending';
			promiseResolve();
			loading = false;
			fullShortURL = `https://${selected === 'sptfy.in' ? 'sptfy.in' : `${selected}.sptfy.in`}/${url_id}`;
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
					turnstileStatus = 'pending';
				}
				// Handle invalid turnstile value (validation_invalid_value)
				else if (errorData?.code === 'validation_invalid_value') {
					errorIcon = strings.ErrorTurnstileValidationIcon;
					alertDialogTitle = strings.ErrorTurnstileValidationTitle;
					alertDialogDescription = strings.ErrorTurnstileValidationDesc;
					reset?.(); // Reset the turnstile widget
					turnstileStatus = 'pending';
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
	class="transform-y-2 relative flex h-[85vh] flex-col items-center justify-center overflow-auto rounded-2xl border-b-4 bg-background/50 pb-0 md:mt-0 md:rounded-xl md:border-2 md:border-b-0 md:border-r-0 md:pb-0 lg:min-h-[96vh] lg:overflow-hidden"
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

	<div class="logo mt-[20em] flex flex-col items-center justify-center md:mb-6 md:mt-[2em]">
		<!-- Sticker-style stats badges positioned around the title -->
		<div class="relative">
			<!-- Cat sticker - top left -->
			<Badge
				variant="outline"
				class="absolute -left-6 -top-3 rotate-[-8deg] border-primary/50 bg-background/80 px-1.5 py-0 text-sm transition-transform hover:rotate-[-4deg] hover:skew-x-6 hover:scale-110 md:-left-12 md:top-5 md:px-2.5 md:py-0.5 md:text-base md:text-lg md:backdrop-blur-sm"
			>
				₍^. .^₎⟆
			</Badge>

			<!-- Links created sticker - top right -->
			<Badge
				variant="outline"
				class="absolute -right-4 -top-1 rotate-[6deg] border-primary/50 bg-background/80 px-1.5 py-0 transition-transform hover:rotate-[2deg] hover:-skew-x-6 hover:scale-110 md:-right-12 md:top-4 md:px-2.5 md:py-0.5 md:backdrop-blur-sm"
			>
				<iconify-icon icon="lucide:link" class="mr-0.5 size-2.5 md:mr-1 md:size-4"></iconify-icon>
				<span class="text-[10px] md:text-xs">{formatNumber(totalLinkCreated)}</span>
			</Badge>

			<!-- Main title -->
			<h1 class="ss03 font-jak-display text-4xl font-bold text-primary lg:block lg:text-8xl">
				sptfy.in
			</h1>

			<!-- Links clicked sticker - bottom left -->
			<Badge
				variant="outline"
				class="hover:skew-12 absolute -bottom-5 left-7 rotate-[-4deg] border-primary/50 bg-background/80 px-1.5 py-0 transition-transform hover:rotate-3 hover:scale-110 md:-bottom-4 md:left-20 md:px-2.5 md:py-0.5 md:backdrop-blur-sm"
			>
				<iconify-icon icon="lucide:pointer" class="mr-0.5 size-2.5 md:mr-1 md:size-4"
				></iconify-icon>
				<span class="text-[10px] md:text-xs">{formatNumber(totalClicks)}</span>
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

	<!-- Cards Container -->
	<div class="flex w-full flex-col items-center px-6 py-10 lg:px-0 lg:py-10">
		<div
			class="grid
			w-full
			max-w-[23rem]
			grid-cols-1
			gap-6
			lg:max-w-[52rem]
			lg:grid-cols-2
			"
		>
			<!-- Left Card: Input Form -->
			<Card.Root class="flex h-full w-full flex-col">
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
									class="rounded-xl placeholder:translate-y-[2px]"
									required
									autofocus
									disabled={isExpandingUrl}
								/>
								<Button
									type="button"
									id="paste"
									class="paste-button rounded-xl hover:bg-primary hover:from-[#afffdc]/20 hover:text-black"
									variant="ghost3"
									onclick={() => handlePaste()}
									disabled={isExpandingUrl}
								>
									<iconify-icon width="20" class="w-[20px]" icon="lucide:clipboard-copy">
									</iconify-icon>
								</Button>
							</div>

							<!-- <Separator class="my-2"/> -->

							<!-- Customize Row - Fixed height inline transform -->
							<div
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && (customizeExpanded = !customizeExpanded)}
								class="group relative flex h-12 w-full items-center justify-between rounded-md border-0 border-input bg-transparent p-0 text-sm transition-all hover:border-b-2 hover:border-b-secondary"
							>
								<!-- Clickable overlay for collapsed state (only visible when collapsed) -->
								{#if !customizeExpanded}
									<button
										type="button"
										onclick={() => (customizeExpanded = true)}
										class="absolute inset-0 z-10 cursor-pointer"
										aria-label="Expand customize options"
									></button>
								{/if}

								<div class="relative flex h-full w-full items-center overflow-hidden">
									<!-- Collapsed state: "customize (optional)" text -->
									<div
										class="absolute inset-0 flex items-center transition-all duration-300 ease-out {customizeExpanded
											? 'pointer-events-none -translate-x-full opacity-0'
											: 'translate-x-0 opacity-100'}"
									>
										<span class="font-medium">customize</span>
										<span class="ml-1 italic text-foreground/60">(optional)</span>
									</div>

									<!-- Expanded state: Domain select + Custom slug input -->
									<div
										class="absolute inset-0 flex items-center gap-2 transition-all duration-300 ease-out {customizeExpanded
											? 'translate-x-0 opacity-100'
											: 'pointer-events-none translate-x-full opacity-0'}"
									>
										<Select.Root type="single" name="domainSelect" bind:value={selected}>
											<Select.Trigger class="h-8 w-[140px] rounded-xl text-xs">
												{selectedLabel || 'sptfy.in'}
											</Select.Trigger>
											<Select.Portal>
												<Select.Content>
													<Select.Group>
														<Select.Label>select domain:</Select.Label>
														{#each domainList as domain}
															<Select.Item
																value={domain.value}
																label="{domain.label}/"
																onclick={() => escapeSelectHandle()}
																disabled={domain.disabled}>{domain.label}</Select.Item
															>
														{/each}
													</Select.Group>
												</Select.Content>
											</Select.Portal>
										</Select.Root>
										<Input
											minlength="4"
											maxlength="80"
											type="text"
											id="short_id"
											placeholder={shortIdDisplay}
											bind:value={customShortId}
											oninput={(e) => updateCustomShortId(e.currentTarget.value)}
											class={'mr-2 h-8 flex-1 rounded-xl text-xs placeholder:translate-y-[2px] ' +
												slugInputClass}
										/>
									</div>
								</div>

								<!-- Chevron icon - rotates on expand (clickable to toggle) -->
								<button
									type="button"
									onclick={() => (customizeExpanded = !customizeExpanded)}
									class="z-20 ml-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-secondary"
									aria-label={customizeExpanded
										? 'Collapse customize options'
										: 'Expand customize options'}
								>
									<iconify-icon
										icon="lucide:chevron-down"
										class="h-4 w-4 text-foreground/60 transition-transform duration-300 {customizeExpanded
											? 'rotate-180'
											: ''}"
									></iconify-icon>
								</button>
							</div>

							<!-- Slug validation message (shown below when expanded and has custom slug) -->
							{#if customizeExpanded && isCustomSlugProvided}
								<p class="mt-1 text-left text-xs" transition:fade={{ duration: 150 }}>
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

							<!-- Invisible Turnstile - appears only if interaction needed -->
							{#if visible}
								<Turnstile
									siteKey={turnstileKey}
									theme="dark"
									appearance="interaction-only"
									retry="auto"
									bind:reset
									on:callback={(event) => {
										turnstileResponse = event.detail.token;
										turnstileStatus = 'verified';
									}}
									on:error={() => {
										turnstileStatus = 'error';
									}}
									on:expired={() => {
										turnstileStatus = 'expired';
										turnstileResponse = undefined;
									}}
									on:timeout={() => {
										turnstileStatus = 'error';
									}}
								/>
							{/if}
							<div class="mt-4">
								<Button
									class="submit-button align-center m-auto flex w-full flex-row items-center justify-center gap-2 rounded-xl text-center
								{loading ? 'bg-secondary text-foreground shadow-lg' : ''}
								transition-all"
									type="submit"
									bind:this={theButton}
									disabled={buttonDisabled}
								>
									<!-- Left icon: scissors or loader -->
									<iconify-icon
										icon={loading ? 'lucide:loader' : 'lucide:scissors'}
										class="h-[18px] w-[18px] shrink-0 {loading
											? 'animate-spin [transform-origin:center]'
											: ''}"
										width="18"
									></iconify-icon>
									<span class="flex-1"
										>{maintenanceActive
											? 'maintenance...'
											: loading
												? 'loading...'
												: turnstileStatus !== 'verified'
													? 'validating...'
													: 'short It!'}</span
									>
									<!-- Right indicator: Turnstile verification status -->
									{#if !loading}
										<div class="flex shrink-0 items-center gap-1 text-xs">
											{#if turnstileStatus === 'verified'}
												<iconify-icon icon="lucide:shield-check" class="h-4 w-4 text-emerald-900"
												></iconify-icon>
											{:else if turnstileStatus === 'error' || turnstileStatus === 'expired'}
												<iconify-icon icon="lucide:shield-alert" class="h-4 w-4 text-red-900"
												></iconify-icon>
											{:else}
												<iconify-icon icon="lucide:shield" class="h-4 w-4 animate-pulse"
												></iconify-icon>
											{/if}
										</div>
									{/if}
								</Button>
							</div>
						</form>
						<div class="continue mt-4">
							<p class="text-xs text-foreground/60">
								by continuing, you agree to
								<a href="/about/privacy">privacy policy</a> and
								<a href="/about/terms">terms</a>.
							</p>
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex-col"></Card.Footer>
			</Card.Root>
			<!-- Right Card: URL Preview -->
			<Card.Root class="flex h-full w-full flex-col">
				<Card.Header>
					<Card.Title>url preview</Card.Title>
					<Card.Description>here's how your URL will look like</Card.Description>
					<Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
						<div
							class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all lg:h-28 lg:py-2"
						>
							<p class="break-all text-[1.44rem] font-semibold lg:text-5xl">
								{selected === 'sptfy.in' ? 'sptfy.in' : `${selected}.sptfy.in`}/<span
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
				</Card.Header>
			</Card.Root>
		</div>
		<!-- End of grid container -->

		<!-- Recent/Top Card: Full Width -->
		<Card.Root
			class="mt-6 h-auto min-h-[10rem] w-full max-w-[23rem] font-thin md:mb-0 lg:min-h-[9.8rem] lg:max-w-[52rem]"
		>
			<Card.Content>
				<div class="flex items-center justify-between pt-6">
					<ToggleGroup.Root type="single" bind:value={activeTab} variant="ghost" class="gap-0">
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
						class="hover:inverseShadow data-[state=on]:inverseShadow inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl border border-t border-secondary/20 px-4 py-2 text-sm font-thin text-secondary-foreground no-underline shadow-md transition-all hover:bg-accent hover:bg-secondary/80 hover:text-accent-foreground hover:outline-primary active:scale-95 data-[state=on]:bg-background/30 data-[state=on]:text-accent-foreground"
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
	<!-- End of cards container -->

	<!-- Popped out footer - emerges from the border -->
	<footer
		class="pointer-events-none absolute bottom-0 right-0 z-40 hidden w-full justify-end md:flex"
	>
		<div
			bind:clientHeight={footerHeight}
			class="pointer-events-auto relative -mb-1 rounded-tl-lg bg-card/95 px-5 pb-4 pt-2"
		>
			<!-- Bottom-left corner SVG -->
			<svg
				class="pointer-events-none absolute bottom-0 left-0"
				style="fill: hsl(var(--card) / 0.95); transform: translateX(-100%);"
				width={cornerSize}
				height={cornerSize}
				viewBox="0 0 39 39"
			>
				<path d="M39 39H0V38.9932C21.5849 38.7288 39 21.3744 39 0V39Z" />
			</svg>

			<!-- Top-right corner SVG -->
			<svg
				class="pointer-events-none absolute right-0 top-0"
				style="fill: hsl(var(--card) / 0.95); transform: translateY(-100%);"
				width={cornerSize}
				height={cornerSize}
				viewBox="0 0 39 39"
			>
				<path d="M39 39H0V38.9932C21.5849 38.7288 39 21.3744 39 0V39Z" />
			</svg>

			<p class="flex flex-row items-center gap-3 text-xs text-foreground/50">
				<a href="/about/terms" class="transition-colors hover:text-foreground">terms</a>
				<span class="text-foreground/20">|</span>
				<a href="/about/privacy" class="transition-colors hover:text-foreground">privacy</a>
				<span class="text-foreground/20">|</span>
				<a href="/about/socials" class="transition-colors hover:text-foreground"
					>socials / contact</a
				>
				<span class="text-foreground/20">|</span>
				<a
					href="https://status.sptfy.in"
					target="_blank"
					class="transition-colors hover:text-foreground">server status</a
				>
			</p>
		</div>
	</footer>
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
