# BridgeX Backend (Node.js + Python bridge to MATLAB)

## What is included
- Node.js Express server exposing POST /api/bridge/analyze
- Python service `python/bridge_service.py` which:
  - tries to use `matlab.engine` (if MATLAB + MATLAB Engine for Python are installed)
  - otherwise falls back to a dummy analysis
- MATLAB function `matlab/analyzeBridge.m` which accepts a JSON string and returns a JSON string

## How it works
1. Start Node server: `npm install` then `npm start`
2. POST JSON to `http://localhost:4000/api/bridge/analyze`
3. Server spawns the Python script and sends the JSON via stdin
4. Python script tries to call MATLAB (via matlab.engine) and calls `analyzeBridge(jsonStr)`
   - If MATLAB is not available, a dummy result is returned
5. Node returns the JSON result to the client

## Example request (Postman)
POST http://localhost:4000/api/bridge/analyze
Content-Type: application/json

Body:
{
  "nodes": [[0,0], [5,0], [10,0]],
  "beams": [[0,1], [1,2]],
  "loads": [[1, -1000]]
}

## Notes and troubleshooting
- To enable full MATLAB calculations, ensure:
  - MATLAB installed and licensed on the machine
  - MATLAB Engine API for Python installed (usually via `cd "matlabroot/extern/engines/python"; python -m pip install .`)
- If you want to use the Node.js MATLAB Engine instead, install the "MATLAB Engine API for Node.js" add-on and follow MathWorks docs.
- The Python script prints MATLAB tracebacks to stderr; check Node console output if Python falls back to dummy.

## File list
- app.js
- routes/bridgeRoutes.js
- controllers/bridgeCtrl.js
- services/pythonService.js
- python/bridge_service.py
- matlab/analyzeBridge.m

