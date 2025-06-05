// src/hooks/useTokenPrices.js
import { useState, useEffect } from "react";
import axios from "axios";

/**
 * useTokenPrices takes an array of CoinGecko “ids” (e.g. ["ethereum", "chainlink"])
 * and fetches their USD prices. It refreshes every minute by default.
 */
export function useTokenPrices(ids = [], vsCurrency = "usd", refreshInterval = 60000) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    if (ids.length === 0) {
      setPrices({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const idList = ids.join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idList}&vs_currencies=${vsCurrency}`;
      const { data } = await axios.get(url);
      setPrices(data);
    } catch (err) {
      console.error("Error fetching CoinGecko prices:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [ids.join(","), vsCurrency]);

  return { prices, loading, error };
}
