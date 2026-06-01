<script>
	import { preventDefault } from 'svelte/legacy';
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { Turnstile } from 'svelte-turnstile';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import HomeSubmitButton from '$lib/components/home/home-submit-button.svelte';
	import QrDrawer from '$lib/components/home/qr-drawer.svelte';
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

	let linkCount = $derived(totalLinkCreated ? formatNumber(totalLinkCreated) : '65.7k');
	let clickCount = $derived(totalClicks ? formatNumber(totalClicks) : '1.2m');

	const tabs = [
		{ id: 'mylinks', label: 'my links', edgeClass: 'rounded-l-2xl', borderSide: 'border-r-0' },
		{ id: 'recent', label: 'recents', edgeClass: '', borderSide: 'border-r-0 border-l-0' },
		{ id: 'top', label: 'top links', edgeClass: 'rounded-r-2xl', borderSide: 'border-l-0' }
	];

	let statPills = $derived([
		{
			icon: 'lucide:link',
			text: linkCount,
			cssClass: 'mobile-home-pill-links',
			left: 'left-[4.25rem]',
			top: 'top-[3.0625rem]',
			w: 'w-[3.5625rem]',
			h: 'h-[0.9375rem]',
			rotation: 'rotate-[6deg]',
			iconW: '10',
			textSize: 'text-[0.5625rem]'
		},
		{
			icon: null,
			text: 'v0.1',
			cssClass: 'mobile-home-pill-version',
			left: 'left-[8.9375rem]',
			top: 'top-[3.1875rem]',
			w: 'w-[1.9375rem]',
			h: 'h-[1.125rem]',
			rotation: 'rotate-[-8deg]',
			iconW: null,
			textSize: 'text-[0.75rem]'
		},
		{
			icon: 'lucide:pointer',
			text: clickCount,
			cssClass: 'mobile-home-pill-clicks',
			left: 'left-[12.0625rem]',
			top: 'top-[3rem]',
			w: 'w-[3.4375rem]',
			h: 'h-5',
			rotation: 'rotate-[-4deg]',
			iconW: '14',
			textSize: 'text-[0.75rem]'
		}
	]);

	const showHotmAndChangelog = false;

	const hotmPills = [
		{ text: '/ topplaylist', maxW: 'max-w-[3.5625rem]', squircle: true },
		{ text: '/ topplaylistthis', maxW: 'max-w-[4.25rem]', squircle: false }
	];

	const footerLinks = [
		{ href: 'https://status.sptfy.in', external: true, label1: 'server', label2: 'status' },
		{ href: '/@/about/terms', external: false, label1: 'terms', label2: null },
		{ href: '/@/about/privacy', external: false, label1: 'privacy', label2: null },
		{ href: '/@/about/socials', external: false, label1: 'contact', label2: null }
	];

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
				? records.slice(0, 2)
				: activeTab === 'mylinks'
					? ownedLinks
					: topRecords.slice(0, 2),
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
		getId: activeTab === 'mylinks' ? (item) => item.id : (item) => item.id_url
	});

	function toggleCustomize() {
		customizeExpanded = !customizeExpanded;
	}
</script>

{#snippet linkItem(item)}
	<a href={resolve(`/${item.id_url}`)} class="font-normal text-[var(--rd-ink)]" target="_blank">
		<span class="text-[var(--rd-muted)]"
			>{item.subdomain === 'sptfy.in' ? 'sptfy.in' : `${item.subdomain}.sptfy.in`}/</span
		><span>{item.id_url}</span>
	</a>
{/snippet}

<div
	class="mobile-home-root max-w-[100dvw - 20rem] relative mx-auto h-dvh w-full overflow-hidden bg-[var(--rd-bg)] text-[var(--rd-ink)] md:hidden"
>
	<div
		class="mobile-home-shell rd-squircle border-3 absolute left-3.5 top-[0.6875rem] mb-2 h-[calc(100dvh-7rem)] max-h-[100dvh] w-[calc(100%-1.8125rem)] max-w-[100dvw-7rem] overflow-y-auto rounded-2xl border-[var(--rd-line)] bg-[var(--rd-shell)]"
	>
		<div
			class="mobile-home-content absolute left-1/2 top-8 grid min-h-[calc(100%-2rem)] min-w-[20rem] max-w-[24rem] -translate-x-1/2 grid-rows-[auto_auto_1fr] gap-y-3"
		>
			{#if visible}
				<div
					class="mobile-home-turnstile absolute left-1/2 top-0 z-30 w-[18.75rem] -translate-x-1/2 translate-y-[7rem]"
					in:fade|global={{ duration: 180 }}
				>
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
			<header
				class="mobile-home-header relative mt-4 {showHotmAndChangelog
					? 'h-[8.125rem]'
					: 'h-[5.25rem]'} w-[20rem]"
			>
				<h1
					class="mobile-home-logo ss03 absolute left-[4.75rem] top-0 flex h-12 w-[10.9375rem] items-center justify-center font-jak-display text-5xl font-black leading-none text-[var(--rd-mint)]"
				>
					sptfy.in
				</h1>

				{#each statPills as pill (pill.cssClass)}
					<div
						class="{pill.cssClass} rd-squircle rd-shadow-lift absolute rounded-full {pill.left} {pill.top} flex {pill.h} {pill.w} {pill.rotation} items-center justify-center gap-px bg-[var(--rd-yellow)] px-2 py-0.5 {pill.textSize} font-semibold leading-none text-[#161517]"
					>
						{#if pill.icon}
							<iconify-icon icon={pill.icon} width={pill.iconW}></iconify-icon>
						{/if}
						<span>{pill.text}</span>
					</div>
				{/each}

				{#if showHotmAndChangelog}
					<div
						class="mobile-home-hotm rd-squircle rd-shadow-inset absolute left-px top-[6.3125rem] h-[1.75rem] w-[10.875rem] rounded-2xl bg-[var(--rd-panel)]"
					>
						<div
							class="mobile-home-hotm-content absolute left-[0.6875rem] top-[0.4375rem] flex h-[0.9375rem] w-[9.5rem] items-center gap-[0.3125rem] overflow-hidden whitespace-nowrap text-[0.5rem] italic text-[var(--rd-ink)]"
						>
							<iconify-icon icon="lucide:flame" width="14" class="shrink-0 text-[var(--rd-mint)]"
							></iconify-icon>
							{#each hotmPills as pill (pill.text)}
								<span
									class="mobile-home-hotm-pill {pill.squircle
										? 'rd-squircle rounded-[0.625rem]'
										: ''} inline-flex h-[0.9375rem] {pill.maxW} items-center truncate bg-[var(--rd-chip)] px-[0.4375rem] underline shadow-[inset_0_-1px_2.5px_0_rgba(197,97,212,0.44)]"
									>{pill.text}</span
								>
							{/each}
						</div>
					</div>
					<div
						class="mobile-home-changelog rd-squircle rd-shadow-inset absolute left-[11.1875rem] top-[6.3125rem] h-[1.8125rem] w-[8.6875rem] rounded-2xl bg-[var(--rd-panel)]"
					>
						<p
							class="mobile-home-changelog-text absolute left-2.5 top-[0.6875rem] max-w-[7.1875rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.4375rem] leading-[0.8125rem] text-[var(--rd-ink-soft)]"
						>
							<span class="font-bold not-italic text-[var(--rd-mint)]">updates:</span>
							<span class="italic underline"> guest links are live</span>
						</p>
					</div>
				{/if}
			</header>

			<section
				class="mobile-home-url-preview rd-squircle rd-shadow-inset relative h-[4.1875rem] w-full rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3.5 py-[0.8125rem]"
			>
				<div
					class="mobile-home-url-preview-header absolute left-3.5 top-[0.9375rem] flex h-[0.9375rem] items-center gap-1 text-[0.625rem] font-normal leading-none text-[var(--rd-mint)]"
				>
					<!-- <iconify-icon icon="lucide:link-2" width="17"></iconify-icon> -->
					<span>url preview</span>
				</div>
				<p
					class="mobile-home-url-preview-url absolute left-3.5 top-[2.25rem] h-[1rem] w-[11.875rem] overflow-hidden whitespace-nowrap text-base italic leading-none text-[var(--rd-ink-soft)]"
				>
					<span class="font-normal">{qrDomain}/</span><span
						class="font-light underline decoration-[rgba(74,227,161,0.5)]">{shortIdDisplay}</span
					>
				</p>
				<div
					class="mobile-home-url-preview-actions absolute left-[13.3125rem] top-[0.875rem] flex h-10 w-[5.6875rem] gap-1.5"
				>
					<QrDrawer
						{qrUrl}
						{shortIdDisplay}
						triggerClass="rd-shadow-nav size-10 rounded-2xl border border-[var(--rd-action)] bg-[var(--rd-action)] p-0 text-[var(--rd-ink)]"
						iconWidth="24"
					/>
					<Button
						type="button"
						variant="ghost"
						class="rd-shadow-nav size-10 rounded-2xl border border-[var(--rd-action)] bg-[var(--rd-action)] p-0 text-[var(--rd-ink)]"
						onclick={handlePreviewCopy}
						aria-label="copy short URL"
					>
						<iconify-icon icon="lucide:copy" width="24"></iconify-icon>
					</Button>
				</div>
			</section>
			<div class="section-2 min-h-0">
				<section
					class="mobile-home-main-box rd-squircle rd-shadow-panel max-h-[12.9375rem] w-full overflow-y-auto rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3.5 py-3"
				>
					<form
						onsubmit={preventDefault(handleSubmit)}
						class="mobile-home-main-box-form grid gap-2 pt-2"
					>
						<!-- <Label
							for="url-mobile"
							class="mobile-home-main-box-label pl-1 pt-1 text-[0.625rem] font-normal text-[var(--rd-ink)]"
							>paste your long ass URL here</Label
						> -->
						<div
							class="mobile-home-main-box-input-row flex items-center rounded-2xl has-[input:focus]:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
						>
							<div class="flex-1">
								<input
									onpaste={handleInputOnPaste}
									id="url-mobile"
									type="url"
									placeholder={isExpandingUrl
										? 'Expanding link...'
										: 'https://open.spotify.com/xxxx....'}
									bind:value={inputText}
									class="inverseShadow h-10 w-full rounded-l-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 text-[0.625rem] text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c]"
									required
									disabled={isExpandingUrl}
								/>
							</div>
							<div class="">
								<button
									type="button"
									onclick={() => handlePaste()}
									disabled={isExpandingUrl}
									aria-label="paste URL"
									class="flex h-10 w-14 items-center justify-center rounded-r-2xl border border-[rgba(57,54,77,0.2)] bg-transparent p-0 text-[var(--rd-ink)] shadow-[0px_1px_1.2px_0px_rgba(16,17,17,0.54),inset_0px_1.2px_2.7px_0px_rgba(145,95,183,0.78),inset_0px_-3px_2px_0px_rgba(24,24,27,0.32)] transition-colors hover:bg-[rgba(16,17,17,0.5)] hover:shadow-[0.1px_1px_4px_0px_#3e3858,inset_1px_3px_3px_3px_rgba(9,7,17,0.47)] active:bg-[var(--rd-mint)] active:text-[var(--rd-bg)]"
								>
									<iconify-icon icon="lucide:clipboard-paste" width="20" class="text-inherit"
									></iconify-icon>
								</button>
							</div>
						</div>

						<div
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && toggleCustomize()}
							class="mobile-home-main-box-customize-btn relative flex h-8 w-full {customizeExpanded
								? 'px-0'
								: 'px-1'} items-center justify-between rounded-xl text-left text-[0.625rem] text-[var(--rd-ink)]"
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
									<Select.Root type="single" name="mobileDomainSelect" bind:value={selected}>
										<Select.Trigger
											class="h-7 rounded-xl border-[var(--rd-action)] bg-[#201f28] text-[0.625rem]"
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
										id="short-id-mobile"
										placeholder={shortIdDisplay}
										bind:value={customShortId}
										oninput={(e) => updateCustomShortId(e.currentTarget.value)}
										class={[
											'h-7 rounded-xl border-[var(--rd-action)] bg-[#201f28] text-[0.625rem] text-[var(--rd-ink)] placeholder:text-[var(--rd-muted)]',
											slugInputClass
										]}
									/>
								</div>
							</div>
							<button
								type="button"
								onclick={toggleCustomize}
								class="z-20 ml-2 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
								aria-label={customizeExpanded
									? 'Collapse customize options'
									: 'Expand customize options'}
							>
								<iconify-icon
									icon="lucide:chevron-down"
									class="h-3.5 w-3.5 text-[var(--rd-ink)] transition-transform duration-300 {customizeExpanded
										? 'rotate-180'
										: ''}"
								></iconify-icon>
							</button>
						</div>

						{#if customizeExpanded && isCustomSlugProvided}
							<p class="mobile-home-main-box-slug-status h-3 text-[0.5625rem] leading-none">
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

						<!-- <Button
							class="mobile-home-main-box-submit h-8 rounded-xl bg-[var(--rd-mint)] text-xs font-bold text-[#161517] shadow-[inset_0_-3px_4px_0_#3b906b96] hover:bg-[var(--rd-mint)]"
							type="submit"
							disabled={buttonDisabled}
						>
							<iconify-icon
								icon={loading ? 'lucide:loader' : 'lucide:scissors'}
								class={loading ? 'mr-1 animate-spin' : 'mr-1'}
								width="14"
							></iconify-icon>
							{maintenanceActive
								? 'maintenance...'
								: loading
									? 'loading...'
									: turnstileStatus !== 'verified'
										? 'validating...'
										: 'short it!'}
						</Button> -->
						<HomeSubmitButton
							{loading}
							{maintenanceActive}
							{turnstileStatus}
							disabled={buttonDisabled}
							class="submit-button align-center m-auto flex w-full flex-row items-center justify-center gap-2 rounded-xl text-center shadow-[inset_0_-3px_4px_0_#3b906b96]
								{loading ? 'bg-secondary text-foreground shadow-[inset_0_-3px_4px_0_#3b906b96]' : ''}
								transition-all"
						/>
					</form>
					<div class="mobile-home-main-box-continue my-2">
						<p class="text-[0.5625rem] leading-tight text-[var(--rd-muted)]">
							by continuing, you agree to
							<a href={resolve('/@/about/privacy')} class="underline">privacy policy</a> and
							<a href={resolve('/@/about/terms')} class="underline">terms</a>.
						</p>
					</div>
				</section>

				<div
					class="mobile-home-footer-bar rd-squircle rd-shadow-inset relative z-[-1] -mt-[0.5rem] ml-auto flex h-[2.875rem] w-[12.4375rem] items-center justify-center gap-4 rounded-b-2xl bg-[var(--rd-panel)] px-4 pt-2 leading-none"
				>
					{#each footerLinks as link (link.label1)}
						{#if link.external}
							<button
								type="button"
								onclick={() => globalThis.open(link.href, '_blank', 'noopener,noreferrer')}
								class="text-center text-[0.5rem] leading-none text-[var(--rd-muted)] underline underline-offset-1"
								>{link.label1}{#if link.label2}<br />{link.label2}{/if}</button
							>
						{:else}
							<a
								href={resolve(link.href)}
								class="text-center text-[0.5rem] leading-none text-[var(--rd-muted)] underline underline-offset-1"
								>{link.label1}{#if link.label2}<br />{link.label2}{/if}</a
							>
						{/if}
					{/each}
				</div>

				<div class="mobile-home-links-wrapper -mt-3">
					<div
						class="mobile-home-links-tab rd-shadow-inset relative z-[-1] grid h-[3.375rem] w-[5.1875rem] grid-rows-[auto_auto_1fr] rounded-t-2xl bg-[var(--rd-panel)]"
					>
						<p class="mt-2 text-center text-[0.625rem] leading-[0.8125rem] text-[var(--rd-muted)]">
							links
						</p>
					</div>
					<section
						class="mobile-home-links-box rd-squircle rd-shadow-panel relative -mt-[1.6875rem] max-h-[14.375rem] w-full overflow-y-auto rounded-2xl bg-[var(--rd-panel)]"
					>
						<div class="flex items-center justify-between px-3 pt-3">
							<div class="flex w-fit items-center">
								{#each tabs as tab (tab.id)}
									<button
										type="button"
										onclick={() => (activeTab = tab.id)}
										class={[
											'h-8 w-fit cursor-pointer border border-[rgba(57,54,77,0.2)] px-[0.8125rem] text-[0.625rem] font-light leading-none transition-colors',
											tab.edgeClass,
											activeTab === tab.id
												? `rd-tab-active ${tab.borderSide}`
												: `rd-tab-inactive ${tab.borderSide}`
										].join(' ')}
									>
										{tab.label}
									</button>
								{/each}
							</div>
							<a
								href={resolve(
									activeTab === 'recent'
										? '/@/recent'
										: activeTab === 'mylinks'
											? '/@/dash/links'
											: '/@/top'
								)}
								class="offset-0 flex h-8 w-fit items-center rounded-2xl border border-[rgba(57,54,77,0.2)] bg-[rgba(57,54,77,0.2)] px-[1.0625rem] text-[0.625rem] font-light leading-none text-[#fafafa] shadow-[0px_1px_1.2px_0px_rgba(16,17,17,0.54),inset_0px_-3px_2px_0px_rgba(24,24,27,0.32),inset_0px_1.2px_2.7px_0px_rgba(145,95,183,0.78)] hover:bg-secondary/80 hover:shadow-[0.1px_1px_1.7px_0px_rgba(62,56,88,0.49),inset_1px_3px_3px_2px_rgba(9,7,17,0.47)]"
							>
								view all
							</a>
						</div>
						<div class="my-2 space-y-1 px-3 pb-3 font-normal">
							{#if activeTab === 'mylinks' && deleteTurnstileVisible && pendingDeleteLink}
								<div
									class="mb-2 rounded-lg border border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] p-2 text-[0.625rem] leading-tight text-[var(--rd-muted)]"
								>
									<p class="mb-1">verify to delete {pendingDeleteLink.id_url}</p>
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
									<div class="mt-1 flex items-center justify-between gap-2">
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
								<p class="text-[0.6875rem] text-[var(--rd-muted)]">{tabContent.loadingMsg}</p>
							{:else if tabContent.empty}
								<p class="text-[0.6875rem] text-[var(--rd-muted)]">{tabContent.emptyMsg}</p>
							{:else}
								<div class="space-y-1">
									{#each tabContent.items as item (tabContent.getId(item))}
										<div
											class="mobile-home-link-row flex items-center justify-between gap-3 rounded-md border-b border-muted/90 px-2 py-1.5 text-[0.6875rem] leading-none"
										>
											<div class="min-w-0 flex-1 truncate">{@render linkItem(item)}</div>
											{#if activeTab === 'mylinks'}
												<button
													type="button"
													class="shrink-0 text-[0.5625rem] text-red-400 underline"
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
													<iconify-icon icon="lucide:mouse-pointer-click" width="10"></iconify-icon>
													{formatNumber(item.utm_view)}
												</span>
											{:else}
												<span class="shrink-0 text-[var(--rd-muted)]"
													>{localizeDate(item.created)}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</section>
				</div>
			</div>
		</div>
	</div>
</div>
