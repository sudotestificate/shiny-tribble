export function createSyncConfig(options = {}) {
  const {
    remoteUrl = '',
    database = 'hledger_journals',
    auth = null,
    retry = true,
    retryDelay = 5000,
    retryMaxAttempts = 10,
    live = true,
    timeout = 30000,
  } = options;

  if (!remoteUrl) {
    throw new Error('SyncConfig: remoteUrl is required');
  }

  return {
    remoteUrl,
    database,
    auth,
    retry,
    retryDelay,
    retryMaxAttempts,
    live,
    timeout,
  };
}

export function buildRemoteUrl(remoteUrl, database) {
  const base = remoteUrl.replace(/\/+$/, '');
  return `${base}/${database}`;
}

export function buildAuthHeader(auth) {
  if (!auth) return null;

  if (auth.token) {
    return { Authorization: `Bearer ${auth.token}` };
  }

  if (auth.username && auth.password) {
    const encoded = btoa(`${auth.username}:${auth.password}`);
    return { Authorization: `Basic ${encoded}` };
  }

  return null;
}