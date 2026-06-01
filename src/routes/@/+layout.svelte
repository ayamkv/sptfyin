<script>
	import { onNavigate } from '$app/navigation';
	import { onMount, tick } from 'svelte';

	let { children } = $props();
	let gsap;
	let Flip;
	let flipLoad;
	let reduceMotion = false;

	const AUTH_PATHS = new Set(['/@/login', '/@/register', '/@/forgot-password']);
	const FLIP_TARGETS = '[data-auth-flip]';

	function normalizePath(pathname) {
		return pathname.replace(/\/$/, '') || '/';
	}

	function isAuthPath(pathname) {
		return AUTH_PATHS.has(normalizePath(pathname));
	}

	async function loadFlip() {
		if (gsap && Flip) return { gsap, Flip };

		flipLoad ??= Promise.all([import('gsap'), import('gsap/Flip')])
			.then(([gsapModule, flipModule]) => {
				gsap = gsapModule.gsap || gsapModule.default || gsapModule;
				Flip = flipModule.Flip || flipModule.default;
				gsap.registerPlugin(Flip);

				return { gsap, Flip };
			})
			.catch((error) => {
				console.error('[Auth Flip] Could not load GSAP Flip', error);
				return null;
			});

		return flipLoad;
	}

	onMount(() => {
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateReduceMotion = () => {
			reduceMotion = motionQuery.matches;
		};

		updateReduceMotion();
		motionQuery.addEventListener('change', updateReduceMotion);
		if (!reduceMotion) void loadFlip();

		return () => motionQuery.removeEventListener('change', updateReduceMotion);
	});

	onNavigate(async ({ from, to }) => {
		if (reduceMotion || !from?.url || !to?.url) return;
		if (!isAuthPath(from.url.pathname) || !isAuthPath(to.url.pathname)) return;

		const modules = await loadFlip();
		if (!modules?.Flip) return;

		const state = modules.Flip.getState(FLIP_TARGETS);

		return async () => {
			await tick();

			const targets = document.querySelectorAll(FLIP_TARGETS);
			if (!targets.length) return;

			modules.Flip.from(state, {
				targets,
				duration: 0.55,
				ease: 'elastic.out(1,0.75)',
				absolute: true,
				nested: true,
				scale: true,
				fade: true,
				onEnter: (elements) =>
					modules.gsap.fromTo(
						elements,
						{ autoAlpha: 0, y: 18, scale: 0.2, filter: 'blur(8px)' },
						{
							autoAlpha: 1,
							y: 0,
							scale: 1,
							filter: 'blur(0px)',
							duration: 0.2,
							ease: 'elastic.out(1,0.75)',
							stagger: 0.035,
							overwrite: true,
							clearProps: 'opacity,visibility,transform,filter'
						}
					)
			});
		};
	});
</script>

{@render children?.()}
