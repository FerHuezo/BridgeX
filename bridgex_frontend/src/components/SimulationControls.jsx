import React from 'react';
import { Play, Pause, RotateCcw, Settings, Download } from 'lucide-react';

const SimulationControls = ({ 
  isSimulating, 
  toggleSimulation, 
  resetAll, 
  showSettings, 
  setShowSettings, 
  exportDesign 
}) => {
  return (
    <div className="flex gap-1 md:gap-2">
      {/* Botón principal - Siempre visible */}
      <button
        onClick={toggleSimulation}
        className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
          isSimulating
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {isSimulating ? <Pause size={14} /> : <Play size={14} />}
        <span className="hidden sm:inline">{isSimulating ? "Parar" : "Probar"}</span>
        <span className="sm:hidden">{isSimulating ? "■" : "▶"}</span>
      </button>

      {/* Reset - Siempre visible */}
      <button
        onClick={resetAll}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm md:text-base"
      >
        <RotateCcw size={14} />
        <span className="hidden md:inline">Reset</span>
      </button>

      {/* Configuración - Siempre visible */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base ${
          showSettings 
            ? "bg-purple-600 hover:bg-purple-700 text-white" 
            : "bg-purple-500 hover:bg-purple-600 text-white"
        }`}
      >
        <Settings size={14} />
        <span className="hidden lg:inline">Config</span>
      </button>

      {/* Exportar - Oculto en móvil */}
      <button
        onClick={exportDesign}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors text-sm"
      >
        <Download size={14} />
        <span className="hidden lg:inline">Exportar</span>
      </button>
    </div>
  );
};

export default SimulationControls;