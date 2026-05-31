<script>
	import { preventDefault } from 'svelte/legacy';
	import { resolve } from '$app/paths';
	import { Turnstile } from 'svelte-turnstile';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import HomeSubmitButton from '$lib/components/home/home-submit-button.svelte';
	import QrDrawer from '$lib/components/home/qr-drawer.svelte';
	import BannerDonoShader from '$lib/components/home/banner-dono-shader.svelte';
	import { localizeDate, formatNumber } from '$lib/utils';

	let {
		totalLinkCreated,
		totalClicks,
		qrDomain,
		shortIdDisplay,
		qrUrl,
		inputText = $bindable(),
		customShortId = $bindable(),
		selected = $bindable(),
		reset = $bindable(),
		turnstileResponse = $bindable(),
		turnstileStatus = $bindable(),
		customizeExpanded = $bindable(false),
		isExpandingUrl,
		handleInputOnPaste,
		handlePaste,
		updateCustomShortId,
		handlePreviewCopy,
		handleSubmit,
		domainList,
		selectedLabel,
		slugInputClass,
		isCustomSlugProvided,
		sanitizedCustomShortId,
		reservedSlug,
		slugChecking,
		slugCheckError,
		slugAvailable,
		strings,
		visible = $bindable(),
		turnstileKey,
		loading,
		buttonDisabled,
		maintenanceActive,
		records = [],
		topRecords = [],
		ownedLinks = [],
		activeTab = $bindable('recent'),
		recentLoading = false,
		topLoading = false,
		ownedLinksLoading = false,
		requestDeleteOwnedLink,
		deletingOwnedLinkId = '',
		pendingDeleteLink = null,
		deleteTurnstileVisible = false,
		deleteTurnstileReset = $bindable(),
		deleteTurnstileStatus = 'pending',
		handleDeleteTurnstileCallback,
		resetDeleteTurnstile
	} = $props();

	const tabs = [
		{ id: 'mylinks', label: 'my links' },
		{ id: 'recent', label: 'recents' },

		{ id: 'top', label: 'top links' }
	];

	let linkCount = $derived(totalLinkCreated ? formatNumber(totalLinkCreated) : '65.7k');
	let clickCount = $derived(totalClicks ? formatNumber(totalClicks) : '1.2m');

	let tabContent = $derived({
		loading:
			activeTab === 'recent'
				? recentLoading
				: activeTab === 'mylinks'
					? ownedLinksLoading
					: topLoading,
		empty:
			activeTab === 'recent'
				? records.length === 0
				: activeTab === 'mylinks'
					? ownedLinks.length === 0
					: topRecords.length === 0,
		items:
			activeTab === 'recent'
				? records.slice(0, 4)
				: activeTab === 'mylinks'
					? ownedLinks
					: topRecords.slice(0, 4),
		emptyMsg:
			activeTab === 'recent'
				? 'no links yet'
				: activeTab === 'mylinks'
					? 'no links saved on this device'
					: 'no top links yet',
		loadingMsg:
			activeTab === 'recent'
				? 'loading...'
				: activeTab === 'mylinks'
					? 'checking links saved on this device...'
					: 'loading...',
		getId: activeTab === 'mylinks' ? (item) => item.id : (item) => item.id_url,
		viewAllHref:
			activeTab === 'recent' ? '/recent' : activeTab === 'mylinks' ? '/dash/links' : '/top'
	});

	function toggleCustomize() {
		customizeExpanded = !customizeExpanded;
	}
</script>

{#snippet linkItem(item)}
	<a
		href={resolve(`/${item.id_url}`)}
		class="min-w-0 truncate font-normal text-[var(--rd-ink)]"
		target="_blank"
	>
		<span class="text-[var(--rd-muted)]"
			>{item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/</span
		><span>{item.id_url}</span>
	</a>
{/snippet}

<div class="hidden min-h-[calc(100vh-10rem)] w-full text-[var(--rd-ink)] md:block">
	<div
		class="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-5xl flex-col px-6 pb-20 pt-2 lg:px-8"
	>
		<header class="relative mx-auto mb-5 h-20 w-[27rem] max-w-full">
			<h1
				class="ss03 absolute left-1/2 top-0 -translate-x-1/2 font-jak-display text-6xl font-black leading-none text-[var(--rd-mint)] lg:text-7xl"
			>
				sptfy.in
			</h1>
			<div
				class="rd-squircle rd-shadow-lift absolute left-12 top-16 flex h-6 min-w-20 rotate-[6deg] items-center justify-center gap-1 rounded-full bg-[var(--rd-yellow)] px-2.5 text-xs font-semibold text-[#161517]"
			>
				<iconify-icon icon="lucide:link" width="14"></iconify-icon>
				<span>{linkCount}</span>
			</div>
			<div
				class="rd-squircle rd-shadow-lift absolute right-12 top-16 flex h-6 min-w-20 rotate-[-4deg] items-center justify-center gap-1 rounded-full bg-[var(--rd-yellow)] px-2.5 text-xs font-semibold text-[#161517]"
			>
				<iconify-icon icon="lucide:pointer" width="14"></iconify-icon>
				<span>{clickCount}</span>
			</div>
		</header>

		<section
			class="rd-squircle rd-shadow-inset mb-4 mt-8 grid min-h-[4.75rem] grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-5 py-4"
		>
			<div class="min-w-0">
				<p class="mb-1.5 text-xs font-normal leading-none text-[var(--rd-mint)]">url preview</p>
				<p class="truncate text-2xl italic leading-tight text-[var(--rd-ink-soft)] lg:text-xl">
					<span class="font-normal">{qrDomain}/</span><span
						class="font-light underline decoration-[rgba(74,227,161,0.5)] decoration-2 underline-offset-4"
						>{shortIdDisplay}</span
					>
				</p>
			</div>
			<div class="flex gap-2">
				<QrDrawer
					{qrUrl}
					{shortIdDisplay}
					triggerClass="rd-shadow-nav size-10 rounded-2xl border border-[var(--rd-action)] bg-[var(--rd-action)] p-0 text-[var(--rd-ink)] hover:bg-[rgba(16,17,17,0.5)]"
					iconWidth="22"
					imageClass="w-[200px] rounded-b-lg shadow-lg lg:w-[350px]"
					skeletonClass="absolute left-0 top-0 h-[200px] w-[200px] lg:h-[350px] lg:w-[350px]"
					footerClass="flex w-full flex-col items-center justify-center gap-2 align-middle lg:flex-row"
					downloadButtonClass="button-download-qr align-center mb-1 mt-1 flex w-[200px] flex-row items-center justify-center text-center transition-all lg:w-[360px]"
					closeButtonClass="my-1 w-[200px] transition-all lg:w-[360px]"
				/>
				<Button
					type="button"
					variant="ghost"
					class="rd-shadow-nav size-10 rounded-2xl border border-[var(--rd-action)] bg-[var(--rd-action)] p-0 text-[var(--rd-ink)] hover:bg-[rgba(16,17,17,0.5)]"
					onclick={handlePreviewCopy}
					aria-label="copy short URL"
				>
					<iconify-icon icon="lucide:copy" width="22"></iconify-icon>
				</Button>
			</div>
		</section>

		<div
			class="relative grid min-h-0 grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] items-stretch gap-4"
		>
			{#if visible}
				<div class="absolute left-4 top-[4rem] z-30 w-[calc(45%-1rem)] max-w-[20rem]">
					<Turnstile
						siteKey={turnstileKey}
						theme="dark"
						appearance="interaction-only"
						retry="auto"
						bind:reset
						on:callback={(event) => {
							turnstileResponse = event.detail.token;
							turnstileStatus = 'verified';
							const verifiedToken = event.detail.token;
							setTimeout(() => {
								if (turnstileStatus === 'verified' && turnstileResponse === verifiedToken) {
									visible = false;
								}
							}, 950);
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
				</div>
			{/if}
			<section
				class="rd-squircle rd-shadow-panel relative overflow-hidden rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-4 pb-8 pt-4"
			>
				<form onsubmit={preventDefault(handleSubmit)} class="grid gap-3">
					<Label for="url-desktop-redesign" class="pl-1 text-xs font-normal text-[var(--rd-ink)]"
						>paste your long ass URL here</Label
					>
					<div
						class="flex items-center rounded-2xl has-[input:focus]:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
					>
						<input
							onpaste={handleInputOnPaste}
							id="url-desktop-redesign"
							type="url"
							placeholder={isExpandingUrl
								? 'Expanding link...'
								: 'https://open.spotify.com/xxxx....'}
							bind:value={inputText}
							class="inverseShadow h-10 w-full rounded-l-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 text-xs text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c]"
							required
							disabled={isExpandingUrl}
						/>
						<button
							type="button"
							onclick={() => handlePaste()}
							disabled={isExpandingUrl}
							aria-label="paste URL"
							class="flex h-10 w-14 items-center justify-center rounded-r-2xl border border-[rgba(57,54,77,0.2)] bg-transparent p-0 text-[var(--rd-ink)] shadow-[0px_1px_1.2px_0px_rgba(16,17,17,0.54),inset_0px_1.2px_2.7px_0px_rgba(145,95,183,0.78),inset_0px_-3px_2px_0px_rgba(24,24,27,0.32)] transition-colors hover:bg-[rgba(16,17,17,0.5)] active:bg-[var(--rd-mint)] active:text-[var(--rd-bg)]"
						>
							<iconify-icon icon="lucide:clipboard-paste" width="20" class="text-inherit"
							></iconify-icon>
						</button>
					</div>

					<div
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && toggleCustomize()}
						class="relative flex h-9 w-full items-center justify-between rounded-xl text-left text-xs text-[var(--rd-ink)]"
					>
						{#if !customizeExpanded}
							<button
								type="button"
								onclick={() => (customizeExpanded = true)}
								class="absolute inset-0 z-10 cursor-pointer"
								aria-label="Expand customize options"
							></button>
						{/if}
						<div class="relative flex h-full w-full items-center overflow-hidden">
							<div
								class="absolute inset-0 flex items-center transition-all duration-300 ease-out {customizeExpanded
									? 'pointer-events-none -translate-x-full opacity-0'
									: 'translate-x-0 opacity-100'}"
							>
								<span>customize</span>
								<span class="ml-1 text-[var(--rd-muted)]">(optional)</span>
							</div>
							<div
								class="absolute inset-0 flex items-center gap-2 transition-all duration-300 ease-out {customizeExpanded
									? 'translate-x-0 opacity-100'
									: 'pointer-events-none translate-x-full opacity-0'}"
							>
								<Select.Root type="single" name="desktopDomainSelect" bind:value={selected}>
									<Select.Trigger
										class="h-9 w-[10rem] rounded-xl border-[var(--rd-action)] bg-[#201f28] text-xs"
									>
										{selectedLabel || 'sptfy.in'}
									</Select.Trigger>
									<Select.Portal>
										<Select.Content>
											<Select.Group>
												<Select.Label>select domain:</Select.Label>
												{#each domainList as domain (domain.value)}
													<Select.Item
														value={domain.value}
														label="{domain.label}/"
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
									id="short-id-desktop-redesign"
									placeholder={shortIdDisplay}
									bind:value={customShortId}
									oninput={(e) => updateCustomShortId(e.currentTarget.value)}
									class={[
										'h-9 flex-1 rounded-xl border-[var(--rd-action)] bg-[#201f28] text-xs text-[var(--rd-ink)] placeholder:text-[var(--rd-muted)]',
										slugInputClass
									]}
								/>
							</div>
						</div>
						<button
							type="button"
							onclick={toggleCustomize}
							class="z-20 ml-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
							aria-label={customizeExpanded
								? 'Collapse customize options'
								: 'Expand customize options'}
						>
							<iconify-icon
								icon="lucide:chevron-down"
								class="h-4 w-4 text-[var(--rd-ink)] transition-transform duration-300 {customizeExpanded
									? 'rotate-180'
									: ''}"
							></iconify-icon>
						</button>
					</div>

					{#if customizeExpanded && isCustomSlugProvided}
						<p class="h-4 text-xs leading-none">
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

					<HomeSubmitButton
						{loading}
						{maintenanceActive}
						{turnstileStatus}
						disabled={buttonDisabled}
						class="submit-button align-center m-auto flex w-full flex-row items-center justify-center gap-2 rounded-xl text-center shadow-[inset_0_-3px_4px_0_#3b906b96] transition-all {loading
							? 'bg-secondary text-foreground'
							: ''}"
					/>
				</form>
				<p class="mt-4 text-xs leading-tight text-[var(--rd-muted)]">
					by continuing, you agree to
					<a href={resolve('/about/privacy')} class="underline">privacy policy</a> and
					<a href={resolve('/about/terms')} class="underline">terms</a>.
				</p>
			</section>

			<section
				class="rd-squircle rd-shadow-panel overflow-hidden rounded-2xl bg-[var(--rd-panel)] pb-4"
			>
				<div class="flex items-center justify-between gap-4 px-4 pt-4">
					<div class="flex w-fit items-center">
						{#each tabs as tab, i (tab.id)}
							<button
								type="button"
								onclick={() => (activeTab = tab.id)}
								class={[
									'h-9 w-fit cursor-pointer border border-[rgba(57,54,77,0.2)] px-4 text-xs font-light leading-none transition-colors',
									i === 0 && 'rounded-l-2xl border-r-0',
									i === tabs.length - 1 && 'rounded-r-2xl border-l-0',
									i === 1 && 'border-l-0 border-r-0',
									activeTab === tab.id ? 'rd-tab-active' : 'rd-tab-inactive'
								]}
							>
								{tab.label}
							</button>
						{/each}
					</div>
					<a
						href={resolve(tabContent.viewAllHref)}
						class="offset-0 flex h-9 w-fit items-center rounded-2xl border border-[rgba(57,54,77,0.2)] bg-[rgba(57,54,77,0.2)] px-5 text-xs font-light leading-none text-[#fafafa] shadow-[0px_1px_1.2px_0px_rgba(16,17,17,0.54),inset_0px_-3px_2px_0px_rgba(24,24,27,0.32),inset_0px_1.2px_2.7px_0px_rgba(145,95,183,0.78)] hover:bg-secondary/80"
					>
						view all
					</a>
				</div>

				<div class="space-y-2 px-4 py-3 font-normal">
					{#if activeTab === 'mylinks' && deleteTurnstileVisible && pendingDeleteLink}
						<div
							class="mb-3 rounded-xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] p-3 text-xs leading-tight text-[var(--rd-muted)]"
						>
							<p class="mb-2">verify to delete {pendingDeleteLink.id_url}</p>
							<Turnstile
								siteKey={turnstileKey}
								theme="dark"
								appearance="interaction-only"
								retry="auto"
								bind:reset={deleteTurnstileReset}
								on:callback={handleDeleteTurnstileCallback}
								on:error={() => {
									deleteTurnstileStatus = 'error';
								}}
								on:expired={() => {
									deleteTurnstileStatus = 'expired';
								}}
								on:timeout={() => {
									deleteTurnstileStatus = 'error';
								}}
							/>
							<div class="mt-2 flex items-center justify-between gap-2">
								<span
									>{deleteTurnstileStatus === 'verified'
										? 'deleting...'
										: 'waiting for verification...'}</span
								>
								<button type="button" class="underline" onclick={resetDeleteTurnstile}
									>cancel</button
								>
							</div>
						</div>
					{/if}

					{#if tabContent.loading}
						<p class="text-sm text-[var(--rd-muted)]">{tabContent.loadingMsg}</p>
					{:else if tabContent.empty}
						<p class="text-sm text-[var(--rd-muted)]">{tabContent.emptyMsg}</p>
					{:else}
						<div class="space-y-1.5">
							{#each tabContent.items as item (tabContent.getId(item))}
								<div
									class="flex items-center justify-between gap-4 rounded-lg border-b border-muted/80 px-3 py-2 text-sm leading-none"
								>
									<div class="min-w-0 flex-1 truncate">{@render linkItem(item)}</div>
									{#if activeTab === 'mylinks'}
										<button
											type="button"
											class="shrink-0 text-xs text-red-400 underline"
											onclick={() => requestDeleteOwnedLink(item)}
											disabled={deletingOwnedLinkId === item.id}
										>
											{deletingOwnedLinkId === item.id
												? 'deleting...'
												: pendingDeleteLink?.id === item.id
													? 'verify...'
													: 'delete'}
										</button>
									{:else if activeTab === 'top'}
										<span class="flex shrink-0 items-center gap-1 text-[var(--rd-mint)]">
											<iconify-icon icon="lucide:mouse-pointer-click" width="12"></iconify-icon>
											{formatNumber(item.utm_view)}
										</span>
									{:else}
										<span class="shrink-0 text-[var(--rd-muted)]">{localizeDate(item.created)}</span
										>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		</div>
		<section class="banner-dono mt-12">
			<a
				href="https://ko-fi.com/freqtion"
				target="_blank"
				rel="noreferrer"
				class="rd-squircle group relative mx-auto block h-32 w-[38rem] overflow-hidden rounded-[9px] bg-[#1b191f] text-white no-underline shadow-[inset_0px_5px_4px_0px_rgba(21,19,27,0.46)] outline-none transition-transform duration-200 hover:no-underline focus:no-underline focus-visible:ring-2 focus-visible:ring-[var(--rd-mint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rd-bg)]"
				aria-label="Support sptfy.in on Ko-fi"
			>
				<BannerDonoShader />
				<div
					class="absolute right-0 top-0 h-full w-1/2 rounded-[9px]"
					style="background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(27, 25, 31, 1) 75%);"
				></div>
				<div
					class="absolute right-0 top-0 h-full w-1/2 rounded-[9px] opacity-90 mix-blend-color-dodge"
					style="background-image: radial-gradient(92% 145% at 84% -9%, rgba(95, 237, 156, 0.98) 0%, rgba(78, 184, 125, 0.74) 17%, rgba(61, 131, 94, 0.5) 33%, rgba(44, 78, 62, 0.24) 49%, rgba(27, 25, 31, 0) 70%);"
				></div>
				<div
					class="absolute right-0 top-0 h-full w-1/2 rounded-[9px] opacity-95 mix-blend-color-dodge"
					style="background-image: radial-gradient(90% 140% at 84% -9%, rgba(24, 241, 227, 0.92) 0%, rgba(25, 187, 178, 0.68) 17%, rgba(25, 133, 129, 0.45) 33%, rgba(26, 79, 80, 0.22) 49%, rgba(27, 25, 31, 0) 70%);"
				></div>
				<div
					class="absolute bottom-0 left-0 h-full w-2/3 rounded-[9px] opacity-70 mix-blend-color-dodge"
					style="background-image: radial-gradient(80% 85% at 0% 100%, rgba(89, 255, 155, 0.24) 0%, rgba(61, 131, 94, 0.14) 34%, rgba(27, 25, 31, 0) 72%);"
				></div>
				<div
					class="absolute inset-0 rounded-[9px] shadow-[inset_0px_5px_4px_0px_rgba(21,19,27,0.46)]"
				></div>

				<div class="absolute right-8 top-[27px] w-[8.95rem] text-right text-white no-underline">
					<p class="mb-[4px] text-[13px] font-light leading-[1.115] tracking-[-0.54px]">
						°⋆.࿔*:･&nbsp;&nbsp;&nbsp;&nbsp; ദ്ദി ^-⩊-^≼
					</p>
					<h2 class="whitespace-nowrap text-[20px] font-normal leading-[1] tracking-[-1.6px]">
						<span class="block">sptfy.in&nbsp;&nbsp;is&nbsp;&nbsp;entirely</span>
						<span class="block">user funded</span>
					</h2>
					<p class="mt-[6px] text-[13px] font-medium italic leading-[0.885] text-[#ffd050]">
						consider supporting?
					</p>
				</div>
			</a>
		</section>
	</div>
</div>
