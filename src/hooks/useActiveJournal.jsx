import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db as pouchDb } from '../services/pouchdb';
import { createReplication } from '../sync/replication';
import { createSyncConfig } from '../sync/config';

const JournalContext = createContext(null);

const STORAGE_KEY = 'hledger_active_journal';

export function JournalProvider({ children }) {
  const [activeJournal, setActiveJournalState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || 'default';
  });
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncInstance, setSyncInstance] = useState(null);

  const loadJournals = useCallback(async () => {
    try {
      const res = await pouchDb.allDocs({
        include_docs: true,
        startkey: 'journal_',
        endkey: 'journal_\u9999',
      });
      const names = res.rows
        .map(r => r.doc && r.doc.name)
        .filter((name, idx, arr) => name && arr.indexOf(name) === idx);
      setJournals(names);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const getDocIdsForJournal = useCallback(async (journalName) => {
    try {
      const [txns, jDocs] = await Promise.all([
        pouchDb.allDocs({
          include_docs: true,
          startkey: 'transaction_',
          endkey: 'transaction_\u9999',
        }),
        pouchDb.allDocs({
          include_docs: true,
          startkey: 'journal_',
          endkey: 'journal_\u9999',
        }),
      ]);

      const txIds = txns.rows
        .filter(r => r.doc && r.doc.source_journal === journalName)
        .map(r => r.id);

      const jId = jDocs.rows.find(r => r.doc && r.doc.name === journalName);
      const journalDocId = jId ? jId.id : null;

      return journalDocId ? [journalDocId, ...txIds] : txIds;
    } catch (err) {
      console.error('Failed to get doc IDs for journal:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    let sync = null;
    let cancelled = false;

    async function setupSync() {
      const remoteUrl = import.meta.env.VITE_COUCHDB_URL;
      if (!remoteUrl) {
        setSyncInstance(null);
        return;
      }

      if (cancelled) return;

      try {
        const docIds = await getDocIdsForJournal(activeJournal);
        if (cancelled) return;

        const syncConfig = createSyncConfig({
          remoteUrl,
          database: 'hledger_journals',
          live: true,
          retry: true,
        });

        sync = createReplication(pouchDb, syncConfig, docIds.length > 0 ? docIds : undefined);
        if (!cancelled) {
          setSyncInstance(sync);
        }
      } catch (err) {
        console.error('Journal sync setup failed:', err);
      }
    }

    setupSync();

    return () => {
      cancelled = true;
      if (sync) {
        try {
          sync.cancel();
        } catch (e) {
          // ignore cancellation errors
        }
      }
    };
  }, [activeJournal, getDocIdsForJournal]);

  const setActiveJournal = useCallback((name) => {
    if (!name || typeof name !== 'string') return;
    setActiveJournalState(name);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  const value = useMemo(() => ({
    activeJournal,
    setActiveJournal,
    journals,
    loading,
    syncInstance,
  }), [activeJournal, setActiveJournal, journals, loading, syncInstance]);

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

export function useActiveJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error('useActiveJournal must be used within a JournalProvider');
  }
  return ctx;
}

export function getStoredJournal() {
  return localStorage.getItem(STORAGE_KEY) || 'default';
}
