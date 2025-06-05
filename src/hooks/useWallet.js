// src/hooks/useWallet.js

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import InvestmentVaultABI from "../InvestmentVaultABI.json";

// Replace with your locally deployed address:
const VAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function useWallet() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletEthBalance, setWalletEthBalance] = useState(null);

  const [vaultBalance, setVaultBalance] = useState(null);
  const [viewingVault, setViewingVault] = useState(false);

  const [txHistory, setTxHistory] = useState([]);

  const [transactionStatus, setTransactionStatus] = useState(""); // "", "pending", "success", "withdrawing", etc.
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // ─── 1) Connect MetaMask & Fetch ETH Balance ────────────────────────────────
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
      setWalletEthBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("MetaMask connection error:", err);
    }
  };

  // ─── 2) Listen for Account/Network Changes ─────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setWalletConnected(true);
        setWalletAddress(newAccount);

        (async () => {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const bal = await provider.getBalance(newAccount);
          setWalletEthBalance(ethers.formatEther(bal));
        })();
      } else {
        setWalletConnected(false);
        setWalletAddress("");
        setWalletEthBalance(null);
        setVaultBalance(null);
        setTxHistory([]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", () => window.location.reload());

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", () =>
          window.location.reload()
        );
      }
    };
  }, []);

  // ─── 3) Fetch Vault Balance ─────────────────────────────────────────────────
  const fetchVaultBalance = async (account) => {
    if (!walletConnected || !account) return;
    try {
      setViewingVault(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(
        VAULT_ADDRESS,
        InvestmentVaultABI,
        signer
      );

      const balWei = await vaultContract.balances(account);
      setVaultBalance(ethers.formatEther(balWei));
    } catch (err) {
      console.error("Error fetching vault balance:", err);
      setVaultBalance(null);
    } finally {
      setViewingVault(false);
    }
  };

  // ─── 4) Fetch Past Events (Deposit / Withdraw) ─────────────────────────────
  const fetchTxHistory = async () => {
    if (!walletConnected || !walletAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vaultContract = new ethers.Contract(
        VAULT_ADDRESS,
        InvestmentVaultABI,
        provider
      );

      // Filter Deposited(user, amount)
      const depositFilter = vaultContract.filters.Deposited(
        walletAddress,
        null
      );
      const depositEvents = await vaultContract.queryFilter(
        depositFilter,
        0,
        "latest"
      );

      // Filter Withdrawn(user, amount)
      const withdrawFilter = vaultContract.filters.Withdrawn(
        walletAddress,
        null
      );
      const withdrawEvents = await vaultContract.queryFilter(
        withdrawFilter,
        0,
        "latest"
      );

      // Normalize deposits
      const deposits = depositEvents.map((evt) => ({
        type: "Deposit",
        amount: ethers.formatEther(evt.args.amount),
        blockNumber: evt.blockNumber,
        txHash: evt.transactionHash,
      }));

      // Normalize withdrawals
      const withdrawals = withdrawEvents.map((evt) => ({
        type: "Withdraw",
        amount: ethers.formatEther(evt.args.amount),
        blockNumber: evt.blockNumber,
        txHash: evt.transactionHash,
      }));

      // Combine & sort by blockNumber ascending
      const combined = deposits.concat(withdrawals);
      combined.sort((a, b) => a.blockNumber - b.blockNumber);

      setTxHistory(combined);
    } catch (err) {
      console.error("Error fetching tx history:", err);
      setTxHistory([]);
    }
  };

  // Re‐fetch history whenever the wallet/account changes
  useEffect(() => {
    if (walletConnected && walletAddress) {
      fetchTxHistory();
    }
  }, [walletConnected, walletAddress]);

  // ─── 5) Handle Deposit (invest 1 ETH) ──────────────────────────────────────
  const handleDeposit = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    setTransactionStatus("pending");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(
        VAULT_ADDRESS,
        InvestmentVaultABI,
        signer
      );

      const tx = await vaultContract.invest({
        value: ethers.parseEther("1.0"),
      });
      console.log("invest() tx hash:", tx.hash);
      await tx.wait();

      setTransactionStatus("success");
      // We do NOT automatically re‐fetch vaultBalance or txHistory here,
      // so that “View Vault” remains strictly manual.
      setTimeout(() => setTransactionStatus(""), 3000);
    } catch (err) {
      console.error("Transaction error:", err);
      setTransactionStatus("");
      alert("Error during investment. See console for details.");
    }
  };

  // ─── 6) Handle Withdraw ────────────────────────────────────────────────────
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
      const vaultContract = new ethers.Contract(
        VAULT_ADDRESS,
        InvestmentVaultABI,
        signer
      );

      const amountWei = ethers.parseEther(withdrawAmount);
      const tx = await vaultContract.withdraw(amountWei);
      console.log("withdraw() tx hash:", tx.hash);
      await tx.wait();

      setTransactionStatus("withdrawSuccess");
      // We do NOT automatically re‐fetch balances here—“View Vault” is manual
      setTimeout(() => setTransactionStatus(""), 3000);
    } catch (err) {
      console.error("Withdraw error:", err);
      setTransactionStatus("");
      alert("Error during withdrawal. See console for details.");
    }
  };

  return {
    walletConnected,
    walletAddress,
    walletEthBalance,
    vaultBalance,
    viewingVault,
    txHistory,
    connectWallet,
    fetchVaultBalance,
    fetchTxHistory,
    handleDeposit,
    withdrawAmount,
    setWithdrawAmount,
    handleWithdraw,
    transactionStatus,
  };
}
