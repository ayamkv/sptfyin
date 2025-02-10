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

	</div>

	<div class="disclaim text-center mt-4">
		<h4 class="bold text-lg">🫡 disclaimer</h4>
		<p class="text-xs text-foreground/60">
			Spotify® is a registered trademark of Spotify AB.<br />
			this project <b>is NOT AFFILIATED</b> with, endorsed by, or sponsored by Spotify AB.<br />
			<i>(TL;DR: not officialy from spotify)</i>
		</p>
	</div>
	
</div>
