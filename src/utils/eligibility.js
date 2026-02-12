import { ethers } from 'ethers';

// --- CONSTANTS ---
const BASE_L1_BRIDGE_ADDRESS = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";
const BASE_PORTAL_ADDRESS = "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e";
const AERODROME_ROUTER = "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";
const UNISWAP_BASE_ROUTER = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
const UNISWAP_MAINNET_ROUTER = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";
const ENS_REGISTRAR = "0x253553366Da8546fC250F225fe3d25d0C782303b";

/**
 * 1. Checks Base Official Bridge Usage
 */
export async function checkBaseBridgeUsage(walletAddress, alchemyKey) {
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: BASE_L1_BRIDGE_ADDRESS, category: ["external", "erc20"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const data = await response.json();
    if (data?.result?.transfers?.length > 0) return true;

    // Fallback: Check Portal
    const portalRes = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 2, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: BASE_PORTAL_ADDRESS, category: ["external"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const portalData = await portalRes.json();
    return (portalData?.result?.transfers?.length > 0);
  } catch (err) { console.error("Bridge Check Error", err); return false; }
}

/**
 * 2. Checks Aerodrome Usage (Base)
 */
export async function checkAerodromeUser(walletAddress, alchemyKey) {
  try {
    const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 3, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: AERODROME_ROUTER, category: ["external", "erc20"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const data = await response.json();
    return (data?.result?.transfers?.length > 0);
  } catch (err) { console.error("Aerodrome Check Error", err); return false; }
}

/**
 * 3. Checks Uniswap Usage (Base)
 */
export async function checkUniswapUser(walletAddress, alchemyKey) {
  try {
    const response = await fetch(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 4, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: UNISWAP_BASE_ROUTER, category: ["external", "erc20"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const data = await response.json();
    return (data?.result?.transfers?.length > 0);
  } catch (err) { console.error("Uniswap Base Check Error", err); return false; }
}

/**
 * 4. Checks Uniswap Usage (Mainnet)
 */
export async function checkMainnetUniswap(walletAddress, alchemyKey) {
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 5, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: UNISWAP_MAINNET_ROUTER, category: ["external", "erc20"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const data = await response.json();
    return (data?.result?.transfers?.length > 0);
  } catch (err) { console.error("Uniswap Mainnet Check Error", err); return false; }
}

/**
 * 5. Checks ENS Registration (Mainnet)
 */
export async function checkENSUser(walletAddress, alchemyKey) {
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 6, method: "alchemy_getAssetTransfers",
        params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: walletAddress, toAddress: ENS_REGISTRAR, category: ["external"], withMetadata: false, excludeZeroValue: true, maxCount: "0x1" }]
      })
    });
    const data = await response.json();
    return (data?.result?.transfers?.length > 0);
  } catch (err) { console.error("ENS Check Error", err); return false; }
}

/**
 * 6. Sybil Risk Calculation
 */
export function calculateSybilRisk(txCount, ethBalance) {
  const balance = parseFloat(ethBalance);
  if (txCount < 5) return { score: 90, label: "HIGH RISK (New Wallet)", color: "text-red-500" };
  if (balance < 0.001) return { score: 75, label: "HIGH RISK (Dust Balance)", color: "text-orange-500" };
  if (txCount < 20) return { score: 40, label: "MEDIUM RISK (Low Activity)", color: "text-yellow-500" };
  return { score: 10, label: "LOW RISK (Healthy)", color: "text-emerald-500" };
}