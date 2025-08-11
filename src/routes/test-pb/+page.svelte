<script>
  export let data;
  import { Button } from '$lib/components/ui/button';
  
  function refreshPage() {
    window.location.reload();
  }
</script>

<div class="container mx-auto py-6 max-w-4xl">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-foreground">PocketBase Connection Test</h1>
    <Button onclick={refreshPage}>Refresh Test</Button>
  </div>
  
  <div class="space-y-4">
    <div class="border border-border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2 text-foreground">Configuration</h2>
      <pre class="bg-background p-3 rounded text-sm overflow-auto text-muted-foreground">
PocketBase URL: {data.results.url || 'Not configured'}
Test Time: {data.results.timestamp}
Environment: {import.meta.env.MODE}
      </pre>
    </div>
    
    <div class="border border-border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-4 text-foreground">Connection Tests</h2>
      <div class="space-y-3">
        {#each data.results.tests as test}
          <div class="border rounded p-3 {test.status === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-medium text-foreground">{test.name}</span>
              <span class="px-2 py-1 rounded text-xs {test.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                {test.status.toUpperCase()}
              </span>
            </div>
            
            {#if test.status === 'success'}
              <pre class="text-xs bg-background border border-border rounded p-2 overflow-auto text-muted-foreground">{JSON.stringify(test.result, null, 2)}</pre>
            {:else}
              <div class="text-sm text-foreground">
                <p><strong>Error:</strong> {test.error.message}</p>
                {#if test.error.status}
                  <p><strong>Status:</strong> {test.error.status}</p>
                {/if}
                {#if test.error.code}
                  <p><strong>Code:</strong> {test.error.code}</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <div class="border border-border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2 text-foreground">Troubleshooting</h2>
      <div class="text-sm space-y-2">
        {#if data.results.tests.some(t => t.status === 'error')}
          <div class="bg-orange-500/10 border border-orange-500/30 rounded p-3">
            <p class="font-medium text-orange-400">Connection Issues Detected</p>
            <ul class="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Check if PocketBase server is running</li>
              <li>• Verify VITE_POCKETBASE_URL environment variable</li>
              <li>• Ensure PocketBase is accessible from this domain</li>
              <li>• Check firewall and network connectivity</li>
            </ul>
          </div>
        {:else}
          <div class="bg-green-500/10 border border-green-500/30 rounded p-3">
            <p class="font-medium text-green-400">✅ All connections successful!</p>
          </div>
        {/if}
        
        <div class="mt-4">
          <p class="font-medium text-foreground">Quick Actions:</p>
          <div class="flex gap-2 mt-2">
            <a href="/debug-auth" class="text-primary hover:text-primary/80 hover:underline text-sm">Debug Auth State</a>
            <a href="/login" class="text-primary hover:text-primary/80 hover:underline text-sm">Try Login</a>
            <a href="/" class="text-primary hover:text-primary/80 hover:underline text-sm">Home</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
