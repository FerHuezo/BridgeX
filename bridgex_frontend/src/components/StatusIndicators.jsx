import React from 'react';

const StatusIndicators = ({ gameStatus, bridgeIntegrity, isSimulating, vehicleProgress, vehicleAcceleration = 100 }) => {
  const getStatusText = () => {
    switch (gameStatus) {
      case "building": return "Construyendo";
      case "testing": 
        if (vehicleAcceleration < 100) return "Acelerando";
        return "Probando";
      case "success": return "¡Éxito!";
      default: return "Falló";
    }
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case "building": return "from-blue-500 to-purple-600";
      case "testing": 
        if (vehicleAcceleration < 100) return "from-yellow-400 to-orange-500";
        return "from-yellow-500 to-orange-600";
      case "success": return "from-green-500 to-emerald-600";
      default: return "from-red-500 to-pink-600";
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getStatusColor()} text-white p-2 md:p-3`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs md:text-sm">
        {/* Información básica */}
        <div className="flex flex-wrap gap-2 md:gap-4">
          <span>
            Estado: <strong>{getStatusText()}</strong>
          </span>
          <span>
            Integridad: <strong>{bridgeIntegrity}%</strong>
          </span>
          {isSimulating && (
            <span className="sm:hidden">
              Progreso: <strong>{Math.round(vehicleProgress)}%</strong>
            </span>
          )}
          {/* Mostrar aceleración solo si está acelerando */}
          {isSimulating && vehicleAcceleration < 100 && (
            <span className="text-yellow-100">
              Acelera: <strong>{Math.round(vehicleAcceleration)}%</strong>
            </span>
          )}
        </div>

        {/* Barra de progreso - Solo en simulación */}
        {isSimulating && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="hidden sm:inline text-xs">Progreso:</span>
            <div className="flex-1 sm:w-24 md:w-32 bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${vehicleProgress}%` }}
              />
            </div>
            <span className="hidden sm:inline text-xs font-medium min-w-[3rem]">
              {Math.round(vehicleProgress)}%
            </span>
          </div>
        )}
      </div>

      {/* Indicador de integridad visual */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs opacity-90">Integridad:</span>
        <div className="flex-1 bg-white/20 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              bridgeIntegrity > 70 ? 'bg-green-300' :
              bridgeIntegrity > 40 ? 'bg-yellow-300' : 'bg-red-300'
            }`}
            style={{ width: `${bridgeIntegrity}%` }}
          />
        </div>
        <span className="text-xs font-medium min-w-[2.5rem]">{bridgeIntegrity}%</span>
      </div>

      {/* Barra de aceleración adicional cuando está acelerando */}
      {isSimulating && vehicleAcceleration < 100 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs opacity-90">Aceleración:</span>
          <div className="flex-1 bg-white/20 rounded-full h-1">
            <div 
              className="bg-yellow-300 h-1 rounded-full transition-all duration-300"
              style={{ width: `${vehicleAcceleration}%` }}
            />
          </div>
          <span className="text-xs font-medium min-w-[2.5rem]">{Math.round(vehicleAcceleration)}%</span>
        </div>
      )}
    </div>
  );
};

export default StatusIndicators;