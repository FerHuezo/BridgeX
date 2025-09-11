import React from 'react';

const ResultsPanel = ({ gameStatus, vehicleProgress, bridgeIntegrity }) => {
  if (gameStatus === "building") return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Resultados</h3>
      <div className="space-y-2 text-sm">
        <div className={`p-3 rounded-lg ${
          gameStatus === "success" 
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          <div className="font-medium">
            {gameStatus === "success" ? "¡Éxito!" : "Puente Colapsado"}
          </div>
          <div className="text-xs mt-1">
            {gameStatus === "success" 
              ? "El vehículo cruzó exitosamente"
              : "El puente no soportó el peso del vehículo"}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Progreso Final</div>
            <div className="font-bold">{Math.round(vehicleProgress)}%</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Integridad Final</div>
            <div className="font-bold">{bridgeIntegrity}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;