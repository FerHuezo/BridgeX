import React from 'react';

// Configuraciones actualizadas de vehículos (sincronizadas con App.jsx)
const VEHICLE_CONFIGS = {
  car: {
    name: "🚗 Carro Ligero",
    description: "Vehículo estándar, liviano y rápido",
    weight: 1200,
    speed: 0.0008
  },
  truck: {
    name: "🚛 Camión Pesado", 
    description: "Vehículo pesado de carga, lento pero resistente",
    weight: 8000,
    speed: 0.0005
  },
  bus: {
    name: "🚌 Autobús",
    description: "Vehículo largo para pasajeros", 
    weight: 5500,
    speed: 0.0006
  },
  motorcycle: {
    name: "🏍️ Motocicleta",
    description: "Vehículo muy ligero y ágil",
    weight: 250,
    speed: 0.0011
  },
  tank: {
    name: "🚜 Tanque Militar",
    description: "Vehículo blindado super pesado",
    weight: 15000,
    speed: 0.0004
  },
  formula1: {
    name: "🏎️ Fórmula 1", 
    description: "Carro de carreras ultra rápido",
    weight: 800,
    speed: 0.0014
  },
  monster_truck: {
    name: "🚙 Monster Truck",
    description: "Camioneta con ruedas gigantes",
    weight: 4500,
    speed: 0.0007
  }
};

const SettingsPanel = ({ settings, setSettings, showSettings }) => {
  if (!showSettings) return null;

  const currentVehicle = VEHICLE_CONFIGS[settings.vehicleType || 'car'];

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 md:mb-3">
        Configuración
      </h3>
      
      <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
        
        {/* Selector de Vehículo */}
        <div>
          <label className="block text-gray-600 mb-1 md:mb-2 font-medium text-xs md:text-sm">
            Tipo de Vehículo
          </label>
          <select
            value={settings.vehicleType || 'car'}
            onChange={(e) => setSettings(prev => ({
              ...prev, 
              vehicleType: e.target.value,
              vehicleSpeed: VEHICLE_CONFIGS[e.target.value].speed,
              vehicleWeight: VEHICLE_CONFIGS[e.target.value].weight
            }))}
            className="w-full p-1 md:p-2 border border-gray-300 rounded-md text-xs md:text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(VEHICLE_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
          
          {/* Información del vehículo - Más compacta en móvil */}
          <div className="mt-1 md:mt-2 p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 mb-1">{currentVehicle.description}</p>
            <div className="flex flex-col sm:flex-row sm:justify-between text-xs mb-1 md:mb-2 gap-1">
              <span>Peso: <strong>{currentVehicle.weight.toLocaleString()} kg</strong></span>
              <span>Velocidad: <strong>{(currentVehicle.speed * 1000).toFixed(1)}x</strong></span>
            </div>
            
            {/* Indicador de dificultad */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Dificultad:</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(level => {
                  const difficulty = currentVehicle.weight > 10000 ? 5 : 
                                   currentVehicle.weight > 6000 ? 4 :
                                   currentVehicle.weight > 3000 ? 3 :
                                   currentVehicle.weight > 1000 ? 2 : 1;
                  return (
                    <div 
                      key={level}
                      className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                        level <= difficulty ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Controles deslizantes - Layout más compacto */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
          
          {/* Gravedad */}
          <div>
            <label className="block text-gray-600 mb-1 text-xs md:text-sm">Gravedad</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={settings.gravity}
              onChange={(e) => setSettings(prev => ({...prev, gravity: parseFloat(e.target.value)}))}
              className="w-full h-1 md:h-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{settings.gravity}</span>
              <span className="text-xs">
                {settings.gravity < 0.5 ? 'Luna' : settings.gravity > 1.5 ? 'Júpiter' : 'Tierra'}
              </span>
            </div>
          </div>

          {/* Velocidad del Vehículo */}
          <div>
            <label className="block text-gray-600 mb-1 text-xs md:text-sm">Velocidad Vehículo</label>
            <input
              type="range"
              min="0.0001"
              max="0.003"
              step="0.0001"
              value={settings.vehicleSpeed}
              onChange={(e) => setSettings(prev => ({...prev, vehicleSpeed: parseFloat(e.target.value)}))}
              className="w-full h-1 md:h-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(settings.vehicleSpeed * 1000).toFixed(1)}x</span>
              <span className="text-xs">
                {settings.vehicleSpeed < 0.0005 ? 'Muy Lento' : 
                 settings.vehicleSpeed > 0.0015 ? 'Muy Rápido' : 'Normal'}
              </span>
            </div>
          </div>

          {/* Umbral de Estrés */}
          <div>
            <label className="block text-gray-600 mb-1 text-xs md:text-sm">Umbral de Estrés</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.stressThreshold}
              onChange={(e) => setSettings(prev => ({...prev, stressThreshold: parseFloat(e.target.value)}))}
              className="w-full h-1 md:h-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(settings.stressThreshold * 100).toFixed(0)}%</span>
              <span className="text-xs">
                {settings.stressThreshold < 0.4 ? 'Frágil' : 
                 settings.stressThreshold > 0.8 ? 'Resistente' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Switches - Layout más compacto */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="text-gray-600 text-xs md:text-sm">Mostrar Estrés</label>
            <input
              type="checkbox"
              checked={settings.showStress}
              onChange={(e) => setSettings(prev => ({...prev, showStress: e.target.checked}))}
              className="rounded w-3 h-3 md:w-4 md:h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-gray-600 text-xs md:text-sm">Auto-Romper</label>
            <input
              type="checkbox"
              checked={settings.autoBreak}
              onChange={(e) => setSettings(prev => ({...prev, autoBreak: e.target.checked}))}
              className="rounded w-3 h-3 md:w-4 md:h-4"
            />
          </div>
        </div>

        {/* Botón de cerrar para móvil */}
        <div className="md:hidden pt-2 border-t border-gray-200">
          <button
            onClick={() => setSettings(prev => ({...prev}))} // Trigger parent to close
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-sm transition-colors"
          >
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;