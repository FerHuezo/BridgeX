import React from 'react';
import { Info } from 'lucide-react';

const StatsPanel = ({ gameStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 md:mb-3 flex items-center gap-2">
        <Info size={16} className="md:hidden" />
        <Info size={20} className="hidden md:block" />
        <span>Estadísticas</span>
      </h3>
      
      {/* Layout en grid para móvil, lista para desktop */}
      <div className="grid grid-cols-2 gap-2 md:space-y-2 md:block text-xs md:text-sm">
        <div className="flex justify-between md:justify-between">
          <span className="text-gray-600">Nodos:</span>
          <span className="font-medium">{gameStats.nodes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Vigas:</span>
          <span className="font-medium">{gameStats.beams}</span>
        </div>
        <div className="flex justify-between col-span-2 md:col-span-1">
          <span className="text-gray-600">Costo:</span>
          <span className="font-medium text-green-600">${gameStats.cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between col-span-2 md:col-span-1">
          <span className="text-gray-600">Estrés Prom:</span>
          <span className={`font-medium ${
            gameStats.stress > 70 ? "text-red-600" :
            gameStats.stress > 40 ? "text-yellow-600" :
            "text-green-600"
          }`}>
            {gameStats.stress}%
          </span>
        </div>
      </div>

      {/* Indicadores visuales para móvil */}
      <div className="md:hidden mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="text-xs text-gray-500">Elementos</div>
          <div className="font-bold text-blue-600">{gameStats.nodes + gameStats.beams}</div>
        </div>
        <div className="bg-gray-50 p-2 rounded text-center">
          <div className="text-xs text-gray-500">Eficiencia</div>
          <div className={`font-bold ${
            gameStats.cost < 1000 ? 'text-green-600' :
            gameStats.cost < 2000 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {gameStats.cost < 1000 ? 'Alta' : gameStats.cost < 2000 ? 'Media' : 'Baja'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;