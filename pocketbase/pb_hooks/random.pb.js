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
	// Log the complete request info for debugging.
	$app.logger().debug('Full Request Info', e.requestInfo());

	// Retrieve headers from either e.request or the fallback from e.requestInfo()
	const req = e.request || e.requestInfo() || {};
	const headers = req.headers || {};

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

	// Log the token extraction attempt.
	$app.logger().debug('Extracted Turnstile Token', turnstileToken ? turnstileToken : 'N/A');
	// log cf_secret_key
	$app.logger().debug('CF_SECRET', process.env.CF_SECRET_KEY);

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

	$app.logger().info('Turnstile verification passed', { record: e.record });
	e.next(); // Continue with record creation
}, 'random_short');

onRecordUpdateRequest((e) => {
	// Configuration for protected and increment-only fields
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
		],
		// New: User-owned fields that can be updated by the record owner
		userOwnedFields: ['id_url', 'from', 'subdomain']
	};

	$app.logger().debug('==== Update Request Debug ====');

	// Check if the request is from a superuser (admin panel)
	const isSuperuser = e.hasSuperuserAuth();

	$app.logger().debug('Authentication check', {
		isSuperuser: isSuperuser,
		hasAuth: !!e.auth,
		authRecord: e.auth?.id || 'none'
	});

	// If superuser, allow all updates and skip protection checks
	if (isSuperuser) {
		$app.logger().info('Superuser detected - allowing all field updates');
		return e.next();
	}

	const originalRecord = e.record.original();
	const newRecord = e.record;

	// Check if the authenticated user owns this record (user field matches auth ID)
	const recordOwnerId = originalRecord.get('user');
	const authenticatedUserId = e.auth?.id;
	const isOwner = authenticatedUserId && recordOwnerId === authenticatedUserId;

	$app.logger().debug('Ownership check', {
		recordOwnerId: recordOwnerId,
		authenticatedUserId: authenticatedUserId,
		isOwner: isOwner
	});

	// Debug current values
	const logger = $app.logger().withGroup('record_values');

	const originalValues = config.protectedFields
		.concat(config.incrementOnlyFields.map((f) => f.name))
		.reduce((acc, field) => {
			acc[field] = originalRecord.get(field);
			return acc;
		}, {});

	const newValues = config.protectedFields
		.concat(config.incrementOnlyFields.map((f) => f.name))
		.reduce((acc, field) => {
			acc[field] = newRecord.get(field);
			return acc;
		}, {});

	logger.debug('Record values comparison', 'original', originalValues, 'new', newValues);

	// Check protected fields (with special handling for user-owned fields)
	for (const field of config.protectedFields) {
		const originalValue = originalRecord.get(field);
		const newValue = newRecord.get(field);

		if (originalValue !== newValue) {
			// Check if this field can be updated by the owner
			if (config.userOwnedFields.includes(field) && isOwner) {
				$app.logger().info('Owner updating user-owned field', {
					field: field,
					userId: authenticatedUserId,
					originalValue: originalValue,
					newValue: newValue
				});
				continue; // Allow the update
			}

			// Field is protected and user is not owner or field is not user-owned
			$app.logger().warn('Protected field modification attempted by non-owner', {
				field: field,
				userId: authenticatedUserId,
				recordOwnerId: recordOwnerId,
				isOwner: isOwner,
				originalValue: originalValue,
				attemptedValue: newValue
			});
			throw new BadRequestError(`Field "${field}" cannot be updated`);
		}
	}

	// Check increment-only fields (only for non-superusers)
	for (const field of config.incrementOnlyFields) {
		const originalValue = originalRecord.getInt(field.name) ?? field.defaultValue;
		const newValue = newRecord.getInt(field.name);

		if (newValue === originalValue) {
			continue; // No change to this field
		}

		if (newValue !== originalValue + 1) {
			$app
				.logger()
				.warn(
					'Invalid increment attempt by non-superuser',
					'field',
					field.name,
					'originalValue',
					originalValue,
					'attemptedValue',
					newValue
				);
			throw new BadRequestError(`Field "${field.name}" can only be incremented by 1`);
		}

		$app
			.logger()
			.info('Valid increment update', 'field', field.name, 'from', originalValue, 'to', newValue);
	}

	e.next();
});

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

			// Only process if this appears to be from Spotify
			if (rawUser && (providerName === 'spotify' || e.meta.id)) {
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
