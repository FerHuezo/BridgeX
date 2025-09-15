import React from 'react';
import { Trophy, AlertTriangle, Target } from 'lucide-react';

const ResultsPanel = ({ gameStatus, vehicleProgress, bridgeIntegrity }) => {
  if (gameStatus === "building") return null;

  const getStatusIcon = () => {
    switch (gameStatus) {
      case "success": return <Trophy size={20} className="text-green-600" />;
      case "failed": return <AlertTriangle size={20} className="text-red-600" />;
      default: return <Target size={20} className="text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case "success": return "border-green-200 bg-green-50";
      case "failed": return "border-red-200 bg-red-50";
      default: return "border-blue-200 bg-blue-50";
    }
  };

  const getPerformanceRating = () => {
    const finalScore = (vehicleProgress * 0.6) + (bridgeIntegrity * 0.4);
    if (finalScore >= 90) return { rating: "Excelente", color: "text-green-600", stars: "⭐⭐⭐" };
    if (finalScore >= 70) return { rating: "Bueno", color: "text-blue-600", stars: "⭐⭐" };
    if (finalScore >= 50) return { rating: "Regular", color: "text-yellow-600", stars: "⭐" };
    return { rating: "Pobre", color: "text-red-600", stars: "" };
  };

  const performance = getPerformanceRating();

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 md:mb-3 flex items-center gap-2">
        {getStatusIcon()}
        <span>Resultados</span>
      </h3>
      
      <div className="space-y-2 md:space-y-3 text-sm">
        
        {/* Estado principal */}
        <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
          <div className="text-center">
            <div className="font-bold text-base md:text-lg">
              {gameStatus === "success" ? "¡Éxito!" : 
               gameStatus === "failed" ? "Puente Colapsado" : "Prueba en Curso"}
            </div>
            <div className="text-xs md:text-sm mt-1 opacity-90">
              {gameStatus === "success" 
                ? "El vehículo cruzó exitosamente"
                : gameStatus === "failed"
                ? "El puente no soportó el peso"
                : "Simulación en progreso"}
            </div>
          </div>
        </div>
        
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
          <div className="bg-gray-50 p-2 md:p-3 rounded text-center">
            <div className="text-gray-600 text-xs">Progreso Final</div>
            <div className="font-bold text-lg md:text-xl text-blue-600">
              {Math.round(vehicleProgress)}%
            </div>
          </div>
          <div className="bg-gray-50 p-2 md:p-3 rounded text-center">
            <div className="text-gray-600 text-xs">Integridad Final</div>
            <div className={`font-bold text-lg md:text-xl ${
              bridgeIntegrity > 70 ? 'text-green-600' :
              bridgeIntegrity > 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {bridgeIntegrity}%
            </div>
          </div>
        </div>

        {/* Calificación de rendimiento */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-2 md:p-3 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Calificación General</div>
            <div className={`font-bold text-base md:text-lg ${performance.color}`}>
              {performance.rating} {performance.stars}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Basado en progreso e integridad
            </div>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progreso del Vehículo</span>
              <span>{Math.round(vehicleProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${vehicleProgress}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Integridad del Puente</span>
              <span>{bridgeIntegrity}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  bridgeIntegrity > 70 ? 'bg-green-500' :
                  bridgeIntegrity > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${bridgeIntegrity}%` }}
              />
            </div>
          </div>
        </div>

        {/* Consejos según el resultado */}
        {gameStatus === "failed" && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg">
            <div className="text-xs text-yellow-800">
              <strong>💡 Consejos:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {vehicleProgress < 50 && (
                  <li>Refuerza la estructura central</li>
                )}
                {bridgeIntegrity < 50 && (
                  <li>Usa más soportes y triángulos</li>
                )}
                <li>Reduce el peso del vehículo si es necesario</li>
              </ul>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales para éxito */}
        {gameStatus === "success" && (
          <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
            <div className="text-xs text-green-800 text-center">
              <div className="font-medium">🎉 ¡Felicitaciones!</div>
              <div className="mt-1">
                Tu puente resistió exitosamente el paso del vehículo
              </div>
              {bridgeIntegrity > 90 && (
                <div className="mt-1 font-medium">
                  ⚡ Diseño casi perfecto - Excelente ingeniería!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;