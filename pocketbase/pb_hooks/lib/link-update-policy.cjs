// Allowlist policy for non-superuser updates to random_short records.
// Loaded from hooks via require(`${__hooks}/lib/link-update-policy.cjs`) and from Vitest.

const VIEW_COUNTER_FIELD = 'utm_view';
const OWNER_EDITABLE_FIELDS = ['from', 'id_url', 'subdomain'];
const GUEST_CLAIM_FIELD = 'user';

/**
 * @param {object} input
 * @param {string[]} input.changedFields - fields whose value differs from the stored record
 * @param {number} input.originalViews
 * @param {number} input.nextViews
 * @param {boolean} input.isOwner - authenticated user owns the record
 * @param {boolean} input.canClaimGuestLink - authenticated user proved guest ownership
 * @returns {string | null} rejection message, or null when the update is allowed
 */
function checkLinkUpdate({ changedFields, originalViews, nextViews, isOwner, canClaimGuestLink }) {
	for (const field of changedFields) {
		if (field === VIEW_COUNTER_FIELD) {
			if (nextViews !== originalViews + 1) {
				return `Field "${VIEW_COUNTER_FIELD}" can only be incremented by 1`;
			}
			continue;
		}

		if (isOwner && OWNER_EDITABLE_FIELDS.includes(field)) continue;
		if (canClaimGuestLink && field === GUEST_CLAIM_FIELD) continue;

		return `Field "${field}" cannot be updated`;
	}

	return null;
}

module.exports = {
	VIEW_COUNTER_FIELD,
	OWNER_EDITABLE_FIELDS,
	GUEST_CLAIM_FIELD,
	checkLinkUpdate
};
