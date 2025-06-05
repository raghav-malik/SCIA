import React from "react";
import { Wallet, CheckCircle } from "lucide-react";

export default function Header({
  walletConnected,
  walletAddress,
  walletEthBalance,
  vaultBalance,
  connectWallet,
}) {
  return (
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Smart Crypto Investment Assistant
          </h1>
        </div>
        <button
          onClick={connectWallet}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            walletConnected
              ? "bg-green-600 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-2" />
          {walletConnected
            ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(
                -4
              )}`
            : "Connect Wallet"}
        </button>
      </div>
      {walletConnected && walletEthBalance !== null && (
        <div className="text-center text-gray-400 mt-2">
          Your ETH Balance: <span className="font-mono">{walletEthBalance} ETH</span>
          {vaultBalance !== null && (
            <span className="ml-4">
              Vault Balance: <span className="font-mono">{vaultBalance} ETH</span>
            </span>
          )}
        </div>
      )}
    </header>
  );
}
