const stateToVerifier = new Map();

export function saveOAuthState(state, verifier, ttlMs = 10 * 60 * 1000) {
  stateToVerifier.set(state, verifier);
  setTimeout(() => {
    stateToVerifier.delete(state);
  }, ttlMs).unref?.();
}

export function takeOAuthVerifier(state) {
  const verifier = stateToVerifier.get(state);
  stateToVerifier.delete(state);
  return verifier;
}


