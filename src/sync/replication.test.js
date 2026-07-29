import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReplication, syncOnce, resolveDocumentConflicts } from './replication.js';

vi.mock('pouchdb', () => {
  const mockSync = {
    on: vi.fn(),
    off: vi.fn(),
    cancel: vi.fn(),
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      sync: vi.fn().mockReturnValue(mockSync),
    })),
  };
});

describe('sync/replication', () => {
  let mockDb;
  let mockRemote;
  let mockSync;

  beforeEach(() => {
    mockSync = {
      on: vi.fn(),
      off: vi.fn(),
      cancel: vi.fn(),
    };

    mockRemote = {
      on: vi.fn(),
      off: vi.fn(),
      cancel: vi.fn(),
    };

    mockDb = {
      sync: vi.fn().mockReturnValue(mockSync),
      get: vi.fn(),
    };
  });

  describe('createReplication', () => {
    it('creates a remote PouchDB with skipSetup and timeout', async () => {
      const PouchDB = (await import('pouchdb')).default;
      const config = {
        remoteUrl: 'https://example.com/couchdb',
        database: 'mydb',
        live: true,
        retry: true,
        timeout: 15000,
      };

      createReplication(mockDb, config);

      expect(PouchDB).toHaveBeenCalledWith(
        'https://example.com/couchdb/mydb',
        expect.objectContaining({ skipSetup: true, timeout: 15000 })
      );
    });

    it('applies auth headers when auth is provided', async () => {
      const PouchDB = (await import('pouchdb')).default;
      const config = {
        remoteUrl: 'https://example.com/couchdb',
        database: 'mydb',
        auth: { username: 'user', password: 'pass' },
      };

      createReplication(mockDb, config);

      expect(PouchDB).toHaveBeenCalledWith(
        'https://example.com/couchdb/mydb',
        expect.objectContaining({
          headers: { Authorization: 'Basic ' + btoa('user:pass') },
        })
      );
    });

    it('attaches event listeners to the sync object', async () => {
      createReplication(mockDb, {
        remoteUrl: 'https://example.com/couchdb',
        database: 'mydb',
      });

    expect(mockSync.on).toHaveBeenCalledTimes(6);
    expect(mockSync.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('denied', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('paused', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('active', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    it('returns the sync object', async () => {
      const result = createReplication(mockDb, {
        remoteUrl: 'https://example.com/couchdb',
        database: 'mydb',
      });

      expect(result).toBe(mockSync);
    });
  });

  describe('syncOnce', () => {
    it('creates a one-time sync without live or retry', async () => {
      const config = {
        remoteUrl: 'https://example.com/couchdb',
        database: 'mydb',
      };

      const result = syncOnce(mockDb, config);
      expect(mockDb.sync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ live: false, retry: false })
      );
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('resolveDocumentConflicts', () => {
    it('returns null when db.get does not return an array', async () => {
      mockDb.get.mockResolvedValue(null);
      const result = await resolveDocumentConflicts(mockDb, 'doc1');
      expect(result).toBeNull();
    });

    it('returns null when the array has no entries with ok', async () => {
      mockDb.get.mockResolvedValue([
        { ok: null, error: 'not_found' },
      ]);
      const result = await resolveDocumentConflicts(mockDb, 'doc1');
      expect(result).toBeNull();
    });

    it('returns the single ok entry when only one exists', async () => {
      const doc = { _id: 'doc1', _rev: '2-abc', data: 'winner' };
      mockDb.get.mockResolvedValue([
        { ok: doc, error: null },
      ]);
      const result = await resolveDocumentConflicts(mockDb, 'doc1');
      expect(result).toBe(doc);
    });

    it('returns the last-write-wins doc when multiple entries exist', async () => {
      const docA = { _id: 'doc1', _rev: '1-abc', data: 'old' };
      const docB = { _id: 'doc1', _rev: '2-def', data: 'new' };
      mockDb.get.mockResolvedValue([
        { ok: docA, error: null },
        { ok: docB, error: null },
      ]);
      const result = await resolveDocumentConflicts(mockDb, 'doc1');
      expect(result).toBe(docB);
    });
  });
});
