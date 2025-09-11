import React from 'react';

const SettingsPanel = ({ settings, setSettings, showSettings }) => {
  if (!showSettings) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Configuración</h3>
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">Gravedad</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={settings.gravity}
            onChange={(e) => setSettings(prev => ({...prev, gravity: parseFloat(e.target.value)}))}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{settings.gravity}</span>
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Tipo de Vehículo</label>
          <select
            value={settings.vehicleType || 'car'}
            onChange={(e) => setSettings(prev => ({...prev, vehicleType: e.target.value}))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="car">🚗 Carro Ligero</option>
            <option value="truck">🚛 Camión Pesado</option>
            <option value="bus">🚌 Bus</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Velocidad Vehículo</label>
          <input
            type="range"
            min="0.0002"
            max="0.002"
            step="0.0001"
            value={settings.vehicleSpeed}
            onChange={(e) => setSettings(prev => ({...prev, vehicleSpeed: parseFloat(e.target.value)}))}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{(settings.vehicleSpeed * 1000).toFixed(1)}x</span>
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Umbral de Estrés</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings.stressThreshold}
            onChange={(e) => setSettings(prev => ({...prev, stressThreshold: parseFloat(e.target.value)}))}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{(settings.stressThreshold * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-gray-600">Mostrar Estrés</label>
          <input
            type="checkbox"
            checked={settings.showStress}
            onChange={(e) => setSettings(prev => ({...prev, showStress: e.target.checked}))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-gray-600">Auto-Romper</label>
          <input
            type="checkbox"
            checked={settings.autoBreak}
            onChange={(e) => setSettings(prev => ({...prev, autoBreak: e.target.checked}))}
            className="rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;