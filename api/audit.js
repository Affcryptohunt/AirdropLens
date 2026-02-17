import { ethers } from 'ethers';

export default async function handler(request, response) {
    // 1. ENVIRONMENT GUARD: Prevent the 127.0.0.1 crash
    if (!process.env.BASE_RPC_URL || !process.env.ETH_RPC_URL) {
        return response.status(500).json({ 
            error: "Vercel Configuration Missing", 
            details: "The server is missing the RPC URLs. Check your Vercel Dashboard variable names." 
        });
    }

    const address = request.query.address;

    if (!address || !ethers.isAddress(address)) {
        return response.status(400).json({ error: "Invalid wallet address" });
    }

    try {
        // 2. Setup Providers with fixed names
        const baseProvider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL, 8453, { staticNetwork: true });
        const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL, 1, { staticNetwork: true });

        // 3. Parallel Fetch
        const [baseBalance, baseTxCount, ethBalance, ethName] = await Promise.all([
            baseProvider.getBalance(address),
            baseProvider.getTransactionCount(address),
            ethProvider.getBalance(address),
            ethProvider.lookupAddress(address)
        ]);

        // 4. Logic
        const ethVal = parseFloat(ethers.formatEther(ethBalance));
        const isLowEth = ethVal < 0.005;
        const isLowTx = baseTxCount < 5;
        
        let riskScore = "LOW";
        if (isLowEth || isLowTx) riskScore = "MEDIUM";
        if (isLowEth && isLowTx) riskScore = "HIGH";

        return response.status(200).json({
            meta: {
                engine: "AirdropLens Multi-Chain",
                timestamp: new Date().toISOString()
            },
            identity: { address, ens_name: ethName || "No ENS detected" },
            chain_data: {
                ethereum: { balance: ethVal.toFixed(4), status: isLowEth ? "Low Balance" : "Healthy" },
                base: { balance: ethers.formatEther(baseBalance), tx_count: baseTxCount, status: isLowTx ? "Inactive" : "Active" }
            },
            sybil_analysis: { risk_score: riskScore }
        });

    } catch (error) {
        return response.status(500).json({ 
            error: "Blockchain Connection Failed", 
            message: error.message,
            code: error.code 
        });
    }
}