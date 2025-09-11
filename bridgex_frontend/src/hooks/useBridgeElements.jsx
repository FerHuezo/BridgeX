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
      friction: 0.8,
      restitution: 0.1,
      frictionAir: 0.01,
      density: 0.001,
      render: { 
        fillStyle: color,
        strokeStyle: "#1F2937",
        lineWidth: 2
      },
      collisionFilter: {
        category: 0x0004, // Categoría de nodos
        mask: 0x0001 // Solo colisiona con vehículos si es necesario
      },
      isSupport,
      isLoad
    });

    // TODOS LOS NODOS SON ESTATICOS AL CREARLOS
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

    // CREAR VIGA COMO CUERPO FÍSICO SÓLIDO
    const beamBody = Bodies.rectangle(
      centerX,
      centerY,
      len, // longitud
      8,   // grosor
      {
        angle: angle,
        isStatic: false, // Dinámico para responder a fuerzas
        density: 0.001,
        friction: 0.8,
        restitution: 0.1,
        render: {
          fillStyle: "#374151",
          strokeStyle: "#1F2937",
          lineWidth: 2
        },
        collisionFilter: {
          category: 0x0002, // Categoría de vigas
          mask: 0x0001 | 0x0008 // Colisiona con vehículos y terreno
        }
      }
    );

    // CONECTAR LA VIGA A LOS NODOS CON CONSTRAINTS INVISIBLES
    // Constraint desde nodo A al extremo izquierdo de la viga
    const constraint1 = Constraint.create({
      bodyA: bodyA,
      bodyB: beamBody,
      pointB: { x: -len/2, y: 0 }, // Extremo izquierdo de la viga
      stiffness: 0.95,
      damping: 0.1,
      render: { visible: false }
    });

    // Constraint desde nodo B al extremo derecho de la viga
    const constraint2 = Constraint.create({
      bodyA: bodyB,
      bodyB: beamBody,
      pointB: { x: len/2, y: 0 }, // Extremo derecho de la viga
      stiffness: 0.95,
      damping: 0.1,
      render: { visible: false }
    });

    // Agregar todo al mundo
    World.add(engineRef.current.world, [beamBody, constraint1, constraint2]);

    // Crear el objeto combinado que reemplaza al constraint simple
    const beamSystem = {
      beamBody: beamBody,
      constraint1: constraint1,
      constraint2: constraint2,
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
      startIdx: startIdx, // Agregar índices para facilitar búsquedas
      endIdx: endIdx,
      area, 
      yield: yieldStrength,
      originalLength: len,
      constraint: beamSystem // Usar el sistema completo
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
        
        // Remover todos los componentes del sistema de viga
        World.remove(engineRef.current.world, [
          beamSystem.beamBody,
          beamSystem.constraint1,
          beamSystem.constraint2
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
      
      return distance < 20; // Área de click para vigas
    });

    if (beamIdx >= 0) {
      const beamSystem = beamConstraints[beamIdx];
      
      // Remover todos los componentes del sistema de viga
      World.remove(engineRef.current.world, [
        beamSystem.beamBody,
        beamSystem.constraint1,
        beamSystem.constraint2
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
        // Hacer dinámicos solo los nodos que NO son soportes
        if (meta && !meta.isSupport) {
          Body.setStatic(body, false);
        }
      }
    });

    // NUEVO: Controlar física de las vigas también
    beamConstraints.forEach(beamSystem => {
      if (beamSystem.beamBody) {
        if (makeStatic) {
          // Al parar simulación, las vigas se vuelven más rígidas
          Body.setStatic(beamSystem.beamBody, false); // Mantener dinámicas pero estables
          Body.setVelocity(beamSystem.beamBody, { x: 0, y: 0 });
          Body.setAngularVelocity(beamSystem.beamBody, 0);
        } else {
          // Durante simulación, las vigas responden normalmente
          Body.setStatic(beamSystem.beamBody, false);
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