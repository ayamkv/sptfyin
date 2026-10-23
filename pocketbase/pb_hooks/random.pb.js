/// <reference path="../pb_data/types.d.ts" />

// For analytics

onRecordCreateRequest((e) => {
	// Log all request headers for debugging
	$app.logger().debug('### DEBUG: Request Headers', 'headers', e.requestInfo());

	// $app.logger().info("Real IP address detected", "ip", e.realIP())

	// log the request
	$app.logger().info('WOII Record Create Request', 'record', e.record);

	try {
		const requestIp = e.realIP();
		const res = $http.send({
			url: 'http://ip-api.com/json/' + requestIp + '?fields=countryCode',
			headers: { 'content-type': 'application/json' }
		});

		const response = res.json;
		const countryCode = response.countryCode;
		$app.logger().info('Country Code detected', 'countryCode', countryCode);
		// e.record.set("rawData", countryCode)
	} catch (err) {
		$app.logger().error('IP API request failed', 'error', err);
	}
	e.next();
}, 'analytics');

onRecordCreateRequest((e) => {
	function getRequestHeaders() {
		const req = e.request || (typeof e.requestInfo === 'function' ? e.requestInfo() : {}) || {};
		return req.headers || {};
	}

	function getHeaderValue(headers, headerName) {
		const normalizedHeaderName = headerName.toLowerCase().replace(/-/g, '_');

		for (const key in headers) {
			const normalizedKey = key.toLowerCase().replace(/-/g, '_');
			if (normalizedKey === normalizedHeaderName) {
				return headers[key];
			}
		}

		return '';
	}

	function getGuestProofHash() {
		const proof = getHeaderValue(getRequestHeaders(), 'x-sptfyin-guest-proof');
		return proof ? $security.sha256(proof) : '';
	}

	function verifyTurnstile() {
		const turnstileToken = getHeaderValue(getRequestHeaders(), 'x-turnstile-token');

		if (!turnstileToken) {
			throw new BadRequestError('Turnstile error', {
				verification: {
					code: 'missing_token',
					message: 'Turnstile token not found.'
				}
			});
		}

		const verifyResponse = $http.send({
			url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				secret: process.env.CF_SECRET_KEY,
				response: turnstileToken
			})
		});

		const verifyResult = verifyResponse.json;
		if (!verifyResult.success) {
			throw new BadRequestError('Turnstile verification failed', {
				verification: new ValidationError(
					verifyResult['error-codes']?.[0] || 'verification_failed',
					'Turnstile verification failed'
				)
			});
		}
	}

	// Log the complete request info for debugging.
	$app.logger().debug('Full Request Info', e.requestInfo());

	const headers = getRequestHeaders();

	// Log the headers so we can see every key available
	$app.logger().debug('Available Headers', headers);

	// Try to extract the token in a case-insensitive manner.
	let turnstileToken;
	for (const key in headers) {
		if (key.toLowerCase() === 'x_turnstile_token') {
			turnstileToken = headers[key];
			break;
		}
	}

	// If token not found then throw error.
	if (!turnstileToken) {
		throw new BadRequestError('Turnstile error', {
			verification: {
				code: 'missing_token',
				message: 'Turnstile token not found.'
			}
		});
	}

	// Proceed with Turnstile validation using Cloudflare's API.
	const verifyResponse = $http.send({
		url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			secret: process.env.CF_SECRET_KEY,
			response: turnstileToken
		})
	});

	const verifyResult = verifyResponse.json;
	if (!verifyResult.success) {
		$app.logger().debug('Turnstile verification failed', verifyResult);

		throw new BadRequestError('Turnstile verification failed', {
			verification: new ValidationError(
				verifyResult['error-codes']?.[0] || 'verification_failed',
				'Turnstile verification failed'
			)
		});
	}

	const authenticatedUserId = e.auth?.id;
	const requestedUserId = e.record.get('user');
	const requestedGuestOwnerHash = e.record.get('guest_owner_hash');

	if (authenticatedUserId) {
		if (requestedUserId && requestedUserId !== authenticatedUserId) {
			throw new BadRequestError('User ownership mismatch');
		}

		e.record.set('user', authenticatedUserId);
		e.record.set('guest_owner_hash', '');
		e.record.set('guest_active', false);
	} else {
		const providedGuestProofHash = getGuestProofHash();

		if (requestedUserId) {
			throw new BadRequestError('Anonymous users cannot assign link ownership');
		}

		if (
			!requestedGuestOwnerHash ||
			!providedGuestProofHash ||
			!$security.equal(requestedGuestOwnerHash, providedGuestProofHash)
		) {
			throw new BadRequestError('Guest ownership proof missing or invalid');
		}

		e.record.set('guest_active', true);
	}

	$app.logger().info('Turnstile verification passed', { record: e.record });
	e.next(); // Continue with record creation
}, 'random_short');

onRecordAfterCreateSuccess((e) => {
	const guestOwnerHash = e.record.get('guest_owner_hash');

	if (!e.record.get('user') && guestOwnerHash) {
		try {
			const maxActiveGuestLinks = 3;
			const activeLinks = $app.findRecordsByFilter(
				'random_short',
				'user = "" && guest_owner_hash = {:guestOwnerHash} && guest_active = true',
				'-created,-id',
				500,
				0,
				{ guestOwnerHash }
			);

			for (let i = maxActiveGuestLinks; i < activeLinks.length; i += 1) {
				activeLinks[i].set('guest_active', false);
				$app.save(activeLinks[i]);
			}
		} catch (err) {
			$app.logger().error('Failed to deactivate stale guest links', {
				recordId: e.record.id,
				error: err.toString()
			});
			throw err;
		}
	}

	e.next();
}, 'random_short');

onRecordUpdateRequest((e) => {
	function getRequestHeaders() {
		const req = e.request || (typeof e.requestInfo === 'function' ? e.requestInfo() : {}) || {};
		return req.headers || {};
	}

	function getHeaderValue(headers, headerName) {
		const normalizedHeaderName = headerName.toLowerCase().replace(/-/g, '_');

		for (const key in headers) {
			const normalizedKey = key.toLowerCase().replace(/-/g, '_');
			if (normalizedKey === normalizedHeaderName) {
				return headers[key];
			}
		}

		return '';
	}

	function getGuestProofHash() {
		const proof = getHeaderValue(getRequestHeaders(), 'x-sptfyin-guest-proof');
		return proof ? $security.sha256(proof) : '';
	}

	function canTransferGuestOwnership(originalRecord, newRecord) {
		const authenticatedUserId = e.auth?.id;
		const originalGuestOwnerHash = originalRecord.get('guest_owner_hash');
		const newGuestOwnerHash = newRecord.get('guest_owner_hash');
		const providedGuestProofHash = getGuestProofHash();

		if (!authenticatedUserId || !originalGuestOwnerHash || !providedGuestProofHash) {
			return false;
		}

		return (
			!originalRecord.get('user') &&
			$security.equal(originalGuestOwnerHash, providedGuestProofHash) &&
			newRecord.get('user') === authenticatedUserId &&
			newGuestOwnerHash === originalGuestOwnerHash
		);
	}

	// Compare every field so new schema fields are protected by default.
	function readComparableValue(record, name, type) {
		if (type === 'select' || type === 'relation' || type === 'file') {
			return record.getStringSlice(name).join('\n');
		}
		return record.getString(name);
	}

	function getChangedFields(originalRecord, newRecord) {
		const fields = originalRecord.collection().fields;
		const changed = [];

		for (let i = 0; i < fields.length; i += 1) {
			const name = fields[i].getName();
			const type = fields[i].type();

			if (name === 'id' || type === 'autodate') continue;

			if (
				readComparableValue(originalRecord, name, type) !==
				readComparableValue(newRecord, name, type)
			) {
				changed.push(name);
			}
		}

		return changed;
	}

	if (e.hasSuperuserAuth()) {
		return e.next();
	}

	const { checkLinkUpdate, VIEW_COUNTER_FIELD } = require(`${__hooks}/lib/link-update-policy.cjs`);

	const originalRecord = e.record.original();
	const newRecord = e.record;
	const authenticatedUserId = e.auth?.id;
	const changedFields = getChangedFields(originalRecord, newRecord);

	const rejection = checkLinkUpdate({
		changedFields,
		originalViews: originalRecord.getInt(VIEW_COUNTER_FIELD),
		nextViews: newRecord.getInt(VIEW_COUNTER_FIELD),
		isOwner: Boolean(authenticatedUserId && originalRecord.get('user') === authenticatedUserId),
		canClaimGuestLink: canTransferGuestOwnership(originalRecord, newRecord)
	});

	if (rejection) {
		$app.logger().warn('Rejected random_short update', {
			recordId: originalRecord.id,
			userId: authenticatedUserId || '',
			changedFields: changedFields.join(',')
		});
		throw new BadRequestError(rejection);
	}

	e.next();
}, 'random_short');

onRecordUpdateExecute((e) => {
	// Configuration needs to be duplicated in each hook
	const config = {
		protectedFields: [
			'name',
			'from',
			'id_url',
			'subdomain',
			'enable',
			'analytics',
			'utm_userAgent'
		],
		incrementOnlyFields: [
			{
				name: 'utm_view',
				defaultValue: 0
			}
		]
	};

	const logger = $app.logger().withGroup('update_execute');

	const values = config.incrementOnlyFields.reduce((acc, field) => {
		acc[field.name] = e.record.getInt(field.name);
		return acc;
	}, {});

	logger.debug('Executing update with values', 'fields', values);
	e.next();
});

onRecordAfterUpdateSuccess((e) => {
	// Configuration needs to be duplicated in each hook
	const config = {
		protectedFields: [
			'name',
			'from',
			'id_url',
			'subdomain',
			'enable',
			'analytics',
			'utm_userAgent'
		],
		incrementOnlyFields: [
			{
				name: 'utm_view',
				defaultValue: 0
			}
		]
	};

	const logger = $app.logger().withGroup('update_success');

	const finalValues = config.incrementOnlyFields.reduce((acc, field) => {
		acc[field.name] = e.record.getInt(field.name);
		return acc;
	}, {});

	logger.info('Update successfully persisted', 'finalValues', finalValues);
	e.next();
});

onRecordDeleteRequest((e) => {
	function getRequestHeaders() {
		const req = e.request || (typeof e.requestInfo === 'function' ? e.requestInfo() : {}) || {};
		return req.headers || {};
	}

	function getHeaderValue(headers, headerName) {
		const normalizedHeaderName = headerName.toLowerCase().replace(/-/g, '_');

		for (const key in headers) {
			const normalizedKey = key.toLowerCase().replace(/-/g, '_');
			if (normalizedKey === normalizedHeaderName) {
				return headers[key];
			}
		}

		return '';
	}

	function getGuestProofHash() {
		const proof = getHeaderValue(getRequestHeaders(), 'x-sptfyin-guest-proof');
		return proof ? $security.sha256(proof) : '';
	}

	function verifyTurnstile() {
		const turnstileToken = getHeaderValue(getRequestHeaders(), 'x-turnstile-token');

		if (!turnstileToken) {
			throw new BadRequestError('Turnstile error', {
				verification: {
					code: 'missing_token',
					message: 'Turnstile token not found.'
				}
			});
		}

		const verifyResponse = $http.send({
			url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				secret: process.env.CF_SECRET_KEY,
				response: turnstileToken
			})
		});

		const verifyResult = verifyResponse.json;
		if (!verifyResult.success) {
			throw new BadRequestError('Turnstile verification failed', {
				verification: new ValidationError(
					verifyResult['error-codes']?.[0] || 'verification_failed',
					'Turnstile verification failed'
				)
			});
		}
	}

	if (e.hasSuperuserAuth()) {
		return e.next();
	}

	const recordOwnerId = e.record.get('user');
	const authenticatedUserId = e.auth?.id;

	if (authenticatedUserId && recordOwnerId === authenticatedUserId) {
		return e.next();
	}

	const recordGuestOwnerHash = e.record.get('guest_owner_hash');
	const isGuestActive = e.record.get('guest_active');
	const providedGuestProofHash = getGuestProofHash();

	if (
		!recordOwnerId &&
		recordGuestOwnerHash &&
		isGuestActive &&
		providedGuestProofHash &&
		$security.equal(recordGuestOwnerHash, providedGuestProofHash)
	) {
		verifyTurnstile();
		return e.next();
	}

	throw new BadRequestError('Not authorized to delete this link');
}, 'random_short');

// Hook to handle Spotify OAuth user creation/authentication
onRecordAuthRequest((e) => {
	$app.logger().info('Record authentication request', {
		authMethod: e.authMethod,
		recordId: e.record?.id || 'null',
		hasMeta: !!e.meta
	});

	// Check if this is an OAuth2 authentication and if it's Spotify
	if (e.authMethod === 'oauth2' && e.meta) {
		try {
			// Log the full meta object to understand its structure
			$app.logger().debug('OAuth2 Meta Data', 'meta', e.meta);

			// Look for Spotify provider identification
			// The meta should contain rawUser data from Spotify
			const rawUser = e.meta.rawUser;
			const providerName = e.meta.provider || e.meta.name;

			$app.logger().info('Processing OAuth2 authentication', {
				provider: providerName,
				hasRawUser: !!rawUser,
				metaKeys: Object.keys(e.meta || {})
			});

			// Only Spotify OAuth should populate spotify_id.
			if (rawUser && providerName === 'spotify') {
				// Extract Spotify user ID from the raw user data
				const spotifyUserId = rawUser.id || e.meta.id;
				const spotifyUsername = rawUser.display_name || rawUser.username || e.meta.username;

				$app.logger().info('Found Spotify OAuth data', {
					spotifyId: spotifyUserId,
					username: spotifyUsername,
					recordId: e.record.id
				});

				if (spotifyUserId) {
					// Check if spotify_id is already set
					const currentSpotifyId = e.record.get('spotify_id');
					if (!currentSpotifyId) {
						// Update the record with the Spotify ID
						e.record.set('spotify_id', spotifyUserId);

						// Save the record with the new spotify_id
						$app.save(e.record);

						$app.logger().info('Set spotify_id for authenticated user', {
							userId: e.record.id,
							spotify_id: spotifyUserId,
							username: spotifyUsername
						});
					} else {
						$app.logger().debug('User already has spotify_id', {
							userId: e.record.id,
							existing_spotify_id: currentSpotifyId
						});
					}
				} else {
					$app.logger().error('No Spotify user ID found in meta data', 'rawUser', rawUser);
				}
			}
		} catch (err) {
			$app.logger().error('Error processing OAuth2 authentication', {
				error: err.toString(),
				stack: err.stack || 'No stack trace'
			});
		}
	}

	e.next();
}, 'users'); // Only apply to the "users" collection
