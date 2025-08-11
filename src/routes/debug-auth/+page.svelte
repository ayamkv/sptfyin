<script>
  export let data;
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Update cookies display
    const cookiesElement = document.getElementById('cookies');
    if (cookiesElement) {
      cookiesElement.textContent = document.cookie || 'No cookies found';
    }
  });
</script>

<div class="container mx-auto py-6 max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Authentication Debug</h1>
  
  <div class="space-y-4">
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Server State</h2>
      <pre class="bg-background p-2 rounded text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
    
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Browser Cookies</h2>
      <pre class="bg-background p-2 rounded text-sm overflow-auto" id="cookies">Loading...</pre>
    </div>
    
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Environment</h2>
      <pre class="bg-background p-2 rounded text-sm overflow-auto">
VITE_POCKETBASE_URL: {import.meta.env.VITE_POCKETBASE_URL}
VITE_APP_URL: {import.meta.env.VITE_APP_URL}
Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}
      </pre>
    </div>
    
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2">Debug Actions</h2>
      <div class="space-y-2">
        <a href="/auth/clear" class="inline-block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Clear All Auth State
        </a>
        <p class="text-sm text-gray-600">Use this if you're stuck in a bad auth state</p>
      </div>
    </div>
  </div>
</div>


