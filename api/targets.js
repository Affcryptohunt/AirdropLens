import dbConnect from './_utils/db.js';
import MonitoredTarget from './_models/MonitoredTarget.js';

export default async function handler(req, res) {
  // 1. Connect to the database first
  await dbConnect();

  // 2. Handle GET Request: Fetch all targets
  if (req.method === 'GET') {
    try {
      const targets = await MonitoredTarget.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: targets });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch targets' });
    }
  }

  // 3. Handle POST Request: Add a new target to hunt
  if (req.method === 'POST') {
    try {
      const { project_slug, github_org } = req.body;

      if (!project_slug || !github_org) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const newTarget = await MonitoredTarget.create({
        project_slug: project_slug.toLowerCase(),
        github_org: github_org.toLowerCase(),
        status: 'searching'
      });

      return res.status(201).json({ success: true, data: newTarget });
    } catch (error) {
      // Handle duplicate entries gracefully
      if (error.code === 11000) {
        return res.status(400).json({ success: false, error: 'This project is already being monitored.' });
      }
      return res.status(500).json({ success: false, error: 'Failed to add target' });
    }
  }

  // 4. Block any other type of request
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}