import mongoose from 'mongoose';

const monitoredTargetSchema = new mongoose.Schema({
  project_slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  github_org: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['searching', 'found', 'paused'], 
    default: 'searching' 
  },
  last_checked: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Check if the model exists before compiling it to prevent Vercel overwrite errors
export default mongoose.models.MonitoredTarget || mongoose.model('MonitoredTarget', monitoredTargetSchema);