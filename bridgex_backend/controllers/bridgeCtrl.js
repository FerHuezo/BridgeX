import { runPythonBridgeAnalysis } from '../services/pythonService.js';

export const analyzeBridge = async (req, res) => {
  try {
    const bridgeData = req.body;
    const result = await runPythonBridgeAnalysis(bridgeData);
    res.status(200).json(result);
  } catch (err) {
    console.error('Controller error:', err);
    res.status(500).json({ error: 'Error processing analysis', details: String(err) });
  }
};
