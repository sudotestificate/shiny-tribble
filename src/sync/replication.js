import PouchDB from 'pouchdb';
import { buildRemoteUrl, buildAuthHeader } from './config.js';
import { resolveConflict, lastWriteWins, hasConflict } from './conflict.js';

export function createReplication(db, config) {
  const remoteUrl = buildRemoteUrl(config.remoteUrl, config.database);
  const remoteOpts = {};
  const authHeader = buildAuthHeader(config.auth);

  if (authHeader) {
    remoteOpts.headers = authHeader;
  }

  const remote = new PouchDB(remoteUrl, {
    skipSetup: true,
    timeout: config.timeout || 30000,
    ...remoteOpts,
  });

  const syncOpts = {
    live: config.live !== false,
    retry: config.retry !== false,
    back_off: true,
    retry_delay: config.retryDelay || 5000,
    retry_max_attempts: config.retryMaxAttempts || 10,
    batch_size: 100,
    chunks: 10,
  };

  const sync = db.sync(remote, syncOpts);

  sync.on('change', (info) => {
    console.log('[Sync] Change detected:', info);
  });

  sync.on('denied', (err) => {
    console.warn('[Sync] Replication denied:', err);
  });

  sync.on('error', (err) => {
    console.error('[Sync] Replication error:', err);
  });

  sync.on('paused', (err) => {
    if (err) {
      console.warn('[Sync] Replication paused:', err);
    } else {
      console.log('[Sync] Replication paused');
    }
  });

  sync.on('active', () => {
    console.log('[Sync] Replication active');
  });

  sync.on('complete', () => {
    console.log('[Sync] Replication complete');
  });

  return sync;
}

export async function syncOnce(db, config) {
  const remoteUrl = buildRemoteUrl(config.remoteUrl, config.database);
  const authHeader = buildAuthHeader(config.auth);
  const remoteOpts = {};

  if (authHeader) {
    remoteOpts.headers = authHeader;
  }

  const remote = new PouchDB(remoteUrl, {
    skipSetup: true,
    timeout: config.timeout || 30000,
    ...remoteOpts,
  });

  const syncOpts = {
    live: false,
    retry: false,
  };

  return db.sync(remote, syncOpts);
}

export async function resolveDocumentConflicts(db, docId) {
  const result = await db.get(docId, { openRevs: 'all' });

  if (!Array.isArray(result)) return null;

  const entries = result.filter((entry) => entry.ok);
  if (entries.length === 0) return null;

  return entries.reduce((winner, entry) => {
    return lastWriteWins(winner, entry.ok);
  }, entries[0].ok);
}