import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PY_SCRIPT = path.join(__dirname, '..', 'python', 'bridge_service.py');

export const runPythonBridgeAnalysis = (bridgeData) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python', [PY_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });

    py.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Failed to parse Python output: ' + err.message + '\n' + stdout));
      }
    });

    // send JSON to python stdin
    py.stdin.write(JSON.stringify(bridgeData));
    py.stdin.end();
  });
};
