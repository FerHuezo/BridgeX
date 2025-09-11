import React from 'react';

const InstructionsPanel = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Instrucciones</h3>
      <div className="text-sm text-gray-600 space-y-2">
        <div><strong>Nodo:</strong> Click para añadir puntos fijos</div>
        <div><strong>Viga:</strong> Click en dos nodos para conectarlos</div>
        <div><strong>Soporte:</strong> Crea puntos fijos (verdes)</div>
        <div><strong>Carga:</strong> Aplica peso a un nodo</div>
        <div><strong>Borrar:</strong> Click en elementos para eliminar</div>
        <br />
        <div className="text-xs bg-blue-50 p-2 rounded">
          <strong>¡NUEVO!</strong> Los nodos ahora se quedan exactamente donde haces clic. Solo se mueven durante la simulación.
        </div>
        <br />
        <div className="text-xs">
          <strong>Objetivo:</strong> Construye un puente que permita al vehículo cruzar desde la plataforma izquierda hasta la derecha sin colapsar.
        </div>
        <br />
        <div className="text-xs">
          <strong>Colores de Estrés:</strong><br />
          <span className="text-green-600">• Verde: Bajo estrés</span><br />
          <span className="text-yellow-600">• Amarillo: Estrés medio</span><br />
          <span className="text-red-600">• Rojo: Alto estrés</span>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPanel;