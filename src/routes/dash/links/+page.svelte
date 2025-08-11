<script>
  export let data;
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as Drawer from '$lib/components/ui/drawer/index.js';
  import { Turnstile } from 'svelte-turnstile';
  import { toast } from 'svelte-sonner';
  import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

  let items = data.initial.items || [];
  let from = '';
  let slug = '';
  let selected = { value: 'sptfy.in', label: 'sptfy.in' };
  let turnstileToken = '';
  let reset;
  const user = data.user;

  const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
  let fullShortURL = '';
  let isQrLoaded = false;
  let qrUrl = '';
  $: fullShortURL = `https://${selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`}/${slug || '****'}`;
  $: qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=${encodeURIComponent(fullShortURL)}`;
  const domainList = [
    { value: 'sptfy.in', label: 'sptfy.in' },
    { value: 'artist', label: 'artist.sptfy.in' },
    { value: 'profile', label: 'profile.sptfy.in' },
    { value: 'playlist', label: 'playlist.sptfy.in' },
    { value: 'track', label: 'track.sptfy.in' }
  ];

  async function createLink() {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from, slug, subdomain: selected.value, turnstileToken })
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    const rec = await res.json();
    items = [rec, ...items];
    from = '';
    slug = rec.id_url;
    try { reset?.(); } catch {}
  }

  async function saveLink(id, newFrom, newSlug) {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: newFrom, id_url: newSlug })
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    const updated = await res.json();
    items = items.map((it) => (it.id === id ? updated : it));
  }

  async function copyFullUrl() {
    try {
      await navigator.clipboard.writeText(fullShortURL);
      toast.success('Copied', { description: 'Short URL copied to clipboard' });
    } catch (e) {
      console.error('copy failed', e);
    }
  }
</script>

<div class="mt-0 flex flex-col items-center justify-start">
  <div class="logo mt-[2em] flex flex-col items-center justify-center">
    <h1 class="ss03 font-jak-display text-2xl font-bold text-primary lg:block lg:text-6xl">Sptfy.in</h1>
  </div>

  <div class="mt-6 w-[23rem] lg:w-[50rem] grid gap-6">
    {#if user}
      <Card.Root>
        <Card.Content class="flex items-center gap-3 pb-4 pt-4">
          <Avatar class="h-10 w-10">
            <AvatarImage src={`${pocketBaseURL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`} alt={user.username} />
            <AvatarFallback>{(user.name || user.username || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div class="text-sm text-foreground/70">Logged in as</div>
            <div class="text-lg font-semibold">{user.name}</div>
            <div class="text-sm text-foreground/70">{user.username}</div>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
    <Card.Root>
      <Card.Content class="grid gap-4 pb-6 pt-6">
        <h2 class="text-xl font-semibold">Create link</h2>
        <Input type="url" placeholder="https://open.spotify.com/..." bind:value={from} />
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
          <Input type="text" placeholder="custom slug (optional)" bind:value={slug} minlength="4" maxlength="80" />
          <Select.Root portal={null} bind:selected>
            <Select.Trigger><Select.Value placeholder="domain: sptfy.in" /></Select.Trigger>
            <Select.Content>
              <Select.Group>
                <Select.Label>select domain</Select.Label>
                {#each domainList as domain}
                  <Select.Item value={domain.value} label={domain.label}>{domain.label}</Select.Item>
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
          />
        </div>
        <Button class="w-full" on:click={createLink}>Create</Button>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>url preview</Card.Title>
        <Card.Content class="grid px-0 pb-0 text-left text-[#82d1af]/60">
          <div class="align-center flex w-full min-w-full items-center justify-between py-2 transition-all lg:h-28 lg:py-2">
            <p class="break-all text-[1.2rem] font-semibold lg:text-3xl">
              {selected.value === 'sptfy.in' ? 'sptfy.in' : `${selected.value}.sptfy.in`}/<span class="text-[#82d1af]">{slug || '****'}</span>
            </p>
            <div class="buttons button-copy flex max-h-20 gap-1 lg:flex-col-reverse">
              <Button variant="secondary" class="p-3 hover:bg-primary hover:text-black" on:click={copyFullUrl}>
                Copy
              </Button>
              <a class="p-3 inline-flex items-center justify-center rounded-md border hover:bg-secondary" href={fullShortURL} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
          <Drawer.Root>
            <Drawer.Trigger>
              <Button variant="secondary" class="button-show-qr w-full">Show QR</Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title class="my-2 text-center">QR Code</Drawer.Title>
                <Drawer.Description>
                  <div class="align-center flex flex-col items-center text-center">
                    <img
                      class="w-[200px] min-w-[50%] rounded-lg shadow-lg lg:w-[350px] lg:min-w-[20%]"
                      onload={() => (isQrLoaded = true)}
                      src={qrUrl}
                      alt="QR Code"
                      height="350"
                      width="350"
                    />
                  </div>
                </Drawer.Description>
              </Drawer.Header>
            </Drawer.Content>
          </Drawer.Root>
        </Card.Content>
      </Card.Header>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Your links</Card.Title>
        <Card.Content class="grid gap-3">
          {#each items as it}
            <div class="rounded-lg border p-3 grid gap-2">
              <div class="text-sm text-foreground/70">{it.subdomain === 'sptfy.in' ? 'sptfy.in' : `${it.subdomain}.sptfy.in`}/{it.id_url}</div>
              <div class="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
                <Input type="url" bind:value={it.from} />
                <Input type="text" bind:value={it.id_url} minlength="4" maxlength="80" class="lg:mx-2" />
                <Button on:click={() => saveLink(it.id, it.from, it.id_url)}>Save</Button>
              </div>
            </div>
          {/each}
        </Card.Content>
      </Card.Header>
    </Card.Root>
  </div>
</div>


