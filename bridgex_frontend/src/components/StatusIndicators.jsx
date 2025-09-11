import React from 'react';

const StatusIndicators = ({ gameStatus, bridgeIntegrity, isSimulating, vehicleProgress }) => {
  const getStatusText = () => {
    switch (gameStatus) {
      case "building": return "Construyendo";
      case "testing": return "Probando";
      case "success": return "¡Éxito!";
      default: return "Falló";
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
      <div className="flex justify-between items-center text-sm">
        <div className="flex gap-4">
          <span>Estado: <strong>{getStatusText()}</strong></span>
          <span>Integridad: <strong>{bridgeIntegrity}%</strong></span>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-2">
            <span>Progreso:</span>
            <div className="w-32 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${vehicleProgress}%` }}
              />
            </div>
            <span><strong>{Math.round(vehicleProgress)}%</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicators;