import React, { useEffect, useRef, useState, useCallback } from "react";

// Importar componentes
import BuildingTools from './components/BuildingTools.jsx';
import SimulationControls from './components/SimulationControls.jsx';
import StatusIndicators from './components/StatusIndicators.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import InstructionsPanel from './components/InstructionsPanel.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';

// Importar hooks personalizados
import usePhysicsEngine from './hooks/usePhysicsEngine.jsx';
import useBridgeElements from './hooks/useBridgeElements.jsx';

// Matter.js importado desde CDN
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint, Composite } = Matter;

// Configuraciones de diferentes tipos de vehículos
// Configuraciones de diferentes tipos de vehículos - MEJORADAS
// Configuraciones de diferentes tipos de vehículos - VELOCIDADES BALANCEADAS
// Configuraciones de diferentes tipos de vehículos - VELOCIDADES BALANCEADAS
const VEHICLE_CONFIGS = {
  car: {
    name: "🚗 Carro Ligero",
    description: "Vehículo estándar, liviano y rápido",
    chassis: { width: 100, height: 30, density: 0.002 },
    wheels: { radius: 18, density: 0.003, offsetY: 25 },
    color: { chassis: "#DC2626", wheels: "#000000" }, // Rojo clásico con llantas negras
    physics: {
      friction: 0.6,
      wheelFriction: 1.2,
      restitution: 0.1,
      stiffness: 0.8
    },
    speed: 0.0008, // Velocidad base normal (referencia)
    weight: 1200 // kg
  },
  
  truck: {
    name: "🚛 Camión Pesado",
    description: "Vehículo pesado de carga, lento pero resistente",
    chassis: { width: 140, height: 45, density: 0.012 }, // Más pesado
    wheels: { radius: 25, density: 0.015, offsetY: 35 },
    color: { chassis: "#F97316", wheels: "#1C1917" }, // Naranja industrial
    physics: {
      friction: 0.9,
      wheelFriction: 1.8,
      restitution: 0.02,
      stiffness: 1.5
    },
    speed: 0.0005, // 37% más lento que el carro
    weight: 8000 // kg
  },
  
  bus: {
    name: "🚌 Autobús",
    description: "Vehículo largo para pasajeros",
    chassis: { width: 160, height: 50, density: 0.008 },
    wheels: { radius: 22, density: 0.010, offsetY: 30 },
    color: { chassis: "#EAB308", wheels: "#27272A" }, // Amarillo escolar
    physics: {
      friction: 0.8,
      wheelFriction: 1.5,
      restitution: 0.05,
      stiffness: 1.2
    },
    speed: 0.0006, // 25% más lento que el carro
    weight: 5500 // kg
  },
  
  motorcycle: {
    name: "🏍️ Motocicleta",
    description: "Vehículo muy ligero y ágil",
    chassis: { width: 80, height: 20, density: 0.0008 },
    wheels: { radius: 15, density: 0.0015, offsetY: 18 },
    color: { chassis: "#059669", wheels: "#1F2937" }, // Verde esmeralda
    physics: {
      friction: 0.5,
      wheelFriction: 1.0,
      restitution: 0.15,
      stiffness: 0.6
    },
    speed: 0.0011, // 37% más rápido que el carro
    weight: 250 // kg
  },
  
  tank: {
    name: "🚜 Tanque Militar",
    description: "Vehículo blindado super pesado",
    chassis: { width: 120, height: 40, density: 0.008 }, // Reducida densidad para estabilidad
    wheels: { radius: 20, density: 0.010, offsetY: 28 }, // Orugas menos pesadas
    color: { chassis: "#4B5563", wheels: "#111827" }, // Gris militar
    physics: {
      friction: 1.2,
      wheelFriction: 2.5,
      restitution: 0.005, // Casi sin rebote para máxima estabilidad
      stiffness: 1.0 // Suspensión más equilibrada
    },
    speed: 0.0004, // 50% más lento que el carro
    weight: 15000 // kg
  },
  
  formula1: {
    name: "🏎️ Fórmula 1",
    description: "Carro de carreras ultra rápido",
    chassis: { width: 110, height: 25, density: 0.0012 },
    wheels: { radius: 16, density: 0.002, offsetY: 20 },
    color: { chassis: "#EF4444", wheels: "#0F172A" }, // Rojo Ferrari
    physics: {
      friction: 0.3,
      wheelFriction: 0.8,
      restitution: 0.2,
      stiffness: 0.4
    },
    speed: 0.0014, // 75% más rápido que el carro
    weight: 800 // kg
  },
  
  monster_truck: {
    name: "🚙 Monster Truck",
    description: "Camioneta con ruedas gigantes",
    chassis: { width: 130, height: 35, density: 0.007 },
    wheels: { radius: 35, density: 0.012, offsetY: 45 },
    color: { chassis: "#8B5CF6", wheels: "#1E1B4B" }, // Púrpura vibrante
    physics: {
      friction: 0.8,
      wheelFriction: 1.6,
      restitution: 0.4,
      stiffness: 1.0
    },
    speed: 0.0007, // 12% más lento que el carro
    weight: 4500 // kg
  }
};

// Configuración global
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

export default function App() {
  const sceneRef = useRef(null);

  // Estados principales
  const [tool, setTool] = useState("node");
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [gameStats, setGameStats] = useState({
    nodes: 0,
    beams: 0,
    cost: 0,
    stress: 0
  });

  // Estados de UI
  const [showSettings, setShowSettings] = useState(false);
  const [bridgeIntegrity, setBridgeIntegrity] = useState(100);
  const [vehicleProgress, setVehicleProgress] = useState(0);
  const [gameStatus, setGameStatus] = useState("building");

  // Configuraciones iniciales actualizadas
  const [settings, setSettings] = useState({
    gravity: 0.8,
    vehicleType: 'car', // Tipo de vehículo por defecto
    vehicleSpeed: 0.0008,
    vehicleWeight: 1200,
    stressThreshold: 0.7,
    showStress: true,
    autoBreak: true
  });

  // Función para actualizar estadísticas
  const updateStats = useCallback(() => {
    setGameStats(prev => {
      const cost = nodeBodies.length * 50 + beamConstraints.length * 100;
      const avgStress = stressLevelsRef.current.reduce((a, b) => a + b, 0) /
        (stressLevelsRef.current.length || 1);

      return {
        nodes: nodeBodies.length,
        beams: beamConstraints.length,
        cost,
        stress: Math.round(avgStress * 100)
      };
    });
  }, []);

  // Hooks personalizados
  const { engineRef, renderRef, initializeEngine, createTerrain } = usePhysicsEngine(settings);

  const {
    nodeBodies,
    beamConstraints,
    nodeMetaRef,
    beamMetaRef,
    stressLevelsRef,
    addNode,
    addBeam,
    removeElement,
    applyLoadToNode,
    resetElements,
    controlNodePhysics,
    setNodeBodies,
    setBeamConstraints
  } = useBridgeElements(engineRef, updateStats);

  // Inicialización del motor de física
  useEffect(() => {
    if (sceneRef.current) {
      return initializeEngine(sceneRef.current);
    }
  }, [initializeEngine]);

  // Actualizar gravedad
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = settings.gravity;
    }
  }, [settings.gravity]);

  // Obtener posición del mouse
  const getMousePos = useCallback((e) => {
    const rect = sceneRef.current?.querySelector("canvas")?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Manejar clicks en el canvas
  const handleCanvasClick = useCallback((e) => {
    if (isSimulating) return;

    const pos = getMousePos(e);

    switch (tool) {
      case "node":
        addNode(pos.x, pos.y, false);
        break;
      case "support":
        addNode(pos.x, pos.y, true);
        break;
      case "delete":
        removeElement(pos.x, pos.y);
        break;
      case "beam":
        if (selectedNodeIdx === null) {
          const idx = nodeBodies.findIndex(b =>
            Math.hypot(b.position.x - pos.x, b.position.y - pos.y) < 20
          );
          if (idx >= 0) {
            setSelectedNodeIdx(idx);
            nodeBodies[idx].render.strokeStyle = "#EF4444";
            nodeBodies[idx].render.lineWidth = 4;
          }
        } else {
          const idx2 = nodeBodies.findIndex(b =>
            Math.hypot(b.position.x - pos.x, b.position.y - pos.y) < 20
          );
          if (idx2 >= 0 && idx2 !== selectedNodeIdx) {
            addBeam(selectedNodeIdx, idx2);
          }
          if (nodeBodies[selectedNodeIdx]) {
            nodeBodies[selectedNodeIdx].render.strokeStyle = "#1F2937";
            nodeBodies[selectedNodeIdx].render.lineWidth = 2;
          }
          setSelectedNodeIdx(null);
        }
        break;
      case "load":
        const idx = nodeBodies.findIndex(b =>
          Math.hypot(b.position.x - pos.x, b.position.y - pos.y) < 20
        );
        if (idx >= 0) {
          const fy = parseFloat(prompt("Carga vertical en N (negativa hacia abajo):", "-2000"));
          if (!isNaN(fy) && fy !== 0) {
            applyLoadToNode(idx, fy);
          }
        }
        break;
    }
  }, [tool, selectedNodeIdx, isSimulating, getMousePos, nodeBodies, addNode, removeElement, addBeam, applyLoadToNode]);

  // Crear vehículo
const spawnVehicle = useCallback(() => {
  if (!engineRef.current) return;

  // Remover vehículo anterior si existe
  if (vehicle?.parts) {
    Object.values(vehicle.parts).forEach(part => {
      if (part.type === 'body' || part.type === 'constraint') {
        World.remove(engineRef.current.world, part);
      }
    });
  }

  // Obtener configuración del vehículo actual
  const config = VEHICLE_CONFIGS[settings.vehicleType || 'car'];

  const startX = 100;
  const startY = CANVAS_HEIGHT - 200;

  // Crear chasis con dimensiones y propiedades específicas
  const chassis = Bodies.rectangle(
    startX,
    startY,
    config.chassis.width,
    config.chassis.height,
    {
      density: config.chassis.density,
      friction: config.physics.friction,
      render: {
        fillStyle: config.color.chassis,
        strokeStyle: config.color.chassis.replace('4', '8'),
        lineWidth: 2
      }
    }
  );

  // Calcular posiciones de las ruedas basadas en el tamaño del chasis
  const wheelOffsetX = config.chassis.width * 0.35;

  // Rueda trasera
  const wheelA = Bodies.circle(
    startX - wheelOffsetX,
    startY + config.wheels.offsetY,
    config.wheels.radius,
    {
      density: config.wheels.density,
      friction: config.physics.wheelFriction,
      restitution: config.physics.restitution,
      render: {
        fillStyle: config.color.wheels,
        strokeStyle: config.color.wheels.replace('4', '8'),
        lineWidth: 2
      }
    }
  );

  // Rueda delantera
  const wheelB = Bodies.circle(
    startX + wheelOffsetX,
    startY + config.wheels.offsetY,
    config.wheels.radius,
    {
      density: config.wheels.density,
      friction: config.physics.wheelFriction,
      restitution: config.physics.restitution,
      render: {
        fillStyle: config.color.wheels,
        strokeStyle: config.color.wheels.replace('4', '8'),
        lineWidth: 2
      }
    }
  );

  // Suspensión trasera - MEJORADA para estabilidad
  const axleA = Constraint.create({
    bodyA: chassis,
    pointA: { x: -wheelOffsetX, y: config.chassis.height / 2 },
    bodyB: wheelA,
    stiffness: config.physics.stiffness,
    length: config.wheels.offsetY - config.chassis.height / 2,
    damping: 0.1, // Agregar amortiguación para reducir vibración
    render: { visible: false }
  });

  // Suspensión delantera - MEJORADA para estabilidad
  const axleB = Constraint.create({
    bodyA: chassis,
    pointA: { x: wheelOffsetX, y: config.chassis.height / 2 },
    bodyB: wheelB,
    stiffness: config.physics.stiffness,
    length: config.wheels.offsetY - config.chassis.height / 2,
    damping: 0.1, // Agregar amortiguación para reducir vibración
    render: { visible: false }
  });

  // Agregar elementos al mundo
  World.add(engineRef.current.world, [chassis, wheelA, wheelB, axleA, axleB]);

  // Crear objeto vehículo
  const newVehicle = {
    parts: { chassis, wheelA, wheelB, axleA, axleB },
    config: config,
    startTime: Date.now()
  };

  setVehicle(newVehicle);
  setVehicleProgress(0);
  setGameStatus("testing");

  // Actualizar velocidad del vehículo en settings
  setSettings(prev => ({
    ...prev,
    vehicleSpeed: config.speed,
    vehicleWeight: config.weight
  }));

  return newVehicle;
}, [vehicle, settings.vehicleType]);

  // Detección de estrés
  const detectAndBreakOverstressedBeams = useCallback(() => {
    if (!beamConstraints.length) return;

    const toRemove = [];
    beamConstraints.forEach((constraint, i) => {
      const meta = beamMetaRef.current[i];
      if (!meta || !constraint.bodyA || !constraint.bodyB) return;

      const dx = constraint.bodyB.position.x - constraint.bodyA.position.x;
      const dy = constraint.bodyB.position.y - constraint.bodyA.position.y;
      const currentLength = Math.hypot(dx, dy);
      const restLength = constraint.length || meta.originalLength;

      const deformation = Math.abs(currentLength - restLength);
      const stress = deformation / restLength;

      stressLevelsRef.current[i] = stress;

      if (stress > settings.stressThreshold) {
        toRemove.push(i);
      }
    });

    if (toRemove.length > 0) {
      setBridgeIntegrity(prev => Math.max(0, prev - toRemove.length * 20));

      toRemove.sort((a, b) => b - a).forEach(idx => {
        const constraint = beamConstraints[idx];
        World.remove(engineRef.current.world, constraint);
        beamConstraints.splice(idx, 1);
        beamMetaRef.current.splice(idx, 1);
        stressLevelsRef.current.splice(idx, 1);
      });

      setBeamConstraints([...beamConstraints]);
    }
  }, [beamConstraints, settings.stressThreshold]);

  // Visualización de estrés
  const updateStressVisualization = useCallback(() => {
    if (!settings.showStress) return;

    beamConstraints.forEach((constraint, i) => {
      const stressLevel = stressLevelsRef.current[i] || 0;
      const color = stressLevel > 0.7 ? "#EF4444" :
        stressLevel > 0.4 ? "#F59E0B" : "#10B981";
      constraint.render.strokeStyle = color;
      constraint.render.lineWidth = 6 + stressLevel * 4;
    });
  }, [beamConstraints, settings.showStress]);

  // Simulación del vehículo simplificada - movimiento lineal
  // Simulación del vehículo actualizada - dentro del useEffect
  // Simulación del vehículo - ARREGLADA (mantiene movimiento original)
  useEffect(() => {
    if (!isSimulating || !vehicle?.parts) return;

    const interval = setInterval(() => {
      try {
        const { chassis } = vehicle.parts;

        // Usar la velocidad específica del vehículo actual (sistema original)
        const moveSpeed = vehicle.config ?
          vehicle.config.speed * 10000 : // Usar velocidad del vehículo
          settings.vehicleSpeed * 10000;  // Fallback a configuración general

        // MANTENER EL SISTEMA ORIGINAL - Establecer velocidad constante horizontal
        Body.setVelocity(chassis, {
          x: moveSpeed,
          y: Math.max(chassis.velocity.y, -5) // Limitar caída libre
        });

        // MANTENER EL SISTEMA ORIGINAL - Mover las ruedas junto con el chasis
        const { wheelA, wheelB } = vehicle.parts;
        Body.setVelocity(wheelA, {
          x: moveSpeed,
          y: Math.max(wheelA.velocity.y, -5)
        });
        Body.setVelocity(wheelB, {
          x: moveSpeed,
          y: Math.max(wheelB.velocity.y, -5)
        });

        // Calcular progreso
        const progress = Math.min((chassis.position.x - 100) / (CANVAS_WIDTH - 200) * 100, 100);
        setVehicleProgress(progress);

        // Verificar condiciones de éxito/fallo
        if (progress >= 95) {
          setGameStatus("success");
          setIsSimulating(false);
        }

        if (chassis.position.y > CANVAS_HEIGHT - 100) {
          setGameStatus("failed");
          setIsSimulating(false);
        }

        // Detectar y romper vigas sobrecargadas
        if (settings.autoBreak) {
          detectAndBreakOverstressedBeams();
        }

        // Actualizar visualización de estrés
        updateStressVisualization();

      } catch (error) {
        console.error("Error en simulación:", error);
        setIsSimulating(false);
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [isSimulating, vehicle, settings, detectAndBreakOverstressedBeams, updateStressVisualization]);

  // Exportar diseño
  const exportDesign = useCallback(() => {
    const design = {
      nodes: nodeMetaRef.current.map((meta, idx) => {
        const body = nodeBodies[idx];
        return {
          id: meta.id,
          x: Math.round(body.position.x),
          y: Math.round(body.position.y),
          isSupport: meta.isSupport,
          isLoad: meta.isLoad,
          load: meta.load
        };
      }),
      beams: beamMetaRef.current.map(beam => ({
        id: beam.id,
        start: beam.start,
        end: beam.end,
        area: beam.area,
        yield: beam.yield
      })),
      settings
    };

    const dataStr = JSON.stringify(design, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'puente_design.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [nodeBodies, settings, nodeMetaRef, beamMetaRef]);

  // Resetear todo
  const resetAll = useCallback(() => {
    if (!engineRef.current) return;

    setIsSimulating(false);
    Composite.clear(engineRef.current.world, false);
    createTerrain(engineRef.current);

    resetElements();
    setVehicle(null);
    setSelectedNodeIdx(null);
    setGameStatus("building");
    setBridgeIntegrity(100);
    setVehicleProgress(0);
    updateStats();
  }, [engineRef, createTerrain, resetElements, updateStats]);

  // Control de simulación
  const toggleSimulation = useCallback(() => {
    if (!isSimulating) {
      // Al iniciar simulación
      controlNodePhysics(false); // false = hacer dinámicos los nodos no-soporte  
      spawnVehicle();
      setIsSimulating(true);
    } else {
      // Al parar simulación
      controlNodePhysics(true); // true = hacer todos estáticos
      setIsSimulating(false);
    }
  }, [isSimulating, vehicle, spawnVehicle, controlNodePhysics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          Poly Bridge Simulator
        </h1>

        {/* Panel de herramientas superior */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <BuildingTools
              tool={tool}
              setTool={setTool}
              isSimulating={isSimulating}
            />
            <SimulationControls
              isSimulating={isSimulating}
              toggleSimulation={toggleSimulation}
              resetAll={resetAll}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              exportDesign={exportDesign}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Área de simulación */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <StatusIndicators
                gameStatus={gameStatus}
                bridgeIntegrity={bridgeIntegrity}
                isSimulating={isSimulating}
                vehicleProgress={vehicleProgress}
              />

              {/* Canvas de simulación */}
              <div className="relative">
                <div
                  ref={sceneRef}
                  onClick={handleCanvasClick}
                  className="cursor-crosshair"
                  style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                />

                {/* Instrucciones superpuestas */}
                {!nodeBodies.length && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white p-6 rounded-lg text-center">
                      <h3 className="text-xl font-bold mb-2">¡Construye tu puente!</h3>
                      <p>Los nodos se quedarán exactamente donde hagas clic</p>
                      <p className="text-sm mt-2 opacity-75">
                        Conecta las plataformas para que el vehículo pueda cruzar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-4">
            <StatsPanel gameStats={gameStats} />

            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              showSettings={showSettings}
            />

            <InstructionsPanel />

            <AnalysisPanel
              nodeBodies={nodeBodies}
              beamConstraints={beamConstraints}
              nodeMetaRef={nodeMetaRef}
              beamMetaRef={beamMetaRef}
            />

            <ResultsPanel
              gameStatus={gameStatus}
              vehicleProgress={vehicleProgress}
              bridgeIntegrity={bridgeIntegrity}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Poly Bridge Simulator - Construye, prueba y optimiza tus diseños de puentes</p>
          <p className="mt-1">Los nodos ahora se mantienen fijos en su posición hasta que pruebes la simulación</p>
        </div>
      </div>
    </div>
  );
}