// src/App.js

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Shield,
  Target,
  RefreshCw,
  Play,
  CheckCircle,
  Activity,
  DollarSign,
  Percent,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { ethers } from "ethers";
import InvestmentVaultABI from "./InvestmentVaultABI.json";
import RiskProfileTab from "./components/RiskProfileTab";
import TokenPriceDisplay from "./components/TokenPriceDisplay";

// ─────────────── NEW: import our multiple-coin hook ───────────────
import { useMultipleCoinGeckoPrices } from "./hooks/useMultipleCoinGeckoPrices";

// ─────────────────────────────────────────────────────────────────────────────
// Replace with whatever Hardhat deployed on localhost
const VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Optional: Your CoinGecko API key if you have one
const COINGECKO_API_KEY = process.env.REACT_APP_COINGECKO_API_KEY || null;

// ─────────────────────────────────────────────────────────────────────────────
export default function CryptoInvestmentAssistant() {
  // ────────────────────────────────────────────────────────────────────────────
  // Wallet & Chain State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletEthBalance, setWalletEthBalance] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Mock-AI risk profile (from RiskProfileTab)
  const [chosenRisk, setChosenRisk] = useState("");

  // UI state
  const [userProfile, setUserProfile] = useState({
    riskLevel: "",
    isProfileComplete: false,
  });
  const [simulationData, setSimulationData] = useState({
    startDate: "",
    endDate: "",
    amount: "",
    results: null,
  });
  const [transactionStatus, setTransactionStatus] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Vault state
  const [vaultBalance, setVaultBalance] = useState(null);
  const [viewingVault, setViewingVault] = useState(false);

  // Transaction History
  const [txHistory, setTxHistory] = useState([]);
  
  // API status tracking
  const [apiStatus, setApiStatus] = useState({
    coingecko: "unknown",
    lastChecked: null
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ── COINGECKO: fetch 5 token prices every 30 seconds ─────────────────────────
  const coinIds = [
    "bitcoin",
    "ethereum",
    "tether",      // CoinGecko ID for USDT
    "chainlink",
    "binancecoin",
  ];
  const {
    prices: multiPrices,
    loading: multiLoading,
    error: multiError,
    useFallback: usingFallbackPrices,
    refresh: refreshPrices
  } = useMultipleCoinGeckoPrices(coinIds, "usd", 30000, COINGECKO_API_KEY);

  useEffect(() => {
    if (multiError) {
      setApiStatus({
        coingecko: "error",
        lastChecked: new Date(),
        errorMessage: multiError.message
      });
    } else if (!multiLoading && Object.values(multiPrices).some(p => p !== null)) {
      setApiStatus({
        coingecko: usingFallbackPrices ? "fallback" : "online",
        lastChecked: new Date()
      });
    }
  }, [multiPrices, multiError, multiLoading, usingFallbackPrices]);

  // ────────────────────────────────────────────────────────────────────────────
  // Mock data for charts (unchanged for data, colors will be updated in render)
  const portfolioData = [
    { name: "BTC", value: 50, color: "#F7931A" }, // Orange
    { name: "ETH", value: 30, color: "#627EEA" }, // Ether Blue
    { name: "LINK", value: 20, color: "#2A5ADA" }, // Chainlink Blue
  ];
  const simulationResults = [
    { date: "2023-01", value: 1000 },
    { date: "2023-02", value: 1150 },
    { date: "2023-03", value: 1080 },
    { date: "2023-04", value: 1320 },
    { date: "2023-05", value: 1280 },
    { date: "2023-06", value: 1450 },
  ];
  const currentHoldings = [
    { token: "BTC", amount: "0.025", value: "$1,250", percentage: "50%" },
    { token: "ETH", amount: "2.5", value: "$750", percentage: "30%" },
    { token: "LINK", amount: "45", value: "$500", percentage: "20%" },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];
      setWalletConnected(true);
      setWalletAddress(account);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      const formatted = ethers.formatEther(balance);
      setWalletEthBalance(formatted);

      const networkHex = await window.ethereum.request({
        method: "eth_chainId",
      });
      const networkNumeric = parseInt(networkHex, 16);
      setChainId(networkNumeric);

      await fetchVaultBalance(account);
      await fetchTxHistory(account);
    } catch (err) {
      console.error("MetaMask connection error:", err);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const acct = accounts[0];
        setWalletConnected(true);
        setWalletAddress(acct);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(acct);
        setWalletEthBalance(ethers.formatEther(bal));
        await fetchVaultBalance(acct);
        await fetchTxHistory(acct);
      } else {
        setWalletConnected(false);
        setWalletAddress("");
        setWalletEthBalance(null);
        setVaultBalance(null);
        setTxHistory([]);
      }
    };

    const handleChainChanged = (newChainHex) => {
      const newChainId = parseInt(newChainHex, 16);
      setChainId(newChainId);
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const fetchVaultBalance = async (account) => {
    try {
      setViewingVault(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, InvestmentVaultABI, signer);
      const balWei = await vaultContract.balances(account);
      const balEth = ethers.formatEther(balWei);
      setVaultBalance(balEth);
    } catch (err) {
      console.error("Error fetching vault balance:", err);
      setVaultBalance(null);
    } finally {
      setViewingVault(false);
    }
  };

  const fetchTxHistory = async (account) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, InvestmentVaultABI, provider);
      const depositFilter = vaultContract.filters.Deposited(account, null);
      const depositEvents = await vaultContract.queryFilter(depositFilter, 0, "latest");
      const withdrawFilter = vaultContract.filters.Withdrawn(account, null);
      const withdrawEvents = await vaultContract.queryFilter(withdrawFilter, 0, "latest");
      const deposits = depositEvents.map((e) => ({ type: "Deposit", amount: ethers.formatEther(e.args.amount), blockNumber: e.blockNumber }));
      const withdrawals = withdrawEvents.map((e) => ({ type: "Withdraw", amount: ethers.formatEther(e.args.amount), blockNumber: e.blockNumber }));
      const all = deposits.concat(withdrawals).sort((a, b) => b.blockNumber - a.blockNumber); // Sort descending by blockNumber
      setTxHistory(all);
    } catch (err) {
      console.error("Error fetching tx history:", err);
      setTxHistory([]);
    }
  };
  
  const handleInvestment = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    setTransactionStatus("pending");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, InvestmentVaultABI, signer);
      const tx = await vaultContract.invest({ value: ethers.parseEther("1.0") });
      await tx.wait();
      setTransactionStatus("success");
      await fetchVaultBalance(walletAddress);
      await fetchTxHistory(walletAddress);
      setTimeout(() => setTransactionStatus(""), 3000);
    } catch (err) {
      console.error("Transaction error:", err);
      setTransactionStatus("");
      alert("Error during investment. See console for details.");
    }
  };

  const handleWithdraw = async () => {
    if (!walletConnected) {
      alert("Connect your wallet first.");
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Enter a valid amount to withdraw.");
      return;
    }
    setTransactionStatus("withdrawing");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, InvestmentVaultABI, signer);
      const amountWei = ethers.parseEther(withdrawAmount);
      const tx = await vaultContract.withdraw(amountWei);
      await tx.wait();
      setTransactionStatus("withdrawSuccess");
      await fetchVaultBalance(walletAddress);
      await fetchTxHistory(walletAddress);
      setWithdrawAmount("");
    } catch (err) {
      console.error("Withdraw error:", err);
      setTransactionStatus("");
      alert("Error during withdrawal. See console for details.");
    }
    setTimeout(() => setTransactionStatus(""), 3000);
  };

  const runSimulation = () => {
    if (simulationData.amount && simulationData.startDate && simulationData.endDate) {
      const finalValue = parseFloat(simulationData.amount) * 1.45;
      const gain = ((finalValue - parseFloat(simulationData.amount)) / parseFloat(simulationData.amount)) * 100;
      setSimulationData({ ...simulationData, results: { finalValue: finalValue.toFixed(2), gain: gain.toFixed(1) } });
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case "Conservative": return "bg-binance-green/20 text-binance-green";
      case "Balanced": return "bg-binance-yellow/20 text-binance-yellow";
      case "Aggressive": return "bg-binance-red/20 text-binance-red";
      default: return "bg-gray-700 text-gray-300";
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  return (
    <div className="min-h-screen bg-binance-bg text-binance-text-primary font-sans">
      {/* ───── Header ───────────────────────────────────────────────────── */}
      <header className="bg-binance-header border-b border-binance-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-binance-yellow to-orange-500 rounded-md flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-semibold text-binance-text-primary">
              Crypto Investment Assistant
            </h1>
          </div>

          <button
            onClick={connectWallet}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
              walletConnected
                ? "bg-binance-green/20 text-binance-green hover:bg-binance-green/30"
                : "bg-binance-yellow hover:bg-binance-yellow-darker text-black"
            }`}
          >
            <Wallet className="w-4 h-4 inline mr-1.5" />
            {walletConnected
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>

        {walletConnected && (
          <div className="container mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-binance-card rounded-md border border-binance-border p-4">
              <h3 className="text-md font-semibold text-binance-text-primary mb-3">Wallet Overview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-binance-text-secondary">Address</span>
                  <span className="text-binance-text-primary font-mono">
                    {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-binance-text-secondary">Network</span>
                  <span className="text-binance-text-primary">
                    {chainId === 1 ? "Ethereum Mainnet" :
                     chainId === 5 ? "Goerli Testnet" :
                     chainId === 11155111 ? "Sepolia Testnet" :
                     chainId === 1337 ? "Localhost" :
                     `Chain ID: ${chainId}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-binance-text-secondary">ETH Balance</span>
                  <span className="text-binance-text-primary">{parseFloat(walletEthBalance).toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-binance-text-secondary">Vault Balance</span>
                  <span className="text-binance-text-primary">
                    {vaultBalance !== null ? `${parseFloat(vaultBalance).toFixed(4)} ETH` : "Loading..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-binance-card rounded-md border border-binance-border p-4">
              {/* Pass prices and loading state to TokenPriceDisplay */}
              <TokenPriceDisplay 
                prices={multiPrices} 
                loading={multiLoading} 
                error={multiError}
                usingFallback={usingFallbackPrices}
                apiStatus={apiStatus}
                refreshPrices={refreshPrices}
                context="header" // Optional: to allow different styling/layout in component
              />
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex space-x-1 mb-6 border-b border-binance-border">
          {[
            { id: "profile", label: "Profile", icon: Shield },
            { id: "portfolio", label: "Portfolio", icon: Target },
            { id: "simulation", label: "Simulation", icon: Activity },
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "tokenPrices", label: "Token Prices", icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2.5 -mb-px text-sm font-medium transition-colors focus:outline-none ${
                activeTab === tab.id
                  ? "border-b-2 border-binance-yellow text-binance-yellow"
                  : "text-binance-text-secondary hover:text-binance-text-primary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── PROFILE TAB ───────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <RiskProfileTab
                onProfileComplete={(risk) => {
                  setChosenRisk(risk);
                  setUserProfile({ riskLevel: risk, isProfileComplete: true });
                }}
              />
            </div>

            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4">
                Profile Summary
              </h2>
              <div className="space-y-3 text-sm">
                {chosenRisk && (
                  <div className="flex justify-between items-center">
                    <span className="text-binance-text-secondary">AI Recommendation:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getRiskBadgeColor(chosenRisk)}`}
                    >
                      {chosenRisk}
                    </span>
                  </div>
                )}
                 {!chosenRisk && <p className="text-sm text-binance-text-secondary">Complete the AI Questionnaire to see your risk profile.</p>}
              </div>
            </div>
            
            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4">
                Activities
              </h2>
              {txHistory.length === 0 ? (
                <p className="text-sm text-binance-text-secondary">No exchanges yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-binance-text-secondary uppercase">
                      <tr>
                        <th scope="col" className="py-2 pr-2">Type</th>
                        <th scope="col" className="py-2 px-2">Amount (ETH)</th>
                        <th scope="col" className="py-2 pl-2">Block #</th>
                      </tr>
                    </thead>
                    <tbody className="text-binance-text-primary">
                      {txHistory.map((tx, idx) => (
                        <tr key={idx} className="border-t border-binance-border hover:bg-binance-hover-bg transition-colors">
                          <td className="py-2.5 pr-2">{tx.type}</td>
                          <td className="py-2.5 px-2 font-mono">{tx.amount}</td>
                          <td className="py-2.5 pl-2 font-mono">{tx.blockNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {walletConnected && (
              <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
                <h2 className="text-lg font-semibold text-binance-text-primary mb-4">Vault Status</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={async () => {
                      await fetchVaultBalance(walletAddress);
                      await fetchTxHistory(walletAddress);
                    }}
                    disabled={viewingVault}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewingVault
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-binance-input-bg hover:bg-opacity-80 text-binance-text-primary"
                    }`}
                  >
                     <RefreshCw className={`w-3.5 h-3.5 mr-1.5 inline ${viewingVault ? "animate-spin" : ""}`} />
                    {viewingVault ? "Refreshing Vault…" : "Refresh Vault Data"}
                  </button>
                  {vaultBalance !== null && (
                    <span className="text-sm text-binance-text-secondary">
                      Current Balance: <span className="font-mono text-binance-text-primary">{vaultBalance} ETH</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "portfolio" && userProfile.isProfileComplete && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-binance-yellow" />
                Recommended Portfolio
              </h2>
              <div className="h-60 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" >
                      {portfolioData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#181A20", border: "1px solid #2B3139", borderRadius: "6px" }} itemStyle={{color: "#EAECEF"}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 text-sm">
                {portfolioData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: item.color }}></div>
                      <span className="text-binance-text-primary">{item.name}</span>
                    </div>
                    <span className="text-binance-text-secondary">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4">AI Commentary</h2>
              <div className="bg-binance-yellow/10 border border-binance-yellow/20 rounded-md p-3.5">
                <p className="text-yellow-200 italic text-sm">
                  "We recommend this allocation based on your {chosenRisk.toLowerCase()} risk profile. This portfolio balances growth potential with risk management, focusing on established cryptocurrencies with strong fundamentals."
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <h3 className="text-md font-medium text-binance-text-primary">Token Details</h3>
                {portfolioData.map((token) => (
                  <div key={token.name} className="bg-binance-input-bg rounded-md p-3 text-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-binance-text-primary">{token.name}</span>
                      <span className="text-binance-text-secondary">{token.value}%</span>
                    </div>
                    <p className="text-xs text-binance-text-secondary">
                      {token.name === "BTC" && "Digital gold, store of value"}
                      {token.name === "ETH" && "Smart contract platform leader"}
                      {token.name === "LINK" && "Decentralized oracle network"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "portfolio" && !userProfile.isProfileComplete && (
             <div className="bg-binance-card rounded-lg p-6 border border-binance-border text-center">
                <AlertCircle className="w-12 h-12 text-binance-yellow mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-binance-text-primary mb-2">Profile Incomplete</h2>
                <p className="text-binance-text-secondary mb-4">Please complete your risk profile on the "Profile" tab to view portfolio recommendations.</p>
                <button 
                    onClick={() => setActiveTab("profile")}
                    className="bg-binance-yellow text-black px-4 py-2 rounded-md hover:bg-binance-yellow-darker font-medium transition-colors"
                >
                    Go to Profile
                </button>
            </div>
        )}


        {activeTab === "simulation" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-binance-yellow" /> Investment Simulation
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-binance-text-secondary mb-1.5">Investment Amount (USDT)</label>
                  <input type="number" value={simulationData.amount} onChange={(e) => setSimulationData({ ...simulationData, amount: e.target.value })}
                    className="w-full p-2.5 bg-binance-input-bg border border-binance-border rounded-md text-binance-text-primary focus:border-binance-yellow outline-none" placeholder="1000" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-binance-text-secondary mb-1.5">Start Date</label>
                    <input type="date" value={simulationData.startDate} onChange={(e) => setSimulationData({ ...simulationData, startDate: e.target.value })}
                      className="w-full p-2.5 bg-binance-input-bg border border-binance-border rounded-md text-binance-text-primary focus:border-binance-yellow outline-none" />
                  </div>
                  <div>
                    <label className="block text-binance-text-secondary mb-1.5">End Date</label>
                    <input type="date" value={simulationData.endDate} onChange={(e) => setSimulationData({ ...simulationData, endDate: e.target.value })}
                      className="w-full p-2.5 bg-binance-input-bg border border-binance-border rounded-md text-binance-text-primary focus:border-binance-yellow outline-none" />
                  </div>
                </div>
                <button onClick={runSimulation} className="w-full bg-binance-yellow hover:bg-binance-yellow-darker text-black py-2.5 rounded-md font-medium transition-colors flex items-center justify-center">
                  <Play className="w-4 h-4 mr-2" /> Run Simulation
                </button>
                {simulationData.results && (
                  <div className="mt-5 p-3.5 bg-binance-green/10 border border-binance-green/20 rounded-md">
                    <h3 className="text-binance-green font-medium mb-2 text-md">Simulation Results</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-binance-text-secondary">Final Value:</span><span className="text-binance-text-primary font-semibold">${simulationData.results.finalValue}</span></div>
                      <div className="flex justify-between"><span className="text-binance-text-secondary">Total Gain:</span><span className="text-binance-green font-semibold">+{simulationData.results.gain}%</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4">Historical Performance</h2>
              <div className="h-60 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationResults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(132, 142, 156, 0.1)" />
                    <XAxis dataKey="date" stroke="#848E9C" fontSize="12px" />
                    <YAxis stroke="#848E9C" fontSize="12px" />
                    <Tooltip contentStyle={{ backgroundColor: "#181A20", border: "1px solid #2B3139", borderRadius: "6px" }} itemStyle={{color: "#EAECEF"}} labelStyle={{color: "#848E9C"}}/>
                    <Line type="monotone" dataKey="value" stroke="#FCD535" strokeWidth={2} dot={{ fill: "#FCD535", strokeWidth: 1, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-5">
                <div className="p-3.5 bg-binance-input-bg rounded-md">
                  <h3 className="text-binance-text-primary font-medium mb-3 text-md">Investment Execution</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-binance-text-secondary mb-1.5">Slippage Tolerance (%)</label>
                      <input type="number" defaultValue="1" min="0.1" max="5" step="0.1" className="w-full p-2 bg-binance-bg border border-binance-border rounded-md text-binance-text-primary focus:border-binance-yellow outline-none" />
                    </div>
                    <button onClick={handleInvestment} disabled={transactionStatus === "pending"}
                      className="w-full bg-binance-green hover:opacity-90 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
                      {transactionStatus === "pending" ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (<><CheckCircle className="w-4 h-4 mr-2" />Approve & Invest (1 ETH)</>)}
                    </button>
                    {transactionStatus === "success" && (<div className="flex items-center text-binance-green text-xs mt-1.5"><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Transaction successful!</div>)}
                  </div>
                </div>

                <div className="p-3.5 bg-binance-input-bg rounded-md">
                  <h3 className="text-binance-text-primary font-medium mb-3 text-md">Withdraw from Vault</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-binance-text-secondary mb-1.5">Amount to Withdraw (ETH)</label>
                      <input type="number" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full p-2 bg-binance-bg border border-binance-border rounded-md text-binance-text-primary focus:border-binance-yellow outline-none" placeholder="0.5" />
                    </div>
                    <button onClick={handleWithdraw} disabled={transactionStatus === "withdrawing"}
                      className="w-full bg-binance-red hover:opacity-90 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center">
                      {transactionStatus === "withdrawing" ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing…</>) : (<><Wallet className="w-4 h-4 mr-2" />Withdraw</>)}
                    </button>
                    {transactionStatus === "withdrawSuccess" && (<div className="flex items-center text-binance-green text-xs mt-1.5"><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Withdrawal successful!</div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Total Portfolio Value", value: "$2,500", icon: DollarSign, color: "text-binance-green" },
                { label: "24h Change", value: "+5.2%", icon: TrendingUp, color: "text-binance-green" },
                { label: "Overall ROI", value: "+25%", icon: Percent, color: "text-binance-yellow" },
              ].map(item => (
                <div key={item.label} className="bg-binance-card rounded-lg p-4 border border-binance-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-binance-text-secondary text-xs">{item.label}</p>
                      <p className={`text-xl font-semibold ${item.color}`}>{item.value}</p>
                    </div>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-binance-text-primary">Current Holdings</h2>
                  <button className="bg-binance-input-bg hover:opacity-80 text-binance-text-primary px-3 py-1.5 rounded-md text-xs font-medium flex items-center">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Rebalance
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  {currentHoldings.map((holding) => (
                    <div key={holding.token} className="flex items-center justify-between p-3 bg-binance-input-bg rounded-md">
                      <div>
                        <div className="font-medium text-binance-text-primary">{holding.token}</div>
                        <div className="text-xs text-binance-text-secondary">{holding.amount} tokens</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-binance-text-primary">{holding.value}</div>
                        <div className="text-xs text-binance-text-secondary">{holding.percentage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
                <h2 className="text-lg font-semibold text-binance-text-primary mb-4">Performance Metrics</h2>
                <div className="space-y-4 text-sm">
                  {[
                    { label: "Sharpe Ratio", value: "1.42", color: "text-binance-text-primary" },
                    { label: "Volatility", value: "15.3%", color: "text-binance-yellow" },
                    { label: "Max Drawdown", value: "-8.2%", color: "text-binance-red" },
                  ].map(metric => (
                    <div key={metric.label} className="flex justify-between items-center">
                      <span className="text-binance-text-secondary">{metric.label}</span>
                      <span className={`font-medium ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                  <div className="mt-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <div className="flex items-center text-blue-400 mb-1.5 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Rebalancing Suggestion
                    </div>
                    <p className="text-blue-300 text-xs">
                      Consider rebalancing your portfolio. BTC allocation has grown to 55%, exceeding your target of 50%.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
              <h2 className="text-lg font-semibold text-binance-text-primary mb-4">Transaction History</h2>
              {txHistory.length === 0 ? (
                <p className="text-sm text-binance-text-secondary">No history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-binance-text-secondary uppercase">
                      <tr>
                        <th scope="col" className="py-2 pr-2">Type</th>
                        <th scope="col" className="py-2 px-2">Amount (ETH)</th>
                        <th scope="col" className="py-2 pl-2">Block #</th>
                      </tr>
                    </thead>
                    <tbody className="text-binance-text-primary">
                      {txHistory.map((tx, idx) => (
                        <tr key={idx} className="border-t border-binance-border hover:bg-binance-hover-bg transition-colors">
                          <td className="py-2.5 pr-2">{tx.type}</td>
                          <td className="py-2.5 px-2 font-mono">{tx.amount}</td>
                          <td className="py-2.5 pl-2 font-mono">{tx.blockNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "tokenPrices" && (
          <div className="bg-binance-card rounded-lg p-4 md:p-6 border border-binance-border">
            <h2 className="text-lg font-semibold text-binance-text-primary mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-binance-yellow" /> Live Token Prices
            </h2>
            <TokenPriceDisplay 
              prices={multiPrices} 
              loading={multiLoading} 
              error={multiError}
              usingFallback={usingFallbackPrices}
              apiStatus={apiStatus}
              refreshPrices={refreshPrices}
            />
          </div>
        )}
      </div>

      <footer className="bg-binance-header border-t border-binance-border mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 text-center">
          <div className="flex flex-wrap justify-center space-x-6 text-xs text-binance-text-secondary">
            <a href="#" className="hover:text-binance-yellow transition-colors">GitHub Repository</a>
            <a href="#" className="hover:text-binance-yellow transition-colors">Terms & Privacy</a>
            <a href="#" className="hover:text-binance-yellow transition-colors">Support / Feedback</a>
          </div>
          <p className="text-xs text-binance-text-tertiary mt-3">© {new Date().getFullYear()} Crypto Investment Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}