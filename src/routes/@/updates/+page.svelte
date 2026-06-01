<script>
	import { resolve } from '$app/paths';
	import { ArrowLeft, ArrowRight } from 'lucide-svelte';
	import { RELEASES, releaseAnchor, versionLabel, APP_VERSION } from '$lib/updates/releases';
	import { UPDATE_COMPONENTS } from '$lib/updates/components';
	import GeneratedChangelog from '../../../../CHANGELOG.md';

	function versionNumber(version) {
		return versionLabel(version).replace(/^v/, '');
	}

	function formatReleaseDate(date) {
		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(`${date}T00:00:00Z`));
	}
</script>

<svelte:head>
	<title>updates ~ sptfy.in</title>
	<meta
		name="description"
		content="Release notes, changelog updates, and tiny dev notes for sptfy.in."
	/>
</svelte:head>

<div
	class="relative h-dvh w-full overflow-hidden bg-[var(--rd-bg)] text-[var(--rd-ink)] md:h-full md:min-h-0 md:overflow-y-auto md:px-8 md:pb-14 md:pt-5"
>
	<div
		class="rd-squircle border-3 absolute left-3.5 top-[0.6875rem] h-[calc(100dvh-7rem)] w-[calc(100%-1.8125rem)] overflow-y-auto rounded-2xl border-[var(--rd-line)] bg-[var(--rd-shell)] px-3 pb-8 pt-3 md:static md:h-auto md:min-h-full md:w-auto md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0"
	>
		<div class="mx-auto flex min-h-full w-full max-w-6xl flex-col">
			<header class="mb-5 flex items-center justify-between gap-3">
				<a
					href={resolve('/')}
					aria-label="back home"
					class="rd-squircle rd-shadow-inset inline-flex items-center rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-4 py-2 text-sm font-semibold text-[var(--rd-ink)] no-underline hover:text-[var(--rd-mint)]"
				>
					<ArrowLeft class="size-4" aria-hidden="true" />
				</a>

				<div class="flex items-center gap-2">
					<a
						href="https://github.com/ayamkv/sptfyin/issues"
						target="_blank"
						rel="noreferrer"
						class="hidden rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)] sm:inline-flex"
					>
						report bugs
					</a>
					<a
						href="https://ko-fi.com/freqtion"
						target="_blank"
						rel="noreferrer"
						class="rd-squircle rd-shadow-lift inline-flex rotate-[-2deg] rounded-full bg-[var(--rd-yellow)] px-3 py-1.5 text-sm font-semibold text-[#161517] no-underline hover:rotate-0 hover:text-[#161517]"
					>
						support
					</a>
				</div>
			</header>

			<div class="grid flex-1 content-start gap-7 md:gap-10">
				{#each RELEASES as release, index (release.version)}
					{@const UpdateComponent = UPDATE_COMPONENTS[`v${release.version.replace(/^v/, '')}`]}
					{@const newerRelease = RELEASES[index - 1]}
					{@const olderRelease = RELEASES[index + 1]}

					<section
						class="grid scroll-mt-6 items-start gap-4 lg:grid-cols-[7rem_minmax(0,48rem)_7rem] lg:gap-6"
					>
						<div class="hidden justify-end lg:flex">
							{#if newerRelease}
								<a
									href={`#${releaseAnchor(newerRelease.version)}`}
									class="rd-squircle rd-shadow-inset sticky top-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)]"
								>
									<ArrowLeft class="size-4" aria-hidden="true" />
									{versionNumber(newerRelease.version)}
								</a>
							{/if}
						</div>

						<article
							id={releaseAnchor(release.version)}
							class="rd-squircle rd-shadow-panel overflow-hidden rounded-[2rem] border border-[var(--rd-line)] bg-[var(--rd-panel)]"
						>
							<header
								class="rd-shadow-inset flex flex-wrap items-end justify-between gap-3 border-b border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] px-5 py-5 md:px-7"
							>
								<div class="flex items-end gap-3">
									<p
										class="font-jak-display text-2xl font-black leading-[0.85] tracking-[-0.08em] text-white md:text-2xl"
									>
										{versionNumber(release.version)}
									</p>
									<p class="pb-1 text-sm font-normal text-[var(--rd-muted)]">
										current {versionLabel(APP_VERSION)}
									</p>
								</div>
								<time class="pb-1 text-sm font-normal text-[var(--rd-ink-soft)]">
									{formatReleaseDate(release.date)}
								</time>
							</header>

							{#if UpdateComponent}
								<div class="updates-content rounded-tl-lg rounded-tr-lg px-5 py-6 md:px-7 md:py-8">
									<UpdateComponent />
								</div>
							{/if}
						</article>

						<div class="hidden lg:flex">
							{#if olderRelease}
								<a
									href={`#${releaseAnchor(olderRelease.version)}`}
									class="rd-squircle rd-shadow-inset sticky top-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)]"
								>
									{versionNumber(olderRelease.version)}
									<ArrowRight class="size-4" aria-hidden="true" />
								</a>
							{/if}
						</div>

						{#if newerRelease || olderRelease}
							<div class="flex justify-between gap-3 lg:hidden">
								{#if newerRelease}
									<a
										href={`#${releaseAnchor(newerRelease.version)}`}
										class="rd-squircle rd-shadow-inset inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)]"
									>
										<ArrowLeft class="size-4" aria-hidden="true" />
										{versionNumber(newerRelease.version)}
									</a>
								{/if}

								{#if olderRelease}
									<a
										href={`#${releaseAnchor(olderRelease.version)}`}
										class="rd-squircle rd-shadow-inset ml-auto inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-3 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)]"
									>
										{versionNumber(olderRelease.version)}
										<ArrowRight class="size-4" aria-hidden="true" />
									</a>
								{/if}
							</div>
						{/if}
					</section>
				{/each}

				<section class="grid items-start gap-4 lg:grid-cols-[7rem_minmax(0,48rem)_7rem] lg:gap-6">
					<div></div>
					<article
						class="rd-squircle rd-shadow-panel overflow-hidden rounded-[2rem] border border-[var(--rd-line)] bg-[var(--rd-panel)]"
					>
						<header
							class="rd-shadow-inset flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] px-5 py-5 md:px-7"
						>
							<h2 class="text-2xl font-black leading-tight text-[var(--rd-ink)]">changelog</h2>
							<a
								href="https://github.com/ayamkv/sptfyin/blob/main/CHANGELOG.md"
								target="_blank"
								rel="noreferrer"
								class="rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--rd-muted)] no-underline hover:text-[var(--rd-mint)]"
							>
								full changelog on GitHub
							</a>
						</header>
						<div class="updates-content changelog-content px-5 py-6 md:px-7 md:py-8">
							<GeneratedChangelog />
						</div>
					</article>
					<div></div>
				</section>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.updates-content) {
		color: var(--rd-ink-soft);
		font-size: 0.98rem;
		line-height: 1.8;
	}

	:global(.updates-content > * + *) {
		margin-top: 1.05rem;
	}

	:global(.updates-content h1) {
		color: var(--rd-ink);
		font-family: 'Fixel Display', 'Fixel', sans-serif;
		font-size: clamp(1.75rem, 6vw, 2.2rem);
		font-weight: 800;
		letter-spacing: -0.055em;
		line-height: 0.95;
	}

	:global(.updates-content h2) {
		color: var(--rd-ink);
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.2;
		margin-top: 2rem;
		border-bottom: 1.5px solid #2f2f2f;
		padding-bottom: 0.25em;
	}

	:global(.updates-content p) {
		max-width: 65ch;
	}

	:global(.updates-content a) {
		color: var(--rd-mint);
		font-weight: 500;
		cursor: pointer;
	}

	:global(.updates-content code) {
		background: hsl(var(--muted) / 0.8);
		border-radius: 0.375rem;
		color: var(--rd-ink);
		font-size: 0.9em;
		padding: 0.1rem 0.35rem;
	}

	:global(.updates-content ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}

	:global(.updates-content li + li) {
		margin-top: 0.45rem;
	}

	:global(.changelog-content h1) {
		display: none;
	}

	:global(.changelog-content h2) {
		color: var(--rd-ink);
		font-size: 1.5rem;
		margin-top: 0;
	}

	:global(.changelog-content h3) {
		color: var(--rd-mint);
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1.5rem;
	}
</style>
