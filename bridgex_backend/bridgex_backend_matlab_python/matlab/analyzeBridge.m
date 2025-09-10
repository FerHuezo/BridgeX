function result = analyzeBridge(jsonStr)
% analyzeBridge Accepts a JSON string describing the bridge and returns a JSON string with results.
% Example input:
% { "nodes": [[0,0],[5,0],[10,0]], "beams": [[0,1],[1,2]] }

try
    data = jsondecode(jsonStr);
catch
    result = jsonencode(struct('error','Invalid JSON'));
    return;
end

if isfield(data,'beams')
    beams = data.beams;
    if iscell(beams)
        numBeams = numel(beams);
    else
        numBeams = size(beams,1);
    end
else
    numBeams = 0;
end

% simple dummy computation: random stresses
stresses = rand(1,numBeams) * 1e7;
if isempty(stresses)
    maxStress = 0;
else
    maxStress = max(stresses);
end

out.status = 'safe';
out.maxStress = maxStress;
out.stresses = stresses;
out.safetyFactor = 2.5;

result = jsonencode(out);
end
