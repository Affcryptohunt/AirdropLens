import { ethers } from 'ethers';

export default async function handler(request, response) {
    console.log("BASE KEY EXISTS:", !!process.env.ALCHEMY_RPC_URL);
    console.log("ETH KEY EXISTS:", !!process.env.ETH_RPC_URL);  // 1. FIX: Get the address directly from the query object
    // This is safer and won't crash on Vercel
    const address = request.query.address;

    if (!address || !ethers.isAddress(address)) {
        return response.status(400).json({ error: "Invalid wallet address" });
    }

    try {
        // 2. Connect to BOTH networks (Base & Ethereum)
        // This forces the code to use the specific network IDs (1 for Eth, 8453 for Base)
const baseProvider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL, 8453, { staticNetwork: true });
const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL, 1, { staticNetwork: true });

        // 3. Fetch data from BOTH chains in parallel
        const [baseBalance, baseTxCount, ethBalance, ethName] = await Promise.all([
            baseProvider.getBalance(address),
            baseProvider.getTransactionCount(address),
            ethProvider.getBalance(address),
            ethProvider.lookupAddress(address)
        ]);

        // 4. Sybil Logic
        const isLowEth = parseFloat(ethers.formatEther(ethBalance)) < 0.005;
        const isLowTx = baseTxCount < 5;
        
        let riskScore = "LOW";
        if (isLowEth || isLowTx) riskScore = "MEDIUM";
        if (isLowEth && isLowTx) riskScore = "HIGH";

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
        // This will send the REAL error message to your browser
        return response.status(500).json({ 
            error: "Engine Error", 
            message: error.message,
            stack: error.code // Tells us if it's a timeout or bad auth
        });
    }
}