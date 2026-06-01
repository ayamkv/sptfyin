export function normalizeEmail(value) {
	return String(value || '')
		.trim()
		.toLowerCase();
}

export function normalizeUsername(value) {
	return String(value || '')
		.trim()
		.toLowerCase();
}

export function validateEmailFormat(value) {
	const email = normalizeEmail(value);
	if (!email) return { valid: false, message: 'Email is required.' };
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { valid: false, message: 'Use a valid email address.' };
	}

	return { valid: true, message: 'Email format looks good.' };
}

export function validateUsernameFormat(value, { optional = true } = {}) {
	const username = normalizeUsername(value);
	if (!username) {
		return optional
			? { valid: true, message: 'We can make one from your email.' }
			: { valid: false, message: 'Username is required.' };
	}

	if (username.length < 3)
		return { valid: false, message: 'Username needs at least 3 characters.' };
	if (username.length > 40)
		return { valid: false, message: 'Username must be 40 characters or fewer.' };
	if (!/^[a-z0-9_][a-z0-9_.-]*$/.test(username)) {
		return {
			valid: false,
			message: 'Use lowercase letters, numbers, _, . or -. Start with a letter, number, or _.'
		};
	}

	return { valid: true, message: 'Username format looks good.' };
}

export function validatePassword(value) {
	const password = String(value || '');
	if (!password) return { valid: false, message: 'Password is required.' };
	if (password.length < 8)
		return { valid: false, message: 'Password needs at least 8 characters.' };

	return { valid: true, message: 'Password is long enough.' };
}
