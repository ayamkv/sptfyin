<script>
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  
  $: status = $page.status;
  $: message = $page.error?.message || 'An unexpected error occurred';
</script>

<div class="min-h-screen flex items-center justify-center bg-background">
  <Card.Root class="w-[90vw] max-w-md">
    <Card.Header>
      <Card.Title class="text-center text-2xl">
        {#if status === 503}
          🔌 Connection Error
        {:else if status === 500}
          🚨 Server Error
        {:else if status === 404}
          🔍 Not Found
        {:else}
          ⚠️ Error {status}
        {/if}
      </Card.Title>
    </Card.Header>
    <Card.Content class="text-center space-y-4">
      <p class="text-muted-foreground">{message}</p>
      
      {#if status === 503}
        <div class="text-sm bg-orange-50 border border-orange-200 rounded p-3">
          <p class="font-medium">Authentication service unavailable</p>
          <p class="mt-1">Please check if PocketBase is running and accessible.</p>
          {#if import.meta.env.DEV}
            <p class="mt-2 text-xs">
              <strong>PocketBase URL:</strong> {import.meta.env.VITE_POCKETBASE_URL || 'Not configured'}
            </p>
          {/if}
        </div>
      {/if}
      
      <div class="flex gap-2 justify-center">
        <Button variant="outline" onclick={() => window.history.back()}>
          Go Back
        </Button>
        <Button onclick={() => window.location.href = '/'}>
          Home
        </Button>
        {#if import.meta.env.DEV}
          <Button variant="outline" onclick={() => window.location.href = '/debug-auth'}>
            Debug
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>
</div>