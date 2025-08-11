<script>
  export let data;
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

  let items = data.initial.items || [];
  let from = '';
  let slug = '';
  let selected = { value: 'sptfy.in', label: 'sptfy.in' };
  let turnstileToken = '';
  let reset;
  let createDialogOpen = false;
  let loading = false;
  const user = data.user;
  
  // Edit mode and pre-generation
  let editMode = false;
  let preGeneratedUrlId = '';
  
  // Edit dialog/drawer state
  let editDialogOpen = false;
  let editDrawerOpen = false;
  let editingItem = null;
  let editForm = {
    from: '',
    id_url: '',
    subdomain: { value: 'sptfy.in', label: 'sptfy.in' }
  };
  
  // Browser detection for paste functionality
  let isIOS = false;
  let isFirefox = false;
  let isMobile = false;

  // Debug logging
  console.log('[Dashboard] Initial data loaded:', {
    user: user?.id || 'not logged in',
    itemsCount: items.length,
    items: items
  });

  // Initialize browser detection and pre-generate ID
  onMount(async () => {
    const ua = navigator.userAgent.toLowerCase();
    isIOS = ua.includes('iphone os') || (ua.includes('mac os') && navigator.maxTouchPoints > 0);
    isFirefox = ua.includes('firefox/');
    isMobile = ua.includes('android') || isIOS;
    
    // Pre-generate URL ID for faster creation
    preGeneratedUrlId = await generateRandomURL();
    console.log('[Dashboard] Pre-generated URL ID:', preGeneratedUrlId);
  });

  // Error handling (copied from main page pattern)
  let isError = false;
  let alertDialogTitle = '';
  let alertDialogDescription = '';
  let errorIcon = 'fluent-emoji:crying-cat';
  let errorMessage = '';

  const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
  
  const domainList = [
    { value: 'sptfy.in', label: 'sptfy.in' },
    { value: 'artist', label: 'artist.sptfy.in' },
    { value: 'profile', label: 'profile.sptfy.in' },
    { value: 'playlist', label: 'playlist.sptfy.in' },
    { value: 'track', label: 'track.sptfy.in' }
  ];

  // Handle paste functionality
  async function handlePaste() {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });
      
      if (permission.state === 'granted' || permission.state === 'prompt') {
        const text = await navigator.clipboard.readText();
        const extractedUrl = findUrl(text);
        
        if (extractedUrl) {
          from = extractedUrl;
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
      }
    } catch (error) {
      console.error('Input paste failed:', error);
    }
  }

  // Handle custom URL formatting (regex filtering)
  function handleCustomUrl() {
    if (slug) {
      const modifiedValue = slug.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
      slug = modifiedValue;
    }
  }

  // Handle URL input formatting  
  function handleUrlInput() {
    if (from) {
      const extractedUrl = findUrl(from);
      if (extractedUrl) {
        from = extractedUrl;
      }
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

    // Check for protected routes
    if (slug && protectedRoutes.includes(slug.toLowerCase())) {
      isError = true;
      alertDialogTitle = strings.ErrorCustomShortIdRouteTitle;
      alertDialogDescription = strings.ErrorCustomShortIdRouteDesc;
      errorIcon = strings.ErrorCustomShortIdRouteIcon;
      return;
    }

    console.log('Creating link with data:', {
      from: from.trim(),
      slug: slug.trim() || undefined,
      subdomain: selected.value,
      turnstileToken: turnstileToken ? 'present' : 'missing',
      users: user?.id || 'not logged in'
    });

    loading = true;
    try {
      // Use pre-generated ID or custom slug
      const finalSlug = slug.trim() || preGeneratedUrlId;
      
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
      
      // Reset form
      from = '';
      slug = '';
      selected = { value: 'sptfy.in', label: 'sptfy.in' };
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
      const res = await fetch('/api/links?perPage=20&page=1');
      if (res.ok) {
        const data = await res.json();
        items = data.items || [];
        console.log('[Dashboard] Refreshed links, count:', items.length);
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
    
    if (isMobile) {
      editDrawerOpen = true;
    } else {
      editDialogOpen = true;
    }
  }

  function cancelEdit() {
    editingItem = null;
    editDialogOpen = false;
    editDrawerOpen = false;
    editForm = {
      from: '',
      id_url: '',
      subdomain: { value: 'sptfy.in', label: 'sptfy.in' }
    };
  }

  async function saveEdit() {
    if (!editingItem) return;
    
    try {
      console.log('Saving edit for item:', editingItem.id, editForm);
      
      // TODO: Implement API call to update the item
      // const res = await fetch(`/api/links/${editingItem.id}`, {
      //   method: 'PATCH',
      //   headers: { 'content-type': 'application/json' },
      //   body: JSON.stringify({
      //     from: editForm.from,
      //     id_url: editForm.id_url,
      //     subdomain: editForm.subdomain.value
      //   })
      // });
      
      // Update the item in the local list
      const itemIndex = items.findIndex(item => item.id === editingItem.id);
      if (itemIndex !== -1) {
        items[itemIndex] = {
          ...items[itemIndex],
          from: editForm.from,
          id_url: editForm.id_url,
          subdomain: editForm.subdomain.value
        };
        items = [...items]; // Trigger reactivity
      }
      
      toast.success('Link updated!', {
        description: `Updated ${editForm.id_url}`
      });
      
      cancelEdit();
    } catch (error) {
      console.error('Failed to save edit:', error);
      toast.error('Failed to update link');
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
        {alertDialogDescription}
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
      <Dialog.Title>Create New Link</Dialog.Title>
      <Dialog.Description>
        Shorten your Spotify URL with a custom domain and slug.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <label for="url">Spotify URL</label>
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
      </div>
      <div class="grid gap-2">
        <label for="slug">Custom slug (optional)</label>
        <Input
          id="slug"
          type="text"
          placeholder={`custom-slug (optional, or ${preGeneratedUrlId})`}
          bind:value={slug}
          on:input={handleCustomUrl}
          minlength="4"
          maxlength="80"
        />
      </div>
      <div class="grid gap-2">
        <label for="domain">Domain</label>
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

<div class="mt-0 flex md:min-h-[96vh] flex-col  border md:rounded-xl sm:pb-0 pb-12 bg-background/40 md:backdrop-blur-3xl">


  <div class="container mx-auto py-6 max-w-8xl ">
    <!-- Header with user info and create button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Avatar class="h-12 w-12">
          <AvatarImage 
            src={`${pocketBaseURL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`} 
            alt={user.username} 
          />
          <AvatarFallback>
            {(user.name || user.username || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 class="hidden md:block text-xl md:text-2xl font-bold">Link Management</h1>
          <p class="text-sm md:text-md text-muted-foreground">{user.name} (@{user.username})</p>
        </div>
      </div>
      <div class="flex gap-4 items-center">
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
        <Card.Title>Your Links ({items.length})</Card.Title>
        <Card.Description>
          Manage and edit your shortened links
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if items.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <p class="mb-2">No links created yet</p>
            <Button variant="outline" onclick={() => createDialogOpen = true} class="gap-2">
              <Plus class="h-4 w-4" />
              Create your first link
            </Button>
          </div>
        {:else}
          <div class="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
            {#each items as item}
              <div class="border rounded-lg highlightCard bg-background/60 p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 flex-1">
                    <div class="flex-1">
                      <span class="font-mono text-sm md:text-md text-foreground">
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

<!-- Edit Dialog (Desktop) -->
<Dialog.Root bind:open={editDialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Edit Link</Dialog.Title>
      <Dialog.Description>
        Update the destination URL, slug, and subdomain for this link.
      </Dialog.Description>
    </Dialog.Header>
    {#if editingItem}
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label for="edit-url">Destination URL</label>
          <Input
            id="edit-url"
            type="url"
            bind:value={editForm.from}
            placeholder="https://open.spotify.com/..."
            required
          />
        </div>
        <div class="grid gap-2">
          <label for="edit-slug">Slug</label>
          <Input
            id="edit-slug"
            type="text"
            bind:value={editForm.id_url}
            placeholder="custom-slug"
            minlength="4"
            maxlength="80"
          />
        </div>
        <div class="grid gap-2">
          <label for="edit-subdomain">Subdomain</label>
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
        <Button variant="outline" onclick={cancelEdit}>Cancel</Button>
        <Button onclick={saveEdit}>Save Changes</Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Drawer (Mobile) -->
<Drawer.Root bind:open={editDrawerOpen}>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Edit Link</Drawer.Title>
      <Drawer.Description>
        Update the destination URL, slug, and subdomain for this link.
      </Drawer.Description>
    </Drawer.Header>
    {#if editingItem}
      <div class="px-4 pb-4 space-y-4">
        <div class="grid gap-2">
          <label for="drawer-edit-url">Destination URL</label>
          <Input
            id="drawer-edit-url"
            type="url"
            bind:value={editForm.from}
            placeholder="https://open.spotify.com/..."
            required
          />
        </div>
        <div class="grid gap-2">
          <label for="drawer-edit-slug">Slug</label>
          <Input
            id="drawer-edit-slug"
            type="text"
            bind:value={editForm.id_url}
            placeholder="custom-slug"
            minlength="4"
            maxlength="80"
          />
        </div>
        <div class="grid gap-2">
          <label for="drawer-edit-subdomain">Subdomain</label>
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
      <Drawer.Footer class="gap-2">
        <Button variant="outline" onclick={cancelEdit} class="flex-1">Cancel</Button>
        <Button onclick={saveEdit} class="flex-1">Save Changes</Button>
      </Drawer.Footer>
    {/if}
  </Drawer.Content>
</Drawer.Root>
