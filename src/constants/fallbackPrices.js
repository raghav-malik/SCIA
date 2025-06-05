/**
 * Fallback cryptocurrency prices to use when the CoinGecko API is unavailable
 * These are sample prices that will be used as a last resort
 * Note: These prices are static and will not reflect real-time market conditions
 */
const fallbackPrices = {
  bitcoin: 65000,
  ethereum: 3500,
  tether: 1.0,
  "usd-coin": 1.0,
  binancecoin: 600,
  ripple: 0.55,
  cardano: 0.45,
  solana: 140,
  polkadot: 7.5,
  chainlink: 15,
  "avalanche-2": 35,
  polygon: 0.65,
  near: 5.5
};

export default fallbackPrices; 