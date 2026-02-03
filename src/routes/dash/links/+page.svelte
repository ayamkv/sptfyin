<script>
	const { data } = $props();
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Turnstile } from 'svelte-turnstile';
	import { toast } from 'svelte-sonner';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Plus, ExternalLink, Copy, Edit, Settings, Trash2 } from 'lucide-svelte';
	import 'iconify-icon';
	import { strings } from '$lib/localization/languages/en.json';
	import { findUrl, isSpotifyShortLink } from '$lib/utils';
	import { generateRandomURL } from '$lib/pocketbase';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { MediaQuery } from 'svelte/reactivity';

	// Create responsive breakpoint
	const isDesktop = new MediaQuery('(min-width: 768px)');

	// Alternative fallback approach
	let screenWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 768);
	let isDesktopFallback = $derived(screenWidth >= 768);

	// Use either MediaQuery or fallback
	let shouldUseDesktop = $derived(isDesktop?.current ?? isDesktopFallback);

	let items = $state(data.initial.items || []);
	let currentPage = $state(data.initial.page || 1);
	let totalPages = $state(data.initial.totalPages || 1);
	let totalItems = $state(data.initial.totalItems || 0);
	let loadingMore = $state(false);
	let hasMore = $derived(currentPage < totalPages);

	let from = $state('');
	let slug = $state('');
	let selected = $state({ value: 'sptfy.in', label: 'sptfy.in' });
	let turnstileToken = $state('');
	let reset = $state();
	let createDialogOpen = $state(false);
	let loading = $state(false);
	const user = data.user;

	// Edit mode and pre-generation
	let editMode = $state(false);
	let preGeneratedUrlId = $state('');

	// Bulk selection state
	let selectedItems = $state(new Set());
	let bulkDeleteLoading = $state(false);
	let bulkDeleteConfirmOpen = $state(false);
	let isAllSelected = $derived(items.length > 0 && selectedItems.size === items.length);
	let hasSelection = $derived(selectedItems.size > 0);

	// Edit dialog/drawer state
	let editOpen = $state(false);
	let editingItem = $state(null);
	let editForm = $state({
		from: '',
		id_url: '',
		subdomain: { value: 'sptfy.in', label: 'sptfy.in' }
	});

	// Browser detection for paste functionality
	let isIOS = false;
	let isFirefox = false;

	// Avatar state
	let avatarUrl = $state('');
	let avatarLoading = $state(true);

	// URL Preview state
	let urlPreview = $state(null);
	let previewLoading = $state(false);
	let editUrlPreview = $state(null);
	let editPreviewLoading = $state(false);

	// URL expansion state (for spotify.link URLs)
	let isExpandingUrl = $state(false);
	let isExpandingEditUrl = $state(false);

	// Link list previews state
	let linkPreviews = $state(new Map());
	let previewsLoading = $state(new Set());

	// View mode state (card or list)
	let viewMode = $state('card'); // 'card' | 'list'
	const VIEW_MODE_KEY = 'sptfyin_view_mode';

	// Preview cache helpers (localStorage)
	const PREVIEW_CACHE_KEY = 'sptfyin_preview_cache';
	const PREVIEW_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

	function getPreviewCache() {
		try {
			const cached = localStorage.getItem(PREVIEW_CACHE_KEY);
			return cached ? JSON.parse(cached) : {};
		} catch (e) {
			console.warn('[Cache] Failed to read cache:', e);
			return {};
		}
	}

	function getCachedPreview(linkId, currentUrl) {
		try {
			const cache = getPreviewCache();
			const entry = cache[linkId];
			if (!entry) return null;

			// Check if URL changed (invalidate)
			if (entry.url !== currentUrl) return null;

			// Check if TTL expired
			if (Date.now() - entry.timestamp > PREVIEW_CACHE_TTL) return null;

			return entry.preview;
		} catch (e) {
			console.warn('[Cache] Failed to get cached preview:', e);
			return null;
		}
	}

	function setCachedPreview(linkId, preview, url) {
		try {
			const cache = getPreviewCache();
			cache[linkId] = {
				preview,
				url,
				timestamp: Date.now()
			};
			localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			// Handle quota exceeded or other errors gracefully
			if (e.name === 'QuotaExceededError') {
				console.warn('[Cache] localStorage quota exceeded, clearing old cache');
				clearAllPreviewCache();
			} else {
				console.warn('[Cache] Failed to cache preview:', e);
			}
		}
	}

	function clearCachedPreview(linkId) {
		try {
			const cache = getPreviewCache();
			delete cache[linkId];
			localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
		} catch (e) {
			console.warn('[Cache] Failed to clear cached preview:', e);
		}
	}

	function clearAllPreviewCache() {
		try {
			localStorage.removeItem(PREVIEW_CACHE_KEY);
			console.log('[Cache] Cleared all preview cache');
		} catch (e) {
			console.warn('[Cache] Failed to clear all cache:', e);
		}
	}

	// Debug logging
	console.log('[Dashboard] Initial data loaded:', {
		user: user?.id || 'not logged in',
		itemsCount: () => items.length,
		items: () => items
	});

	// Initialize browser detection and pre-generate ID
	onMount(async () => {
		const ua = navigator.userAgent.toLowerCase();
		isIOS = ua.includes('iphone os') || (ua.includes('mac os') && navigator.maxTouchPoints > 0);
		isFirefox = ua.includes('firefox/');

		// Set initial screen width and add resize listener
		screenWidth = window.innerWidth;
		const handleResize = () => {
			screenWidth = window.innerWidth;
		};
		window.addEventListener('resize', handleResize);

		// Load saved view mode preference
		const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
		if (savedViewMode === 'list' || savedViewMode === 'card') {
			viewMode = savedViewMode;
		}

		// Pre-generate URL ID for faster creation
		preGeneratedUrlId = await generateRandomURL();
		console.log('[Dashboard] Pre-generated URL ID:', preGeneratedUrlId);

		// Fetch avatar from Microlink API
		await fetchSpotifyAvatar();

		// Fetch previews for existing links
		await fetchLinkPreviews();

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Fetch previews for all links in the list
	async function fetchLinkPreviews() {
		console.log('[Dashboard] Fetching previews for', items.length, 'links');

		// First pass: load from cache, collect uncached items
		const uncachedItems = [];
		for (const item of items) {
			if (!item.from) continue;

			const isSpotifyUrl =
				item.from.includes('open.spotify.com') || item.from.includes('spotify.link');
			if (!isSpotifyUrl) continue;

			const cached = getCachedPreview(item.id, item.from);
			if (cached) {
				// Use cached preview immediately
				linkPreviews.set(item.id, cached);
			} else {
				uncachedItems.push(item);
			}
		}

		// Trigger reactivity for cached previews
		if (linkPreviews.size > 0) {
			linkPreviews = new Map(linkPreviews);
			console.log('[Dashboard] Loaded', linkPreviews.size, 'previews from cache');
		}

		// Second pass: fetch uncached items from API in batches
		if (uncachedItems.length === 0) {
			console.log('[Dashboard] All previews loaded from cache');
			return;
		}

		console.log('[Dashboard] Fetching', uncachedItems.length, 'uncached previews from API');

		const batchSize = 3;
		for (let i = 0; i < uncachedItems.length; i += batchSize) {
			const batch = uncachedItems.slice(i, i + batchSize);

			// Process batch in parallel
			await Promise.allSettled(batch.map((item) => fetchUrlPreview(item.from, false, item.id)));

			// Small delay between batches to be respectful to the API
			if (i + batchSize < uncachedItems.length) {
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
		}

		console.log('[Dashboard] Finished fetching link previews');
	}

	// Error handling (copied from main page pattern)
	let isError = $state(false);
	let alertDialogTitle = $state('');
	let alertDialogDescription = $state('');
	let errorIcon = $state('fluent-emoji:crying-cat');
	let errorMessage = $state('');

	const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

	const domainList = [
		{ value: 'sptfy.in', label: 'sptfy.in' },
		{ value: 'artist', label: 'artist.sptfy.in' },
		{ value: 'profile', label: 'profile.sptfy.in' },
		{ value: 'playlist', label: 'playlist.sptfy.in' },
		{ value: 'track', label: 'track.sptfy.in' }
	];

	// Fetch avatar from Microlink API
	async function fetchSpotifyAvatar() {
		if (!user?.spotify_id) {
			console.warn('[Dashboard] No spotify_id found for user');
			avatarLoading = false;
			return;
		}

		try {
			const microlinkUrl = `https://api.microlink.io/?url=https://open.spotify.com/user/${user.spotify_id}`;
			console.log('[Dashboard] Fetching avatar from:', microlinkUrl);

			const response = await fetch(microlinkUrl);

			if (!response.ok) {
				throw new Error(`Microlink API error: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success' && data.data?.image?.url) {
				avatarUrl = data.data.image.url;
				console.log('[Dashboard] Avatar URL fetched:', avatarUrl);
			} else {
				console.warn('[Dashboard] No image found in Microlink response:', data);
			}
		} catch (error) {
			console.error('[Dashboard] Failed to fetch avatar from Microlink:', error);
			// Fallback to Dicebear avatar if Microlink fails
			avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`;
		} finally {
			avatarLoading = false;
		}
	}

	// Fetch URL preview from Microlink API
	async function fetchUrlPreview(url, isEdit = false, linkId = null) {
		if (!url || (!url.includes('open.spotify.com') && !url.includes('spotify.link'))) {
			return null;
		}

		// Handle different preview types
		let setState;
		if (linkId) {
			// Link list preview
			setState = (loading, preview) => {
				if (loading) {
					previewsLoading.add(linkId);
					previewsLoading = new Set(previewsLoading);
				} else {
					previewsLoading.delete(linkId);
					previewsLoading = new Set(previewsLoading);
					if (preview) {
						linkPreviews.set(linkId, preview);
						linkPreviews = new Map(linkPreviews);
					}
				}
			};
		} else if (isEdit) {
			// Edit dialog preview
			setState = (loading, preview) => {
				editPreviewLoading = loading;
				editUrlPreview = preview;
			};
		} else {
			// Create dialog preview
			setState = (loading, preview) => {
				previewLoading = loading;
				urlPreview = preview;
			};
		}

		setState(true, null);

		try {
			// Add palette parameter for link list previews to get accent colors
			const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}${linkId ? '&palette' : ''}`;
			console.log('[Dashboard] Fetching URL preview from:', microlinkUrl);

			const response = await fetch(microlinkUrl);

			if (!response.ok) {
				throw new Error(`Microlink API error: ${response.status}`);
			}

			const data = await response.json();

			if (data.status === 'success' && data.data) {
				const preview = formatSpotifyPreview(data.data, url);
				// Cache the preview for link list items
				if (linkId) {
					setCachedPreview(linkId, preview, url);
				}
				setState(false, preview);
				return preview;
			} else {
				console.warn('[Dashboard] Invalid Microlink response:', data);
				setState(false, null);
				return null;
			}
		} catch (error) {
			console.error('[Dashboard] Failed to fetch URL preview:', error);
			setState(false, null);
			return null;
		}
	}

	// Format Spotify preview data based on content type
	function formatSpotifyPreview(data, url) {
		const contentType = getSpotifyContentType(url);

		const preview = {
			type: contentType,
			image: data.image?.url,
			url: data.url,
			title: '',
			subtitle: '',
			publisher: data.publisher || 'Spotify',
			accentColor: data.image?.color || data.image?.alternative_color || '#1DB954', // Spotify green as fallback
			backgroundColor: data.image?.background_color || '#121212'
		};

		switch (contentType) {
			case 'artist':
			case 'user':
				preview.title = data.title || 'Unknown Artist';
				preview.subtitle = data.description || 'Artist';
				break;

			case 'playlist':
				preview.title = data.title || 'Unknown Playlist';
				preview.subtitle = data.description || 'Playlist';
				break;

			case 'show':
				preview.title = data.author || data.description || data.title || 'Unknown Podcast';
				preview.subtitle = 'Podcast';
				break;

			case 'track':
			case 'album':
			case 'episode':
				preview.title = data.title || 'Unknown Title';
				preview.subtitle = data.author || 'Unknown Artist';
				break;

			default:
				preview.title = data.title || 'Spotify Content';
				preview.subtitle = data.description || data.author || '';
		}

		return preview;
	}

	// Get Spotify content type from URL
	function getSpotifyContentType(url) {
		if (!url || !url.includes('open.spotify.com')) return 'unknown';

		const urlParts = url.split('/');
		const typeIndex = urlParts.findIndex((part) => part === 'open.spotify.com') + 1;

		if (typeIndex < urlParts.length) {
			const type = urlParts[typeIndex];

			switch (type) {
				case 'artist':
					return 'artist';
				case 'user':
					return 'user';
				case 'playlist':
					return 'playlist';
				case 'show':
					return 'show';
				case 'track':
					return 'track';
				case 'album':
					return 'album';
				case 'episode':
					return 'episode';
				default:
					return 'unknown';
			}
		}

		return 'unknown';
	}

	/**
	 * Expand a shortened Spotify URL (spotify.link) to the full open.spotify.com URL
	 * @param {string} url - The URL to expand
	 * @param {boolean} isEdit - Whether this is for the edit form
	 * @returns {Promise<string|null>} - The expanded URL or null if expansion failed
	 */
	async function expandSpotifyUrl(url, isEdit = false) {
		if (!isSpotifyShortLink(url)) {
			return url; // Not a short link, return as-is
		}

		console.log('[Dashboard] Expanding spotify.link URL:', url);

		// Set loading state
		if (isEdit) {
			isExpandingEditUrl = true;
		} else {
			isExpandingUrl = true;
		}

		try {
			const response = await fetch('/api/expand-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[Dashboard] URL expansion failed:', error);
				toast.error('Failed to expand link', {
					description: error.message || 'Could not resolve the Spotify link'
				});
				return null;
			}

			const data = await response.json();
			console.log('[Dashboard] URL expanded:', data);

			if (data.wasExpanded) {
				toast.success('Link expanded!', {
					description: 'Spotify short link resolved successfully'
				});
			}

			return data.expanded;
		} catch (error) {
			console.error('[Dashboard] URL expansion error:', error);
			toast.error('Failed to expand link', {
				description: 'Network error while resolving the link'
			});
			return null;
		} finally {
			if (isEdit) {
				isExpandingEditUrl = false;
			} else {
				isExpandingUrl = false;
			}
		}
	}

	// Handle paste functionality
	async function handlePaste() {
		try {
			const permission = await navigator.permissions.query({ name: 'clipboard-read' });

			if (permission.state === 'granted' || permission.state === 'prompt') {
				const text = await navigator.clipboard.readText();
				let extractedUrl = findUrl(text);

				if (extractedUrl) {
					// Check if it's a spotify.link that needs expansion
					if (isSpotifyShortLink(extractedUrl)) {
						from = extractedUrl; // Show the short link while expanding
						const expandedUrl = await expandSpotifyUrl(extractedUrl, false);
						if (expandedUrl) {
							extractedUrl = expandedUrl;
						} else {
							// Expansion failed, keep the original short link
							return;
						}
					}

					from = extractedUrl;
					await fetchUrlPreview(extractedUrl, false);
					toast.success('URL pasted!', {
						description: 'Spotify URL extracted from clipboard'
					});
				} else {
					isError = true;
					alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
					alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
					errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
				}
			} else {
				isError = true;
				alertDialogTitle = strings.ErrorClipboardPermTitle;
				alertDialogDescription = strings.ErrorClipboardPermissionDesc;
				errorIcon = 'fluent-emoji:crying-cat';
			}
		} catch (e) {
			const error = String(e).toLowerCase();
			console.error('Failed to read clipboard:', error);

			if (error.includes('function') && isFirefox) {
				alert('Firefox does not support clipboard access');
			} else if (error.includes('dismissed') || isIOS) {
				alert(
					'Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔'
				);
			}
		}
	}

	// Handle input paste
	async function handleInputPaste(event) {
		try {
			const text = await navigator.clipboard.readText();
			let extractedUrl = findUrl(text);
			if (extractedUrl) {
				// Check if it's a spotify.link that needs expansion
				if (isSpotifyShortLink(extractedUrl)) {
					from = extractedUrl; // Show the short link while expanding
					const expandedUrl = await expandSpotifyUrl(extractedUrl, false);
					if (expandedUrl) {
						extractedUrl = expandedUrl;
					} else {
						return; // Expansion failed
					}
				}

				from = extractedUrl;
				await fetchUrlPreview(extractedUrl, false);
			}
		} catch (error) {
			console.error('Input paste failed:', error);
		}
	}

	// Handle edit paste functionality
	async function handleEditPaste() {
		try {
			const permission = await navigator.permissions.query({ name: 'clipboard-read' });

			if (permission.state === 'granted' || permission.state === 'prompt') {
				const text = await navigator.clipboard.readText();
				let extractedUrl = findUrl(text);

				if (extractedUrl) {
					// Check if it's a spotify.link that needs expansion
					if (isSpotifyShortLink(extractedUrl)) {
						editForm.from = extractedUrl; // Show the short link while expanding
						const expandedUrl = await expandSpotifyUrl(extractedUrl, true);
						if (expandedUrl) {
							extractedUrl = expandedUrl;
						} else {
							return; // Expansion failed
						}
					}

					editForm.from = extractedUrl;
					await fetchUrlPreview(extractedUrl, true);
					toast.success('URL pasted!', {
						description: 'Spotify URL extracted from clipboard'
					});
				} else {
					isError = true;
					alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
					alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
					errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
				}
			} else {
				isError = true;
				alertDialogTitle = strings.ErrorClipboardPermTitle;
				alertDialogDescription = strings.ErrorClipboardPermissionDesc;
				errorIcon = 'fluent-emoji:crying-cat';
			}
		} catch (e) {
			const error = String(e).toLowerCase();
			console.error('Failed to read clipboard:', error);

			if (error.includes('function') && isFirefox) {
				alert('Firefox does not support clipboard access');
			} else if (isIOS) {
				alert(
					'Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔'
				);
			}
		}
	}

	// Handle custom URL formatting (regex filtering)
	function handleCustomUrl() {
		if (slug) {
			const modifiedValue = slug.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
			slug = modifiedValue;
		}
	}

	// Advanced slug sanitization (copied from main page)
	let sanitizedSlug = $derived(
		!slug
			? ''
			: slug
					.toLowerCase()
					.replace(/[^a-zA-Z0-9\-_]/g, '-')
					// Remove multiple consecutive hyphens/underscores
					.replace(/[-_]{2,}/g, '-')
					// Remove leading/trailing hyphens/underscores
					.replace(/^[-_]+|[-_]+$/g, '')
	);

	// Function to update slug with sanitized value - reactive approach
	function updateSlug(value) {
		if (!value) {
			slug = '';
			return;
		}

		const sanitized = value
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\-_]/g, '-')
			// Remove multiple consecutive hyphens/underscores
			.replace(/[-_]{2,}/g, '-')
			// Remove leading/trailing hyphens/underscores
			.replace(/^[-_]+|[-_]+$/g, '');

		slug = sanitized;
	}

	// Real-time slug input handler
	function handleSlugInput(event) {
		const value = event.target.value;
		updateSlug(value);
	}

	// Sanitized edit form slug
	let sanitizedEditSlug = $derived(
		!editForm.id_url
			? ''
			: editForm.id_url
					.toLowerCase()
					.replace(/[^a-zA-Z0-9\-_]/g, '-')
					// Remove multiple consecutive hyphens/underscores
					.replace(/[-_]{2,}/g, '-')
					// Remove leading/trailing hyphens/underscores
					.replace(/^[-_]+|[-_]+$/g, '')
	);

	// Function to update edit form slug with sanitized value
	function updateEditSlug(value) {
		if (!value) {
			editForm.id_url = '';
			return;
		}

		const sanitized = value
			.toLowerCase()
			.replace(/[^a-zA-Z0-9\-_]/g, '-')
			// Remove multiple consecutive hyphens/underscores
			.replace(/[-_]{2,}/g, '-')
			// Remove leading/trailing hyphens/underscores
			.replace(/^[-_]+|[-_]+$/g, '');

		editForm.id_url = sanitized;
	}

	// Real-time edit slug input handler
	function handleEditSlugInput(event) {
		const value = event.target.value;
		updateEditSlug(value);
	}

	// Protected routes check
	const protectedRoutes = ['recent', 'about', 'terms', 'privacy'];

	// Handle URL input formatting
	async function handleUrlInput() {
		if (from) {
			let extractedUrl = findUrl(from);
			if (extractedUrl) {
				// Check if it's a spotify.link that needs expansion
				if (isSpotifyShortLink(extractedUrl)) {
					from = extractedUrl; // Show the short link while expanding
					// Debounce expansion to avoid too many API calls
					clearTimeout(window.urlExpandTimeout);
					window.urlExpandTimeout = setTimeout(async () => {
						const expandedUrl = await expandSpotifyUrl(extractedUrl, false);
						if (expandedUrl) {
							from = expandedUrl;
							fetchUrlPreview(expandedUrl, false);
						}
					}, 500);
				} else {
					from = extractedUrl;
					// Debounce URL preview to avoid too many API calls
					clearTimeout(window.urlPreviewTimeout);
					window.urlPreviewTimeout = setTimeout(() => {
						fetchUrlPreview(extractedUrl, false);
					}, 500);
				}
			}
		} else {
			// Clear preview if URL is empty
			urlPreview = null;
			previewLoading = false;
		}
	}

	// Handle edit URL input formatting
	async function handleEditUrlInput() {
		if (editForm.from) {
			let extractedUrl = findUrl(editForm.from);
			if (extractedUrl) {
				// Check if it's a spotify.link that needs expansion
				if (isSpotifyShortLink(extractedUrl)) {
					editForm.from = extractedUrl; // Show the short link while expanding
					// Debounce expansion to avoid too many API calls
					clearTimeout(window.editUrlExpandTimeout);
					window.editUrlExpandTimeout = setTimeout(async () => {
						const expandedUrl = await expandSpotifyUrl(extractedUrl, true);
						if (expandedUrl) {
							editForm.from = expandedUrl;
							fetchUrlPreview(expandedUrl, true);
						}
					}, 500);
				} else {
					editForm.from = extractedUrl;
					// Debounce URL preview to avoid too many API calls
					clearTimeout(window.editUrlPreviewTimeout);
					window.editUrlPreviewTimeout = setTimeout(() => {
						fetchUrlPreview(extractedUrl, true);
					}, 500);
				}
			}
		} else {
			// Clear preview if URL is empty
			editUrlPreview = null;
			editPreviewLoading = false;
		}
	}

	async function createLink() {
		// Apply URL extraction first
		const extractedUrl = findUrl(from);
		if (extractedUrl) {
			from = extractedUrl;
		}

		if (!from.trim()) {
			isError = true;
			alertDialogTitle = strings.ErrorCreatedRecordNoInputTitle;
			alertDialogDescription = strings.ErrorCreatedRecordNoInputDesc;
			errorIcon = 'fluent-emoji:face-with-monocle';
			return;
		}

		// Use sanitized slug for validation
		const finalSlug = sanitizedSlug.trim() || preGeneratedUrlId;

		// Check for protected routes using sanitized slug
		if (sanitizedSlug && protectedRoutes.includes(sanitizedSlug.toLowerCase())) {
			isError = true;
			alertDialogTitle = strings.ErrorCustomShortIdRouteTitle;
			alertDialogDescription = strings.ErrorCustomShortIdRouteDesc;
			errorIcon = strings.ErrorCustomShortIdRouteIcon;
			return;
		}

		console.log('Creating link with data:', {
			from: from.trim(),
			slug: finalSlug,
			sanitizedSlug: sanitizedSlug,
			originalSlug: slug,
			subdomain: selected.value,
			turnstileToken: turnstileToken ? 'present' : 'missing',
			users: user?.id || 'not logged in'
		});

		loading = true;
		try {
			const requestBody = {
				from: from.trim(),
				slug: finalSlug,
				subdomain: selected.value,
				turnstileToken,
				users: user?.id
			};

			console.log('Request body:', requestBody);

			const res = await fetch('/api/links', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			console.log('Response status:', res.status);

			if (!res.ok) {
				const errorText = await res.text();
				console.log('Error response:', errorText);

				// Close create dialog first to show error dialog properly
				createDialogOpen = false;

				if (res.status === 409) {
					// Slug taken
					isError = true;
					alertDialogTitle = strings.ErrorCustomShortIdExistsTitle;
					alertDialogDescription = strings.ErrorCustomShortIdExistsDesc;
					errorIcon = strings.ErrorCustomShortIdExistsIcon;
				} else if (res.status === 400) {
					// Parse error response to get more details
					let errorDetails = '';
					try {
						const errorJson = JSON.parse(errorText);
						console.log('Parsed error:', errorJson);
						errorDetails = JSON.stringify(errorJson, null, 2);
					} catch {
						errorDetails = errorText;
					}

					isError = true;
					alertDialogTitle = strings.ErrorTurnstileValidationTitle;
					alertDialogDescription = `${strings.ErrorTurnstileValidationDesc}<br><br><details><summary>Technical Details</summary><pre>${errorDetails}</pre></details>`;
					errorIcon = strings.ErrorTurnstileValidationIcon;
					try {
						reset?.();
					} catch {}
				} else {
					throw new Error(errorText);
				}
				return;
			}

			const rec = await res.json();
			console.log('Created record:', rec);

			// Add the new record to the beginning of the list
			items = [rec, ...items];

			// Fetch preview for the new link
			if (rec.from && rec.from.includes('open.spotify.com')) {
				fetchUrlPreview(rec.from, false, rec.id);
			}

			// Reset form
			from = '';
			slug = '';
			selected = { value: 'sptfy.in', label: 'sptfy.in' };
			urlPreview = null;
			previewLoading = false;
			createDialogOpen = false;

			// Generate next pre-generated ID for future use
			preGeneratedUrlId = await generateRandomURL();

			try {
				reset?.();
			} catch {}

			toast.success('Link Created!', {
				description: `Successfully created ${rec.subdomain === 'sptfy.in' ? 'sptfy.in' : `${rec.subdomain}.sptfy.in`}/${rec.id_url}`
			});
		} catch (err) {
			console.error('Create link error:', err);
			createDialogOpen = false; // Close dialog before showing error
			isError = true;
			alertDialogTitle = strings.ErrorCreateRecordTitle;
			alertDialogDescription = strings.ErrorCreateRecordDesc;
			errorIcon = 'fluent-emoji:crying-cat';
		} finally {
			loading = false;
		}
	}

	async function copyLink(item) {
		const fullUrl = `https://${item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/${item.id_url}`;
		try {
			await navigator.clipboard.writeText(fullUrl);
			toast.success('Copied to clipboard');
		} catch (e) {
			console.error('Copy failed', e);
			toast.error('Failed to copy');
		}
	}

	function openLink(item) {
		const fullUrl = `https://${item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/${item.id_url}`;
		window.open(fullUrl, '_blank');
	}

	async function refreshLinks() {
		try {
			console.log('[Dashboard] Refresh button clicked - fetching fresh data');
			const res = await fetch('/api/links?perPage=50&page=1');
			if (res.ok) {
				const data = await res.json();
				console.log('[Dashboard] Refresh API response:', {
					itemsCount: data.items?.length || 0,
					totalItems: data.totalItems,
					page: data.page,
					perPage: data.perPage,
					totalPages: data.totalPages
				});
				items = data.items || [];
				currentPage = data.page || 1;
				totalPages = data.totalPages || 1;
				totalItems = data.totalItems || 0;

				// Clear existing previews and fetch new ones
				clearAllPreviewCache(); // Clear localStorage cache
				linkPreviews.clear();
				linkPreviews = new Map();
				previewsLoading.clear();
				previewsLoading = new Set();

				// Fetch previews for refreshed links
				await fetchLinkPreviews();
			} else {
				console.error('[Dashboard] Refresh failed:', res.status, res.statusText);
			}
		} catch (error) {
			console.error('[Dashboard] Failed to refresh links:', error);
		}
	}

	async function loadMore() {
		if (!hasMore || loadingMore) return;

		loadingMore = true;
		try {
			const nextPage = currentPage + 1;
			console.log('[Dashboard] Loading more links, page:', nextPage);

			const res = await fetch(`/api/links?perPage=50&page=${nextPage}`);
			if (res.ok) {
				const data = await res.json();
				console.log('[Dashboard] Load more response:', {
					itemsCount: data.items?.length || 0,
					page: data.page,
					totalPages: data.totalPages
				});

				// Append new items to existing list
				const newItems = data.items || [];
				items = [...items, ...newItems];
				currentPage = data.page;
				totalPages = data.totalPages;
				totalItems = data.totalItems;

				// Fetch previews for new items
				for (const item of newItems) {
					if (item.from && item.from.includes('open.spotify.com')) {
						fetchUrlPreview(item.from, false, item.id);
					}
				}
			} else {
				console.error('[Dashboard] Load more failed:', res.status, res.statusText);
				toast.error('Failed to load more links');
			}
		} catch (error) {
			console.error('[Dashboard] Failed to load more:', error);
			toast.error('Failed to load more links');
		} finally {
			loadingMore = false;
		}
	}

	// Edit mode functions
	function toggleEditMode() {
		editMode = !editMode;
		console.log('[Dashboard] Edit mode:', editMode ? 'ON' : 'OFF');
		// Clear selection when edit mode is turned off
		if (!editMode) {
			clearSelection();
		}
	}

	// View mode toggle function
	function toggleViewMode() {
		viewMode = viewMode === 'card' ? 'list' : 'card';
		localStorage.setItem(VIEW_MODE_KEY, viewMode);
		console.log('[Dashboard] View mode:', viewMode);
	}

	function startEditing(item) {
		editingItem = item;
		editForm = {
			from: item.from,
			id_url: item.id_url,
			subdomain: domainList.find((d) => d.value === item.subdomain) || {
				value: 'sptfy.in',
				label: 'sptfy.in'
			}
		};

		// Load preview for existing URL
		if (item.from) {
			fetchUrlPreview(item.from, true);
		}

		editOpen = true;
	}

	function cancelEdit() {
		editingItem = null;
		editOpen = false;
		editForm = {
			from: '',
			id_url: '',
			subdomain: { value: 'sptfy.in', label: 'sptfy.in' }
		};
		editUrlPreview = null;
		editPreviewLoading = false;
	}

	// Delete confirmation state
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);
	let itemToDelete = $state(null);

	function confirmDelete(item) {
		itemToDelete = item;
		deleteConfirmOpen = true;
	}

	async function deleteLink() {
		if (!itemToDelete) return;

		deleteLoading = true;
		try {
			const res = await fetch(`/api/links/${itemToDelete.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('[Dashboard] Delete failed:', errorText);

				if (res.status === 403) {
					throw new Error('Not authorized to delete this link');
				} else if (res.status === 404) {
					throw new Error('Link not found');
				} else {
					throw new Error('Failed to delete link');
				}
			}

			// Remove from local list
			items = items.filter((item) => item.id !== itemToDelete.id);

			// Clear preview cache for deleted item (in-memory and localStorage)
			linkPreviews.delete(itemToDelete.id);
			linkPreviews = new Map(linkPreviews);
			clearCachedPreview(itemToDelete.id);

			toast.success('Link deleted', {
				description: `Removed ${itemToDelete.id_url}`
			});

			// Close dialogs
			deleteConfirmOpen = false;
			editOpen = false;
			itemToDelete = null;
		} catch (error) {
			console.error('[Dashboard] Delete error:', error);
			toast.error(`Failed to delete: ${error.message}`);
		} finally {
			deleteLoading = false;
		}
	}

	function cancelDelete() {
		deleteConfirmOpen = false;
		itemToDelete = null;
	}

	// Bulk selection functions
	function toggleSelectItem(id) {
		if (selectedItems.has(id)) {
			selectedItems.delete(id);
		} else {
			selectedItems.add(id);
		}
		selectedItems = new Set(selectedItems); // Trigger reactivity
	}

	function toggleSelectAll() {
		if (isAllSelected) {
			selectedItems.clear();
		} else {
			selectedItems = new Set(items.map((item) => item.id));
		}
		selectedItems = new Set(selectedItems); // Trigger reactivity
	}

	function clearSelection() {
		selectedItems.clear();
		selectedItems = new Set(selectedItems);
	}

	function confirmBulkDelete() {
		if (selectedItems.size === 0) return;
		if (selectedItems.size > 5) {
			toast.error('Cannot delete more than 5 links at once (free tier limit)');
			return;
		}
		bulkDeleteConfirmOpen = true;
	}

	async function bulkDelete() {
		if (selectedItems.size === 0) return;

		bulkDeleteLoading = true;
		try {
			const idsToDelete = Array.from(selectedItems);
			console.log('[Dashboard] Bulk deleting:', idsToDelete);

			const res = await fetch('/api/links/bulk', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ ids: idsToDelete })
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('[Dashboard] Bulk delete failed:', errorText);
				throw new Error(errorText);
			}

			const result = await res.json();
			console.log('[Dashboard] Bulk delete result:', result);

			// Remove deleted items from local list
			items = items.filter((item) => !result.deleted.includes(item.id));

			// Clear previews for deleted items
			for (const id of result.deleted) {
				linkPreviews.delete(id);
			}
			linkPreviews = new Map(linkPreviews);

			// Clear selection
			clearSelection();

			// Show result
			if (result.deleted.length > 0) {
				toast.success(
					`Deleted ${result.deleted.length} link${result.deleted.length > 1 ? 's' : ''}`
				);
			}
			if (result.failed.length > 0) {
				toast.error(
					`Failed to delete ${result.failed.length} link${result.failed.length > 1 ? 's' : ''}`
				);
			}

			bulkDeleteConfirmOpen = false;
		} catch (error) {
			console.error('[Dashboard] Bulk delete error:', error);
			toast.error('Failed to delete links');
		} finally {
			bulkDeleteLoading = false;
		}
	}

	function cancelBulkDelete() {
		bulkDeleteConfirmOpen = false;
	}

	async function saveEdit() {
		if (!editingItem) return;

		try {
			console.log('Saving edit for item:', editingItem.id, editForm);

			// Use sanitized slug for validation
			const finalEditSlug = sanitizedEditSlug.trim();

			// Check for protected routes using sanitized slug
			if (finalEditSlug && protectedRoutes.includes(finalEditSlug.toLowerCase())) {
				toast.error('Cannot use protected route names');
				return;
			}

			// Make the actual API call to update the item
			const res = await fetch(`/api/links/${editingItem.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					from: editForm.from,
					id_url: finalEditSlug,
					subdomain: editForm.subdomain.value
				})
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('Update failed:', errorText);

				if (res.status === 409) {
					throw new Error('Slug already taken');
				} else if (res.status === 403) {
					throw new Error('Not authorized to edit this link');
				} else {
					throw new Error(`Update failed: ${errorText}`);
				}
			}

			const updatedRecord = await res.json();

			// Update the item in the local list with the server response
			const itemIndex = items.findIndex((item) => item.id === editingItem.id);
			if (itemIndex !== -1) {
				items[itemIndex] = updatedRecord;
				items = [...items]; // Trigger reactivity
			}

			// Invalidate cache if URL changed and re-fetch preview
			if (editForm.from !== editingItem.from) {
				clearCachedPreview(editingItem.id);
				linkPreviews.delete(editingItem.id);
				linkPreviews = new Map(linkPreviews);
				// Fetch new preview for updated URL
				fetchUrlPreview(editForm.from, false, editingItem.id);
			}

			toast.success('Link updated!', {
				description: `Updated ${editForm.id_url}`
			});

			cancelEdit();
		} catch (error) {
			console.error('Failed to save edit:', error);
			toast.error(`Failed to update link: ${error.message}`);
		}
	}
</script>

<!-- Error Dialog (copied from main page) -->
<AlertDialog.Root bind:open={isError}>
	<AlertDialog.Content class="z-[60]">
		<AlertDialog.Header>
			<div
				class="align-center m-auto flex min-h-[120px] w-[120px] flex-col justify-center text-center"
			>
				<iconify-icon icon={errorIcon} class="m-auto block text-center" width="120" alt="emoji"
				></iconify-icon>
			</div>
			<AlertDialog.Title class="text-center">
				{alertDialogTitle}
			</AlertDialog.Title>
			<AlertDialog.Description class="whitespace-pre-line text-center">
				{@html alertDialogDescription}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Action class="min-w-full font-semibold" onclick={() => (isError = false)}>
				Okay, got it
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteConfirmOpen}>
	<AlertDialog.Content class="z-[60]">
		<AlertDialog.Header>
			<div
				class="align-center m-auto flex min-h-[80px] w-[80px] flex-col justify-center text-center"
			>
				<iconify-icon
					icon="fluent-emoji:warning"
					class="m-auto block text-center"
					width="80"
					alt="warning"
				></iconify-icon>
			</div>
			<AlertDialog.Title class="text-center">Delete this link?</AlertDialog.Title>
			<AlertDialog.Description class="text-center">
				{#if itemToDelete}
					This will permanently delete <strong
						>{itemToDelete.subdomain === 'sptfy.in'
							? 'sptfy.in'
							: `${itemToDelete.subdomain}.sptfy.in`}/{itemToDelete.id_url}</strong
					>. This action cannot be undone.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex gap-2 sm:justify-center">
			<AlertDialog.Cancel onclick={cancelDelete}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				onclick={deleteLink}
				disabled={deleteLoading}
			>
				{deleteLoading ? 'Deleting...' : 'Delete'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Bulk Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={bulkDeleteConfirmOpen}>
	<AlertDialog.Content class="z-[60]">
		<AlertDialog.Header>
			<div
				class="align-center m-auto flex min-h-[80px] w-[80px] flex-col justify-center text-center"
			>
				<iconify-icon
					icon="fluent-emoji:warning"
					class="m-auto block text-center"
					width="80"
					alt="warning"
				></iconify-icon>
			</div>
			<AlertDialog.Title class="text-center"
				>Delete {selectedItems.size} link{selectedItems.size > 1 ? 's' : ''}?</AlertDialog.Title
			>
			<AlertDialog.Description class="text-center">
				This will permanently delete the selected links. This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex gap-2 sm:justify-center">
			<AlertDialog.Cancel onclick={cancelBulkDelete}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				onclick={bulkDelete}
				disabled={bulkDeleteLoading}
			>
				{bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedItems.size}`}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Create Link Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				<iconify-icon icon="lucide:plus"> </iconify-icon>
				create new link</Dialog.Title
			>
			<Dialog.Description>
				shorten your Spotify URL with a custom domain and slug.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<label for="url">spotify URL</label>
				<div class="flex gap-2">
					<Input
						id="url"
						type="url"
						placeholder={isExpandingUrl ? 'Expanding link...' : 'https://open.spotify.com/...'}
						bind:value={from}
						on:paste={handleInputPaste}
						on:input={handleUrlInput}
						required
						class="flex-1"
						disabled={isExpandingUrl}
					/>
					<Button
						type="button"
						variant="ghost"
						onclick={handlePaste}
						class="px-3"
						title="Paste from clipboard"
						disabled={isExpandingUrl}
					>
						<iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
					</Button>
				</div>

				<!-- URL Preview -->
				{#if previewLoading}
					<div class="rounded-lg border bg-muted/50 p-3">
						<div class="flex items-center gap-3">
							<div class="h-12 w-12 animate-pulse rounded bg-muted/40"></div>
							<div class="flex-1 space-y-2">
								<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
								<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
							</div>
						</div>
					</div>
				{:else if urlPreview}
					<div class="max-w-[24.5rem] rounded-lg border bg-background p-3">
						<div class="flex items-center gap-3">
							<div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
								{#if urlPreview.image}
									<!-- Image with loading skeleton -->
									<div class="relative h-full w-full">
										<!-- Skeleton background -->
										<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
										<!-- Actual image -->
										<img
											src={urlPreview.image}
											alt={urlPreview.title}
											class="relative h-full w-full object-cover opacity-0 transition-opacity duration-300"
											onload={(e) => (e.target.style.opacity = '1')}
											onerror={(e) => (e.target.style.opacity = '0')}
										/>
									</div>
								{:else}
									<div class="flex h-full w-full items-center justify-center bg-muted">
										<iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"
										></iconify-icon>
									</div>
								{/if}
							</div>
							<div class="min-w-0 max-w-[calc(100%-6rem)] flex-1">
								<div class="truncate text-sm font-medium">{urlPreview.title}</div>
								<div class="truncate text-xs text-muted-foreground">{urlPreview.subtitle}</div>
								<div class="text-xs capitalize text-muted-foreground">{urlPreview.type}</div>
							</div>
							<div class="flex-shrink-0">
								<iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"
								></iconify-icon>
							</div>
						</div>
					</div>
				{/if}
			</div>
			<div class="grid gap-2">
				<label for="slug">custom slug (optional)</label>
				<Input
					id="slug"
					type="text"
					placeholder={`custom-slug (optional, or ${preGeneratedUrlId})`}
					bind:value={slug}
					on:input={handleSlugInput}
					minlength="4"
					maxlength="80"
				/>
			</div>
			<div class="grid gap-2">
				<label for="domain">subdomain</label>
				<Select.Root portal={null} bind:selected>
					<Select.Trigger>
						<Select.Value placeholder="Select domain" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Available domains</Select.Label>
							{#each domainList as domain}
								<Select.Item value={domain.value} label={domain.label}>
									{domain.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
					<Select.Input name="subdomain" />
				</Select.Root>
			</div>
			<div class="max-h-[64px] max-w-[300px]">
				<Turnstile
					class="relative inline-block h-[64px] w-[300px]"
					siteKey={import.meta.env.VITE_CF_SITE_KEY}
					theme="dark"
					retry="auto"
					bind:token={turnstileToken}
					bind:reset
					on:callback={(event) => {
						console.log('Turnstile callback triggered:', event.detail);
						turnstileToken = event.detail.token;
					}}
					on:error={(event) => {
						console.error('Turnstile error:', event.detail);
					}}
					on:expired={(event) => {
						console.warn('Turnstile expired:', event.detail);
						turnstileToken = '';
					}}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (createDialogOpen = false)}>Cancel</Button>
			<Button onclick={createLink} disabled={loading}>
				{loading ? 'Creating...' : 'Create Link'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<div
	class="mt-0 flex min-h-[98vh] flex-col overflow-y-hidden rounded-b-2xl border
bg-background/40 pb-16 sm:pb-0 md:max-h-[96vh] md:min-h-[96vh] md:rounded-xl md:backdrop-blur-3xl"
>
	<div
		class="max-w-8xl container mx-auto overflow-auto py-6
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-background
  dark:[&::-webkit-scrollbar-thumb]:bg-primary/40
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  dark:[&::-webkit-scrollbar-track]:bg-background
  [&::-webkit-scrollbar]:w-2
  "
	>
		<!-- Header with user info and create button -->
		<div class="mb-6 flex items-center justify-between gap-1">
			<div class="flex items-center gap-4">
				<Avatar class="h-12 w-12">
					{#if avatarLoading}
						<div class="h-full w-full animate-pulse rounded-full bg-muted"></div>
					{:else}
						<AvatarImage
							src={avatarUrl ||
								`${pocketBaseURL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`}
							alt={user.username}
						/>
						<AvatarFallback>
							{(user.name || user.username || 'U').slice(0, 2).toUpperCase()}
						</AvatarFallback>
					{/if}
				</Avatar>
				<div>
					<h1 class="hidden text-xl font-bold md:block md:text-2xl">link management</h1>
					<p class="md:text-md truncate text-xs text-muted-foreground">@{user.username}</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-2">
					<Switch id="edit-mode" bind:checked={editMode} onCheckedChange={toggleEditMode} />
					<iconify-icon icon="lucide:edit" width="16" class=""></iconify-icon>
					<Label for="edit-mode" class="hidden cursor-pointer text-sm font-medium md:block">
						Edit
					</Label>
				</div>
				<div class="flex gap-2">
					<Button
						variant="outline"
						onclick={toggleViewMode}
						title={viewMode === 'card' ? 'Switch to list view' : 'Switch to card view'}
					>
						<iconify-icon icon={viewMode === 'card' ? 'lucide:list' : 'lucide:grid-2x2'} width="16"
						></iconify-icon>
					</Button>
					<Button variant="outline" onclick={refreshLinks} class="gap-2">
						<iconify-icon icon="lucide:refresh-cw" width="16"></iconify-icon>
					</Button>
					<Button onclick={() => (createDialogOpen = true)} class="gap-2">
						<Plus class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>

		<!-- Links List -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-md md:text-xl">your links ({items.length})</Card.Title>
						<Card.Description class="md:text-md text-xs">
							manage and edit your shortened links
						</Card.Description>
					</div>
					<!-- Bulk actions (visible in edit mode with items) -->
					{#if editMode && items.length > 0}
						<div class="flex items-center gap-2">
							<label class="flex cursor-pointer items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={isAllSelected}
									onchange={toggleSelectAll}
									class="h-4 w-4 cursor-pointer rounded border-2 border-muted-foreground bg-background accent-primary transition-colors hover:border-primary"
								/>
								<span class="hidden text-muted-foreground sm:inline">Select all</span>
							</label>
							{#if hasSelection}
								<Button
									variant="destructive"
									size="sm"
									onclick={confirmBulkDelete}
									class="gap-1"
									disabled={selectedItems.size > 5}
								>
									<Trash2 class="h-3 w-3" />
									<span class="hidden sm:inline">Delete</span>
									({selectedItems.size})
								</Button>
								{#if selectedItems.size > 5}
									<span class="text-xs text-destructive">Max 5</span>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</Card.Header>
			<Card.Content>
				{#if items.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<p class="mb-2">no links created yet</p>
						<Button variant="outline" onclick={() => (createDialogOpen = true)} class="gap-2">
							<Plus class="h-4 w-4" />
							create your first link
						</Button>
					</div>
				{:else}
					{#if viewMode === 'card'}
						<!-- Card View -->
						<div class="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
							{#each items as item}
								<div
									class="highlightCard relative overflow-hidden rounded-lg border bg-background/60 p-4 {editMode &&
									selectedItems.has(item.id)
										? 'ring-2 ring-primary'
										: ''}"
								>
									<!-- Bulk selection checkbox (visible in edit mode) -->
									{#if editMode}
										<div class="absolute left-2 top-2 z-20">
											<label class="flex cursor-pointer items-center">
												<input
													type="checkbox"
													checked={selectedItems.has(item.id)}
													onchange={() => toggleSelectItem(item.id)}
													class="h-4 w-4 cursor-pointer rounded border-2 border-muted-foreground bg-background accent-primary transition-colors hover:border-primary"
												/>
											</label>
										</div>
									{/if}

									<!-- Accent color sidebar (behind content) -->
									{#if linkPreviews.has(item.id) && linkPreviews.get(item.id)?.accentColor}
										<div
											class="-z-9 absolute bottom-0 right-0 top-0 w-1 blur-lg"
											style="background-color: {linkPreviews.get(item.id).accentColor}; 
                    box-shadow: -4px -2px 20px 5px {linkPreviews.get(item.id).accentColor};"
										></div>
									{/if}

									<!-- Main content with preview (above accent bar) -->
									{#if linkPreviews.has(item.id)}
										{@const preview = linkPreviews.get(item.id)}
										<div class="mb-3 flex gap-3">
											<div class="z-10 h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
												{#if preview.image}
													<!-- Image with loading skeleton -->
													<div class="relative h-full w-full">
														<!-- Skeleton background (always visible) -->
														<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
														<!-- Actual image (fades in when loaded) -->
														<img
															src={preview.image}
															alt={preview.title}
															class="relative h-full w-full object-cover opacity-0 outline outline-2 outline-muted transition-opacity duration-300"
															onload={(e) => (e.target.style.opacity = '1')}
															onerror={(e) => (e.target.style.opacity = '0')}
														/>
													</div>
												{:else}
													<div class="flex h-full w-full items-center justify-center bg-muted">
														<iconify-icon icon="mdi:music" width="20" class="text-muted-foreground"
														></iconify-icon>
													</div>
												{/if}
											</div>
											<div class="min-w-0 max-w-[calc(100%-6rem)] flex-1">
												<div class="truncate text-sm font-medium">{preview.title}</div>
												<div class="truncate text-xs text-muted-foreground">{preview.subtitle}</div>
												<div class="text-xs capitalize text-muted-foreground">{preview.type}</div>
											</div>
										</div>
									{:else}
										<!-- Loading state -->
										<div class="mb-2 flex gap-3">
											<div class="h-12 w-12 animate-pulse rounded bg-muted">
												<div class="relative h-full w-full">
													<!-- Skeleton background (always visible) -->
													<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
												</div>
											</div>
											<div class="flex-1 space-y-2">
												<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
												<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
												<div class="h-3 w-1/4 animate-pulse rounded bg-muted"></div>
											</div>
										</div>
									{/if}

									<div class="mb-2 flex items-center justify-between">
										<div class="flex flex-1 items-center gap-2">
											<div class="flex-1">
												<span class="md:text-md z-10 font-mono text-sm text-foreground">
													{item.subdomain === 'sptfy.in'
														? 'sptfy.in'
														: `${item.subdomain}.sptfy.in`}/{item.id_url}
												</span>
											</div>
											<div class="flex gap-1">
												{#if editMode}
													<Button
														variant="ghost"
														size="md"
														onclick={() => startEditing(item)}
														class="h-6 w-6 p-0"
														title="Edit link"
													>
														<Edit class="h-4 w-4" />
													</Button>
												{/if}
												<Button
													variant="ghost"
													size="md"
													onclick={() => copyLink(item)}
													class="h-6 w-6 p-0"
													title="Copy link"
												>
													<Copy class="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="md"
													onclick={() => openLink(item)}
													class="h-6 w-6 p-0"
													title="Open link"
												>
													<ExternalLink class="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>

									<div
										class="flex h-4 w-full items-center gap-2 truncate text-sm text-muted-foreground"
									>
										<span
											class="inline-flex items-center whitespace-nowrap text-xs text-muted-foreground"
										>
											<iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
											<span class="pl-1">{new Date(item.created).toLocaleDateString()}</span>
										</span>
										<span class="text-xs text-muted-foreground"> • </span>
										<span
											class="inline-flex items-center whitespace-nowrap text-xs text-muted-foreground"
											title="Total views"
										>
											<iconify-icon icon="lucide:eye" width="12"></iconify-icon>
											<span class="pl-1">{item.utm_view || 0}</span>
										</span>
										<span class="text-xs text-muted-foreground"> • </span>
										<span class="truncate text-xs text-muted-foreground">
											{item.from}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- List View (Two-line layout) -->
						<div class="space-y-2">
							{#each items as item}
								{@const preview = linkPreviews.get(item.id)}
								<div
									class="flex gap-2 rounded-lg border bg-background/60 p-2 transition-colors hover:bg-muted/30 sm:gap-3 sm:p-3 {editMode &&
									selectedItems.has(item.id)
										? 'ring-2 ring-primary'
										: ''}"
								>
									<!-- Checkbox (edit mode) -->
									{#if editMode}
										<label class="flex flex-shrink-0 cursor-pointer items-center self-center">
											<input
												type="checkbox"
												checked={selectedItems.has(item.id)}
												onchange={() => toggleSelectItem(item.id)}
												class="h-4 w-4 cursor-pointer rounded border-2 border-muted-foreground bg-background accent-primary transition-colors hover:border-primary"
											/>
										</label>
									{/if}

									<!-- Thumbnail -->
									<div
										class="h-10 w-10 flex-shrink-0 self-center overflow-hidden rounded bg-muted sm:h-12 sm:w-12"
									>
										{#if preview?.image}
											<div class="relative h-full w-full">
												<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
												<img
													src={preview.image}
													alt={preview.title || 'Preview'}
													class="relative h-full w-full object-cover opacity-0 transition-opacity duration-300"
													onload={(e) => (e.target.style.opacity = '1')}
													onerror={(e) => (e.target.style.opacity = '0')}
												/>
											</div>
										{:else if previewsLoading.has(item.id)}
											<div class="h-full w-full animate-pulse bg-muted"></div>
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-muted">
												<iconify-icon icon="mdi:music" width="16" class="text-muted-foreground"
												></iconify-icon>
											</div>
										{/if}
									</div>

									<!-- Two-line content -->
									<div class="flex min-w-0 flex-1 flex-col gap-0.5">
										<!-- Line 1: Title + Type + Actions -->
										<div class="flex items-center gap-2">
											<!-- Title -->
											<span
												class="min-w-0 flex-1 truncate text-sm font-medium"
												title={preview?.title || item.from}
											>
												{#if preview?.title}
													{preview.title}
												{:else}
													<span class="text-muted-foreground">{item.from}</span>
												{/if}
											</span>

											<!-- Type badge (hidden on mobile) -->
											{#if preview?.type && preview.type !== 'unknown'}
												<span
													class="hidden flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground sm:inline"
												>
													{preview.type}
												</span>
											{/if}

											<!-- Actions: Edit + Open -->
											<div class="flex flex-shrink-0 gap-0.5">
												{#if editMode}
													<Button
														variant="ghost"
														size="sm"
														onclick={() => startEditing(item)}
														class="h-7 w-7 p-0"
														title="Edit link"
													>
														<Edit class="h-3.5 w-3.5" />
													</Button>
												{/if}
												<Button
													variant="ghost"
													size="sm"
													onclick={() => openLink(item)}
													class="h-7 w-7 p-0"
													title="Open link"
												>
													<ExternalLink class="h-3.5 w-3.5" />
												</Button>
											</div>
										</div>

										<!-- Line 2: Arrow + Link + Copy + Stats -->
										<div class="flex items-center gap-1 text-muted-foreground sm:gap-2">
											<!-- Arrow icon -->
											<iconify-icon
												icon="lucide:corner-down-right"
												width="12"
												class="flex-shrink-0 opacity-50"
											></iconify-icon>

											<!-- Short URL -->
											<span class="truncate font-mono text-xs sm:text-sm">
												{item.subdomain === 'sptfy.in'
													? ''
													: `${item.subdomain}.`}sptfy.in/{item.id_url}
											</span>

											<!-- Copy button -->
											<Button
												variant="ghost"
												size="sm"
												onclick={() => copyLink(item)}
												class="h-6 w-6 flex-shrink-0 p-0"
												title="Copy link"
											>
												<Copy class="h-3 w-3" />
											</Button>

											<!-- Separator -->
											<span class="hidden text-xs opacity-50 sm:inline">•</span>

											<!-- Views -->
											<span class="hidden items-center gap-1 text-xs sm:flex" title="Views">
												<iconify-icon icon="lucide:eye" width="11"></iconify-icon>
												{item.utm_view || 0}
											</span>

											<!-- Date (hide on xs) -->
											<span class="hidden items-center gap-1 text-xs md:flex" title="Created">
												<iconify-icon icon="lucide:calendar" width="11"></iconify-icon>
												{new Date(item.created).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Load More Button -->
					{#if hasMore}
						<div class="flex justify-center pt-6">
							<Button variant="outline" onclick={loadMore} disabled={loadingMore} class="gap-2">
								{#if loadingMore}
									<iconify-icon icon="lucide:loader-2" width="16" class="animate-spin"
									></iconify-icon>
									Loading...
								{:else}
									<iconify-icon icon="lucide:chevrons-down" width="16"></iconify-icon>
									Load more ({totalItems - items.length} remaining)
								{/if}
							</Button>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Responsive Edit Dialog/Drawer -->
<!-- Debug: MediaQuery = {isDesktop?.current}, Fallback = {isDesktopFallback}, Final = {shouldUseDesktop}, Width = {screenWidth} -->
{#if shouldUseDesktop}
	<Dialog.Root bind:open={editOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>
					<iconify-icon icon="lucide:edit" width="16" class=""></iconify-icon>
					edit link
				</Dialog.Title>
				<Dialog.Description>
					update the destination URL, slug, and subdomain for this link.
				</Dialog.Description>
			</Dialog.Header>
			{#if editingItem}
				<div class="grid gap-4 py-4">
					<div class="grid gap-2">
						<label for="edit-url">destination URL</label>
						<div class="flex gap-1">
							<Input
								id="edit-url"
								type="url"
								bind:value={editForm.from}
								on:input={handleEditUrlInput}
								placeholder={isExpandingEditUrl
									? 'Expanding link...'
									: 'https://open.spotify.com/...'}
								required
								class="flex-1"
								disabled={isExpandingEditUrl}
							/>
							<Button
								type="button"
								variant="ghost"
								onclick={handleEditPaste}
								class="px-3"
								title="Paste from clipboard"
								disabled={isExpandingEditUrl}
							>
								<iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
							</Button>
						</div>

						<!-- Edit URL Preview -->
						{#if editPreviewLoading}
							<div class="rounded-lg border bg-muted/50 p-3">
								<div class="flex items-center gap-3">
									<div class="h-12 w-12 animate-pulse rounded bg-muted"></div>
									<div class="flex-1 space-y-2">
										<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
										<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
									</div>
								</div>
							</div>
						{:else if editUrlPreview}
							<div class="max-w-[24rem] rounded-lg border bg-background p-3">
								<div class="flex items-center gap-3">
									<div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
										{#if editUrlPreview.image}
											<!-- Image with loading skeleton -->
											<div class="relative h-full w-full">
												<!-- Skeleton background -->
												<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
												<!-- Actual image -->
												<img
													src={editUrlPreview.image}
													alt={editUrlPreview.title}
													class="relative h-full w-full object-cover opacity-0 transition-opacity duration-300"
												/>
											</div>
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-muted">
												<iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"
												></iconify-icon>
											</div>
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<div class="truncate text-sm font-medium">{editUrlPreview.title}</div>
										<div class="truncate text-xs text-muted-foreground">
											{editUrlPreview.subtitle}
										</div>
										<div class="text-xs capitalize text-muted-foreground">
											{editUrlPreview.type}
										</div>
									</div>
									<div class="flex-shrink-0">
										<iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"
										></iconify-icon>
									</div>
								</div>
							</div>
						{/if}
					</div>
					<div class="grid gap-2">
						<label for="edit-slug">slug</label>
						<Input
							id="edit-slug"
							type="text"
							bind:value={editForm.id_url}
							on:input={handleEditSlugInput}
							placeholder="custom-slug"
							minlength="4"
							maxlength="80"
						/>
					</div>
					<div class="grid gap-2">
						<label for="edit-subdomain">subdomain</label>
						<Select.Root bind:selected={editForm.subdomain}>
							<Select.Trigger>
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each domainList as domain}
									<Select.Item value={domain.value} label={domain.label}>
										{domain.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<Dialog.Footer class="flex justify-between">
					<Button variant="destructive" onclick={() => confirmDelete(editingItem)} class="gap-1">
						<Trash2 class="h-4 w-4" />
						Delete
					</Button>
					<div class="flex gap-2">
						<Button variant="outline" onclick={cancelEdit}>cancel</Button>
						<Button onclick={saveEdit}>save Changes</Button>
					</div>
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open={editOpen}>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Edit Link</Drawer.Title>
				<Drawer.Description>
					Update the destination URL, slug, and subdomain for this link.
				</Drawer.Description>
			</Drawer.Header>
			{#if editingItem}
				<div class="space-y-4 px-4 pb-4">
					<div class="grid gap-2">
						<label for="drawer-edit-url">destination URL</label>
						<div class="flex gap-1">
							<Input
								id="drawer-edit-url"
								type="url"
								bind:value={editForm.from}
								on:input={handleEditUrlInput}
								placeholder={isExpandingEditUrl
									? 'Expanding link...'
									: 'https://open.spotify.com/...'}
								required
								class="flex-1"
								disabled={isExpandingEditUrl}
							/>
							<Button
								type="button"
								variant="ghost"
								onclick={handleEditPaste}
								class="px-3"
								title="Paste from clipboard"
								disabled={isExpandingEditUrl}
							>
								<iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
							</Button>
						</div>

						<!-- Edit URL Preview (Mobile) -->
						{#if editPreviewLoading}
							<div class="rounded-lg border bg-muted/50 p-3">
								<div class="flex items-center gap-3">
									<div class="h-12 w-12 animate-pulse rounded bg-muted"></div>
									<div class="flex-1 space-y-2">
										<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
										<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
									</div>
								</div>
							</div>
						{:else if editUrlPreview}
							<div class="rounded-lg border bg-background p-3">
								<div class="flex items-center gap-3">
									<div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
										{#if editUrlPreview.image}
											<!-- Image with loading skeleton -->
											<div class="relative h-full w-full">
												<!-- Skeleton background -->
												<div class="absolute inset-0 animate-pulse rounded bg-muted"></div>
												<!-- Actual image -->
												<img
													src={editUrlPreview.image}
													alt={editUrlPreview.title}
													class="relative h-full w-full object-cover opacity-0 transition-opacity duration-300"
												/>
											</div>
										{:else}
											<div class="flex h-full w-full items-center justify-center bg-muted">
												<iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"
												></iconify-icon>
											</div>
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<div class="truncate text-sm font-medium">{editUrlPreview.title}</div>
										<div class="truncate text-xs text-muted-foreground">
											{editUrlPreview.subtitle}
										</div>
										<div class="text-xs capitalize text-muted-foreground">
											{editUrlPreview.type}
										</div>
									</div>
									<div class="flex-shrink-0">
										<iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"
										></iconify-icon>
									</div>
								</div>
							</div>
						{/if}
					</div>
					<div class="grid gap-2">
						<label for="drawer-edit-slug">slug</label>
						<Input
							id="drawer-edit-slug"
							type="text"
							bind:value={editForm.id_url}
							on:input={handleEditSlugInput}
							placeholder="custom-slug"
							minlength="4"
							maxlength="80"
						/>
					</div>
					<div class="grid gap-2">
						<label for="drawer-edit-subdomain">subdomain</label>
						<Select.Root bind:selected={editForm.subdomain}>
							<Select.Trigger>
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								{#each domainList as domain}
									<Select.Item value={domain.value} label={domain.label}>
										{domain.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<Drawer.Footer class="flex flex-col gap-2 pt-2">
					<Button onclick={saveEdit} class="w-full">save Changes</Button>
					<div class="flex w-full gap-2">
						<Drawer.Close class="flex-1">
							<Button variant="outline" onclick={cancelEdit} class="w-full">cancel</Button>
						</Drawer.Close>
						<Button
							variant="destructive"
							onclick={() => confirmDelete(editingItem)}
							class="flex-1 gap-1"
						>
							<Trash2 class="h-4 w-4" />
							Delete
						</Button>
					</div>
				</Drawer.Footer>
			{/if}
		</Drawer.Content>
	</Drawer.Root>
{/if}
