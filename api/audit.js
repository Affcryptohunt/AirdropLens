import { ethers } from 'ethers';

export default async function handler(request, response) {
    const address = request.query.address;
    const ORIGINAL_KEY = "nsCngDhoNy8FfxPUKK7SJ"; // Your working Alchemy key

    try {
        const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ORIGINAL_KEY}`);
        
        // Fail-safe fetch
        const [balance, tx] = await Promise.all([
            provider.getBalance(address || "0x0000000000000000000000000000000000000000").catch(() => 0n),
            provider.getTransactionCount(address || "0x0000000000000000000000000000000000000000").catch(() => 0)
        ]);

        // Returns the data structure your original frontend expects
        return response.status(200).json({
            ethereum_balance: ethers.formatEther(balance),
            base_balance: "0.00",
            tx_count: tx,
            status: "Online"
        });
    } catch (e) {
        // Emergency 200 OK response to prevent frontend black screens
        return response.status(200).json({ ethereum_balance: "0.00", tx_count: 0, status: "Recovery" });
    }
}