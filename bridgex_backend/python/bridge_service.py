#! /usr/bin/env python3
# bridge_service.py
# Reads JSON from stdin, tries to call MATLAB Engine via matlab.engine,
# otherwise returns a dummy analysis.

import sys
import json
import traceback

def dummy_analysis(data):
    beams = data.get('beams', [])
    num_beams = len(beams)
    import random
    stresses = [random.random()*1e7 for _ in range(num_beams)]
    result = {
        "status": "safe",
        "maxStress": max(stresses) if stresses else 0,
        "stresses": stresses,
        "safetyFactor": 2.5,
        "backend": "dummy"
    }
    return result

def matlab_analysis(data):
    import matlab.engine
    import json as _json
    eng = matlab.engine.start_matlab()
    # add current matlab directory (optional)
    # eng.addpath(eng.pwd(), nargout=0)
    # Convert python dict to JSON string and pass to matlab function analyzeBridge (expects JSON string)
    json_str = _json.dumps(data)
    try:
        res = eng.analyzeBridge(json_str, nargout=1)
        # res expected as JSON string
        if isinstance(res, str):
            return _json.loads(res)
        else:
            # if MATLAB returned struct, try to convert to JSON
            try:
                return json.loads(res)
            except Exception:
                return {"status":"error","message":"Unexpected MATLAB return type","raw":str(res)}
    finally:
        eng.quit()

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
    except Exception:
        print(json.dumps({"error":"invalid input"}))
        sys.exit(1)

    # try matlab engine
    try:
        result = matlab_analysis(data)
    except Exception:
        # fallback to dummy
        # print traceback to stderr for debugging
        traceback.print_exc(file=sys.stderr)
        result = dummy_analysis(data)

    sys.stdout.write(json.dumps(result))

if __name__ == '__main__':
    main()
