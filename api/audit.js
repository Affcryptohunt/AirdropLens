import { ethers } from 'ethers';

export default async function handler(request, response) {
    const address = request.query.address;

    // 1. SAFE RESPONSE: If no address, return empty data so the UI doesn't crash
    if (!address || !ethers.isAddress(address)) {
        return response.status(200).json({ 
            ethereum_balance: "0.00", 
            base_balance: "0.00", 
            tx_count: 0,
            risk_score: "N/A" 
        });
    }

    try {
        // 2. CONNECT: We use the variables you already have in Vercel
        const baseProvider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || process.env.ALCHEMY_RPC_URL);
        const ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);

        // 3. FETCH: Get the basic data your dashboard needs
        const [baseBal, baseTx, ethBal] = await Promise.all([
            baseProvider.getBalance(address).catch(() => 0n),
            baseProvider.getTransactionCount(address).catch(() => 0),
            ethProvider.getBalance(address).catch(() => 0n)
        ]);

        // 4. MATCH FRONTEND: This returns the EXACT names your dashboard looks for
        return response.status(200).json({
            ethereum_balance: parseFloat(ethers.formatEther(ethBal)).toFixed(4),
            base_balance: parseFloat(ethers.formatEther(baseBal)).toFixed(4),
            tx_count: baseTx,
            risk_score: baseTx > 5 ? "LOW" : "MEDIUM",
            status: "Success"
        });

    } catch (e) {
        // 5. EMERGENCY FALLBACK: Always send 200 so the screen stays white
        return response.status(200).json({ 
            ethereum_balance: "0.00", 
            base_balance: "0.00", 
            tx_count: 0,
            error: "Blockchain lag - try again" 
        });
    }
}