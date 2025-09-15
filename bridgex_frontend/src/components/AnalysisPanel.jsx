import React, { useState } from 'react';
import { Zap, Loader, AlertCircle, CheckCircle, TrendingUp, Activity, Shield, AlertTriangle } from 'lucide-react';

const AnalysisPanel = ({ nodeBodies, beamConstraints, nodeMetaRef, beamMetaRef }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const handleAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      // Preparar datos mejorados del diseño para el análisis
      const designData = {
        // Nodos con información completa
        nodes: nodeMetaRef.current.map((meta, idx) => {
          const body = nodeBodies[idx];
          return [
            Math.round(body.position.x), 
            Math.round(body.position.y)
          ];
        }),
        
        // Vigas con índices correctos
        beams: beamMetaRef.current.map(beam => [beam.startIdx, beam.endIdx]),
        
        // Información adicional para MATLAB
        supports: nodeMetaRef.current
          .map((meta, idx) => meta.isSupport ? idx : null)
          .filter(idx => idx !== null),
          
        loads: nodeMetaRef.current
          .map((meta, idx) => ({ 
            node: idx, 
            fx: meta.load?.fx || 0, 
            fy: meta.load?.fy || 0 
          }))
          .filter(l => l.fy !== 0 || l.fx !== 0),

        // Metadatos del diseño
        metadata: {
          timestamp: new Date().toISOString(),
          nodeCount: nodeBodies.length,
          beamCount: beamConstraints.length,
          canvasWidth: 1400,
          canvasHeight: 700
        }
      };

      console.log("🔬 Enviando datos para análisis:", designData);

      // Realizar petición al backend con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch('http://localhost:4000/api/bridge/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(designData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Resultado del análisis:", result);
      
      // Enriquecer resultado con análisis local
      const enrichedResult = {
        ...result,
        timestamp: new Date().toISOString(),
        designStats: {
          efficiency: calculateEfficiency(result),
          riskLevel: calculateRiskLevel(result),
          recommendations: generateRecommendations(result, designData)
        }
      };

      setAnalysisResult(enrichedResult);
      
      // Agregar al historial
      setAnalysisHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        result: enrichedResult,
        nodeCount: designData.metadata.nodeCount,
        beamCount: designData.metadata.beamCount
      }, ...prev.slice(0, 4)]); // Mantener últimos 5 análisis

    } catch (error) {
      console.error("❌ Error en análisis:", error);
      if (error.name === 'AbortError') {
        setError('Timeout: El análisis tardó demasiado. Verifica la conexión con el backend.');
      } else if (error.message.includes('fetch')) {
        setError('Error de conexión: Verifica que el backend esté ejecutándose en puerto 4000');
      } else {
        setError(error.message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Funciones auxiliares para análisis avanzado
  const calculateEfficiency = (result) => {
    if (!result.stresses || result.stresses.length === 0) return 0;
    
    const avgStress = result.stresses.reduce((a, b) => a + b, 0) / result.stresses.length;
    const maxAllowedStress = result.analysis_info?.yield_strength || 250e6;
    const utilization = avgStress / maxAllowedStress;
    
    // Eficiencia: balance entre utilización y seguridad
    if (utilization < 0.3) return Math.round(utilization * 100 * 0.5); // Subutilizado
    if (utilization > 0.8) return Math.round((1 - utilization) * 100); // Sobreutilizado
    return Math.round(utilization * 100); // Óptimo
  };

  const calculateRiskLevel = (result) => {
    const safetyFactor = result.safetyFactor || Infinity;
    
    if (safetyFactor > 3) return 'Muy Bajo';
    if (safetyFactor > 2) return 'Bajo';
    if (safetyFactor > 1.5) return 'Medio';
    if (safetyFactor > 1) return 'Alto';
    return 'Crítico';
  };

  const generateRecommendations = (result, designData) => {
    const recommendations = [];
    
    if (result.safetyFactor < 1.5) {
      recommendations.push("⚠️ Agregar más vigas de soporte");
      recommendations.push("🔧 Considerar nodos de soporte adicionales");
    }
    
    if (result.stresses && result.stresses.length > 0) {
      const maxStress = Math.max(...result.stresses);
      const criticalBeams = result.stresses.filter(s => s > maxStress * 0.8).length;
      
      if (criticalBeams > result.stresses.length * 0.3) {
        recommendations.push("📐 Redistribuir cargas más uniformemente");
      }
    }
    
    if (designData.beams.length < designData.nodes.length - 1) {
      recommendations.push("🔗 El puente puede estar sub-conectado");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✅ Diseño equilibrado y seguro");
    }
    
    return recommendations;
  };

  const renderDetailedResults = () => {
    if (!analysisResult) return null;

    const { 
      status, 
      maxStress, 
      stresses, 
      safetyFactor, 
      backend,
      analysis_info,
      designStats 
    } = analysisResult;

    return (
      <div className="mt-4 space-y-3">
        {/* Estado Principal */}
        <div className={`p-3 rounded-lg border ${
          status === 'safe' 
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center gap-2 font-bold text-base ${
            status === 'safe' ? 'text-green-800' : 'text-red-800'
          }`}>
            {status === 'safe' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {status === 'safe' ? 'PUENTE SEGURO' : 'PUENTE EN RIESGO'}
          </div>
          <p className={`text-sm mt-1 ${
            status === 'safe' ? 'text-green-700' : 'text-red-700'
          }`}>
            Factor de seguridad: <strong>{safetyFactor}</strong> 
            {status === 'safe' ? ' (Óptimo)' : ' (Insuficiente)'}
          </p>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <TrendingUp size={16} />
              <span>Estrés Máximo</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {(maxStress / 1e6).toFixed(1)} <span className="text-sm">MPa</span>
            </div>
            <div className="text-xs text-blue-600">
              Límite: {((analysis_info?.yield_strength || 250e6) / 1e6).toFixed(0)} MPa
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-purple-800 font-medium">
              <Activity size={16} />
              <span>Eficiencia</span>
            </div>
            <div className="text-xl font-bold text-purple-900">
              {designStats?.efficiency || 0}%
            </div>
            <div className="text-xs text-purple-600">
              Utilización del material
            </div>
          </div>
        </div>

        {/* Análisis de Riesgo */}
        <div className={`p-3 rounded-lg border ${
          designStats?.riskLevel === 'Muy Bajo' || designStats?.riskLevel === 'Bajo'
            ? 'bg-green-50 border-green-200'
            : designStats?.riskLevel === 'Medio'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <Shield size={16} />
            <span>Nivel de Riesgo: {designStats?.riskLevel || 'Desconocido'}</span>
          </div>
        </div>

        {/* Distribución de Estrés por Viga */}
        {stresses && stresses.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Activity size={16} />
              Estrés por Viga
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {stresses.map((stress, idx) => {
                const stressMPa = stress / 1e6;
                const isHigh = stressMPa > 200;
                const isMedium = stressMPa > 150;
                
                return (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Viga {idx + 1}:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        isHigh ? 'text-red-600' : 
                        isMedium ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {stressMPa.toFixed(1)} MPa
                      </span>
                      {isHigh && <AlertTriangle size={12} className="text-red-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        {designStats?.recommendations && designStats.recommendations.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-2">💡 Recomendaciones:</h4>
            <div className="space-y-1 text-xs text-indigo-700">
              {designStats.recommendations.map((rec, idx) => (
                <div key={idx}>• {rec}</div>
              ))}
            </div>
          </div>
        )}

        {/* Información Técnica */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <div className="flex justify-between">
            <span>Backend: {backend || 'desconocido'}</span>
            <span>Nodos: {analysis_info?.nodes_count} | Vigas: {analysis_info?.beams_count}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisHistory = () => {
    if (analysisHistory.length === 0) return null;

    return (
      <div className="mt-4 border-t pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Historial de Análisis</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {analysisHistory.map((analysis, idx) => (
            <div key={analysis.id} className="text-xs bg-gray-50 p-2 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {analysis.result.status === 'safe' ? '✅' : '❌'} 
                  Factor: {analysis.result.safetyFactor}
                </span>
                <span className="text-gray-500">
                  {new Date(analysis.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-600">
                {analysis.nodeCount}N • {analysis.beamCount}V • 
                Máx: {(analysis.result.maxStress / 1e6).toFixed(1)}MPa
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Zap size={20} className="text-purple-600" />
        Análisis Estructural Avanzado
      </h3>
      
      {/* Botón de Análisis */}
      <button
        onClick={handleAnalysis}
        disabled={isAnalyzing || !nodeBodies.length || !beamConstraints.length}
        className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
          isAnalyzing 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-[1.02] shadow-lg'
        } text-white`}
      >
        {isAnalyzing ? (
          <>
            <Loader size={18} className="animate-spin" />
            Analizando con MATLAB...
          </>
        ) : (
          <>
            <Zap size={18} />
            Ejecutar Análisis Completo
          </>
        )}
      </button>

      {/* Indicador de Estado */}
      {isAnalyzing && (
        <div className="mt-2 text-center text-xs text-purple-600">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            Procesando con motor MATLAB/Python...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 font-medium">
            <AlertCircle size={16} />
            Error de Análisis
          </div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
          <div className="text-red-600 text-xs mt-2 space-y-1">
            <div>• Verifica que el backend esté corriendo en puerto 4000</div>
            <div>• Comprueba la instalación de MATLAB Engine</div>
            <div>• Revisa la configuración de CORS</div>
          </div>
        </div>
      )}

      {/* Resultados Detallados */}
      {renderDetailedResults()}

      {/* Historial */}
      {renderAnalysisHistory()}

      {/* Información del Sistema */}
      <div className="mt-3 text-xs text-gray-500 text-center border-t pt-2">
        <div className="mb-1">
          Requiere: {nodeBodies.length} nodos • {beamConstraints.length} vigas mínimo
        </div>
        <div>
          🔬 Análisis Estructural • 🏗️ Simulación FEM • ⚡ MATLAB Engine
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;