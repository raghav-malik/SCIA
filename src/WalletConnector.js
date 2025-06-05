// src/WalletConnector.js
import React, { useEffect, useState } from "react";

export default function WalletConnector() {
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState("");

  // Function to connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Prompt user to connect MetaMask
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0] || "");
        
        // Get network chain ID (hex)
        const network = await window.ethereum.request({
          method: "eth_chainId",
        });
        setChainId(network);
      } catch (err) {
        console.error("User rejected connection or error occurred", err);
      }
    } else {
      alert("MetaMask not detected. Please install MetaMask to continue.");
    }
  };

  // Listen for account or network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0] || "");
      });
      window.ethereum.on("chainChanged", (newChainId) => {
        // Force a reload on network change
        window.location.reload();
      });
    }
    // Clean up listeners when component unmounts
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  // Render a button showing either "Connect Wallet" or connected address
  return (
    <div>
      <button
        onClick={connectWallet}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {walletAddress
          ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "Connect Wallet"}
      </button>
      {chainId && (
        <p className="mt-2 text-sm text-gray-700">Chain ID: {parseInt(chainId, 16)}</p>
      )}
    </div>
  );
}
