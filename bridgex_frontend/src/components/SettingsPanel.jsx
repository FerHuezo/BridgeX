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
    speed: 0.0005 // 37% más lento que el carro
  },
  bus: {
    name: "🚌 Autobús",
    description: "Vehículo largo para pasajeros", 
    weight: 5500,
    speed: 0.0006 // 25% más lento que el carro
  },
  motorcycle: {
    name: "🏍️ Motocicleta",
    description: "Vehículo muy ligero y ágil",
    weight: 250,
    speed: 0.0011 // 37% más rápido que el carro
  },
  tank: {
    name: "🚜 Tanque Militar",
    description: "Vehículo blindado super pesado",
    weight: 15000,
    speed: 0.0004 // 50% más lento que el carro
  },
  formula1: {
    name: "🏎️ Fórmula 1", 
    description: "Carro de carreras ultra rápido",
    weight: 800,
    speed: 0.0014 // 75% más rápido que el carro
  },
  monster_truck: {
    name: "🚙 Monster Truck",
    description: "Camioneta con ruedas gigantes",
    weight: 4500,
    speed: 0.0007 // 12% más lento que el carro
  }
};

const SettingsPanel = ({ settings, setSettings, showSettings }) => {
  if (!showSettings) return null;

  const currentVehicle = VEHICLE_CONFIGS[settings.vehicleType || 'car'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Configuración</h3>
      <div className="space-y-4 text-sm">
        
        {/* Selector de Vehículo */}
        <div>
          <label className="block text-gray-600 mb-2 font-medium">Tipo de Vehículo</label>
          <select
            value={settings.vehicleType || 'car'}
            onChange={(e) => setSettings(prev => ({
              ...prev, 
              vehicleType: e.target.value,
              vehicleSpeed: VEHICLE_CONFIGS[e.target.value].speed,
              vehicleWeight: VEHICLE_CONFIGS[e.target.value].weight
            }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(VEHICLE_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
          
          {/* Información del vehículo seleccionado con indicador visual de dificultad */}
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 mb-1">{currentVehicle.description}</p>
            <div className="flex justify-between text-xs mb-2">
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
                      className={`w-2 h-2 rounded-full ${
                        level <= difficulty ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Gravedad */}
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
          <div className="flex justify-between text-xs text-gray-500">
            <span>{settings.gravity}</span>
            <span>{settings.gravity < 0.5 ? 'Luna' : settings.gravity > 1.5 ? 'Júpiter' : 'Tierra'}</span>
          </div>
        </div>

        {/* Velocidad del Vehículo */}
        <div>
          <label className="block text-gray-600 mb-1">Velocidad Vehículo</label>
          <input
            type="range"
            min="0.0001"
            max="0.003"
            step="0.0001"
            value={settings.vehicleSpeed}
            onChange={(e) => setSettings(prev => ({...prev, vehicleSpeed: parseFloat(e.target.value)}))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{(settings.vehicleSpeed * 1000).toFixed(1)}x</span>
            <span>
              {settings.vehicleSpeed < 0.0005 ? 'Muy Lento' : 
               settings.vehicleSpeed > 0.0015 ? 'Muy Rápido' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Umbral de Estrés */}
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
          <div className="flex justify-between text-xs text-gray-500">
            <span>{(settings.stressThreshold * 100).toFixed(0)}%</span>
            <span>
              {settings.stressThreshold < 0.4 ? 'Frágil' : 
               settings.stressThreshold > 0.8 ? 'Resistente' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Switches */}
        <div className="space-y-2">
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
    </div>
  );
};

export default SettingsPanel;