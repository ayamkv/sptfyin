/**
 * Maintenance mode utilities
 *
 * Environment variables (set in Cloudflare Pages or .env):
 * - PUBLIC_MAINTENANCE_MODE: "true" | "off" | "false" - true forces on, off forces off, false/empty uses schedule
 * - PUBLIC_MAINTENANCE_TYPE: migration | database | infrastructure | security | incident | general
 * - PUBLIC_MAINTENANCE_NOTE: optional extra context shown under the status message
 * - PUBLIC_MAINTENANCE_SCHEDULED: ISO date string - Start time
 * - PUBLIC_MAINTENANCE_END: ISO date string - End time (optional)
 * - PUBLIC_STATUS_PAGE_URL: optional status page URL (defaults to https://status.sptfy.in)
 */

import { env } from '$env/dynamic/public';

const MAINTENANCE_TYPES = {
	migration: 'migration',
	database: 'database',
	infrastructure: 'infrastructure',
	security: 'security',
	incident: 'incident',
	general: 'general'
};

/**
 * Get normalized maintenance type
 * @returns {'migration' | 'database' | 'infrastructure' | 'security' | 'incident' | 'general'}
 */
export function getMaintenanceType() {
	const type = (env.PUBLIC_MAINTENANCE_TYPE || '').trim().toLowerCase();
	return MAINTENANCE_TYPES[type] ? type : 'general';
}

/**
 * Get human-readable maintenance type label
 * @returns {string}
 */
export function getMaintenanceTypeLabel() {
	return MAINTENANCE_TYPES[getMaintenanceType()];
}

/**
 * Get normalized maintenance mode
 * @returns {'force_on' | 'force_off' | 'auto'}
 */
export function getMaintenanceMode() {
	const mode = (env.PUBLIC_MAINTENANCE_MODE || '').trim().toLowerCase();

	if (mode === 'true') return 'force_on';
	if (mode === 'off') return 'force_off';

	return 'auto';
}

/**
 * Check if maintenance mode is currently active
 * @returns {boolean}
 */
export function isMaintenanceActive(now = Date.now()) {
	const mode = getMaintenanceMode();
	if (mode === 'force_on') return true;
	if (mode === 'force_off') return false;

	const startDate = getScheduledMaintenanceDate();
	if (!startDate) return false;

	if (startDate.getTime() > now) return false;

	const endDate = getMaintenanceEndDate();
	if (endDate && endDate.getTime() <= startDate.getTime()) {
		return true;
	}

	if (endDate && now >= endDate.getTime()) return false;

	return true;
}

/**
 * Get maintenance status message
 * @param {'active' | 'scheduled'} status
 * @returns {string}
 */
export function getMaintenanceMessage(status) {
	const typeLabel = getMaintenanceTypeLabel();

	if (status === 'scheduled') {
		return `${typeLabel} maintenance will start soon.`;
	}

	return `${typeLabel} maintenance is in progress. Link creation is temporarily disabled.`;
}

/**
 * Get optional maintenance note
 * @returns {string | null}
 */
export function getMaintenanceNote() {
	const note = env.PUBLIC_MAINTENANCE_NOTE;
	return note && note.trim() ? note.trim() : null;
}

/**
 * Get status page URL
 * @returns {string}
 */
export function getStatusPageUrl() {
	const url = env.PUBLIC_STATUS_PAGE_URL;
	return url && url.trim() ? url.trim() : 'https://status.sptfy.in';
}

/**
 * Get the scheduled maintenance date, if any
 * @returns {Date | null}
 */
export function getScheduledMaintenanceDate() {
	const scheduled = env.PUBLIC_MAINTENANCE_SCHEDULED;
	if (!scheduled || !scheduled.trim()) return null;

	const date = new Date(scheduled);
	if (isNaN(date.getTime())) return null;

	return date;
}

/**
 * Get the scheduled maintenance end date, if any
 * @returns {Date | null}
 */
export function getMaintenanceEndDate() {
	const scheduledEnd = env.PUBLIC_MAINTENANCE_END;
	if (!scheduledEnd || !scheduledEnd.trim()) return null;

	const date = new Date(scheduledEnd);
	if (isNaN(date.getTime())) return null;

	return date;
}

/**
 * Check if there's upcoming scheduled maintenance (not yet active)
 * @returns {boolean}
 */
export function hasScheduledMaintenance(now = Date.now()) {
	const mode = getMaintenanceMode();
	if (mode !== 'auto') return false;

	if (isMaintenanceActive(now)) return false; // Already active, not "scheduled"

	const scheduled = getScheduledMaintenanceDate();
	if (!scheduled) return false;

	return scheduled.getTime() > now;
}

/**
 * Get the current maintenance state
 * @returns {{ status: 'normal' | 'scheduled' | 'active', type: string | null, message: string | null, note: string | null, scheduledDate: Date | null, endDate: Date | null }}
 */
export function getMaintenanceState(now = Date.now()) {
	const type = getMaintenanceType();
	const note = getMaintenanceNote();
	const scheduledDate = getScheduledMaintenanceDate();
	const endDate = getMaintenanceEndDate();

	if (isMaintenanceActive(now)) {
		return {
			status: 'active',
			type,
			message: getMaintenanceMessage('active'),
			note,
			scheduledDate,
			endDate
		};
	}

	if (hasScheduledMaintenance(now)) {
		return {
			status: 'scheduled',
			type,
			message: getMaintenanceMessage('scheduled'),
			note,
			scheduledDate,
			endDate
		};
	}

	return {
		status: 'normal',
		type: null,
		message: null,
		note: null,
		scheduledDate: null,
		endDate: null
	};
}

/**
 * Calculate time remaining until scheduled maintenance
 * @param {Date} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, total: number }}
 */
export function getTimeRemaining(targetDate) {
	const total = Math.max(0, targetDate.getTime() - Date.now());

	const seconds = Math.floor((total / 1000) % 60);
	const minutes = Math.floor((total / 1000 / 60) % 60);
	const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
	const days = Math.floor(total / (1000 * 60 * 60 * 24));

	return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as a human-readable string
 * @param {{ days: number, hours: number, minutes: number, seconds: number }} time
 * @returns {string}
 */
export function formatTimeRemaining({ days, hours, minutes, seconds }) {
	const parts = [];

	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (days === 0 && hours === 0) parts.push(`${seconds}s`); // Only show seconds if < 1 hour

	return parts.join(' ') || '0s';
}
