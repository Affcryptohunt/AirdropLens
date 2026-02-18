import { ethers } from 'ethers';

export default async function handler(req, res) {
  // 1. READ THE KEY FROM VERCEL SETTINGS
  // This looks for the "ETH_RPC_URL" variable you set up in Vercel.
  const RPC_URL = process.env.ETH_RPC_URL;

  // Safety Check: If Vercel settings are empty, stop here.
  if (!RPC_URL) {
    console.error("CRITICAL ERROR: ETH_RPC_URL is missing in Vercel Environment Variables.");
    return res.status(500).json({ error: "Server Configuration Error: Missing RPC URL" });
  }

  const { address } = req.query;

  // 2. Validate the Address
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }

  try {
    // 3. Connect to Alchemy using the Secure Variable
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Test the connection by getting the balance
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    // Return success
    return res.status(200).json({ 
        success: true, 
        balance: balanceInEth,
        provider: "Alchemy via Backend" 
    });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
}