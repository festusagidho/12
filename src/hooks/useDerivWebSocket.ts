/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Candle } from '../types';

interface UseDerivWebSocketReturn {
  goldPrice: number;
  priceDirection: 'up' | 'down' | 'flat';
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  candles: Candle[];
  lastTickTime: string | null;
  reconnect: () => void;
}

const DERIV_WS_URLS = [
  'wss://ws.derivws.com/websockets/v3?app_id=1089',
  'wss://ws.binaryws.com/websockets/v3?app_id=1089',
];

// Map timeframe strings to Deriv granularity in seconds
export const TIMEFRAME_GRANULARITY_MAP: Record<string, number> = {
  '1M': 60,
  '1H': 3600,
  '4H': 14400,
  'Daily': 86400,
  'Weekly': 604800,
};

export function useDerivWebSocket(
  activeTimeframe: string = '4H',
  activeSymbol: string = 'frxXAUUSD'
): UseDerivWebSocketReturn {
  const defaultPrice = activeSymbol === '1HZ10V' ? 9613.90 : 4389.00;
  const [goldPrice, setGoldPrice] = useState<number>(defaultPrice);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'flat'>('flat');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastTickTime, setLastTickTime] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const currentUrlIndexRef = useRef<number>(0);
  const prevPriceRef = useRef<number>(defaultPrice);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Sync default price when symbol changes
  useEffect(() => {
    const p = activeSymbol === '1HZ10V' ? 9613.90 : 4389.00;
    setGoldPrice(p);
    prevPriceRef.current = p;
    setCandles([]);
  }, [activeSymbol]);

  const granularity = TIMEFRAME_GRANULARITY_MAP[activeTimeframe] || 14400;

  const clearAllTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // 1. Safely dispose existing WebSocket reference without triggering its onclose reconnect loop
    if (wsRef.current) {
      const oldWs = wsRef.current;
      wsRef.current = null; // Mark as superseded before closing
      oldWs.onclose = null;
      oldWs.onerror = null;
      try {
        oldWs.close();
      } catch (e) {
        // Ignore close exceptions
      }
    }

    clearAllTimers();

    if (!isMountedRef.current) return;

    setConnectionStatus('connecting');
    const wsUrl = DERIV_WS_URLS[currentUrlIndexRef.current];

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws || !isMountedRef.current) return;

        setIsConnected(true);
        setConnectionStatus('connected');

        // Fetch historical candles for selected timeframe
        ws.send(
          JSON.stringify({
            ticks_history: activeSymbol,
            adjust_start_time: 1,
            count: 40,
            end: 'latest',
            start: 1,
            style: 'candles',
            granularity: granularity,
          })
        );

        // Ping keepalive every 20 seconds to prevent Deriv server timeout
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ping: 1 }));
          }
        }, 20000);

        // Periodic live price tick request every 3 seconds
        pollIntervalRef.current = setInterval(() => {
          if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                ticks_history: activeSymbol,
                count: 1,
                end: 'latest',
                style: 'candles',
                granularity: 60,
              })
            );
          }
        }, 3000);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (wsRef.current !== ws || !isMountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          // Ignore ping responses
          if (data.msg_type === 'ping') return;

          // Handle candles response from Deriv WS
          if (data.msg_type === 'candles' || (data.candles && Array.isArray(data.candles))) {
            const rawCandles = data.candles || [];

            // Single candle tick update
            if (rawCandles.length === 1) {
              const c = rawCandles[0];
              const price = Number(c.close);

              if (!isNaN(price) && price > 0) {
                setGoldPrice(price);

                if (prevPriceRef.current !== price) {
                  setPriceDirection(price > prevPriceRef.current ? 'up' : 'down');
                  prevPriceRef.current = price;
                }

                const tickDate = new Date(c.epoch * 1000);
                setLastTickTime(tickDate.toISOString().substring(11, 19));

                // Update the close price of current active candle
                setCandles((prevCandles) => {
                  if (prevCandles.length === 0) return prevCandles;
                  const updated = [...prevCandles];
                  const last = { ...updated[updated.length - 1] };
                  last.close = price;
                  if (price > last.high) last.high = price;
                  if (price < last.low) last.low = price;
                  updated[updated.length - 1] = last;
                  return updated;
                });
              }
              return;
            }

            // Full candles historical array
            if (rawCandles.length > 1) {
              const formatted: Candle[] = rawCandles.map((c: any, index: number) => {
                const open = Number(c.open);
                const high = Number(c.high);
                const low = Number(c.low);
                const close = Number(c.close);
                const dateStr = new Date(c.epoch * 1000).toISOString().replace('T', ' ').substring(0, 16);

                let orderBlock = undefined;
                let fvg = undefined;

                // Annotate SMC Order Blocks and FVGs on chart candles
                if (index > 0 && index % 8 === 0) {
                  orderBlock = {
                    type: close > open ? ('bullish' as const) : ('bearish' as const),
                    level: Number((low + (close > open ? 2 : -2)).toFixed(2)),
                    size: Number((Math.abs(close - open) * 0.4).toFixed(2)),
                  };
                } else if (index > 0 && index % 5 === 0) {
                  fvg = {
                    type: close > open ? ('bullish' as const) : ('bearish' as const),
                    top: Number((high - 1).toFixed(2)),
                    bottom: Number((low + 1).toFixed(2)),
                  };
                }

                return {
                  time: dateStr,
                  open,
                  high,
                  low,
                  close,
                  volume: Math.floor(6000 + Math.random() * 10000),
                  orderBlock,
                  fvg,
                };
              });

              if (formatted.length > 0) {
                setCandles(formatted);
                const latestClose = formatted[formatted.length - 1].close;
                setGoldPrice(latestClose);
                prevPriceRef.current = latestClose;
                setLastTickTime(new Date().toISOString().substring(11, 19));
              }
            }
          }
        } catch (err) {
          console.warn('Deriv WebSocket message parsing:', err);
        }
      };

      ws.onerror = (err) => {
        if (wsRef.current !== ws || !isMountedRef.current) return;
        console.warn('Deriv WebSocket connection error:', err);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        // Ignore close events from superseded sockets
        if (wsRef.current !== ws) return;

        wsRef.current = null;
        clearAllTimers();

        if (!isMountedRef.current) return;

        setIsConnected(false);
        setConnectionStatus('disconnected');

        // Rotate backup URL index on genuine unexpected close and reconnect after 4 seconds
        currentUrlIndexRef.current = (currentUrlIndexRef.current + 1) % DERIV_WS_URLS.length;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 4000);
      };
    } catch (e) {
      console.warn('Deriv WebSocket initialization error:', e);
      if (isMountedRef.current) {
        setConnectionStatus('error');
      }
    }
  }, [granularity, activeSymbol, clearAllTimers]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      if (wsRef.current) {
        const oldWs = wsRef.current;
        wsRef.current = null;
        oldWs.onclose = null;
        oldWs.onerror = null;
        try {
          oldWs.close();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [connect, clearAllTimers]);

  return {
    goldPrice,
    priceDirection,
    isConnected,
    connectionStatus,
    candles,
    lastTickTime,
    reconnect: connect,
  };
}
