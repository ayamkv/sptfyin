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
  import { Plus, ExternalLink, Copy, Edit, Settings } from 'lucide-svelte';
  import 'iconify-icon';
  import { strings } from '$lib/localization/languages/en.json';
  import { findUrl } from '$lib/utils';
  import { generateRandomURL } from '$lib/pocketbase';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
  import { MediaQuery } from 'svelte/reactivity';

  // Create responsive breakpoint
  const isDesktop = new MediaQuery("(min-width: 768px)");
  
  // Alternative fallback approach
  let screenWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 768);
  let isDesktopFallback = $derived(screenWidth >= 768);
  
  // Use either MediaQuery or fallback
  let shouldUseDesktop = $derived(isDesktop?.current ?? isDesktopFallback);

  let items = $state(data.initial.items || []);
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
  
  // Link list previews state
  let linkPreviews = $state(new Map());
  let previewsLoading = $state(new Set());

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
    
    // Batch process to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.allSettled(
        batch.map(item => {
          if (item.from && item.from.includes('open.spotify.com')) {
            return fetchUrlPreview(item.from, false, item.id);
          }
          return Promise.resolve();
        })
      );
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
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
    if (!url || !url.includes('open.spotify.com')) {
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
      setState = (loading, preview) => { editPreviewLoading = loading; editUrlPreview = preview; };
    } else {
      // Create dialog preview
      setState = (loading, preview) => { previewLoading = loading; urlPreview = preview; };
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
    const typeIndex = urlParts.findIndex(part => part === 'open.spotify.com') + 1;
    
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

  // Handle paste functionality
  async function handlePaste() {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });
      
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const text = await navigator.clipboard.readText();
        const extractedUrl = findUrl(text);
        
        if (extractedUrl) {
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
        alert('Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔');
      }
    }
  }

  // Handle input paste
  async function handleInputPaste(event) {
    try {
      const text = await navigator.clipboard.readText();
      const extractedUrl = findUrl(text);
      if (extractedUrl) {
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
        const extractedUrl = findUrl(text);
        
        if (extractedUrl) {
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
        alert('Sorry! iOS Safari does not support clipboard access, so you have to paste manually 😔');
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
    !slug ? '' : slug
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
    !editForm.id_url ? '' : editForm.id_url
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
  function handleUrlInput() {
    if (from) {
      const extractedUrl = findUrl(from);
      if (extractedUrl) {
        from = extractedUrl;
        // Debounce URL preview to avoid too many API calls
        clearTimeout(window.urlPreviewTimeout);
        window.urlPreviewTimeout = setTimeout(() => {
          fetchUrlPreview(extractedUrl, false);
        }, 500);
      }
    } else {
      // Clear preview if URL is empty
      urlPreview = null;
      previewLoading = false;
    }
  }

  // Handle edit URL input formatting
  function handleEditUrlInput() {
    if (editForm.from) {
      const extractedUrl = findUrl(editForm.from);
      if (extractedUrl) {
        editForm.from = extractedUrl;
        // Debounce URL preview to avoid too many API calls
        clearTimeout(window.editUrlPreviewTimeout);
        window.editUrlPreviewTimeout = setTimeout(() => {
          fetchUrlPreview(extractedUrl, true);
        }, 500);
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
          try { reset?.(); } catch {}
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
      
      try { reset?.(); } catch {}
      
      toast.success('Link Created!', {
        description: `Successfully created ${rec.subdomain === 'sptfy.in' ? 'sptfy.in' : `${rec.subdomain}.sptfy.in`}/${rec.id_url}`
      });
      
      // Optionally refresh the list to ensure consistency
      setTimeout(() => refreshLinks(), 1000);
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
        
        // Clear existing previews and fetch new ones
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

  // Edit mode functions
  function toggleEditMode() {
    editMode = !editMode;
    console.log('[Dashboard] Edit mode:', editMode ? 'ON' : 'OFF');
  }

  function startEditing(item) {
    editingItem = item;
    editForm = {
      from: item.from,
      id_url: item.id_url,
      subdomain: domainList.find(d => d.value === item.subdomain) || { value: 'sptfy.in', label: 'sptfy.in' }
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
      const itemIndex = items.findIndex(item => item.id === editingItem.id);
      if (itemIndex !== -1) {
        items[itemIndex] = updatedRecord;
        items = [...items]; // Trigger reactivity
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
      <div class="align-center m-auto flex min-h-[120px] w-[120px] flex-col justify-center text-center">
        <iconify-icon icon={errorIcon} class="m-auto block text-center" width="120" alt="emoji"></iconify-icon>
      </div>
      <AlertDialog.Title class="text-center">
        {alertDialogTitle}
      </AlertDialog.Title>
      <AlertDialog.Description class="text-center whitespace-pre-line">
        {@html (alertDialogDescription)}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action class="min-w-full font-semibold" onclick={() => (isError = false)}>
        Okay, got it
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
        create new link</Dialog.Title>
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
            placeholder="https://open.spotify.com/..."
            bind:value={from}
            on:paste={handleInputPaste}
            on:input={handleUrlInput}
            required
            class="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            onclick={handlePaste}
            class="px-3"
            title="Paste from clipboard"
          >
            <iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
          </Button>
        </div>
        
        <!-- URL Preview -->
        {#if previewLoading}
          <div class="border rounded-lg p-3 bg-muted/50">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-muted/40 animate-pulse rounded"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div class="h-3 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            </div>
          </div>
        {:else if urlPreview}
          <div class="border rounded-lg p-3 bg-background max-w-[24.5rem]">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                {#if urlPreview.image}
                  <!-- Image with loading skeleton -->
                  <div class="relative w-full h-full">
                    <!-- Skeleton background -->
                    <div class="absolute inset-0 bg-muted animate-pulse rounded"></div>
                    <!-- Actual image -->
                    <img 
                      src={urlPreview.image} 
                      alt={urlPreview.title}
                      class="relative w-full h-full object-cover opacity-0 transition-opacity duration-300"
                      onload={(e) => e.target.style.opacity = '1'}
                      onerror={(e) => e.target.style.opacity = '0'}
                    />
                  </div>
                {:else}
                  <div class="w-full h-full bg-muted flex items-center justify-center">
                    <iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"></iconify-icon>
                  </div>
                {/if}
              </div>
              <div class="flex-1 min-w-0 max-w-[calc(100%-6rem)]">
                <div class="font-medium text-sm truncate">{urlPreview.title}</div>
                <div class="text-xs text-muted-foreground truncate">{urlPreview.subtitle}</div>
                <div class="text-xs text-muted-foreground capitalize">{urlPreview.type}</div>
              </div>
              <div class="flex-shrink-0">
                <iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"></iconify-icon>
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
      <Button variant="outline" onclick={() => createDialogOpen = false}>Cancel</Button>
      <Button onclick={createLink} disabled={loading}>
        {loading ? 'Creating...' : 'Create Link'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<div class="mt-0 flex min-h-[98vh]  rounded-b-2xl md:min-h-[96vh] md:max-h-[96vh] flex-col  
border md:rounded-xl sm:pb-0 pb-16 bg-background/40 md:backdrop-blur-3xl overflow-y-hidden">


  <div class="container mx-auto py-6 max-w-8xl overflow-auto 
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-background
  dark:[&::-webkit-scrollbar-track]:bg-background
  dark:[&::-webkit-scrollbar-thumb]:bg-primary/40
  ">
    <!-- Header with user info and create button -->
    <div class="flex items-center justify-between mb-6 gap-1">
      <div class="flex items-center gap-4">
        <Avatar class="h-12 w-12">
          {#if avatarLoading}
            <div class="h-full w-full bg-muted animate-pulse rounded-full"></div>
          {:else}
            <AvatarImage 
              src={avatarUrl || `${pocketBaseURL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`} 
              alt={user.username} 
            />
            <AvatarFallback>
              {(user.name || user.username || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          {/if}
        </Avatar>
        <div>
          <h1 class="hidden md:block text-xl md:text-2xl font-bold">link management</h1>
          <p class="text-xs md:text-md text-muted-foreground truncate">@{user.username}</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <div class="flex items-center gap-2">
          <Switch 
            id="edit-mode" 
            bind:checked={editMode}
            onCheckedChange={toggleEditMode}
          />
          <iconify-icon icon="lucide:edit" width="16" class=""></iconify-icon>
          <Label for="edit-mode" class="hidden md:block text-sm font-medium cursor-pointer">
            Edit
          </Label>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={refreshLinks} class="gap-2">
            <iconify-icon icon="lucide:refresh-cw" width="16"></iconify-icon>
          </Button>
          <Button onclick={() => createDialogOpen = true} class="gap-2">
            <Plus class="h-4 w-4" />
            
          </Button>
        </div>
      </div>
    </div>

    <!-- Links List -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-md md:text-xl">your links ({items.length})</Card.Title>
        <Card.Description class="text-xs md:text-md">
          manage and edit your shortened links
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if items.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <p class="mb-2">no links created yet</p>
            <Button variant="outline" onclick={() => createDialogOpen = true} class="gap-2">
              <Plus class="h-4 w-4" />
              create your first link
            </Button>
          </div>
        {:else}
          <div class="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
            {#each items as item}
              <div class="border rounded-lg highlightCard bg-background/60 p-4 relative overflow-hidden">
                <!-- Accent color sidebar (behind content) -->
                {#if linkPreviews.has(item.id) && linkPreviews.get(item.id)?.accentColor}
                  <div 
                    class="absolute right-0 top-0 bottom-0 w-1 blur-lg -z-9" 
                    style="background-color: {linkPreviews.get(item.id).accentColor}; 
                    box-shadow: -4px -2px 20px 5px {linkPreviews.get(item.id).accentColor};"
                  ></div>
                {/if}
                
                <!-- Main content with preview (above accent bar) -->
                {#if linkPreviews.has(item.id)}
                  {@const preview = linkPreviews.get(item.id)}
                  <div class="flex gap-3 mb-3">
                    <div class="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 z-10">
                      {#if preview.image}
                        <!-- Image with loading skeleton -->
                        <div class="relative w-full h-full">
                          <!-- Skeleton background (always visible) -->
                          <div class="absolute inset-0 bg-muted animate-pulse rounded"></div>
                          <!-- Actual image (fades in when loaded) -->
                          <img 
                            src={preview.image} 
                            alt={preview.title}
                            class="relative w-full h-full object-cover outline outline-2 outline-muted opacity-0 transition-opacity duration-300"
                             onload={(e) => e.target.style.opacity = '1'}
                            onerror={(e) => e.target.style.opacity = '0'}
                          />
                        </div>
                      {:else}
                        <div class="w-full h-full bg-muted flex items-center justify-center">
                          <iconify-icon icon="mdi:music" width="20" class="text-muted-foreground"></iconify-icon>
                        </div>
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0 max-w-[calc(100%-6rem)]">
                      <div class="font-medium text-sm truncate">{preview.title}</div>
                      <div class="text-xs text-muted-foreground truncate">{preview.subtitle}</div>
                      <div class="text-xs text-muted-foreground capitalize">{preview.type}</div>
                    </div>
                  </div>
                {:else}
                  <!-- Loading state -->
                  <div class="flex gap-3 mb-2">
                    <div class="w-12 h-12 bg-muted animate-pulse rounded">
                          <div class="relative w-full h-full">
                          <!-- Skeleton background (always visible) -->
                          <div class="absolute inset-0 bg-muted animate-pulse rounded"></div>
                        
                        </div>
                    </div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div class="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                      <div class="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                    </div>
                  </div>
                {/if}

                
                
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 flex-1">
                    <div class="flex-1">
                      <span class="font-mono text-sm md:text-md text-foreground z-10">
                        {item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/{item.id_url}
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
                
                <div class="text-sm text-muted-foreground truncate flex w-full h-4 gap-2 items-center">
                  <span class="text-xs text-muted-foreground inline-flex items-center whitespace-nowrap">
                    <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                    <span class="pl-1">{new Date(item.created).toLocaleDateString()}</span>
                  </span>
                  <span class="text-xs text-muted-foreground"> • </span>
                  <span class="text-xs text-muted-foreground">
                    {item.from}
                  </span>
                </div>
              </div>
            {/each}
          </div>
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
          edit link </Dialog.Title>
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
                placeholder="https://open.spotify.com/..."
                required
                class="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                onclick={handleEditPaste}
                class="px-3"
                title="Paste from clipboard"
              >
                <iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
              </Button>
            </div>
            
            <!-- Edit URL Preview -->
            {#if editPreviewLoading}
              <div class="border rounded-lg p-3 bg-muted/50">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-muted animate-pulse rounded"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div class="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            {:else if editUrlPreview}
              <div class="border rounded-lg p-3 bg-background max-w-[24rem]">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {#if editUrlPreview.image}
                      <!-- Image with loading skeleton -->
                      <div class="relative w-full h-full">
                        <!-- Skeleton background -->
                        <div class="absolute inset-0 bg-muted animate-pulse rounded"></div>
                        <!-- Actual image -->
                        <img 
                          src={editUrlPreview.image} 
                          alt={editUrlPreview.title}
                          class="relative w-full h-full object-cover opacity-0 transition-opacity duration-300"
                        />
                      </div>
                    {:else}
                      <div class="w-full h-full bg-muted flex items-center justify-center">
                        <iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"></iconify-icon>
                      </div>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{editUrlPreview.title}</div>
                    <div class="text-xs text-muted-foreground truncate">{editUrlPreview.subtitle}</div>
                    <div class="text-xs text-muted-foreground capitalize">{editUrlPreview.type}</div>
                  </div>
                  <div class="flex-shrink-0">
                    <iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"></iconify-icon>
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
        <Dialog.Footer>
          <Button variant="outline" onclick={cancelEdit}>cancel</Button>
          <Button onclick={saveEdit}>save Changes</Button>
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
        <div class="px-4 pb-4 space-y-4">
          <div class="grid gap-2">
            <label for="drawer-edit-url">destination URL</label>
            <div class="flex gap-1">
              <Input
                id="drawer-edit-url"
                type="url"
                bind:value={editForm.from}
                on:input={handleEditUrlInput}
                placeholder="https://open.spotify.com/..."
                required
                class="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                onclick={handleEditPaste}
                class="px-3"
                title="Paste from clipboard"
              >
                <iconify-icon icon="lucide:clipboard" width="16"></iconify-icon>
              </Button>
            </div>
            
            <!-- Edit URL Preview (Mobile) -->
            {#if editPreviewLoading}
              <div class="border rounded-lg p-3 bg-muted/50">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-muted animate-pulse rounded"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div class="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            {:else if editUrlPreview}
              <div class="border rounded-lg p-3 bg-background">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {#if editUrlPreview.image}
                      <!-- Image with loading skeleton -->
                      <div class="relative w-full h-full">
                        <!-- Skeleton background -->
                        <div class="absolute inset-0 bg-muted animate-pulse rounded"></div>
                        <!-- Actual image -->
                        <img 
                          src={editUrlPreview.image} 
                          alt={editUrlPreview.title}
                          class="relative w-full h-full object-cover opacity-0 transition-opacity duration-300"
                        />
                      </div>
                    {:else}
                      <div class="w-full h-full bg-muted flex items-center justify-center">
                        <iconify-icon icon="mdi:music" width="24" class="text-muted-foreground"></iconify-icon>
                      </div>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm truncate">{editUrlPreview.title}</div>
                    <div class="text-xs text-muted-foreground truncate">{editUrlPreview.subtitle}</div>
                    <div class="text-xs text-muted-foreground capitalize">{editUrlPreview.type}</div>
                  </div>
                  <div class="flex-shrink-0">
                    <iconify-icon icon="mdi:check-circle" width="16" class="text-green-500"></iconify-icon>
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
        <Drawer.Footer class="pt-2">
          <Drawer.Close class="w-full">
            <Button variant="outline" onclick={cancelEdit} class="w-full">cancel</Button>
          </Drawer.Close>
          <Button onclick={saveEdit} class="w-full">save Changes</Button>
        </Drawer.Footer>
      {/if}
    </Drawer.Content>
  </Drawer.Root>
{/if}
