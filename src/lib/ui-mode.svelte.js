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
			window.localStorage.setItem(STORAGE_KEY, requestedMode);
		} else if (VALID_MODES.has(storedMode)) {
			this.mode = storedMode;
		}
	}

	setMode = (nextMode) => {
		if (!VALID_MODES.has(nextMode)) return;

		this.mode = nextMode;

		if (!browser) return;

		window.localStorage.setItem(STORAGE_KEY, nextMode);
	};
}

export const homeUiMode = new HomeUiMode();
