import { browser } from '$app/environment';

const STORAGE_KEY = 'sptfyin-home-ui';
const VALID_MODES = new Set(['old', 'new']);

class HomeUiMode {
	mode = $state('new');

	constructor() {
		if (!browser) return;

		const params = new URLSearchParams(window.location.search);
		const requestedMode = params.get('ui');
		const storedMode = window.localStorage.getItem(STORAGE_KEY);

		if (VALID_MODES.has(requestedMode)) {
			this.mode = requestedMode;
			if (requestedMode === 'new') {
				window.localStorage.setItem(STORAGE_KEY, requestedMode);
			} else {
				window.localStorage.removeItem(STORAGE_KEY);
			}
		} else if (storedMode === 'new') {
			this.mode = storedMode;
		} else if (storedMode === 'old') {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	}

	setMode = (nextMode) => {
		if (!VALID_MODES.has(nextMode)) return;

		this.mode = nextMode;

		if (!browser) return;

		if (nextMode === 'new') {
			window.localStorage.setItem(STORAGE_KEY, nextMode);
		} else {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const homeUiMode = new HomeUiMode();
