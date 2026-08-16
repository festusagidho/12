import { useState, useEffect, useCallback, useRef } from 'react';

export interface WorldClockState {
  currentTimeMs: number;
  isSynced: boolean;
  syncSource: string;
  lastSyncTime: Date | null;
  resync: () => Promise<void>;
  getCountdown: (targetDate: string | number) => {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    totalSeconds: number;
    isExpired: boolean;
  };
}

export function useWorldClock(): WorldClockState {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [syncSource, setSyncSource] = useState<string>('Syncing World Clock...');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const offsetRef = useRef<number>(0);
  offsetRef.current = offsetMs;

  const syncWorldClock = useCallback(async () => {
    const start = performance.now();
    let fetchedTimeMs: number | null = null;
    let sourceName = '';

    // Attempt 1: Try public World Time API
    try {
      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.datetime) {
          fetchedTimeMs = new Date(data.datetime).getTime();
          sourceName = 'WorldTimeAPI.org (UTC)';
        }
      }
    } catch {
      // Fallback
    }

    // Attempt 2: Try timeapi.io if Attempt 1 failed
    if (!fetchedTimeMs) {
      try {
        const res = await fetch('https://timeapi.io/api/v1/time/current/zone?timeZone=UTC', {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.dateTime) {
            fetchedTimeMs = new Date(data.dateTime).getTime();
            sourceName = 'TimeAPI.io (UTC)';
          }
        }
      } catch {
        // Fallback
      }
    }

    // Attempt 3: Try our Cloud Run backend NTP endpoint
    if (!fetchedTimeMs) {
      try {
        const res = await fetch('/api/world-time', {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.utc_timestamp) {
            fetchedTimeMs = Number(data.utc_timestamp);
            sourceName = 'Cloud Server NTP (UTC)';
          }
        }
      } catch {
        // Fallback
      }
    }

    const end = performance.now();
    const rtt = end - start;

    if (fetchedTimeMs) {
      // Adjust for network trip half-time
      const adjustedWorldTime = fetchedTimeMs + Math.round(rtt / 2);
      const calculatedOffset = adjustedWorldTime - Date.now();

      setOffsetMs(calculatedOffset);
      offsetRef.current = calculatedOffset;
      setCurrentTimeMs(Date.now() + calculatedOffset);
      setIsSynced(true);
      setSyncSource(sourceName);
      setLastSyncTime(new Date(adjustedWorldTime));
    } else {
      // Fallback to local machine clock if all network attempts fail, but mark as un-synced fallback
      setIsSynced(false);
      setSyncSource('Local Device Clock (Offline Fallback)');
    }
  }, []);

  // Initial sync and periodic 60-second re-sync
  useEffect(() => {
    syncWorldClock();
    const resyncInterval = setInterval(() => {
      syncWorldClock();
    }, 60000);

    return () => clearInterval(resyncInterval);
  }, [syncWorldClock]);

  // 1-second ticker using world time offset
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now() + offsetRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to calculate exact countdown from current world time
  const getCountdown = useCallback(
    (targetDate: string | number) => {
      const targetMs = typeof targetDate === 'number' ? targetDate : new Date(targetDate).getTime();
      const diffMs = targetMs - currentTimeMs;
      const isExpired = diffMs <= 0;
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));

      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      return {
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        totalSeconds: totalSecs,
        isExpired,
      };
    },
    [currentTimeMs]
  );

  return {
    currentTimeMs,
    isSynced,
    syncSource,
    lastSyncTime,
    resync: syncWorldClock,
    getCountdown,
  };
}
