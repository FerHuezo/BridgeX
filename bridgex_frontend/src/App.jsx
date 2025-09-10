import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings, Zap, Download, Upload, Info } from "lucide-react";

// Matter.js importado desde CDN
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint, Composite } = Matter;

export default function ImprovedBridgeGame() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);

  // Estados principales
  const [tool, setTool] = useState("node");
  const [nodeBodies, setNodeBodies] = useState([]);
  const [beamConstraints, setBeamConstraints] = useState([]);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [nextNodeId, setNextNodeId] = useState(0);
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
  const [gameStatus, setGameStatus] = useState("building"); // building, testing, success, failed
  
  // Configuraciones
  const [settings, setSettings] = useState({
    gravity: 0.8,
    vehicleSpeed: 0.0008,
    vehicleWeight: 3000,
    stressThreshold: 0.7,
    showStress: true,
    autoBreak: true
  });

  // Referencias para metadatos
  const nodeMetaRef = useRef([]);
  const beamMetaRef = useRef([]);
  const stressLevelsRef = useRef([]);

  // Parámetros físicos
  const defaultArea = 1e-4;
  const defaultYield = 250e6;
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 700;

  // Inicialización del motor de física
  useEffect(() => {
    const engine = Engine.create();
    engine.gravity.y = settings.gravity;
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: "linear-gradient(to bottom, #87CEEB, #98FB98)",
        showVelocity: false,
        showAngleIndicator: false,
        showDebug: false,
      },
    });
    renderRef.current = render;

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    // Crear terreno más realista
    createTerrain(engine);

    // Control de mouse mejorado
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { 
        stiffness: 0.2, 
        render: { visible: false },
        angularStiffness: 0
      },
    });
    mouseConstraintRef.current = mouseConstraint;
    World.add(engine.world, mouseConstraint);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      render.textures = {};
    };
  }, []);

  // Mostrar loading si Matter.js no está cargado
  if (!matterLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Matter.js...</p>
        </div>
      </div>
    );
  }

  // Crear terreno
  const createTerrain = (engine) => {
    // Suelo principal
    const ground = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 60, { 
      isStatic: true, 
      render: { 
        fillStyle: "#2d3748",
        strokeStyle: "#4a5568",
        lineWidth: 2
      } 
    });

    // Plataformas laterales (para start/end del puente)
    const leftPlatform = Bodies.rectangle(100, CANVAS_HEIGHT - 120, 180, 120, {
      isStatic: true,
      render: { fillStyle: "#4a5568" }
    });
    
    const rightPlatform = Bodies.rectangle(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 120, 180, 120, {
      isStatic: true,
      render: { fillStyle: "#4a5568" }
    });

    // Agua/vacío en el medio
    const water = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 80, 600, 40, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "#4299e1" }
    });

    World.add(engine.world, [ground, leftPlatform, rightPlatform, water]);
  };

  // Actualizar gravedad cuando cambian los settings
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

  // Añadir nodo con efectos visuales mejorados
  const addNode = useCallback((x, y, isSupport = false, isLoad = false) => {
    if (!engineRef.current) return;

    const radius = isSupport ? 15 : (isLoad ? 12 : 8);
    const color = isSupport ? "#10B981" : (isLoad ? "#F59E0B" : "#3B82F6");
    
    const node = Bodies.circle(x, y, radius, {
      inertia: Infinity,
      friction: 0.4,
      restitution: 0.2,
      render: { 
        fillStyle: color,
        strokeStyle: "#1F2937",
        lineWidth: 2
      },
      isSupport,
      isLoad
    });

    if (isSupport) {
      Body.setStatic(node, true);
    }

    World.add(engineRef.current.world, node);

    const id = nextNodeId;
    nodeMetaRef.current.push({ 
      id, 
      support: { ux: isSupport, uy: isSupport }, 
      load: { fx: 0, fy: 0 },
      isSupport,
      isLoad
    });
    setNextNodeId(n => n + 1);
    setNodeBodies(prev => [...prev, node]);
    
    updateStats();
    return id;
  }, [nextNodeId]);

  // Añadir viga con visualización de estrés
  const addBeam = useCallback((startIdx, endIdx, area = defaultArea, yieldStrength = defaultYield) => {
    if (!engineRef.current || !nodeBodies[startIdx] || !nodeBodies[endIdx]) return;

    const bodyA = nodeBodies[startIdx];
    const bodyB = nodeBodies[endIdx];
    const len = Math.hypot(bodyB.position.x - bodyA.position.x, bodyB.position.y - bodyA.position.y);

    const constraint = Constraint.create({
      bodyA,
      bodyB,
      length: len,
      stiffness: 0.9,
      render: { 
        strokeStyle: "#374151",
        lineWidth: 8,
        type: "line"
      },
    });

    World.add(engineRef.current.world, constraint);

    const id = beamMetaRef.current.length;
    beamMetaRef.current.push({ 
      id, 
      start: nodeMetaRef.current[startIdx]?.id, 
      end: nodeMetaRef.current[endIdx]?.id, 
      area, 
      yield: yieldStrength,
      originalLength: len,
      constraint
    });
    
    setBeamConstraints(prev => [...prev, constraint]);
    stressLevelsRef.current.push(0);
    
    updateStats();
    return id;
  }, [nodeBodies]);

  // Aplicar carga a un nodo
  const applyLoadToNode = useCallback((nodeIdx, fy) => {
    const body = nodeBodies[nodeIdx];
    if (!body) return;
    
    const forceVec = { x: 0, y: fy * 0.0001 };
    Body.applyForce(body, body.position, forceVec);

    const meta = nodeMetaRef.current[nodeIdx];
    if (meta) {
      meta.load = { fx: 0, fy };
      meta.isLoad = true;
      // Cambiar color del nodo para indicar carga
      body.render.fillStyle = "#F59E0B";
    }
  }, [nodeBodies]);

  // Eliminar elementos
  const removeElement = useCallback((x, y) => {
    // Buscar nodo cercano
    const nodeIdx = nodeBodies.findIndex(b => 
      Math.hypot(b.position.x - x, b.position.y - y) < 20
    );
    
    if (nodeIdx >= 0) {
      const body = nodeBodies[nodeIdx];
      
      // Remover constraints conectados
      const connectedConstraints = beamConstraints.filter(c => 
        c.bodyA === body || c.bodyB === body
      );
      
      connectedConstraints.forEach(constraint => {
        const constraintIdx = beamConstraints.indexOf(constraint);
        if (constraintIdx >= 0) {
          World.remove(engineRef.current.world, constraint);
          beamConstraints.splice(constraintIdx, 1);
          beamMetaRef.current.splice(constraintIdx, 1);
          stressLevelsRef.current.splice(constraintIdx, 1);
        }
      });

      World.remove(engineRef.current.world, body);
      nodeBodies.splice(nodeIdx, 1);
      nodeMetaRef.current.splice(nodeIdx, 1);
      
      setNodeBodies([...nodeBodies]);
      setBeamConstraints([...beamConstraints]);
      updateStats();
    }
  }, [nodeBodies, beamConstraints]);

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
          // Reset visual selection
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

  // Crear vehículo mejorado
  const spawnVehicle = useCallback(() => {
    if (!engineRef.current) return;

    // Limpiar vehículo anterior
    if (vehicle?.parts) {
      Object.values(vehicle.parts).forEach(part => {
        if (part.type === 'body' || part.type === 'constraint') {
          World.remove(engineRef.current.world, part);
        }
      });
    }

    const startX = 100;
    const startY = CANVAS_HEIGHT - 200;

    // Chasis más realista
    const chassis = Bodies.rectangle(startX, startY, 100, 30, {
      density: 0.002,
      friction: 0.6,
      render: { 
        fillStyle: "#EF4444",
        strokeStyle: "#991B1B",
        lineWidth: 2
      }
    });

    // Ruedas con mejor física
    const wheelA = Bodies.circle(startX - 35, startY + 25, 18, {
      density: 0.004,
      friction: 1.2,
      restitution: 0.1,
      render: { 
        fillStyle: "#1F2937",
        strokeStyle: "#374151",
        lineWidth: 2
      }
    });

    const wheelB = Bodies.circle(startX + 35, startY + 25, 18, {
      density: 0.004,
      friction: 1.2,
      restitution: 0.1,
      render: { 
        fillStyle: "#1F2937",
        strokeStyle: "#374151",
        lineWidth: 2
      }
    });

    // Suspensión
    const axleA = Constraint.create({
      bodyA: chassis,
      pointA: { x: -35, y: 15 },
      bodyB: wheelA,
      stiffness: 0.8,
      length: 10,
      render: { visible: false }
    });

    const axleB = Constraint.create({
      bodyA: chassis,
      pointB: { x: 35, y: 15 },
      bodyB: wheelB,
      stiffness: 0.8,
      length: 10,
      render: { visible: false }
    });

    World.add(engineRef.current.world, [chassis, wheelA, wheelB, axleA, axleB]);

    const newVehicle = {
      parts: { chassis, wheelA, wheelB, axleA, axleB },
      startTime: Date.now()
    };

    setVehicle(newVehicle);
    setVehicleProgress(0);
    setGameStatus("testing");
    
    return newVehicle;
  }, [vehicle]);

  // Simulación del vehículo y detección de estrés
  useEffect(() => {
    if (!isSimulating || !vehicle?.parts) return;

    const interval = setInterval(() => {
      try {
        const { chassis, wheelA, wheelB } = vehicle.parts;
        
        // Aplicar fuerza de movimiento
        const force = { x: settings.vehicleSpeed, y: 0 };
        Body.applyForce(wheelA, wheelA.position, force);
        Body.applyForce(wheelB, wheelB.position, force);

        // Calcular progreso
        const progress = Math.min((chassis.position.x - 100) / (CANVAS_WIDTH - 200) * 100, 100);
        setVehicleProgress(progress);

        // Verificar si llegó al final
        if (progress >= 95) {
          setGameStatus("success");
          setIsSimulating(false);
        }

        // Verificar si cayó
        if (chassis.position.y > CANVAS_HEIGHT - 100) {
          setGameStatus("failed");
          setIsSimulating(false);
        }

        // Detectar y romper vigas sobrecargadas
        if (settings.autoBreak) {
          detectAndBreakOverstressedBeams();
        }

        // Actualizar niveles de estrés para visualización
        updateStressVisualization();

      } catch (error) {
        console.error("Error en simulación:", error);
        setIsSimulating(false);
      }
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [isSimulating, vehicle, settings]);

  // Detección de estrés mejorada
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

  // Actualizar visualización de estrés
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

  // Actualizar estadísticas
  const updateStats = useCallback(() => {
    const cost = nodeBodies.length * 50 + beamConstraints.length * 100;
    const avgStress = stressLevelsRef.current.reduce((a, b) => a + b, 0) / 
                     (stressLevelsRef.current.length || 1);

    setGameStats({
      nodes: nodeBodies.length,
      beams: beamConstraints.length,
      cost,
      stress: Math.round(avgStress * 100)
    });
  }, [nodeBodies.length, beamConstraints.length]);

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
  }, [nodeBodies, settings]);

  // Resetear todo
  const resetAll = useCallback(() => {
    if (!engineRef.current) return;

    Composite.clear(engineRef.current.world, false);
    createTerrain(engineRef.current);
    
    nodeMetaRef.current = [];
    beamMetaRef.current = [];
    stressLevelsRef.current = [];
    
    setNodeBodies([]);
    setBeamConstraints([]);
    setVehicle(null);
    setIsSimulating(false);
    setSelectedNodeIdx(null);
    setGameStatus("building");
    setBridgeIntegrity(100);
    setVehicleProgress(0);
    setNextNodeId(0);
    updateStats();
  }, []);

  // Iniciar/parar simulación
  const toggleSimulation = useCallback(() => {
    if (!vehicle) {
      spawnVehicle();
    }
    setIsSimulating(!isSimulating);
  }, [isSimulating, vehicle, spawnVehicle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          Poly Bridge Simulator
        </h1>

        {/* Panel de herramientas superior */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {/* Herramientas de construcción */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: "node", label: "Nodo", icon: "⬤" },
                { id: "beam", label: "Viga", icon: "━" },
                { id: "support", label: "Soporte", icon: "▲" },
                { id: "load", label: "Carga", icon: "↓" },
                { id: "delete", label: "Borrar", icon: "✕" }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setTool(id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    tool === id
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Controles de simulación */}
            <div className="flex gap-2">
              <button
                onClick={toggleSimulation}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSimulating
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                {isSimulating ? "Parar" : "Probar"}
              </button>

              <button
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                <Settings size={16} />
                Config
              </button>

              <button
                onClick={exportDesign}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Área de simulación */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Indicadores de estado */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-4">
                    <span>Estado: <strong>{
                      gameStatus === "building" ? "Construyendo" :
                      gameStatus === "testing" ? "Probando" :
                      gameStatus === "success" ? "¡Éxito!" :
                      "Falló"
                    }</strong></span>
                    <span>Integridad: <strong>{bridgeIntegrity}%</strong></span>
                  </div>
                  {isSimulating && (
                    <div className="flex items-center gap-2">
                      <span>Progreso:</span>
                      <div className="w-32 bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all"
                          style={{ width: `${vehicleProgress}%` }}
                        />
                      </div>
                      <span><strong>{Math.round(vehicleProgress)}%</strong></span>
                    </div>
                  )}
                </div>
              </div>

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
                      <p>Selecciona una herramienta y haz clic en el canvas</p>
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
            {/* Estadísticas */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Info size={20} />
                Estadísticas
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nodos:</span>
                  <span className="font-medium">{gameStats.nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vigas:</span>
                  <span className="font-medium">{gameStats.beams}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo:</span>
                  <span className="font-medium text-green-600">${gameStats.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estrés Prom:</span>
                  <span className={`font-medium ${
                    gameStats.stress > 70 ? "text-red-600" :
                    gameStats.stress > 40 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {gameStats.stress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Configuraciones */}
            {showSettings && (
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
                      value={settings.vehicleType}
                      onChange={(e) => setSettings(prev => ({...prev, vehicleType: e.target.value}))}
                      className="w-full p-1 border rounded text-sm"
                      disabled={isSimulating}
                    >
                      <option value="car">🚗 Carro</option>
                      <option value="truck">🚛 Camión</option>
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
            )}

            {/* Instrucciones */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Instrucciones</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Nodo:</strong> Click para añadir puntos de conexión</div>
                <div><strong>Viga:</strong> Click en dos nodos para conectarlos</div>
                <div><strong>Soporte:</strong> Crea puntos fijos (verdes)</div>
                <div><strong>Carga:</strong> Aplica peso a un nodo</div>
                <div><strong>Borrar:</strong> Click en elementos para eliminar</div>
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

            {/* Análisis (para conexión con backend) */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Zap size={20} />
                Análisis Avanzado
              </h3>
              <button
                onClick={async () => {
                  try {
                    const designData = {
                      nodes: nodeMetaRef.current.map((meta, idx) => {
                        const body = nodeBodies[idx];
                        return [Math.round(body.position.x), Math.round(body.position.y)];
                      }),
                      beams: beamMetaRef.current.map(beam => ({
                        start: beam.start,
                        end: beam.end,
                        area: beam.area,
                        yield: beam.yield
                      })),
                      loads: nodeMetaRef.current
                        .map((meta, idx) => ({ 
                          node: meta.id, 
                          fx: meta.load?.fx || 0, 
                          fy: meta.load?.fy || 0 
                        }))
                        .filter(l => l.fy !== 0)
                    };

                    // Aquí puedes conectar con tu backend
                    console.log("Datos para análisis:", designData);
                    alert("Función de análisis preparada. Conecta con tu backend en /api/bridge/analyze");
                    
                    // const response = await fetch("/api/bridge/analyze", {
                    //   method: "POST",
                    //   headers: { "Content-Type": "application/json" },
                    //   body: JSON.stringify(designData)
                    // });
                    // const result = await response.json();
                    // alert(`Análisis:\n${JSON.stringify(result, null, 2)}`);
                  } catch (error) {
                    console.error("Error en análisis:", error);
                    alert("Error al analizar: " + error.message);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={!nodeBodies.length || !beamConstraints.length}
              >
                <Zap size={16} />
                Análisis Estructural
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Requiere al menos 1 nodo y 1 viga
              </p>
            </div>

            {/* Resultados del análisis */}
            {gameStatus !== "building" && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Resultados</h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-3 rounded-lg ${
                    gameStatus === "success" 
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                    <div className="font-medium">
                      {gameStatus === "success" ? "¡Éxito!" : "Puente Colapsado"}
                    </div>
                    <div className="text-xs mt-1">
                      {gameStatus === "success" 
                        ? "El vehículo cruzó exitosamente"
                        : "El puente no soportó el peso del vehículo"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">Progreso Final</div>
                      <div className="font-bold">{Math.round(vehicleProgress)}%</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">Integridad Final</div>
                      <div className="font-bold">{bridgeIntegrity}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Poly Bridge Simulator - Construye, prueba y optimiza tus diseños de puentes</p>
          <p className="mt-1">Usa las herramientas para crear una estructura que soporte el vehículo</p>
        </div>
      </div>
    </div>
  );
}