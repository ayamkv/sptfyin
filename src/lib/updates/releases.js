import versionInfo from './version.json';

export const APP_VERSION = versionInfo.version;
export const RELEASE_NOTIFICATION_DAYS = 7;

export const RELEASES = [
	{
		version: '0.1.0',
		date: '2026-06-01',
		title: 'almost two years of sptfy.in',
		chip: 'accounts + guest links are live',
		summary:
			'a big reset for sptfy.in with Svelte 5, a refreshed UI, local guest links, and real accounts.',
		component: 'v0.1.0'
	}
];

export const latestRelease = RELEASES[0];

export function versionLabel(version = APP_VERSION) {
	return `v${String(version).replace(/^v/, '')}`;
}

export function releaseAnchor(version) {
	return versionLabel(version).replace(/\./g, '-');
}

export function releaseHref(release) {
	return `/@/updates#${releaseAnchor(release.version)}`;
}

export function isReleaseFresh(release, now = new Date(), days = RELEASE_NOTIFICATION_DAYS) {
	if (!release?.date) return false;

	const releasedAt = Date.parse(`${release.date}T00:00:00Z`);
	if (Number.isNaN(releasedAt)) return false;

	const age = now.getTime() - releasedAt;
	return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}

export function releaseSeenStorageKey(release) {
	return `sptfyin:update:${release.version}:seen`;
}
