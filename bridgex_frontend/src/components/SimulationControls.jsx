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
    <div className="flex gap-2">
      <button
        onClick={toggleSimulation}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isSimulating
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {isSimulating ? <Pause size={16} /> : <Play size={16} />}
        {isSimulating ? "Parar" : "Probar"}
      </button>

      <button
        onClick={resetAll}
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        <RotateCcw size={16} />
        Reset
      </button>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
      >
        <Settings size={16} />
        Config
      </button>

      <button
        onClick={exportDesign}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
      >
        <Download size={16} />
        Exportar
      </button>
    </div>
  );
};

export default SimulationControls;