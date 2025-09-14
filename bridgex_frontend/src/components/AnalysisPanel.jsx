import React, { useState } from 'react';
import { Zap, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const AnalysisPanel = ({ nodeBodies, beamConstraints, nodeMetaRef, beamMetaRef }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      // Preparar datos del diseño para el análisis
      const designData = {
        nodes: nodeMetaRef.current.map((meta, idx) => {
          const body = nodeBodies[idx];
          return [Math.round(body.position.x), Math.round(body.position.y)];
        }),
        beams: beamMetaRef.current.map(beam => [beam.startIdx, beam.endIdx]),
        // Agregar información adicional que pueda necesitar MATLAB
        supports: nodeMetaRef.current
          .map((meta, idx) => meta.isSupport ? idx : null)
          .filter(idx => idx !== null),
        loads: nodeMetaRef.current
          .map((meta, idx) => ({ 
            node: idx, 
            fx: meta.load?.fx || 0, 
            fy: meta.load?.fy || 0 
          }))
          .filter(l => l.fy !== 0 || l.fx !== 0)
      };

      console.log("Enviando datos para análisis:", designData);

      // Realizar petición al backend
      const response = await fetch('http://localhost:4000/api/bridge/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("Resultado del análisis:", result);
      
      setAnalysisResult(result);

    } catch (error) {
      console.error("Error en análisis:", error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderResults = () => {
    if (!analysisResult) return null;

    const { status, maxStress, stresses, safetyFactor, backend } = analysisResult;

    return (
      <div className="mt-3 space-y-2">
        <div className={`p-2 rounded-lg border ${
          status === 'safe' 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {status === 'safe' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            Estado: {status === 'safe' ? 'SEGURO' : 'PELIGROSO'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Estrés Máximo</div>
            <div className="font-bold">{(maxStress / 1e6).toFixed(2)} MPa</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Factor Seguridad</div>
            <div className="font-bold">{safetyFactor}</div>
          </div>
        </div>

        {stresses && stresses.length > 0 && (
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-600 mb-1">Estrés por Viga (MPa):</div>
            <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
              {stresses.map((stress, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>Viga {idx + 1}:</span>
                  <span className={`font-medium ${
                    stress / 1e6 > 200 ? 'text-red-600' : 
                    stress / 1e6 > 100 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {(stress / 1e6).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Backend: {backend || 'desconocido'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Zap size={20} />
        Análisis Avanzado
      </h3>
      
      <button
        onClick={handleAnalysis}
        disabled={isAnalyzing || !nodeBodies.length || !beamConstraints.length}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader size={16} className="animate-spin" />
            Analizando...
          </>
        ) : (
          <>
            <Zap size={16} />
            Análisis Estructural
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm font-medium">Error:</div>
          <div className="text-red-600 text-xs">{error}</div>
          <div className="text-red-500 text-xs mt-1">
            Verifica que el backend esté ejecutándose en puerto 4000
          </div>
        </div>
      )}

      {renderResults()}

      <p className="text-xs text-gray-500 mt-2">
        Requiere al menos 1 nodo y 1 viga
      </p>
    </div>
  );
};

export default AnalysisPanel;