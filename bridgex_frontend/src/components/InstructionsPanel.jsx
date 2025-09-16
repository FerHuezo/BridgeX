import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const InstructionsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
      {/* Header con toggle para móvil */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
          <HelpCircle size={16} className="md:hidden" />
          <HelpCircle size={20} className="hidden md:block" />
          Instrucciones
        </h3>
        
        {/* Toggle button - solo en móvil */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Contenido - Expandible en móvil, siempre visible en desktop */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block mt-2 md:mt-3`}>
        <div className="text-xs md:text-sm text-gray-600 space-y-1 md:space-y-2">
          
          {/* Instrucciones básicas - Siempre visibles */}
          <div className="space-y-1">
            <div><strong>Nodo:</strong> Click para añadir puntos completamente fijos</div>
            <div><strong>Viga:</strong> Click en dos nodos para conectarlos</div>
            <div><strong>Soporte:</strong> Crea nodos verdes (misma función que nodos normales)</div>
            <div className="md:block"><strong>Carga:</strong> Marca un nodo con peso adicional</div>
            <div><strong>Borrar:</strong> Click en elementos para eliminar</div>
          </div>
          
          {/* Información adicional */}
          <div className="pt-2 md:pt-3 border-t border-gray-200">
            <div className="text-xs bg-green-50 border border-green-200 p-2 rounded mb-2">
              <strong>✅ NUEVA FUNCIONALIDAD:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li><strong>Nodos completamente fijos:</strong> Nunca se mueven durante la simulación</li>
                <li><strong>Aceleración gradual:</strong> El vehículo acelera suavemente sin impulsos bruscos</li>
                <li><strong>Solo las vigas se flexionan:</strong> Comportamiento más realista</li>
              </ul>
            </div>
            
            <div className="text-xs mb-2">
              <strong>Objetivo:</strong> Construye un puente que permita al vehículo cruzar desde la plataforma izquierda hasta la derecha sin colapsar.
            </div>
          </div>

          {/* Comportamiento del sistema */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs mb-1"><strong>Comportamiento del Sistema:</strong></div>
            <div className="space-y-1 text-xs">
              <div>🔹 <strong>Nodos:</strong> Permanecen fijos en su posición original</div>
              <div>🔹 <strong>Vigas:</strong> Pueden flexionarse y rotar alrededor de los nodos</div>
              <div>🔹 <strong>Vehículo:</strong> Acelera gradualmente durante 2 segundos</div>
              <div>🔹 <strong>Soportes:</strong> Funcionan igual que los nodos normales</div>
            </div>
          </div>

          {/* Colores de estrés - Compacto */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs mb-1"><strong>Colores de Estrés en Vigas:</strong></div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Verde: Bajo estrés</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Amarillo: Estrés medio</span>
              </div>
              <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Rojo: Alto estrés (se romperá)</span>
              </div>
            </div>
          </div>

          {/* Tips rápidos para móvil */}
          <div className="md:hidden pt-2 border-t border-gray-200">
            <div className="text-xs bg-gray-50 p-2 rounded">
              <strong>💡 Tips Estratégicos:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Usa estructuras triangulares para mayor estabilidad</li>
                <li>Los nodos verdes y azules funcionan igual</li>
                <li>Menos vigas = menor costo pero menos estabilidad</li>
                <li>El vehículo ya no tiene impulso inicial brusco</li>
              </ul>
            </div>
          </div>

          {/* Ventajas del nuevo sistema */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded">
              <strong>🚀 Mejoras del Sistema:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Construcción más predecible y estable</li>
                <li>Simulación más realista de estructuras</li>
                <li>Movimiento suave del vehículo</li>
                <li>Mejor control de la física del puente</li>
              </ul>
            </div>
          </div>

          {/* Controles táctiles para móvil */}
          <div className="md:hidden pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <strong>📱 Móvil:</strong> Toca para seleccionar herramientas y construir. Usa zoom del navegador si es necesario.
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de contenido colapsado en móvil */}
      {!isExpanded && (
        <div className="md:hidden mt-2 text-xs text-gray-500 text-center">
          Toca para ver instrucciones completas
        </div>
      )}
    </div>
  );
};

export default InstructionsPanel;