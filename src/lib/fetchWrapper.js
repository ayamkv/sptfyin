class ResponseError extends Error {
	constructor(message, res) {
		super(message);
		this.response = res;
	}
}

export async function myFetch(...options) {
	const res = await fetch(...options);
	if (!res.ok) {
		throw new ResponseError('Bad fetch response', res);
	}
	return res;
}
