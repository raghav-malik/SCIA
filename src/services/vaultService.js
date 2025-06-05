// src/services/vaultService.js

import { ethers } from "ethers";
import { VAULT_ADDRESS, VAULT_ABI } from "../constants/vault";

/**
 * Given a BrowserProvider or JsonRpcProvider, return the contract
 * object to call read/write functions. 
 */
export function getVaultContract(providerOrSigner) {
  return new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, providerOrSigner);
}

/**
 * Return only a “read‐only” contract attached to the provider (no signer):
 */
export async function fetchVaultBalanceStatic(provider, account) {
  const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
  const balWei = await vaultContract.balances(account);
  return ethers.formatEther(balWei);
}
