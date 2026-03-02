import connectToDatabase from './_utils/db.js';
import OfficialAirdrop from './_models/OfficialAirdrop.js';

export default async function handler(req, res) {
  try {
    // 1. Connect to MongoDB
    await connectToDatabase();

    // 2. Get the wallet address the user typed in
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ success: false, error: "No wallet address provided." });
    }

    // 3. Search the vault for that exact wallet (case insensitive)
    const claims = await OfficialAirdrop.find({ 
      wallet_address: { $regex: new RegExp(`^${address}$`, 'i') } 
    });

    // 4. Send the winning data back to the frontend
    res.status(200).json({ success: true, data: claims });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, error: "Server connection failed." });
  }
}