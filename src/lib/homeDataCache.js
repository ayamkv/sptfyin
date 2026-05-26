const CACHE_KEY = 'sptfyin_home_data';
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function getHomeData() {
	if (typeof localStorage !== 'undefined') {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (cached) {
				const parsed = JSON.parse(cached);
				if (parsed.expires > Date.now()) {
					return parsed.data;
				}
			}
		} catch {}
	}

	const res = await fetch('/home-data.json');
	if (!res.ok) {
		throw new Error(`Failed to fetch home data: ${res.status}`);
	}
	const data = await res.json();

	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.setItem(
				CACHE_KEY,
				JSON.stringify({
					data,
					expires: Date.now() + CACHE_TTL
				})
			);
		} catch {}
	}

	return data;
}

export function clearHomeDataCache() {
	if (typeof localStorage !== 'undefined') {
		try {
			localStorage.removeItem(CACHE_KEY);
		} catch {}
	}
}
