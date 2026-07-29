import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncStatus } from './useSyncStatus.jsx';

describe('sync/useSyncStatus', () => {
  it('returns initial disconnected status when no sync instance provided', () => {
    const { result } = renderHook(() => useSyncStatus(null));
    expect(result.current.connected).toBe(false);
    expect(result.current.syncing).toBe(false);
    expect(result.current.error).toBe('No sync instance configured');
  });

  it('attaches event listeners when syncInstance is provided', () => {
    const mockSync = {
      on: vi.fn(),
      off: vi.fn(),
    };

    renderHook(() => useSyncStatus(mockSync));

    expect(mockSync.on).toHaveBeenCalledTimes(5);
    expect(mockSync.on).toHaveBeenCalledWith('active', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('paused', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mockSync.on).toHaveBeenCalledWith('complete', expect.any(Function));
  });

  it('updates status when sync becomes active', () => {
    const handlers = {};
    const mockSync = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: vi.fn(),
    };

    const { result } = renderHook(() => useSyncStatus(mockSync));

    act(() => {
      handlers['active']();
    });

    expect(result.current.syncing).toBe(true);
    expect(result.current.connected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('updates status when sync errors', () => {
    const handlers = {};
    const mockSync = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
      off: vi.fn(),
    };

    const { result } = renderHook(() => useSyncStatus(mockSync));

    act(() => {
      handlers['error'](new Error('connection failed'));
    });

    expect(result.current.syncing).toBe(false);
    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBe('connection failed');
  });

  it('cleans up event listeners when syncInstance changes', () => {
    const mockSyncA = {
      on: vi.fn(),
      off: vi.fn(),
    };

    const mockSyncB = {
      on: vi.fn(),
      off: vi.fn(),
    };

    const { rerender } = renderHook(
      ({ syncInstance }) => useSyncStatus(syncInstance),
      { initialProps: { syncInstance: mockSyncA } }
    );

    rerender({ syncInstance: mockSyncB });

    expect(mockSyncA.off).toHaveBeenCalled();
  });

  it('resets status via the reset callback', () => {
    const { result } = renderHook(() => useSyncStatus(null));

    expect(result.current.error).toBe('No sync instance configured');

    act(() => {
      result.current.reset();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.syncing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSync).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });
});
