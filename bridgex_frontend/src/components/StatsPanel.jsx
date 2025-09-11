import React from 'react';
import { Info } from 'lucide-react';

const StatsPanel = ({ gameStats }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Info size={20} />
        Estadísticas
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Nodos:</span>
          <span className="font-medium">{gameStats.nodes}</span>
        </div>
        <div className="flex justify-between">
          <span>Vigas:</span>
          <span className="font-medium">{gameStats.beams}</span>
        </div>
        <div className="flex justify-between">
          <span>Costo:</span>
          <span className="font-medium text-green-600">${gameStats.cost}</span>
        </div>
        <div className="flex justify-between">
          <span>Estrés Prom:</span>
          <span className={`font-medium ${
            gameStats.stress > 70 ? "text-red-600" :
            gameStats.stress > 40 ? "text-yellow-600" :
            "text-green-600"
          }`}>
            {gameStats.stress}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;