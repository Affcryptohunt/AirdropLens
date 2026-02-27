import mongoose from 'mongoose';

const officialAirdropSchema = new mongoose.Schema({
  wallet_address: { 
    type: String, 
    required: true, 
    index: true, 
    lowercase: true 
  },
  project_slug: { 
    type: String, 
    required: true, 
    index: true 
  },
  token_amount: { 
    type: String, 
    required: true 
  },
  proof: { 
    type: [String], 
    required: true 
  },
  is_live: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Compound index to ensure a wallet only has one entry per project
officialAirdropSchema.index({ wallet_address: 1, project_slug: 1 }, { unique: true });

export default mongoose.models.OfficialAirdrop || mongoose.model('OfficialAirdrop', officialAirdropSchema);