import connectToDatabase from './_utils/db.js';
import OfficialAirdrop from './_models/OfficialAirdrop.js';

export default async function handler(req, res) {
  try {
    console.log("Connecting to Cloud DB...");
    await connectToDatabase();

    console.log("Fetching real airdrop data...");
    const response = await fetch('https://raw.githubusercontent.com/perspectivefi/airdrop-addresses/main/Airdrop.json');
    const wallets = await response.json();

    const injectionData = wallets.map(entry => {
      const address = typeof entry === 'string' ? entry : (entry.address || entry.wallet || Object.values(entry)[0]);
      return {
        wallet_address: address.toLowerCase(),
        project_slug: "Perspective.fi ($POV)",
        token_amount: String(entry.amount || "1500"),
        is_claimed: false
      };
    });

    // INJECT YOUR OWN WALLET FOR THE DEMO VIDEO
    injectionData.push({
      wallet_address: "YOUR_METAMASK_ADDRESS_HERE".toLowerCase(),
      project_slug: "Perspective.fi ($POV)",
      token_amount: "8500",
      is_claimed: false
    });

    await OfficialAirdrop.insertMany(injectionData);
    
    res.status(200).json({ success: true, message: `SUCCESS! ${injectionData.length} wallets locked into the vault!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}