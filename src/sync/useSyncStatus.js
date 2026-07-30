import { useState, useEffect, useCallback, useRef } from 'react';

export function useSyncStatus(syncInstance) {
  const [status, setStatus] = useState({
    connected: false,
    syncing: false,
    error: null,
    lastSync: null,
    retryCount: 0,
  });

  const syncRef = useRef(syncInstance);
  const retryCountRef = useRef(0);

  useEffect(() => {
    syncRef.current = syncInstance;
  }, [syncInstance]);

  useEffect(() => {
    if (!syncRef.current) {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        syncing: false,
        error: 'No sync instance configured',
      }));
      return;
    }

    const sync = syncRef.current;

    const onActive = () => {
      retryCountRef.current = 0;
      setStatus((prev) => ({
        ...prev,
        syncing: true,
        connected: true,
        error: null,
      }));
    };

    const onPaused = (err) => {
      setStatus((prev) => ({
        ...prev,
        syncing: false,
        connected: !!err,
        error: err ? err.message || 'Replication paused' : null,
      }));
    };

    const onError = (err) => {
      retryCountRef.current += 1;
      setStatus((prev) => ({
        ...prev,
        syncing: false,
        connected: false,
        error: err.message || 'Sync error',
        retryCount: retryCountRef.current,
      }));
    };

    const onChange = () => {
      setStatus((prev) => ({
        ...prev,
        lastSync: new Date(),
        syncing: false,
        connected: true,
        error: null,
      }));
    };

    const onComplete = () => {
      setStatus((prev) => ({
        ...prev,
        syncing: false,
        lastSync: new Date(),
      }));
    };

    sync.on('active', onActive);
    sync.on('paused', onPaused);
    sync.on('error', onError);
    sync.on('change', onChange);
    sync.on('complete', onComplete);

    return () => {
      sync.off('active', onActive);
      sync.off('paused', onPaused);
      sync.off('error', onError);
      sync.off('change', onChange);
      sync.off('complete', onComplete);
    };
  }, [syncRef.current]);

  const reset = useCallback(() => {
    retryCountRef.current = 0;
    setStatus({
      connected: false,
      syncing: false,
      error: null,
      lastSync: null,
      retryCount: 0,
    });
  }, []);

  return { ...status, reset };
}

export function SyncIndicator({ status }) {
  const { connected, syncing, error, lastSync, retryCount } = status;

  if (error) {
    return (
      <div className="sync-indicator sync-indicator--error" role="status" aria-live="polite">
        <span className="sync-indicator__dot sync-indicator__dot--error" />
        <span className="sync-indicator__text">Sync error: {error}</span>
        {retryCount > 0 && (
          <span className="sync-indicator__retry">Retry {retryCount}</span>
        )}
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="sync-indicator sync-indicator--syncing" role="status" aria-live="polite">
        <span className="sync-indicator__dot sync-indicator__dot--syncing" />
        <span className="sync-indicator__text">Syncing...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="sync-indicator sync-indicator--disconnected" role="status" aria-live="polite">
        <span className="sync-indicator__dot sync-indicator__dot--disconnected" />
        <span className="sync-indicator__text">Disconnected</span>
      </div>
    );
  }

  return (
    <div className="sync-indicator sync-indicator--connected" role="status" aria-live="polite">
      <span className="sync-indicator__dot sync-indicator__dot--connected" />
      <span className="sync-indicator__text">Synced</span>
      {lastSync && (
        <span className="sync-indicator__time">
          {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}