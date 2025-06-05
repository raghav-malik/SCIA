// src/hooks/useMultipleCoinGeckoPrices.js
import { useState, useEffect, useRef } from "react";

/**
 * Enhanced useMultipleCoinGeckoPrices with better error handling and fallback
 *
 * - coingeckoIds: e.g. ["bitcoin","ethereum","tether","chainlink","binancecoin"]
 * - vsCurrency: e.g. "usd"
 * - refreshInterval: poll interval in milliseconds (e.g. 20000)
 * - apiKey: optional CoinGecko API key for Pro users
 *
 * Returns { prices, loading, error, refresh, useFallback, resetFallbackState }.
 */
export function useMultipleCoinGeckoPrices(
  coingeckoIds,
  vsCurrency = "usd",
  refreshInterval = 30000,
  apiKey = null
) {
  const [prices, setPrices] = useState(() => {
    // initialize each ID to null so UI can render "—" placeholders
    return coingeckoIds.reduce((acc, id) => {
      acc[id] = null;
      return acc;
    }, {});
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [cachedPrices, setCachedPrices] = useState({});
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const lastSuccessfulFetchRef = useRef(null);

  // Fallback prices for when API is unavailable
  const fallbackPrices = {
    bitcoin: 43000,
    ethereum: 2600,
    tether: 1.00,
    chainlink: 15.50,
    binancecoin: 310,
    "usd-coin": 1.00,
    ripple: 0.50,
    cardano: 0.45,
    solana: 110,
    polkadot: 6.5,
    "avalanche-2": 30,
    polygon: 0.65,
    near: 4.2
  };

  // Exponential backoff for retries
  const getBackoffTime = (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  };

  const fetchPrices = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);

    // Build the query string for our proxy endpoint
    const idsParam = coingeckoIds.join(",");
    
    // Use our local proxy endpoint instead of calling CoinGecko directly
    // This helps avoid rate limiting and provides caching
    const url = `/api/crypto/prices?ids=${idsParam}&vs_currency=${vsCurrency}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      console.log(`Fetching prices from local proxy endpoint...`);
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        // Handle specific error cases
        if (resp.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later or use a Pro API key.");
        } else if (resp.status === 403) {
          throw new Error("Access forbidden. Check API key or IP restrictions.");
        } else if (resp.status === 401) {
          throw new Error("Unauthorized. Invalid API key.");
        } else if (resp.status === 404) {
          throw new Error("Endpoint not found. Check URL.");
        } else if (resp.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
        throw new Error(`API responded with status ${resp.status}`);
      }

      const data = await resp.json();
      
      // Check if the response contains an error
      if (data.error) {
        throw new Error(data.error.message || "Error fetching cryptocurrency prices");
      }
      
      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format from API");
      }

      // Example response: { "bitcoin": { "usd": 56000.12 }, … }
      const newPrices = {};
      coingeckoIds.forEach((id) => {
        const coinData = data[id];
        if (coinData && typeof coinData === 'object') {
          const price = coinData[vsCurrency];
          newPrices[id] = typeof price === "number" && price > 0 ? price : null;
          
          // Add 24h change if available
          if (coinData[`${vsCurrency}_24h_change`]) {
            newPrices[`${id}_24h_change`] = coinData[`${vsCurrency}_24h_change`];
          }
        } else {
          newPrices[id] = null;
        }
      });

      if (isMountedRef.current) {
        setPrices(newPrices);
        setCachedPrices(newPrices); // Cache successful prices
        setLoading(false);
        setUseFallback(false);
        retryCountRef.current = 0; // Reset retry count on success
        lastSuccessfulFetchRef.current = Date.now(); // Track successful fetch time
        console.log("Successfully fetched prices from API");
      }
    } catch (err) {
      console.error("Error fetching cryptocurrency prices:", err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
        
        // Increment retry count
        retryCountRef.current += 1;
        
        // Use fallback after 3 failed attempts
        if (retryCountRef.current >= 3) {
          console.log("Using fallback prices after multiple failures");
          setUseFallback(true);
          
          // Use cached prices if available, otherwise use fallback
          const pricesToUse = Object.keys(cachedPrices).length > 0 ? cachedPrices : fallbackPrices;
          const fallbackPricesFormatted = {};
          
          coingeckoIds.forEach((id) => {
            fallbackPricesFormatted[id] = pricesToUse[id] || fallbackPrices[id] || null;
          });
          
          setPrices(fallbackPricesFormatted);
        }
      }
    }
  };

  // Manual refresh function
  const refresh = () => {
    // Clear any pending timeout, then immediately fetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    retryCountRef.current = 0; // Reset retry count on manual refresh
    fetchPrices();
  };

  // Reset fallback state and try live data again
  const resetFallbackState = () => {
    setUseFallback(false);
    retryCountRef.current = 0;
    setError(null);
    fetchPrices();
  };

  useEffect(() => {
    // When the hook mounts, fetch once immediately
    isMountedRef.current = true;
    fetchPrices();

    // Then set up an interval for auto‐refresh
    function scheduleNext() {
      // Use exponential backoff if we're having failures
      const delay = retryCountRef.current > 0 
        ? getBackoffTime(retryCountRef.current) 
        : refreshInterval;
      
      timeoutRef.current = setTimeout(() => {
        fetchPrices(true); // Mark as retry/background fetch
        scheduleNext();
      }, delay);
    }
    scheduleNext();

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [coingeckoIds.join(","), vsCurrency, refreshInterval]);

  return { 
    prices, 
    loading, 
    error, 
    refresh, 
    useFallback, 
    resetFallbackState 
  };
}