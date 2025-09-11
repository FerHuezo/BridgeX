import { useState, useRef, useCallback } from 'react';

// Matter.js importado desde CDN
const { Bodies, Body, World, Constraint, Composite } = Matter;

const DEFAULT_AREA = 1e-4;
const DEFAULT_YIELD = 250e6;

const useBridgeElements = (engineRef, updateStats) => {
  const [nodeBodies, setNodeBodies] = useState([]);
  const [beamConstraints, setBeamConstraints] = useState([]);
  const [nextNodeId, setNextNodeId] = useState(0);
  
  const nodeMetaRef = useRef([]);
  const beamMetaRef = useRef([]);
  const stressLevelsRef = useRef([]);

  const addNode = useCallback((x, y, isSupport = false, isLoad = false) => {
    if (!engineRef.current) return;

    const radius = isSupport ? 15 : (isLoad ? 12 : 8);
    const color = isSupport ? "#10B981" : (isLoad ? "#F59E0B" : "#3B82F6");
    
    const node = Bodies.circle(x, y, radius, {
      inertia: Infinity,
      friction: 1.0, // Aumentar fricción
      restitution: 0.05, // Reducir rebote
      frictionAir: 0.1, // Aumentar resistencia al aire
      density: isSupport ? 0.01 : 0.001, // Soportes más pesados
      render: { 
        fillStyle: color,
        strokeStyle: "#1F2937",
        lineWidth: 3
      },
      collisionFilter: {
        category: 0x0004, // Categoría de nodos
        mask: 0x0001 | 0x0008 // Colisiona con vehículos y terreno
      },
      isSupport,
      isLoad
    });

    // TODOS LOS NODOS SON ESTATICOS AL CREARLOS - Los soportes permanecen estáticos siempre
    Body.setStatic(node, true);
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
  }, [nextNodeId, engineRef, updateStats]);

  const addBeam = useCallback((startIdx, endIdx, area = DEFAULT_AREA, yieldStrength = DEFAULT_YIELD) => {
    if (!engineRef.current || !nodeBodies[startIdx] || !nodeBodies[endIdx]) return;

    const bodyA = nodeBodies[startIdx];
    const bodyB = nodeBodies[endIdx];
    
    // Verificar si ya existe una viga entre estos nodos
    const exists = beamMetaRef.current.some(beam =>
      (beam.startIdx === startIdx && beam.endIdx === endIdx) ||
      (beam.startIdx === endIdx && beam.endIdx === startIdx)
    );
    
    if (exists) return;

    const len = Math.hypot(bodyB.position.x - bodyA.position.x, bodyB.position.y - bodyA.position.y);
    
    // Calcular posición y ángulo de la viga
    const centerX = (bodyA.position.x + bodyB.position.x) / 2;
    const centerY = (bodyA.position.y + bodyB.position.y) / 2;
    const angle = Math.atan2(bodyB.position.y - bodyA.position.y, bodyB.position.x - bodyA.position.x);

    // CREAR VIGA COMO CUERPO FÍSICO MÁS ROBUSTO
    const beamBody = Bodies.rectangle(
      centerX,
      centerY,
      len, // longitud
      12,  // grosor aumentado para mayor estabilidad
      {
        angle: angle,
        isStatic: false,
        density: 0.005, // Aumentar densidad para mayor estabilidad
        friction: 1.0,  // Máxima fricción
        restitution: 0.01, // Minimizar rebote
        frictionAir: 0.05, // Resistencia al aire
        render: {
          fillStyle: "#374151",
          strokeStyle: "#1F2937",
          lineWidth: 3
        },
        collisionFilter: {
          category: 0x0002, // Categoría de vigas
          mask: 0x0001 | 0x0008 // Colisiona con vehículos y terreno
        }
      }
    );

    // CONEXIONES MÁS RÍGIDAS - Usar múltiples constraints para mayor estabilidad
    // Constraint principal para estructura
    const constraint1 = Constraint.create({
      bodyA: bodyA,
      bodyB: beamBody,
      pointB: { x: -len/2, y: 0 },
      stiffness: 1.0, // Máxima rigidez
      damping: 0.2,   // Amortiguación para evitar oscilaciones
      render: { visible: false }
    });

    const constraint2 = Constraint.create({
      bodyA: bodyB,
      bodyB: beamBody,
      pointB: { x: len/2, y: 0 },
      stiffness: 1.0, // Máxima rigidez
      damping: 0.2,   // Amortiguación para evitar oscilaciones
      render: { visible: false }
    });

    // CONSTRAINTS ADICIONALES PARA ESTABILIDAD ROTACIONAL
    const stabilizer1 = Constraint.create({
      bodyA: bodyA,
      bodyB: beamBody,
      pointB: { x: -len/2, y: -3 }, // Offset vertical para resistir rotación
      stiffness: 0.8,
      damping: 0.3,
      render: { visible: false }
    });

    const stabilizer2 = Constraint.create({
      bodyA: bodyB,
      bodyB: beamBody,
      pointB: { x: len/2, y: -3 }, // Offset vertical para resistir rotación
      stiffness: 0.8,
      damping: 0.3,
      render: { visible: false }
    });

    // Agregar todo al mundo
    World.add(engineRef.current.world, [beamBody, constraint1, constraint2, stabilizer1, stabilizer2]);

    // Crear el objeto combinado mejorado
    const beamSystem = {
      beamBody: beamBody,
      constraint1: constraint1,
      constraint2: constraint2,
      stabilizer1: stabilizer1,
      stabilizer2: stabilizer2,
      length: len,
      // Mantener propiedades compatibles con código existente
      bodyA: bodyA,
      bodyB: bodyB,
      render: beamBody.render
    };

    const id = beamMetaRef.current.length;
    beamMetaRef.current.push({ 
      id, 
      start: nodeMetaRef.current[startIdx]?.id, 
      end: nodeMetaRef.current[endIdx]?.id,
      startIdx: startIdx,
      endIdx: endIdx,
      area, 
      yield: yieldStrength,
      originalLength: len,
      constraint: beamSystem
    });
    
    setBeamConstraints(prev => [...prev, beamSystem]);
    stressLevelsRef.current.push(0);
    
    updateStats();
    return id;
  }, [nodeBodies, engineRef, updateStats]);

  const removeElement = useCallback((x, y) => {
    // Buscar nodo primero
    const nodeIdx = nodeBodies.findIndex(b => 
      Math.hypot(b.position.x - x, b.position.y - y) < 20
    );
    
    if (nodeIdx >= 0) {
      const body = nodeBodies[nodeIdx];
      
      // Buscar vigas conectadas a este nodo
      const connectedConstraints = [];
      beamConstraints.forEach((beamSystem, i) => {
        if (beamSystem.bodyA === body || beamSystem.bodyB === body) {
          connectedConstraints.push(i);
        }
      });
      
      // Remover vigas de atrás hacia adelante para no afectar índices
      connectedConstraints.reverse().forEach(constraintIdx => {
        const beamSystem = beamConstraints[constraintIdx];
        
        // Remover todos los componentes del sistema de viga mejorado
        World.remove(engineRef.current.world, [
          beamSystem.beamBody,
          beamSystem.constraint1,
          beamSystem.constraint2,
          beamSystem.stabilizer1,
          beamSystem.stabilizer2
        ]);
        
        beamConstraints.splice(constraintIdx, 1);
        beamMetaRef.current.splice(constraintIdx, 1);
        stressLevelsRef.current.splice(constraintIdx, 1);
      });

      // Remover el nodo
      World.remove(engineRef.current.world, body);
      nodeBodies.splice(nodeIdx, 1);
      nodeMetaRef.current.splice(nodeIdx, 1);
      
      setNodeBodies([...nodeBodies]);
      setBeamConstraints([...beamConstraints]);
      updateStats();
      return;
    }

    // Si no se encontró un nodo, buscar viga para eliminar
    const beamIdx = beamConstraints.findIndex(beamSystem => {
      const beamBody = beamSystem.beamBody;
      if (!beamBody) return false;
      
      // Verificar si el click está sobre la viga
      const dx = x - beamBody.position.x;
      const dy = y - beamBody.position.y;
      const distance = Math.hypot(dx, dy);
      
      return distance < 25; // Área de click aumentada para vigas más gruesas
    });

    if (beamIdx >= 0) {
      const beamSystem = beamConstraints[beamIdx];
      
      // Remover todos los componentes del sistema de viga mejorado
      World.remove(engineRef.current.world, [
        beamSystem.beamBody,
        beamSystem.constraint1,
        beamSystem.constraint2,
        beamSystem.stabilizer1,
        beamSystem.stabilizer2
      ]);
      
      beamConstraints.splice(beamIdx, 1);
      beamMetaRef.current.splice(beamIdx, 1);
      stressLevelsRef.current.splice(beamIdx, 1);

      setBeamConstraints([...beamConstraints]);
      updateStats();
    }
  }, [nodeBodies, beamConstraints, engineRef, updateStats]);

  const applyLoadToNode = useCallback((nodeIdx, fy) => {
    const body = nodeBodies[nodeIdx];
    if (!body) return;
    
    const forceVec = { x: 0, y: fy * 0.0001 };
    Body.applyForce(body, body.position, forceVec);

    const meta = nodeMetaRef.current[nodeIdx];
    if (meta) {
      meta.load = { fx: 0, fy };
      meta.isLoad = true;
      body.render.fillStyle = "#F59E0B";
    }
  }, [nodeBodies]);

  const resetElements = useCallback(() => {
    nodeMetaRef.current = [];
    beamMetaRef.current = [];
    stressLevelsRef.current = [];
    setNodeBodies([]);
    setBeamConstraints([]);
    setNextNodeId(0);
  }, []);

  const controlNodePhysics = useCallback((makeStatic) => {
    nodeBodies.forEach((body, idx) => {
      const meta = nodeMetaRef.current[idx];
      if (makeStatic) {
        // Hacer todos los nodos estáticos
        Body.setStatic(body, true);
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
      } else {
        // Los SOPORTES siempre permanecen estáticos
        if (meta && meta.isSupport) {
          Body.setStatic(body, true);
        } else {
          // Solo los nodos normales se vuelven dinámicos
          Body.setStatic(body, false);
          // Aplicar propiedades de estabilidad
          body.friction = 1.0;
          body.frictionAir = 0.1;
          body.restitution = 0.05;
        }
      }
    });

    // Controlar física de las vigas para mayor estabilidad
    beamConstraints.forEach(beamSystem => {
      if (beamSystem.beamBody) {
        if (makeStatic) {
          // Al parar simulación, estabilizar vigas
          Body.setStatic(beamSystem.beamBody, false);
          Body.setVelocity(beamSystem.beamBody, { x: 0, y: 0 });
          Body.setAngularVelocity(beamSystem.beamBody, 0);
        } else {
          // Durante simulación, aplicar propiedades de estabilidad
          Body.setStatic(beamSystem.beamBody, false);
          beamSystem.beamBody.friction = 1.0;
          beamSystem.beamBody.frictionAir = 0.05;
          beamSystem.beamBody.restitution = 0.01;
        }
      }
    });
  }, [nodeBodies, beamConstraints]);

  return {
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
  };
};

export default useBridgeElements;