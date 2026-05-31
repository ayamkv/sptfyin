<script>
	import { toast } from 'svelte-sonner';

	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Drawer from '$lib/components/ui/drawer/index.js';

	let {
		qrUrl,
		shortIdDisplay,
		triggerClass = '',
		iconWidth = '24',
		imageClass = 'w-[200px] rounded-b-lg shadow-lg',
		skeletonClass = 'absolute left-0 top-0 h-[200px] w-[200px]',
		footerClass = 'flex w-full flex-col items-center justify-center gap-2 align-middle',
		downloadButtonClass = 'button-download-qr align-center mb-1 mt-1 flex w-[200px] flex-row items-center justify-center text-center transition-all',
		closeButtonClass = 'my-1 w-[200px] transition-all'
	} = $props();

	let qrDrawerOpen = $state(false);
	let isQrLoaded = $state(false);

	async function downloadQRCode() {
		try {
			toast.loading('Downloading QR code...');
			const response = await fetch(qrUrl);
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = objectUrl;
			anchor.setAttribute('download', `sptfyin_qr_${shortIdDisplay}.png`);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(objectUrl);
			toast.success('Download successful! 🥳', {
				description: 'The QR code has been saved to your device.'
			});
		} catch (error) {
			console.error('Download failed', error);
			toast.error('Download failed.');
		}
	}
</script>

<Drawer.Root shouldScaleBackground bind:open={qrDrawerOpen}>
	<Drawer.Trigger>
		<Button type="button" variant="ghost" class={triggerClass} aria-label="open QR code">
			<iconify-icon icon="lucide:qr-code" width={iconWidth}></iconify-icon>
		</Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title class="my-2 text-center">QR Code</Drawer.Title>
			<Drawer.Description>
				<div class="align-center flex flex-col items-center text-center">
					<div class="relative inline-block">
						<img
							class={imageClass}
							onload={() => (isQrLoaded = true)}
							src={qrUrl}
							alt="QR Code"
							height="350"
							width="350"
						/>
						{#if !isQrLoaded}
							<Skeleton class={skeletonClass} />
						{/if}
					</div>
				</div>
			</Drawer.Description>
		</Drawer.Header>
		<Drawer.Footer>
			<div class={footerClass}>
				{#if isQrLoaded}
					<Button
						variant="default"
						onclick={(event) => {
							qrDrawerOpen = false;
							event.preventDefault();
							downloadQRCode();
						}}
						class={downloadButtonClass}
					>
						<iconify-icon icon="lucide:download" class="pr-5" width="15"></iconify-icon>
						<span>Download</span>
					</Button>
				{/if}
				<Drawer.Close class="contents">
					<Button variant="secondary" class={closeButtonClass}>Close</Button>
				</Drawer.Close>
			</div>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
