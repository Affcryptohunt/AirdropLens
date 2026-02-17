import { ethers } from 'ethers';

export default async function handler(request, response) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || !ethers.isAddress(address)) {
        return response.status(400).json({ error: "Invalid wallet address" });
    }

    try {
        // 1. Connect to BOTH networks (Base & Ethereum)
        // We use the variables you set in Vercel
        const baseProvider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL); // Base
        const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);      // Ethereum

        // 2. Fetch data from BOTH chains in parallel (Fast!)
        const [baseBalance, baseTxCount, ethBalance, ethName] = await Promise.all([
            baseProvider.getBalance(address),
            baseProvider.getTransactionCount(address),
            ethProvider.getBalance(address),
            ethProvider.lookupAddress(address) // Checks for ENS (e.g., imran.eth)
        ]);

        // 3. Simple Sybil Logic (Cross-Chain)
        // If they have < 0.005 ETH on Mainnet, they might be a bot
        const isLowEth = ethers.formatEther(ethBalance) < 0.005;
        const isLowTx = baseTxCount < 5;
        
        let riskScore = "LOW";
        if (isLowEth || isLowTx) riskScore = "MEDIUM";
        if (isLowEth && isLowTx) riskScore = "HIGH";

        // 4. Return the "Master Airdrop Hunter" JSON
        return response.status(200).json({
            meta: {
                engine: "AirdropLens Multi-Chain",
                timestamp: new Date().toISOString()
            },
            identity: {
                address: address,
                ens_name: ethName || "No ENS detected"
            },
            chain_data: {
                ethereum: {
                    balance: ethers.formatEther(ethBalance),
                    status: isLowEth ? "Low Balance" : "Healthy"
                },
                base: {
                    balance: ethers.formatEther(baseBalance),
                    tx_count: baseTxCount,
                    status: isLowTx ? "Inactive" : "Active"
                }
            },
            sybil_analysis: {
                risk_score: riskScore,
                reason: riskScore === "HIGH" ? "Low activity on both chains" : "Wallet looks organic"
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Failed to fetch cross-chain data" });
    }
}