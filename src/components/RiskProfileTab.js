// src/components/RiskProfileTab.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useMultipleCoinGeckoPrices } from "../hooks/useMultipleCoinGeckoPrices";

/**
 * This component asks the user three questions,
 * then sends those answers to `/api/risk-profile` to get a real AI-driven
 * recommendation (Conservative / Balanced / Aggressive) from Gemini,
 * and then gets a portfolio recommendation.
 */
export default function RiskProfileTab({ onProfileComplete }) {
  // Step index (0 → first question, 1 → second, 2 → third)
  const [stepIndex, setStepIndex] = useState(0);

  // Store answers for each question
  const [answers, setAnswers] = useState({
    timeHorizon: "",
    volatilityTolerance: "",
    primaryGoal: "",
  });

  // Loading + AI result states
  const [loading, setLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [portfolioRecommendation, setPortfolioRecommendation] = useState(null);
  const [error, setError] = useState("");

  // Track market data for enhanced AI recommendations
  const [marketData, setMarketData] = useState(null);
  const [marketTrend, setMarketTrend] = useState(null);

  // Fetch real-time prices for top cryptocurrencies
  const coinIds = [
    "bitcoin",
    "ethereum",
    "tether",
    "usd-coin",
    "binancecoin",
    "ripple",
    "cardano",
    "solana",
    "polkadot",
    "chainlink",
    "avalanche-2",
    "polygon",
    "near",
  ];
  
  const {
    prices: liveTokenPrices,
    loading: pricesLoading,
    error: pricesError
  } = useMultipleCoinGeckoPrices(coinIds, "usd", 30000);

  // Fetch additional market data for better recommendations
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/global');
        setMarketData(response.data.data);
        
        // Determine market trend based on market_cap_change_percentage_24h_usd
        const change24h = response.data.data.market_cap_change_percentage_24h_usd;
        if (change24h > 5) setMarketTrend("bullish");
        else if (change24h < -5) setMarketTrend("bearish");
        else setMarketTrend("neutral");
      } catch (err) {
        console.error("Failed to fetch global market data:", err);
      }
    };
    
    fetchMarketData();
    // Refresh market data every 5 minutes
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  // The three questions we will ask
  const questions = [
    {
      key: "timeHorizon",
      label: "How long do you plan to hold this investment?",
      options: [
        { value: "<1 year", text: "Less than 1 year" },
        { value: "1–3 years", text: "1–3 years" },
        { value: ">3 years", text: "More than 3 years" },
      ],
    },
    {
      key: "volatilityTolerance",
      label: "If your portfolio dropped 20% in one month, how would you react?",
      options: [
        { value: "Panic-sell", text: "Panic-sell immediately" },
        { value: "Hold", text: "Hold and wait it out" },
        { value: "Buy more", text: "Buy more (because it's a discount)" },
      ],
    },
    {
      key: "primaryGoal",
      label: "What is your primary goal?",
      options: [
        { value: "Preserve capital", text: "Preserve capital (very low risk)" },
        { value: "Steady growth", text: "Steady growth (moderate risk)" },
        { value: "Maximize gains", text: "Maximize gains (high risk)" },
      ],
    },
  ];

  // Move to next question (only if the current question has been answered)
  const handleNext = () => {
    const currentKey = questions[stepIndex].key;
    if (!answers[currentKey]) {
      alert("Please select an option to continue.");
      return;
    }
    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Last question answered → call backend AI endpoint
      submitToAI();
    }
  };

  // Move back one question
  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // Update answers as the user selects an option
  const handleOptionChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // ───────────────────────────────────────────────────────────
  // Calls POST /api/risk-profile on our Express server
  const submitToAI = async () => {
    setLoading(true);
    setError("");
    setAiRecommendation("");
    setPortfolioRecommendation(null);

    try {
      // Prepare enhanced payload with real-time market data
      const payload = {
        timeHorizon: answers.timeHorizon,
        volatilityTolerance: answers.volatilityTolerance,
        primaryGoal: answers.primaryGoal,
        marketData: {
          trend: marketTrend || "neutral",
          totalMarketCap: marketData?.total_market_cap?.usd,
          btcDominance: marketData?.market_cap_percentage?.btc,
          ethDominance: marketData?.market_cap_percentage?.eth,
          marketCapChange24h: marketData?.market_cap_change_percentage_24h_usd
        }
      };

      // Step 1: Get risk profile
      console.log("Getting risk profile with market data...");
      const riskResp = await axios.post("/api/risk-profile", payload);
      const { risk, explanation } = riskResp.data;

      setAiRecommendation(risk);

      // Step 2: Get portfolio recommendation based on risk profile and current prices
      console.log("Getting portfolio recommendation with live market data...");
      
      // Filter out any coins with null prices
      const livePrices = {};
      Object.keys(liveTokenPrices).forEach(coin => {
        if (liveTokenPrices[coin] !== null) {
          livePrices[coin] = liveTokenPrices[coin];
        }
      });
      
      const portfolioResp = await axios.post("/api/portfolio-recommendation", {
        riskProfile: risk,
        investmentAmount: 10000, // Default amount, you can make this configurable
        marketTrend: marketTrend || "neutral",
        livePrices: livePrices,
        marketMetrics: {
          btcDominance: marketData?.market_cap_percentage?.btc,
          totalMarketCapChange: marketData?.market_cap_change_percentage_24h_usd
        }
      });

      setPortfolioRecommendation(portfolioResp.data);
      setLoading(false);

      // Let the parent (App.js) know that profiling is complete:
      if (typeof onProfileComplete === "function") {
        onProfileComplete(risk, portfolioResp.data);
      }
    } catch (err) {
      console.error("Error in AI analysis:", err.response?.data || err);
      setError(
        err.response?.data?.error?.message || 
        "Sorry, could not compute your risk profile. Please check your API key and try again."
      );
      setLoading(false);
    }
  };

  // Reset to start over
  const handleReset = () => {
    setStepIndex(0);
    setAnswers({
      timeHorizon: "",
      volatilityTolerance: "",
      primaryGoal: "",
    });
    setAiRecommendation("");
    setPortfolioRecommendation(null);
    setError("");
  };

  // ───────────────────────────────────────────────────────────
  // Render a loading indicator if waiting for the AI
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 text-center text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>Analyzing your answers with AI and real-time market data... please wait.</p>
      </div>
    );
  }

  // If we have both recommendation and portfolio, show the complete results
  if (aiRecommendation && portfolioRecommendation) {
    return (
      <div className="space-y-6">
        {/* Risk Profile Result */}
        <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            Your AI‐Driven Risk Profile:
          </h3>
          <p className="text-2xl font-bold text-purple-400 mb-2">{aiRecommendation}</p>
          <p className="text-gray-300 mb-4">
            Based on your answers and current market conditions, this profile is recommended.
          </p>
          
          {/* Market Conditions */}
          {marketData && (
            <div className="mt-2 mb-4 p-3 bg-slate-700/50 rounded-lg text-left">
              <h4 className="text-md font-semibold text-white mb-2">Current Market Conditions:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Trend:</span>
                  <span className={`font-medium ${
                    marketTrend === 'bullish' ? 'text-green-400' : 
                    marketTrend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {marketTrend ? marketTrend.charAt(0).toUpperCase() + marketTrend.slice(1) : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">24h Change:</span>
                  <span className={`font-medium ${
                    (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {marketData?.market_cap_change_percentage_24h_usd?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BTC Dominance:</span>
                  <span className="text-blue-400 font-medium">
                    {marketData?.market_cap_percentage?.btc?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ETH Dominance:</span>
                  <span className="text-blue-400 font-medium">
                    {marketData?.market_cap_percentage?.eth?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Portfolio Recommendation */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg text-left">
            <h4 className="text-lg font-semibold text-white mb-3">
              Real-Time Portfolio Recommendation:
            </h4>
            <div className="space-y-3">
              {portfolioRecommendation.portfolio?.map((asset, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-600/50 rounded">
                  <div>
                    <span className="font-medium text-white">{asset.name}</span>
                    <p className="text-sm text-gray-400">{asset.rationale}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400 font-bold">{asset.percentage}%</span>
                    {liveTokenPrices[asset.coinGeckoId] && (
                      <p className="text-xs text-green-400">${liveTokenPrices[asset.coinGeckoId].toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded">
              <p className="text-blue-200 text-sm">
                <strong>Strategy:</strong> {portfolioRecommendation.summary}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                <strong>Expected Return:</strong> {portfolioRecommendation.expectedReturn}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                <strong>Market-Adjusted Recommendation:</strong> {portfolioRecommendation.marketAdjustment || "Standard allocation based on risk profile"}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the current question
  const q = questions[stepIndex];
  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {stepIndex + 1} of {questions.length}</span>
          <span>{Math.round(((stepIndex + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">{q.label}</h3>
      <div className="space-y-3 mb-6">
        {q.options.map((opt) => (
          <label 
            key={opt.value} 
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              answers[q.key] === opt.value 
                ? 'border-purple-500 bg-purple-500/20 text-white' 
                : 'border-slate-600 hover:border-slate-500 text-gray-300'
            }`}
          >
            <input
              type="radio"
              name={q.key}
              value={opt.value}
              checked={answers[q.key] === opt.value}
              onChange={() => handleOptionChange(q.key, opt.value)}
              className="form-radio h-4 w-4 text-purple-400"
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={stepIndex === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            stepIndex === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!answers[q.key]}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !answers[q.key]
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {stepIndex < questions.length - 1 ? "Next" : "Get AI Recommendation"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      {/* Market data indicator */}
      {marketData && (
        <div className="mt-6 p-3 bg-slate-700/30 rounded-lg text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>Market data loaded</span>
            <span className={`${
              (marketData?.market_cap_change_percentage_24h_usd || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              24h: {marketData?.market_cap_change_percentage_24h_usd?.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}