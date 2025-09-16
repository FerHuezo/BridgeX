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
    chassis: { width: 60, height: 20, density: 0.003 },
    wheels: { radius: 12, density: 0.008, offsetY: 16 },
    color: { chassis: "#DC2626", wheels: "#000000" },
    physics: {
      friction: 0.8,
      wheelFriction: 1.0,
      restitution: 0.05,
      stiffness: 1.2,
      damping: 0.3
    },
    speed: 0.00002, // Reducido para inicio más suave
    weight: 1200,
    torque: 0.01 // Reducido para menos impulso inicial
  },
  
  truck: {
    name: "🚛 Camión Pesado",
    description: "Vehículo pesado de carga, lento pero resistente",
    chassis: { width: 84, height: 30, density: 0.008 },
    wheels: { radius: 16, density: 0.015, offsetY: 22 },
    color: { chassis: "#F97316", wheels: "#1C1917" },
    physics: {
      friction: 1.0,
      wheelFriction: 2.5,
      restitution: 0.02,
      stiffness: 1.8,
      damping: 0.4
    },
    speed: 0.0002, // Reducido para inicio más suave
    weight: 8000,
    torque: 0.008 // Reducido para menos impulso inicial
  },
  
  bus: {
    name: "🚌 Autobús",
    description: "Vehículo largo para pasajeros",
    chassis: { width: 96, height: 32, density: 0.008 },
    wheels: { radius: 14, density: 0.010, offsetY: 20 },
    color: { chassis: "#EAB308", wheels: "#27272A" },
    physics: {
      friction: 0.8,
      wheelFriction: 1.5,
      restitution: 0.05,
      stiffness: 1.2,
      damping: 0.3
    },
    speed: 0.0003, // Reducido para inicio más suave
    weight: 5500,
    torque: 0.009 // Reducido para menos impulso inicial
  },
  
  motorcycle: {
    name: "🏍️ Motocicleta",
    description: "Vehículo muy ligero y ágil",
    chassis: { width: 48, height: 14, density: 0.0008 },
    wheels: { radius: 10, density: 0.0015, offsetY: 12 },
    color: { chassis: "#059669", wheels: "#1F2937" },
    physics: {
      friction: 0.5,
      wheelFriction: 1.0,
      restitution: 0.15,
      stiffness: 0.6,
      damping: 0.2
    },
    speed: 0.0006, // Reducido para inicio más suave
    weight: 250,
    torque: 0.012 // Reducido para menos impulso inicial
  },
  
  tank: {
    name: "🚜 Tanque Militar",
    description: "Vehículo blindado super pesado",
    chassis: { width: 72, height: 26, density: 0.008 },
    wheels: { radius: 13, density: 0.010, offsetY: 18 },
    color: { chassis: "#4B5563", wheels: "#111827" },
    physics: {
      friction: 1.2,
      wheelFriction: 2.5,
      restitution: 0.005,
      stiffness: 1.0,
      damping: 0.5
    },
    speed: 0.0002, // Reducido para inicio más suave
    weight: 15000,
    torque: 0.006 // Reducido para menos impulso inicial
  },
  
  formula1: {
    name: "🏎️ Fórmula 1",
    description: "Carro de carreras ultra rápido",
    chassis: { width: 66, height: 16, density: 0.0012 },
    wheels: { radius: 10, density: 0.002, offsetY: 14 },
    color: { chassis: "#EF4444", wheels: "#0F172A" },
    physics: {
      friction: 0.3,
      wheelFriction: 0.8,
      restitution: 0.2,
      stiffness: 0.4,
      damping: 0.15
    },
    speed: 0.0007, // Reducido para inicio más suave
    weight: 800,
    torque: 0.017 // Reducido para menos impulso inicial
  },
  
  monster_truck: {
    name: "🚙 Monster Truck",
    description: "Camioneta con ruedas gigantes",
    chassis: { width: 78, height: 22, density: 0.007 },
    wheels: { radius: 22, density: 0.012, offsetY: 28 },
    color: { chassis: "#8B5CF6", wheels: "#1E1B4B" },
    physics: {
      friction: 0.8,
      wheelFriction: 1.6,
      restitution: 0.4,
      stiffness: 1.0,
      damping: 0.3
    },
    speed: 0.0004, // Reducido para inicio más suave
    weight: 4500,
    torque: 0.011 // Reducido para menos impulso inicial
  }
};

// Configuración responsive del canvas
const getCanvasSize = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  let width, height;
  
  if (screenWidth >= 1400) {
    width = 1200;
    height = 600;
  } else if (screenWidth >= 1024) {
    width = Math.min(1000, screenWidth - 200);
    height = 500;
  } else if (screenWidth >= 768) {
    width = screenWidth - 60;
    height = 450;
  } else {
    width = screenWidth - 20;
    height = 400;
  }
  
  return { width, height };
};

const INITIAL_CANVAS_SIZE = getCanvasSize();

export default function App() {
  const sceneRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(INITIAL_CANVAS_SIZE);

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
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [bridgeIntegrity, setBridgeIntegrity] = useState(100);
  const [vehicleProgress, setVehicleProgress] = useState(0);
  const [gameStatus, setGameStatus] = useState("building");

  // NUEVO ESTADO PARA CONTROL DE ACELERACIÓN GRADUAL
  const [vehicleAcceleration, setVehicleAcceleration] = useState(0);

  // Configuraciones iniciales actualizadas
  const [settings, setSettings] = useState({
    gravity: 0.8,
    vehicleType: 'car',
    vehicleSpeed: 0.0003, // Velocidad inicial reducida
    vehicleWeight: 1200,
    stressThreshold: 0.65,
    showStress: true,
    autoBreak: true
  });

  // Manejo responsive
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize();
      setCanvasSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hooks personalizados
  const { engineRef, renderRef, initializeEngine, createTerrain } = usePhysicsEngine(settings, canvasSize);

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

  // FUNCIÓN DE DETECCIÓN DE ESTRÉS ACTUALIZADA PARA SISTEMA HÍBRIDO
  const detectAndBreakOverstressedBeams = useCallback(() => {
    if (!beamConstraints.length) return;

    const toRemove = [];
    beamConstraints.forEach((beamSystem, i) => {
      const meta = beamMetaRef.current[i];
      if (!meta) return;

      const node1 = nodeBodies[meta.startIdx];
      const node2 = nodeBodies[meta.endIdx];
      
      if (!node1 || !node2) return;

      const dx = node2.position.x - node1.position.x;
      const dy = node2.position.y - node1.position.y;
      const currentLength = Math.hypot(dx, dy);
      const restLength = meta.originalLength;

      // Calcular estrés basado en deformación
      const deformationStress = Math.abs(currentLength - restLength) / restLength;
      
      // Estrés adicional por movimiento de la viga física (si existe)
      let physicsStress = 0;
      if (beamSystem.beamBody) {
        const beamVelocity = Math.hypot(beamSystem.beamBody.velocity.x, beamSystem.beamBody.velocity.y);
        const beamRotation = Math.abs(beamSystem.beamBody.angularVelocity);
        physicsStress = (beamVelocity * 0.01) + (beamRotation * 0.1);
      }
      
      const totalStress = deformationStress + physicsStress;
      stressLevelsRef.current[i] = totalStress;

      // Actualizar color del constraint visual basado en estrés
      if (beamSystem.visualConstraint && beamSystem.visualConstraint.render) {
        let color;
        if (totalStress > 0.8) {
          color = "#DC2626";
        } else if (totalStress > 0.6) {
          color = "#EA580C";
        } else if (totalStress > 0.4) {
          color = "#F59E0B";
        } else if (totalStress > 0.2) {
          color = "#84CC16";
        } else {
          color = "#10B981";
        }
        
        beamSystem.visualConstraint.render.strokeStyle = color;
        beamSystem.visualConstraint.render.lineWidth = Math.max(4, 4 + totalStress * 4);
      }

      const adjustedThreshold = settings.stressThreshold * (1 + Math.random() * 0.2);
      
      if (totalStress > adjustedThreshold) {
        toRemove.push(i);
      }
    });

    if (toRemove.length > 0) {
      const integrityLoss = toRemove.length * (15 + Math.random() * 10);
      setBridgeIntegrity(prev => Math.max(0, prev - integrityLoss));

      toRemove.sort((a, b) => b - a).forEach(idx => {
        const beamSystem = beamConstraints[idx];
        
        // Remover todos los componentes del sistema híbrido
        World.remove(engineRef.current.world, [
          beamSystem.beamBody,
          beamSystem.visualConstraint,
          beamSystem.physicsConstraint1,
          beamSystem.physicsConstraint2
        ]);
        
        beamConstraints.splice(idx, 1);
        beamMetaRef.current.splice(idx, 1);
        stressLevelsRef.current.splice(idx, 1);
      });

      setBeamConstraints([...beamConstraints]);
      
      if (toRemove.length >= 3) {
        setBridgeIntegrity(prev => Math.max(0, prev - 30));
        if (bridgeIntegrity <= 20) {
          setGameStatus("failed");
          setIsSimulating(false);
        }
      }
    }
  }, [beamConstraints, settings.stressThreshold, nodeBodies, bridgeIntegrity, engineRef]);

  // Función de visualización de estrés actualizada para sistema híbrido
  const updateStressVisualization = useCallback(() => {
    if (!settings.showStress) {
      beamConstraints.forEach((beamSystem) => {
        if (beamSystem.visualConstraint && beamSystem.visualConstraint.render) {
          beamSystem.visualConstraint.render.strokeStyle = "#374151";
          beamSystem.visualConstraint.render.lineWidth = 4;
        }
      });
      return;
    }

    beamConstraints.forEach((beamSystem, i) => {
      const stressLevel = stressLevelsRef.current[i] || 0;
      if (beamSystem.visualConstraint && beamSystem.visualConstraint.render) {
        let color;
        
        if (stressLevel > 0.9) {
          color = "#B91C1C";
        } else if (stressLevel > 0.7) {
          color = "#DC2626";
        } else if (stressLevel > 0.5) {
          color = "#EA580C";
        } else if (stressLevel > 0.3) {
          color = "#F59E0B";
        } else if (stressLevel > 0.1) {
          color = "#84CC16";
        } else {
          color = "#10B981";
        }
        
        beamSystem.visualConstraint.render.strokeStyle = color;
        beamSystem.visualConstraint.render.lineWidth = Math.max(4, 4 + stressLevel * 4);
      }
    });
  }, [beamConstraints, settings.showStress, stressLevelsRef]);

  // Inicialización del motor de física
  useEffect(() => {
    if (sceneRef.current) {
      return initializeEngine(sceneRef.current);
    }
  }, [initializeEngine, canvasSize]);

  // Actualizar gravedad
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gravity.y = settings.gravity;
    }
  }, [settings.gravity]);

  // Obtener posición del mouse (escalada para el nuevo tamaño)
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

  // FUNCIÓN DE SPAWN DE VEHÍCULO ACTUALIZADA
  const spawnVehicle = useCallback(() => {
    if (!engineRef.current) return;

    if (vehicle?.parts) {
      Object.values(vehicle.parts).forEach(part => {
        if (part.type === 'body' || part.type === 'constraint') {
          World.remove(engineRef.current.world, part);
        }
      });
    }

    const config = VEHICLE_CONFIGS[settings.vehicleType || 'car'];
    const startX = canvasSize.width * 0.125;
    const startY = canvasSize.height - (canvasSize.height * 0.25);

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
    setVehicleAcceleration(0); // RESETEAR ACELERACIÓN
    setGameStatus("testing");

    setSettings(prev => ({
      ...prev,
      vehicleSpeed: config.speed,
      vehicleWeight: config.weight
    }));

    return newVehicle;
  }, [vehicle, settings.vehicleType, engineRef, canvasSize]);

  // SISTEMA DE MOVIMIENTO ACTUALIZADO CON ACELERACIÓN GRADUAL
  useEffect(() => {
    if (!isSimulating || !vehicle?.parts) return;

    const interval = setInterval(() => {
      try {
        const { chassis, wheelA, wheelB } = vehicle.parts;
        const config = vehicle.config;
        
        // ACELERACIÓN GRADUAL - Los primeros 2 segundos
        const elapsedTime = (Date.now() - vehicle.startTime) / 1000;
        const accelerationPhase = Math.min(elapsedTime / 2, 1); // 2 segundos de aceleración gradual
        
        // Factor de aceleración suave (curva easing)
        const accelerationCurve = 0.5 * (1 - Math.cos(accelerationPhase * Math.PI));
        
        // Aplicar torque gradualmente
        const currentTorque = config.torque * accelerationCurve;
        const currentSpeed = config.speed * accelerationCurve * 1000;
        
        // Aplicar torque a las ruedas de forma más suave
        const maxAngularVelocity = 0.2 * accelerationCurve; // Velocidad angular máxima gradual
        
        Body.setAngularVelocity(wheelA, Math.min(wheelA.angularVelocity + currentTorque, maxAngularVelocity));
        Body.setAngularVelocity(wheelB, Math.min(wheelB.angularVelocity + currentTorque, maxAngularVelocity));
        
        // Fuerza horizontal gradual
        if (chassis.position.y > canvasSize.height - (canvasSize.height * 0.4)) {
          Body.applyForce(chassis, chassis.position, { x: currentSpeed, y: 0 });
        }
        
        // Control de estabilidad más suave
        if (Math.abs(chassis.angle) > 0.3) {
          const correctionTorque = -chassis.angle * 0.005 * accelerationCurve; // Más suave
          Body.setAngularVelocity(chassis, chassis.angularVelocity + correctionTorque);
        }

        // Límite de velocidad gradual
        const maxVelocity = 6 * accelerationCurve; // Velocidad máxima gradual
        if (chassis.velocity.x > maxVelocity) {
          Body.setVelocity(chassis, { x: maxVelocity, y: chassis.velocity.y });
        }
        if (wheelA.velocity.x > maxVelocity) {
          Body.setVelocity(wheelA, { x: maxVelocity, y: wheelA.velocity.y });
        }
        if (wheelB.velocity.x > maxVelocity) {
          Body.setVelocity(wheelB, { x: maxVelocity, y: wheelB.velocity.y });
        }

        const progress = Math.min((chassis.position.x - canvasSize.width * 0.125) / (canvasSize.width * 0.75) * 100, 100);
        setVehicleProgress(progress);
        setVehicleAcceleration(accelerationCurve * 100); // Para mostrar progreso de aceleración

        if (progress >= 95) {
          setGameStatus("success");
          setIsSimulating(false);
        }

        if (chassis.position.y > canvasSize.height - (canvasSize.height * 0.15)) {
          setGameStatus("failed");
          setIsSimulating(false);
        }

        if (settings.autoBreak) {
          detectAndBreakOverstressedBeams();
        }

        updateStressVisualization();

      } catch (error) {
        console.error("Error en simulación:", error);
        setIsSimulating(false);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isSimulating, vehicle, settings, detectAndBreakOverstressedBeams, updateStressVisualization, canvasSize]);

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
    setVehicleAcceleration(0);
    updateStats();
  }, [engineRef, createTerrain, resetElements, updateStats]);

  // Control de simulación
  const toggleSimulation = useCallback(() => {
    if (!isSimulating) {
      // MANTENER NODOS ESTÁTICOS SIEMPRE - Solo permitir movimiento de vigas
      controlNodePhysics(false);
      spawnVehicle();
      setIsSimulating(true);
    } else {
      controlNodePhysics(true);
      setIsSimulating(false);
    }
  }, [isSimulating, vehicle, spawnVehicle, controlNodePhysics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              BridgeX
            </h1>
            
            {/* Controles principales en el header */}
            <div className="flex gap-2">
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
        </div>
      </div>

      <div className="container mx-auto px-2 md:px-4 py-4">
        {/* Herramientas de construcción */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-4">
          <BuildingTools
            tool={tool}
            setTool={setTool}
            isSimulating={isSimulating}
          />
        </div>

        {/* Layout principal responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Área de simulación - Ocupa toda la anchura en móvil, 3 columnas en desktop */}
          <div className="xl:col-span-3 order-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <StatusIndicators
                gameStatus={gameStatus}
                bridgeIntegrity={bridgeIntegrity}
                isSimulating={isSimulating}
                vehicleProgress={vehicleProgress}
                vehicleAcceleration={vehicleAcceleration}
              />

              {/* Canvas de simulación responsive */}
              <div className="relative overflow-hidden">
                <div
                  ref={sceneRef}
                  onClick={handleCanvasClick}
                  className="cursor-crosshair w-full"
                  style={{ 
                    width: canvasSize.width, 
                    height: canvasSize.height,
                    maxWidth: '100%'
                  }}
                />

                {/* Instrucciones superpuestas */}
                {!nodeBodies.length && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white p-4 md:p-6 rounded-lg text-center max-w-sm mx-4">
                      <h3 className="text-lg md:text-xl font-bold mb-2">¡Construye tu puente!</h3>
                      <p className="text-sm md:text-base">Los nodos permanecen fijos durante toda la simulación</p>
                      <p className="text-xs md:text-sm mt-2 opacity-75">
                        Solo las vigas pueden moverse y flexionarse
                      </p>
                    </div>
                  </div>
                )}

                {/* Indicador de aceleración durante simulación */}
                {isSimulating && vehicleAcceleration < 100 && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                    <div className="text-xs">Acelerando...</div>
                    <div className="w-24 bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-green-400 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${vehicleAcceleration}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral - Se muestra debajo en móvil, al lado en desktop */}
          <div className="xl:col-span-1 order-2 space-y-4">
            {/* Toggle para mostrar/ocultar paneles en móvil */}
            <div className="xl:hidden flex gap-2 mb-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showStats ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showInstructions ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Ayuda
              </button>
            </div>

            {/* Stats Panel - Siempre visible en desktop */}
            <div className={showStats || window.innerWidth >= 1280 ? 'block' : 'hidden'}>
              <StatsPanel gameStats={gameStats} />
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                showSettings={showSettings}
              />
            )}

            {/* Instructions Panel - Condicional en móvil */}
            <div className={showInstructions || window.innerWidth >= 1280 ? 'block' : 'hidden'}>
              <InstructionsPanel />
            </div>

            {/* Analysis Panel - Siempre visible */}
            <AnalysisPanel
              nodeBodies={nodeBodies}
              beamConstraints={beamConstraints}
              nodeMetaRef={nodeMetaRef}
              beamMetaRef={beamMetaRef}
            />

            {/* Results Panel */}
            <ResultsPanel
              gameStatus={gameStatus}
              vehicleProgress={vehicleProgress}
              bridgeIntegrity={bridgeIntegrity}
            />
          </div>
        </div>

        {/* Footer responsivo */}
        <div className="mt-6 text-center text-gray-500 text-xs md:text-sm px-4">
          <p className="mb-1">BridgeX - Construye, prueba y optimiza tus diseños de puentes</p>
          <p className="hidden md:block">Los nodos permanecen completamente fijos - Solo las vigas pueden flexionarse</p>
        </div>
      </div>
    </div>
  );
}