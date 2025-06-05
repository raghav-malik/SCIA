// src/components/TokenPriceDisplay.js
import React, { useState, useEffect } from "react";
import { useMultipleCoinGeckoPrices } from "../hooks/useMultipleCoinGeckoPrices";

export default function TokenPriceDisplay({ apiKey = null }) {
  // Track previous prices to show changes
  const [prevPrices, setPrevPrices] = useState({});
  // Track which prices have changed for animation
  const [flashingPrices, setFlashingPrices] = useState({});
  // Track retry attempts for UI
  const [retryAttempt, setRetryAttempt] = useState(0);
  // Track last successful update time
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  
  // Use more tokens for a comprehensive display
  const coinIds = [
    "bitcoin",
    "ethereum",
    "tether",
    "chainlink",
    "binancecoin",
    "solana",
    "cardano",
    "polkadot",
  ];
  
  // Use a moderate refresh interval (30 seconds) to avoid rate limiting
  const { 
    prices, 
    loading, 
    error, 
    refresh,
    useFallback, 
    resetFallbackState 
  } = useMultipleCoinGeckoPrices(coinIds, "usd", 30000, apiKey);

  // Manual refresh function
  const handleManualRefresh = () => {
    setRetryAttempt(prev => prev + 1);
    if (useFallback) {
      resetFallbackState();
    } else {
      refresh();
    }
  };

  // Compare new prices with previous to detect changes
  useEffect(() => {
    if (!loading && Object.keys(prices).length > 0) {
      // Identify which prices have changed
      const newFlashing = {};
      
      Object.keys(prices).forEach(coin => {
        // Only process actual coin prices, not metadata like _24h_change
        if (!coin.includes('_24h_change') && prevPrices[coin] && 
            prices[coin] !== null && prices[coin] !== prevPrices[coin]) {
          newFlashing[coin] = true;
        }
      });
      
      // Set flashing state for animation
      setFlashingPrices(newFlashing);
      
      // Clear flashing after animation (700ms)
      const timer = setTimeout(() => {
        setFlashingPrices({});
      }, 700);
      
      // Save current prices as previous for next comparison
      setPrevPrices({...prices});
      
      // Update last successful time
      if (!useFallback && Object.values(prices).some(p => p !== null)) {
        setLastUpdateTime(new Date());
      }
      
      return () => clearTimeout(timer);
    }
  }, [prices, loading, prevPrices, useFallback]);

  // Format price with proper decimals based on value
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "—";
    
    // Format based on price range
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  };

  // Format 24h change percentage
  const format24hChange = (change) => {
    if (change === null || change === undefined) return "—";
    const formattedChange = change.toFixed(2);
    return `${formattedChange > 0 ? '+' : ''}${formattedChange}%`;
  };

  // Determine if price has increased, decreased, or stayed the same
  const getPriceChangeDirection = (coin) => {
    if (!prevPrices[coin] || !prices[coin] || prices[coin] === prevPrices[coin]) return "same";
    return prices[coin] > prevPrices[coin] ? "up" : "down";
  };

  // Get 24h change direction
  const get24hChangeDirection = (coin) => {
    const changeKey = `${coin}_24h_change`;
    if (!prices[changeKey] || prices[changeKey] === 0) return "same";
    return prices[changeKey] > 0 ? "up" : "down";
  };

  // Show loading state only when initially loading
  if (loading && Object.values(prices).every(price => price === null)) {
    return (
      <div className="flex items-center justify-center h-40 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <div className="ml-3 text-sm text-gray-300">Fetching latest prices...</div>
      </div>
    );
  }

  // Show error state only when we have no prices at all
  if (error && Object.values(prices).every(price => price === null)) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 text-center">
        <div className="mb-4 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">API Error</h3>
        <p className="mb-4 text-gray-300">
          {error.message && error.message.includes("429") 
            ? "CoinGecko API rate limit reached. Please try again later or use an API key." 
            : error.message && error.message.includes("Rate limit")
            ? "Rate limit exceeded. Please wait before trying again or subscribe to CoinGecko Pro."
            : error.message || "Error loading cryptocurrency prices. This could be due to network issues or API limitations."}
        </p>
        <button 
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
        >
          Try Again {retryAttempt > 0 ? `(${retryAttempt})` : ''}
        </button>
      </div>
    );
  }

  // Token symbol mapping
  const tokenSymbols = {
    bitcoin: "BTC",
    ethereum: "ETH",
    tether: "USDT",
    chainlink: "LINK",
    binancecoin: "BNB",
    solana: "SOL",
    cardano: "ADA",
    polkadot: "DOT"
  };

  // Token names for display
  const tokenNames = {
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    tether: "Tether",
    chainlink: "Chainlink",
    binancecoin: "BNB",
    solana: "Solana",
    cardano: "Cardano",
    polkadot: "Polkadot"
  };

  // Token icons (using emoji as placeholders - in a real app, use SVG icons)
  const tokenIcons = {
    bitcoin: "₿",
    ethereum: "Ξ",
    tether: "₮",
    chainlink: "⌘",
    binancecoin: "⚛",
    solana: "◎",
    cardano: "₳",
    polkadot: "●"
  };

  // Token colors
  const tokenColors = {
    bitcoin: "from-yellow-500 to-orange-500",
    ethereum: "from-blue-500 to-indigo-500",
    tether: "from-green-500 to-teal-500",
    chainlink: "from-blue-400 to-blue-600",
    binancecoin: "from-yellow-400 to-yellow-600",
    solana: "from-purple-500 to-purple-700",
    cardano: "from-blue-300 to-blue-500",
    polkadot: "from-pink-500 to-pink-700"
  };

  return (
    <div className="overflow-hidden">
      {/* Warning for fallback mode */}
      {useFallback && (
        <div className="mb-3 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg text-blue-300 text-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Using estimated prices. CoinGecko API is currently unavailable.</p>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="mt-2 px-3 py-1.5 bg-blue-800/50 hover:bg-blue-700/50 text-blue-200 rounded-lg text-xs transition-colors w-full"
          >
            Try Live Prices {retryAttempt > 0 ? `(Attempt ${retryAttempt})` : ''}
          </button>
        </div>
      )}

      {/* Warning for stale data */}
      {error && !useFallback && Object.values(prices).some(price => price !== null) && (
        <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg text-yellow-300 text-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>Showing cached prices. Live data may be unavailable.</p>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="mt-2 px-3 py-1.5 bg-yellow-800/50 hover:bg-yellow-700/50 text-yellow-200 rounded-lg text-xs transition-colors w-full"
          >
            Refresh {retryAttempt > 0 ? `(Attempt ${retryAttempt})` : ''}
          </button>
        </div>
      )}

      <div className="bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg backdrop-blur-sm">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700">
          <h2 className="text-white font-semibold">Live Crypto Prices</h2>
          <div className="flex items-center">
            {lastUpdateTime && !loading && (
              <span className="text-xs text-slate-400 mr-3">
                Updated: {lastUpdateTime.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={handleManualRefresh}
              className="p-1.5 rounded-md hover:bg-slate-700 transition-colors"
              title="Refresh prices"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {coinIds.map(coin => {
            const direction = getPriceChangeDirection(coin);
            const change24hDirection = get24hChangeDirection(coin);
            const isFlashing = flashingPrices[coin];
            const changeKey = `${coin}_24h_change`;
            
            return (
              <div key={coin} className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tokenColors[coin]} flex items-center justify-center text-white mr-3`}>
                    {tokenIcons[coin]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{tokenNames[coin]}</div>
                    <div className="text-xs text-slate-400">{tokenSymbols[coin]}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-base font-semibold ${
                    isFlashing 
                      ? direction === "up" 
                        ? "text-green-400 animate-price-flash-green" 
                        : "text-red-400 animate-price-flash-red"
                      : "text-white"
                  }`}>
                    ${formatPrice(prices[coin])}
                  </div>
                  
                  {prices[changeKey] !== undefined && (
                    <div className={`text-xs ${
                      change24hDirection === "up" 
                        ? "text-green-400" 
                        : change24hDirection === "down" 
                          ? "text-red-400" 
                          : "text-slate-400"
                    }`}>
                      {format24hChange(prices[changeKey])}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-400">
              Data provided by CoinGecko
            </div>
            {useFallback && (
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                Using estimated data
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}