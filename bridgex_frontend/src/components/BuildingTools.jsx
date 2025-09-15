import React from 'react';

const BuildingTools = ({ tool, setTool, isSimulating }) => {
  const tools = [
    { id: "node", label: "Nodo", icon: "⬤", shortLabel: "Nodo" },
    { id: "beam", label: "Viga", icon: "━", shortLabel: "Viga" },
    { id: "support", label: "Soporte", icon: "▲", shortLabel: "Soporte" },
    { id: "load", label: "Carga", icon: "↓", shortLabel: "Carga" },
    { id: "delete", label: "Borrar", icon: "✕", shortLabel: "Borrar" }
  ];

  return (
    <div className="w-full">
      {/* Vista desktop - botones horizontales */}
      <div className="hidden md:flex gap-1 bg-gray-100 rounded-lg p-1 justify-center">
        {tools.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            disabled={isSimulating}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              tool === id
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Vista móvil - grid compacto */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        {tools.map(({ id, label, icon, shortLabel }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            disabled={isSimulating}
            className={`p-3 rounded-lg text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              tool === id
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50"
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="leading-tight">{shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Indicador de herramienta seleccionada en móvil */}
      <div className="md:hidden mt-2 text-center">
        <span className="text-sm text-gray-600">
          Herramienta activa: <span className="font-medium text-blue-600">
            {tools.find(t => t.id === tool)?.label || 'Nodo'}
          </span>
        </span>
      </div>
    </div>
  );
};

export default BuildingTools;