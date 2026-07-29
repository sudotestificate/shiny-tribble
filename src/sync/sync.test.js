import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSyncConfig,
  buildRemoteUrl,
  buildAuthHeader,
} from './config.js';
import {
  createAuthAdapter,
  validateAuth,
} from './auth.js';
import {
  resolveConflict,
  lastWriteWins,
  hasConflict,
  resolveAllConflicts,
} from './conflict.js';

describe('sync/config', () => {
  it('createSyncConfig requires remoteUrl', () => {
    expect(() => createSyncConfig()).toThrow('remoteUrl is required');
  });

  it('createSyncConfig accepts remoteUrl and database', () => {
    const config = createSyncConfig({ remoteUrl: 'https://example.com/couchdb', database: 'mydb' });
    expect(config.remoteUrl).toBe('https://example.com/couchdb');
    expect(config.database).toBe('mydb');
  });

  it('createSyncConfig defaults retry to true and live to true', () => {
    const config = createSyncConfig({ remoteUrl: 'https://example.com/couchdb' });
    expect(config.retry).toBe(true);
    expect(config.live).toBe(true);
  });

  it('createSyncConfig accepts auth object', () => {
    const config = createSyncConfig({
      remoteUrl: 'https://example.com/couchdb',
      auth: { username: 'admin', password: 'pass' },
    });
    expect(config.auth).toEqual({ username: 'admin', password: 'pass' });
  });

  it('buildRemoteUrl joins base URL with database name', () => {
    expect(buildRemoteUrl('https://example.com/couchdb', 'mydb')).toBe('https://example.com/couchdb/mydb');
  });

  it('buildRemoteUrl handles trailing slash on remote URL', () => {
    expect(buildRemoteUrl('https://example.com/couchdb/', 'mydb')).toBe('https://example.com/couchdb/mydb');
  });

  it('buildAuthHeader returns Basic auth for username/password', () => {
    const header = buildAuthHeader({ username: 'admin', password: 'secret' });
    expect(header).toEqual({ Authorization: 'Basic ' + btoa('admin:secret') });
  });

  it('buildAuthHeader returns Bearer token for token auth', () => {
    const header = buildAuthHeader({ token: 'mytoken123' });
    expect(header).toEqual({ Authorization: 'Bearer mytoken123' });
  });

  it('buildAuthHeader returns null when no auth', () => {
    expect(buildAuthHeader(null)).toBeNull();
    expect(buildAuthHeader(undefined)).toBeNull();
  });
});

describe('sync/auth', () => {
  it('createAuthAdapter returns Basic header for username/password', () => {
    const adapter = createAuthAdapter({ username: 'user', password: 'pass' });
    expect(adapter.headers.Authorization).toBe('Basic ' + btoa('user:pass'));
  });

  it('createAuthAdapter returns Bearer header for token', () => {
    const adapter = createAuthAdapter({ token: 'tok123' });
    expect(adapter.headers.Authorization).toBe('Bearer tok123');
  });

  it('createAuthAdapter returns empty object for null auth', () => {
    const adapter = createAuthAdapter(null);
    expect(adapter).toEqual({});
  });

  it('validateAuth returns true for valid basic auth', () => {
    expect(validateAuth({ username: 'user', password: 'pass' })).toBe(true);
  });

  it('validateAuth returns true for valid token auth', () => {
    expect(validateAuth({ token: 'tok' })).toBe(true);
  });

  it('validateAuth returns true for null auth', () => {
    expect(validateAuth(null)).toBe(true);
  });

  it('validateAuth returns false for invalid auth', () => {
    expect(validateAuth({})).toBe(false);
    expect(validateAuth({ username: 'user' })).toBe(false);
    expect(validateAuth({ password: 'pass' })).toBe(false);
  });
});

describe('sync/conflict', () => {
  it('lastWriteWins returns doc with higher rev seq', () => {
    const docA = { _id: 'doc1', _rev: '1-abc', data: 'old' };
    const docB = { _id: 'doc1', _rev: '2-def', data: 'new' };
    expect(lastWriteWins(docA, docB)).toBe(docB);
  });

  it('lastWriteWins returns docA when rev seq is equal', () => {
    const docA = { _id: 'doc1', _rev: '2-abc', data: 'a' };
    const docB = { _id: 'doc1', _rev: '2-def', data: 'b' };
    expect(lastWriteWins(docA, docB)).toBe(docA);
  });

  it('resolveConflict returns localDoc when it has higher rev', () => {
    const localDoc = { _id: 'doc1', _rev: '3-local', data: 'local' };
    const remoteDoc = { _id: 'doc1', _rev: '2-remote', data: 'remote' };
    expect(resolveConflict(localDoc, remoteDoc)).toBe(localDoc);
  });

  it('resolveConflict returns remoteDoc when it has higher rev', () => {
    const localDoc = { _id: 'doc1', _rev: '1-local', data: 'local' };
    const remoteDoc = { _id: 'doc1', _rev: '3-remote', data: 'remote' };
    expect(resolveConflict(localDoc, remoteDoc)).toBe(remoteDoc);
  });

  it('resolveConflict returns null when both docs are null', () => {
    expect(resolveConflict(null, null)).toBeNull();
  });

  it('resolveConflict returns the only doc when one is null', () => {
    const doc = { _id: 'doc1', _rev: '1-abc', data: 'only' };
    expect(resolveConflict(null, doc)).toBe(doc);
    expect(resolveConflict(doc, null)).toBe(doc);
  });

  it('hasConflict returns true when _conflicts array has entries', () => {
    const doc = { _id: 'doc1', _conflicts: ['1-abc', '2-def'] };
    expect(hasConflict(doc)).toBe(true);
  });

  it('hasConflict returns false when _conflicts is empty', () => {
    const doc = { _id: 'doc1', _conflicts: [] };
    expect(hasConflict(doc)).toBe(false);
  });

  it('hasConflict returns false when no _conflicts field', () => {
    const doc = { _id: 'doc1', _rev: '1-abc' };
    expect(hasConflict(doc)).toBe(false);
  });

  it('resolveAllConflicts returns winner with highest rev', () => {
    const doc = { _id: 'doc1', _rev: '1-aaa' };
    const v1 = { _id: 'doc1', _rev: '1-aaa', data: 'first' };
    const v2 = { _id: 'doc1', _rev: '2-bbb', data: 'second' };
    const v3 = { _id: 'doc1', _rev: '3-ccc', data: 'third' };
    expect(resolveAllConflicts(doc, [v1, v2, v3])).toBe(v3);
  });

  it('resolveAllConflicts returns doc when allVersions is empty', () => {
    const doc = { _id: 'doc1', _rev: '1-aaa' };
    expect(resolveAllConflicts(doc, [])).toBe(doc);
  });
});