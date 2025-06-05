// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Make sure you have GEMINI_API_KEY set in your .env ────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("⚠️  Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// Use the correct Gemini model name
const GEMINI_MODEL = "gemini-1.5-flash";

// Optional CoinGecko API key
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || null;

// Cache for CoinGecko responses
const coinGeckoCache = {
  data: {},
  timestamp: {},
  cacheDuration: 60000, // 1 minute cache
};

// Helper to build a simple one‐shot prompt:
function buildPrompt({ timeHorizon, volatilityTolerance, primaryGoal }) {
  return `
You are a professional financial advisor. Based on these answers:
• Time horizon: ${timeHorizon}
• Volatility tolerance: ${volatilityTolerance}
• Primary goal: ${primaryGoal}

Assign one of "Conservative", "Balanced", or "Aggressive" and explain in one sentence why.
Return strictly valid JSON in this format:
{
  "risk": "<either Conservative|Balanced|Aggressive>",
  "explanation": "One-sentence explanation here"
}
  `.trim();
}

// Add a proxy endpoint for CoinGecko API requests
app.get("/api/crypto/prices", async (req, res) => {
  try {
    const { ids, vs_currency = "usd" } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        error: { message: "Missing required 'ids' parameter" }
      });
    }
    
    // Check if we have a valid cached response
    const cacheKey = `${ids}-${vs_currency}`;
    const now = Date.now();
    if (
      coinGeckoCache.data[cacheKey] && 
      coinGeckoCache.timestamp[cacheKey] && 
      now - coinGeckoCache.timestamp[cacheKey] < coinGeckoCache.cacheDuration
    ) {
      console.log("Returning cached CoinGecko data");
      return res.json(coinGeckoCache.data[cacheKey]);
    }
    
    // Determine which API endpoint to use
    const baseUrl = COINGECKO_API_KEY 
      ? "https://pro-api.coingecko.com/api/v3" 
      : "https://api.coingecko.com/api/v3";
    
    const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=${vs_currency}&include_24hr_change=true&precision=full`;
    
    const headers = {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    };
    
    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }
    
    console.log(`Proxying request to CoinGecko API: ${url}`);
    const response = await axios.get(url, { headers });
    
    // Cache the response
    coinGeckoCache.data[cacheKey] = response.data;
    coinGeckoCache.timestamp[cacheKey] = now;
    
    return res.json(response.data);
  } catch (err) {
    console.error("Error proxying CoinGecko request:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: {
        message: err.response?.data?.error?.message || err.message || "Error fetching cryptocurrency prices"
      }
    });
  }
});

app.post("/api/risk-profile", async (req, res) => {
  try {
    const { timeHorizon, volatilityTolerance, primaryGoal } = req.body;
    
    // Validate required fields
    if (!timeHorizon || !volatilityTolerance || !primaryGoal) {
      return res.status(400).json({
        error: { message: "Missing required fields" }
      });
    }

    // Build the prompt text for Gemini:
    const prompt = buildPrompt({ timeHorizon, volatilityTolerance, primaryGoal });

    // Correct Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // Correct payload format for Gemini API
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        topP: 0.8,
        topK: 10
      }
    };

    const headers = {
      "Content-Type": "application/json",
    };

    console.log("Sending request to Gemini API...");
    const response = await axios.post(url, payload, { headers });
    console.log("Gemini API response:", response.data);

    // Gemini returns response in this format:
    // {
    //   candidates: [
    //     {
    //       content: {
    //         parts: [
    //           { text: "your response here" }
    //         ]
    //       }
    //     }
    //   ]
    // }
    
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No text content in Gemini response");
    }

    // Clean up the text response (remove markdown formatting if present)
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", cleanText);
      // Fallback: extract risk level from text
      const riskMatch = cleanText.match(/(Conservative|Balanced|Aggressive)/i);
      if (riskMatch) {
        parsed = {
          risk: riskMatch[1],
          explanation: "Risk profile determined based on your investment preferences."
        };
      } else {
        throw new Error("Could not parse risk profile from AI response");
      }
    }

    // Validate the parsed response
    if (!parsed.risk || !['Conservative', 'Balanced', 'Aggressive'].includes(parsed.risk)) {
      throw new Error("Invalid risk profile returned by AI");
    }

    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/risk-profile:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: {
        message: err.response?.data?.error?.message || err.message || "Internal server error"
      }
    });
  }
});

// New endpoint for portfolio recommendations
app.post("/api/portfolio-recommendation", async (req, res) => {
  try {
    const { riskProfile, investmentAmount } = req.body;
    
    if (!riskProfile) {
      return res.status(400).json({
        error: { message: "Risk profile is required" }
      });
    }

    const prompt = `
As a professional financial advisor, recommend a cryptocurrency portfolio allocation for a ${riskProfile.toLowerCase()} risk investor with an investment amount of $${investmentAmount || '10000'}.

Provide a detailed portfolio breakdown with percentages for different cryptocurrencies, considering:
- Risk level: ${riskProfile}
- Current market conditions
- Diversification principles
- Long-term growth potential

Return the response as valid JSON in this exact format:
{
  "portfolio": [
    {"name": "BTC", "percentage": 50, "rationale": "Digital gold, store of value"},
    {"name": "ETH", "percentage": 30, "rationale": "Smart contracts platform leader"},
    {"name": "LINK", "percentage": 20, "rationale": "Decentralized oracle network"}
  ],
  "summary": "Brief explanation of the overall strategy",
  "expectedReturn": "8-12% annually",
  "riskLevel": "${riskProfile}"
}
    `.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
        topP: 0.8,
        topK: 10
      }
    };

    const headers = {
      "Content-Type": "application/json",
    };

    console.log("Sending portfolio recommendation request to Gemini API...");
    const response = await axios.post(url, payload, { headers });
    
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No text content in Gemini response");
    }

    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse portfolio recommendation:", cleanText);
      // Fallback portfolio based on risk profile
      const fallbackPortfolios = {
        Conservative: {
          portfolio: [
            {"name": "BTC", "percentage": 60, "rationale": "Digital gold, most stable crypto"},
            {"name": "ETH", "percentage": 25, "rationale": "Established platform with strong fundamentals"},
            {"name": "USDC", "percentage": 15, "rationale": "Stable coin for capital preservation"}
          ],
          summary: "Conservative approach focusing on established cryptocurrencies with lower volatility",
          expectedReturn: "5-8% annually",
          riskLevel: "Conservative"
        },
        Balanced: {
          portfolio: [
            {"name": "BTC", "percentage": 45, "rationale": "Digital gold, store of value"},
            {"name": "ETH", "percentage": 35, "rationale": "Smart contracts platform leader"},
            {"name": "LINK", "percentage": 20, "rationale": "Decentralized oracle network"}
          ],
          summary: "Balanced approach mixing stability with growth potential",
          expectedReturn: "8-12% annually",
          riskLevel: "Balanced"
        },
        Aggressive: {
          portfolio: [
            {"name": "BTC", "percentage": 30, "rationale": "Foundation holding"},
            {"name": "ETH", "percentage": 25, "rationale": "Smart contracts leader"},
            {"name": "SOL", "percentage": 20, "rationale": "High-performance blockchain"},
            {"name": "LINK", "percentage": 15, "rationale": "Oracle network"},
            {"name": "DOT", "percentage": 10, "rationale": "Interoperability protocol"}
          ],
          summary: "Aggressive strategy with higher risk and potential returns",
          expectedReturn: "15-25% annually",
          riskLevel: "Aggressive"
        }
      };
      parsed = fallbackPortfolios[riskProfile] || fallbackPortfolios.Balanced;
    }

    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/portfolio-recommendation:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    return res.status(status).json({
      error: {
        message: err.response?.data?.error?.message || err.message || "Internal server error"
      }
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`✅ Gemini API key configured: ${GEMINI_API_KEY ? 'Yes' : 'No'}`);
});