import { useState, useEffect, useRef } from "react";

/**
 * useCoinGeckoPrice(coingeckoId, vsCurrency, refreshInterval)
 */
export function useCoinGeckoPrice(
  coingeckoId,
  vsCurrency = "usd",
  refreshInterval = 20000
) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
        coingeckoId
      )}&vs_currencies=${encodeURIComponent(vsCurrency)}`;
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      if (!resp.ok) {
        throw new Error(`CoinGecko responded ${resp.status}`);
      }
      const data = await resp.json();
      const newPrice = data[coingeckoId]?.[vsCurrency];
      if (typeof newPrice !== "number") {
        throw new Error(
          `Unexpected CoinGecko response: ${JSON.stringify(data)}`
        );
      }
      setPrice(newPrice);
    } catch (err) {
      console.error("CoinGecko fetch error:", err);
      setError(err);
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchPrice();
    // then re-poll every refreshInterval ms
    function scheduleNext() {
      timeoutRef.current = setTimeout(async () => {
        await fetchPrice();
        scheduleNext();
      }, refreshInterval);
    }
    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [coingeckoId, vsCurrency, refreshInterval]);

  return { price, loading, error };
}
