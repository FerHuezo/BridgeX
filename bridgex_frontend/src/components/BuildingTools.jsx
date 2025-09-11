import React from 'react';

const BuildingTools = ({ tool, setTool, isSimulating }) => {
  const tools = [
    { id: "node", label: "Nodo", icon: "⬤" },
    { id: "beam", label: "Viga", icon: "━" },
    { id: "support", label: "Soporte", icon: "▲" },
    { id: "load", label: "Carga", icon: "↓" },
    { id: "delete", label: "Borrar", icon: "✕" }
  ];

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {tools.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          disabled={isSimulating}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            tool === id
              ? "bg-blue-500 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          }`}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
};

export default BuildingTools;