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

// CONFIGURACIONES DE VEHÍCULOS MEJORADAS PARA ESTABILIDAD
const VEHICLE_CONFIGS = {
  car: {
    name: "🚗 Carro Ligero",
    description: "Vehículo estándar, liviano y rápido",
    chassis: { width: 100, height: 30, density: 0.003 }, // Ligeramente más pesado
    wheels: { radius: 18, density: 0.008, offsetY: 25 }, // Ruedas más pesadas para estabilidad
    color: { chassis: "#DC2626", wheels: "#000000" },
    physics: {
      friction: 0.8,       // Más fricción
      wheelFriction: 2.0,  // Mucha más fricción en ruedas
      restitution: 0.05,   // Menos rebote
      stiffness: 1.2,      // Suspensión más rígida
      damping: 0.3         // Más amortiguación
    },
    speed: 0.0006,         // Velocidad reducida para mayor control
    weight: 1200,
    torque: 0.02           // Fuerza de las ruedas
  },
  
  truck: {
    name: "🚛 Camión Pesado",
    description: "Vehículo pesado de carga, lento pero resistente",
    chassis: { width: 140, height: 45, density: 0.008 },
    wheels: { radius: 25, density: 0.015, offsetY: 35 },
    color: { chassis: "#F97316", wheels: "#1C1917" },
    physics: {
      friction: 1.0,
      wheelFriction: 2.5,
      restitution: 0.02,
      stiffness: 1.8,
      damping: 0.4
    },
    speed: 0.0004,
    weight: 8000,
    torque: 0.015
  },
  
  bus: {
    name: "🚌 Autobús",
    description: "Vehículo largo para pasajeros",
    chassis: { width: 160, height: 50, density: 0.008 },
    wheels: { radius: 22, density: 0.010, offsetY: 30 },
    color: { chassis: "#EAB308", wheels: "#27272A" },
    physics: {
      friction: 0.8,
      wheelFriction: 1.5,
      restitution: 0.05,
      stiffness: 1.2,
      damping: 0.3
    },
    speed: 0.0006,
    weight: 5500,
    torque: 0.018
  },
  
  motorcycle: {
    name: "🏍️ Motocicleta",
    description: "Vehículo muy ligero y ágil",
    chassis: { width: 80, height: 20, density: 0.0008 },
    wheels: { radius: 15, density: 0.0015, offsetY: 18 },
    color: { chassis: "#059669", wheels: "#1F2937" },
    physics: {
      friction: 0.5,
      wheelFriction: 1.0,
      restitution: 0.15,
      stiffness: 0.6,
      damping: 0.2
    },
    speed: 0.0011,
    weight: 250,
    torque: 0.025
  },
  
  tank: {
    name: "🚜 Tanque Militar",
    description: "Vehículo blindado super pesado",
    chassis: { width: 120, height: 40, density: 0.008 },
    wheels: { radius: 20, density: 0.010, offsetY: 28 },
    color: { chassis: "#4B5563", wheels: "#111827" },
    physics: {
      friction: 1.2,
      wheelFriction: 2.5,
      restitution: 0.005,
      stiffness: 1.0,
      damping: 0.5
    },
    speed: 0.0004,
    weight: 15000,
    torque: 0.012
  },
  
  formula1: {
    name: "🏎️ Fórmula 1",
    description: "Carro de carreras ultra rápido",
    chassis: { width: 110, height: 25, density: 0.0012 },
    wheels: { radius: 16, density: 0.002, offsetY: 20 },
    color: { chassis: "#EF4444", wheels: "#0F172A" },
    physics: {
      friction: 0.3,
      wheelFriction: 0.8,
      restitution: 0.2,
      stiffness: 0.4,
      damping: 0.15
    },
    speed: 0.0014,
    weight: 800,
    torque: 0.035
  },
  
  monster_truck: {
    name: "🚙 Monster Truck",
    description: "Camioneta con ruedas gigantes",
    chassis: { width: 130, height: 35, density: 0.007 },
    wheels: { radius: 35, density: 0.012, offsetY: 45 },
    color: { chassis: "#8B5CF6", wheels: "#1E1B4B" },
    physics: {
      friction: 0.8,
      wheelFriction: 1.6,
      restitution: 0.4,
      stiffness: 1.0,
      damping: 0.3
    },
    speed: 0.0007,
    weight: 4500,
    torque: 0.022
  }
};

// Configuración global
const CANVAS_WIDTH = 1400;
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
    vehicleType: 'car',
    vehicleSpeed: 0.0006,    // Velocidad reducida por defecto
    vehicleWeight: 1200,
    stressThreshold: 0.65,   // Umbral más realista
    showStress: true,
    autoBreak: true
  });

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
  } = useBridgeElements(engineRef, () => updateStats());

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
  }, [nodeBodies.length, beamConstraints.length, stressLevelsRef]);

  // FUNCIÓN DE DETECCIÓN DE ESTRÉS MEJORADA - Definida una sola vez aquí
  const detectAndBreakOverstressedBeams = useCallback(() => {
    if (!beamConstraints.length) return;

    const toRemove = [];
    beamConstraints.forEach((beamSystem, i) => {
      const meta = beamMetaRef.current[i];
      if (!meta || !beamSystem.beamBody) return;

      const node1 = nodeBodies[meta.startIdx];
      const node2 = nodeBodies[meta.endIdx];
      
      if (!node1 || !node2) return;

      // CÁLCULO DE ESTRÉS MEJORADO - Múltiples factores
      const dx = node2.position.x - node1.position.x;
      const dy = node2.position.y - node1.position.y;
      const currentLength = Math.hypot(dx, dy);
      const restLength = meta.originalLength;

      // Estrés por deformación (estiramiento/compresión)
      const deformationStress = Math.abs(currentLength - restLength) / restLength;
      
      // Estrés por velocidad de deformación
      const velocityStress = Math.abs(beamSystem.beamBody.velocity.x + beamSystem.beamBody.velocity.y) * 0.01;
      
      // Estrés por rotación excesiva
      const rotationStress = Math.abs(beamSystem.beamBody.angle) * 0.1;
      
      // Estrés combinado con pesos
      const totalStress = (deformationStress * 0.7) + (velocityStress * 0.2) + (rotationStress * 0.1);

      stressLevelsRef.current[i] = totalStress;

      // VISUALIZACIÓN DE ESTRÉS MEJORADA con gradientes más suaves
      if (beamSystem.beamBody && beamSystem.beamBody.render) {
        let color;
        if (totalStress > 0.8) {
          color = "#DC2626"; // Rojo crítico
        } else if (totalStress > 0.6) {
          color = "#EA580C"; // Naranja alto
        } else if (totalStress > 0.4) {
          color = "#F59E0B"; // Amarillo medio
        } else if (totalStress > 0.2) {
          color = "#84CC16"; // Verde-amarillo bajo
        } else {
          color = "#10B981"; // Verde seguro
        }
        
        beamSystem.beamBody.render.fillStyle = color;
        beamSystem.beamBody.render.strokeStyle = color.replace('6', '8');
        
        // Grosor visual basado en estrés
        beamSystem.beamBody.render.lineWidth = 2 + totalStress * 2;
      }

      // UMBRAL DE ROTURA AJUSTADO para mayor realismo
      const adjustedThreshold = settings.stressThreshold * (1 + Math.random() * 0.2);
      
      if (totalStress > adjustedThreshold) {
        toRemove.push(i);
      }
    });

    // ROTURA DE VIGAS con efectos mejorados
    if (toRemove.length > 0) {
      const integrityLoss = toRemove.length * (15 + Math.random() * 10);
      setBridgeIntegrity(prev => Math.max(0, prev - integrityLoss));

      toRemove.sort((a, b) => b - a).forEach(idx => {
        const beamSystem = beamConstraints[idx];
        
        // Remover todos los componentes del sistema de viga mejorado
        World.remove(engineRef.current.world, [
          beamSystem.beamBody,
          beamSystem.constraint1,
          beamSystem.constraint2,
          ...(beamSystem.stabilizer1 ? [beamSystem.stabilizer1] : []),
          ...(beamSystem.stabilizer2 ? [beamSystem.stabilizer2] : [])
        ]);
        
        beamConstraints.splice(idx, 1);
        beamMetaRef.current.splice(idx, 1);
        stressLevelsRef.current.splice(idx, 1);
      });

      setBeamConstraints([...beamConstraints]);
      
      // Si se rompieron muchas vigas, considerar fallo inmediato
      if (toRemove.length >= 3) {
        setBridgeIntegrity(prev => Math.max(0, prev - 30));
        if (bridgeIntegrity <= 20) {
          setGameStatus("failed");
          setIsSimulating(false);
        }
      }
    }
  }, [beamConstraints, settings.stressThreshold, nodeBodies, bridgeIntegrity, engineRef]);

  // FUNCIÓN DE VISUALIZACIÓN DE ESTRÉS MEJORADA
  const updateStressVisualization = useCallback(() => {
    if (!settings.showStress) {
      // Si no se muestra estrés, usar color neutro
      beamConstraints.forEach((beamSystem) => {
        if (beamSystem.beamBody && beamSystem.beamBody.render) {
          beamSystem.beamBody.render.fillStyle = "#374151";
          beamSystem.beamBody.render.strokeStyle = "#1F2937";
          beamSystem.beamBody.render.lineWidth = 3;
        }
      });
      return;
    }

    beamConstraints.forEach((beamSystem, i) => {
      const stressLevel = stressLevelsRef.current[i] || 0;
      if (beamSystem.beamBody && beamSystem.beamBody.render) {
        // Mapeo de colores más detallado
        let color, strokeColor;
        
        if (stressLevel > 0.9) {
          color = "#B91C1C"; strokeColor = "#7F1D1D";
        } else if (stressLevel > 0.7) {
          color = "#DC2626"; strokeColor = "#991B1B";
        } else if (stressLevel > 0.5) {
          color = "#EA580C"; strokeColor = "#C2410C";
        } else if (stressLevel > 0.3) {
          color = "#F59E0B"; strokeColor = "#D97706";
        } else if (stressLevel > 0.1) {
          color = "#84CC16"; strokeColor = "#65A30D";
        } else {
          color = "#10B981"; strokeColor = "#059669";
        }
        
        beamSystem.beamBody.render.fillStyle = color;
        beamSystem.beamBody.render.strokeStyle = strokeColor;
        beamSystem.beamBody.render.lineWidth = Math.max(2, 2 + stressLevel * 3);
      }
    });
  }, [beamConstraints, settings.showStress, stressLevelsRef]);

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

  // FUNCIÓN DE SPAWN DE VEHÍCULO MEJORADA
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

    const config = VEHICLE_CONFIGS[settings.vehicleType || 'car'];
    const startX = 150; // Posición en el centro de la plataforma izquierda
    const startY = CANVAS_HEIGHT - 200; // Altura adecuada sobre la plataforma

    // CHASIS MEJORADO con mejor estabilidad
    const chassis = Bodies.rectangle(
      startX,
      startY,
      config.chassis.width,
      config.chassis.height,
      {
        density: config.chassis.density,
        friction: config.physics.friction,
        frictionAir: 0.01,
        restitution: config.physics.restitution,
        render: {
          fillStyle: config.color.chassis,
          strokeStyle: config.color.chassis.replace('4', '8'),
          lineWidth: 2
        },
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002 | 0x0008 | 0x0004
        }
      }
    );

    const wheelOffsetX = config.chassis.width * 0.35;

    // RUEDAS MEJORADAS con mejor tracción
    const wheelA = Bodies.circle(
      startX - wheelOffsetX,
      startY + config.wheels.offsetY,
      config.wheels.radius,
      {
        density: config.wheels.density,
        friction: config.physics.wheelFriction,
        frictionAir: 0.005,
        restitution: config.physics.restitution,
        render: {
          fillStyle: config.color.wheels,
          strokeStyle: config.color.wheels.replace('4', '8'),
          lineWidth: 2
        },
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002 | 0x0008 | 0x0004
        }
      }
    );

    const wheelB = Bodies.circle(
      startX + wheelOffsetX,
      startY + config.wheels.offsetY,
      config.wheels.radius,
      {
        density: config.wheels.density,
        friction: config.physics.wheelFriction,
        frictionAir: 0.005,
        restitution: config.physics.restitution,
        render: {
          fillStyle: config.color.wheels,
          strokeStyle: config.color.wheels.replace('4', '8'),
          lineWidth: 2
        },
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002 | 0x0008 | 0x0004
        }
      }
    );

    // SUSPENSIÓN MEJORADA para absorber impactos sin empujar el puente
    const axleA = Constraint.create({
      bodyA: chassis,
      pointA: { x: -wheelOffsetX, y: config.chassis.height / 2 },
      bodyB: wheelA,
      stiffness: config.physics.stiffness,
      damping: config.physics.damping,
      length: config.wheels.offsetY - config.chassis.height / 2,
      render: { visible: false }
    });

    const axleB = Constraint.create({
      bodyA: chassis,
      pointA: { x: wheelOffsetX, y: config.chassis.height / 2 },
      bodyB: wheelB,
      stiffness: config.physics.stiffness,
      damping: config.physics.damping,
      length: config.wheels.offsetY - config.chassis.height / 2,
      render: { visible: false }
    });

    // ESTABILIZADORES ADICIONALES para evitar volcaduras
    const stabilizerA = Constraint.create({
      bodyA: chassis,
      pointA: { x: -wheelOffsetX * 0.5, y: -config.chassis.height / 3 },
      bodyB: wheelA,
      stiffness: config.physics.stiffness * 0.5,
      damping: config.physics.damping * 1.5,
      length: config.wheels.offsetY * 0.8,
      render: { visible: false }
    });

    const stabilizerB = Constraint.create({
      bodyA: chassis,
      pointA: { x: wheelOffsetX * 0.5, y: -config.chassis.height / 3 },
      bodyB: wheelB,
      stiffness: config.physics.stiffness * 0.5,
      damping: config.physics.damping * 1.5,
      length: config.wheels.offsetY * 0.8,
      render: { visible: false }
    });

    // Agregar elementos al mundo
    World.add(engineRef.current.world, [
      chassis, wheelA, wheelB, 
      axleA, axleB, 
      stabilizerA, stabilizerB
    ]);

    const newVehicle = {
      parts: { 
        chassis, wheelA, wheelB, 
        axleA, axleB, 
        stabilizerA, stabilizerB 
      },
      config: config,
      startTime: Date.now()
    };

    setVehicle(newVehicle);
    setVehicleProgress(0);
    setGameStatus("testing");

    setSettings(prev => ({
      ...prev,
      vehicleSpeed: config.speed,
      vehicleWeight: config.weight
    }));

    return newVehicle;
  }, [vehicle, settings.vehicleType, engineRef]);

  // SISTEMA DE MOVIMIENTO MEJORADO - Sin empujar el puente
  useEffect(() => {
    if (!isSimulating || !vehicle?.parts) return;

    const interval = setInterval(() => {
      try {
        const { chassis, wheelA, wheelB } = vehicle.parts;

        // SISTEMA DE PROPULSIÓN MEJORADO - Aplicar torque en lugar de velocidad directa
        const config = vehicle.config;
        const torqueForce = config.torque || 0.02;
        
        // Aplicar torque a las ruedas para movimiento más realista
        Body.setAngularVelocity(wheelA, Math.min(wheelA.angularVelocity + torqueForce, 0.3));
        Body.setAngularVelocity(wheelB, Math.min(wheelB.angularVelocity + torqueForce, 0.3));
        
        // Fuerza horizontal suave basada en la fricción de las ruedas
        const horizontalForce = config.speed * 1000;
        
        // Aplicar fuerza solo si el vehículo no está en el aire
        if (chassis.position.y > CANVAS_HEIGHT - 300) {
          Body.applyForce(chassis, chassis.position, { x: horizontalForce, y: 0 });
        }
        
        // ESTABILIZACIÓN ACTIVA - Evitar que el vehículo se vuelque
        if (Math.abs(chassis.angle) > 0.3) {
          const correctionTorque = -chassis.angle * 0.01;
          Body.setAngularVelocity(chassis, chassis.angularVelocity + correctionTorque);
        }

        // LIMITACIÓN DE VELOCIDAD para evitar empujar elementos
        const maxVelocity = 8;
        if (chassis.velocity.x > maxVelocity) {
          Body.setVelocity(chassis, { x: maxVelocity, y: chassis.velocity.y });
        }
        if (wheelA.velocity.x > maxVelocity) {
          Body.setVelocity(wheelA, { x: maxVelocity, y: wheelA.velocity.y });
        }
        if (wheelB.velocity.x > maxVelocity) {
          Body.setVelocity(wheelB, { x: maxVelocity, y: wheelB.velocity.y });
        }

        // Calcular progreso
        const progress = Math.min((chassis.position.x - 150) / (CANVAS_WIDTH - 300) * 100, 100);
        setVehicleProgress(progress);

        // Verificar condiciones de éxito/fallo
        if (progress >= 95) {
          setGameStatus("success");
          setIsSimulating(false);
        }

        // Verificar si cayó al agua (más margen)
        if (chassis.position.y > CANVAS_HEIGHT - 120) {
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
          BridgeX
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
          <div className="lg:col-span-4">
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
          <p>BridgeX - Construye, prueba y optimiza tus diseños de puentes</p>
          <p className="mt-1">Los nodos ahora se mantienen fijos en su posición hasta que pruebes la simulación</p>
        </div>
      </div>
    </div>
  );
}