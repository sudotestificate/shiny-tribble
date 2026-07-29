export function createAuthAdapter(auth) {
  if (!auth) return {};

  if (auth.token) {
    return {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    };
  }

  if (auth.username && auth.password) {
    const encoded = btoa(`${auth.username}:${auth.password}`);
    return {
      headers: {
        Authorization: `Basic ${encoded}`,
      },
    };
  }

  return {};
}

export function authenticateRemote(pouchRemote, auth) {
  const adapterOpts = createAuthAdapter(auth);
  return pouchRemote;
}

export function validateAuth(auth) {
  if (!auth) return true;

  if (auth.token && typeof auth.token === 'string' && auth.token.length > 0) {
    return true;
  }

  if (
    auth.username &&
    typeof auth.username === 'string' &&
    auth.username.length > 0 &&
    auth.password &&
    typeof auth.password === 'string' &&
    auth.password.length > 0
  ) {
    return true;
  }

  return false;
}