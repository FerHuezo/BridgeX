import React from 'react';
import { Zap } from 'lucide-react';

const AnalysisPanel = ({ nodeBodies, beamConstraints, nodeMetaRef, beamMetaRef }) => {
  const handleAnalysis = async () => {
    try {
      const designData = {
        nodes: nodeMetaRef.current.map((meta, idx) => {
          const body = nodeBodies[idx];
          return [Math.round(body.position.x), Math.round(body.position.y)];
        }),
        beams: beamMetaRef.current.map(beam => ({
          start: beam.start,
          end: beam.end,
          area: beam.area,
          yield: beam.yield
        })),
        loads: nodeMetaRef.current
          .map((meta, idx) => ({ 
            node: meta.id, 
            fx: meta.load?.fx || 0, 
            fy: meta.load?.fy || 0 
          }))
          .filter(l => l.fy !== 0)
      };

      console.log("Datos para análisis:", designData);
      alert("Función de análisis preparada. Conecta con tu backend en /api/bridge/analyze");
    } catch (error) {
      console.error("Error en análisis:", error);
      alert("Error al analizar: " + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Zap size={20} />
        Análisis Avanzado
      </h3>
      <button
        onClick={handleAnalysis}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        disabled={!nodeBodies.length || !beamConstraints.length}
      >
        <Zap size={16} />
        Análisis Estructural
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Requiere al menos 1 nodo y 1 viga
      </p>
    </div>
  );
};

export default AnalysisPanel;