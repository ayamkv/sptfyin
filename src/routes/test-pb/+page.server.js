export const load = async ({ locals }) => {
	const pb = locals.pb;
	const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

	console.log('[PB Test] Testing PocketBase connection to:', pbUrl);

	const results = {
		url: pbUrl,
		timestamp: new Date().toISOString(),
		tests: []
	};

	// Test 1: Basic connection
	try {
		const health = await pb.health.check();
		results.tests.push({
			name: 'Health Check',
			status: 'success',
			result: health
		});
	} catch (error) {
		results.tests.push({
			name: 'Health Check',
			status: 'error',
			error: {
				message: error.message,
				status: error.status,
				code: error.code
			}
		});
	}

	// Test 2: Auth methods
	try {
		const authMethods = await pb.collection('users').listAuthMethods();
		results.tests.push({
			name: 'Auth Methods',
			status: 'success',
			result: {
				oauth2ProvidersCount: authMethods.oauth2?.providers?.length || 0,
				spotifyConfigured: Boolean(authMethods.oauth2?.providers?.find((p) => p.name === 'spotify'))
			}
		});
	} catch (error) {
		results.tests.push({
			name: 'Auth Methods',
			status: 'error',
			error: {
				message: error.message,
				status: error.status,
				code: error.code
			}
		});
	}

	return { results };
};
