import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 1. Define the Schema (Matches your database)
const airdropSchema = new mongoose.Schema({
  wallet_address: { type: String, required: true },
  project_slug: { type: String, required: true },
  token_amount: { type: String, required: true },
  is_claimed: { type: Boolean, default: false }
});

const OfficialAirdrop = mongoose.models.OfficialAirdrop || mongoose.model('OfficialAirdrop', airdropSchema, 'officialairdrops');

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB Vault...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    console.log("Downloading real airdrop data from GitHub...");
    // 2. Fetch the raw JSON directly from the URL you found
    const response = await fetch('https://raw.githubusercontent.com/perspectivefi/airdrop-addresses/main/Airdrop.json');
    const wallets = await response.json();

    console.log(`Found ${wallets.length} wallets! Preparing for injection...`);

    // 3. Format the data for MongoDB
    const injectionData = wallets.map(entry => {
      // Handles different JSON structures defensively
      const address = typeof entry === 'string' ? entry : (entry.address || entry.wallet || Object.values(entry)[0]);
      const amount = entry.amount || "1500"; 

      return {
        wallet_address: address.toLowerCase(),
        project_slug: "Perspective.fi ($POV)",
        token_amount: String(amount),
        is_claimed: false
      };
    });

    // 4. INJECT YOUR OWN WALLET FOR THE DEMO FLEX
    injectionData.push({
      wallet_address: "YOUR_METAMASK_ADDRESS_HERE".toLowerCase(),
      project_slug: "Perspective.fi ($POV)",
      token_amount: "8500", // Give yourself a massive bag for the screenshot
      is_claimed: false
    });

    // 5. Massive Bulk Insert
    await OfficialAirdrop.insertMany(injectionData);
    
    console.log(`SUCCESS: ${injectionData.length} winning wallets locked into the vault!`);
    process.exit();
  } catch (error) {
    console.error("Injection Failed:", error);
    process.exit(1);
  }
}

seedDatabase();