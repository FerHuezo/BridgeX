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
      friction: 1.0,
      restitution: 0.05,
      frictionAir: 0.1,
      density: 0.001, // Densidad uniforme para todos los nodos
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

    // TODOS LOS NODOS SON ESTÁTICOS SIEMPRE
    Body.setStatic(node, true);
    World.add(engineRef.current.world, node);

    const id = nextNodeId;
    nodeMetaRef.current.push({ 
      id, 
      support: { ux: true, uy: true }, // TODOS LOS NODOS TIENEN SOPORTE COMPLETO
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

    // CREAR CUERPO FÍSICO INVISIBLE PARA COLISIÓN (pero más estable)
    const beamBody = Bodies.rectangle(
      centerX,
      centerY,
      len,
      6, // Grosor para colisión
      {
        angle: angle,
        isStatic: false,
        density: 0.001, // Muy liviano para que no afecte mucho la física
        friction: 0.8,
        restitution: 0.01,
        frictionAir: 0.01,
        render: {
          visible: false // INVISIBLE - no se dibuja
        },
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001 // Solo colisiona con vehículos
        }
      }
    );

    // CONSTRAINT VISUAL entre nodos (lo que se ve)
    const visualConstraint = Constraint.create({
      bodyA: bodyA,
      bodyB: bodyB,
      length: len,
      stiffness: 0.9,
      damping: 0.1,
      render: {
        visible: true,
        lineWidth: 4,
        strokeStyle: "#374151",
        type: "line"
      }
    });

    // CONSTRAINTS FÍSICOS para conectar el cuerpo invisible a los nodos
    const physicsConstraint1 = Constraint.create({
      bodyA: bodyA,
      bodyB: beamBody,
      pointB: { x: -len/2, y: 0 },
      stiffness: 0.9,
      damping: 0.1,
      length: 0,
      render: { visible: false }
    });

    const physicsConstraint2 = Constraint.create({
      bodyA: bodyB,
      bodyB: beamBody,
      pointB: { x: len/2, y: 0 },
      stiffness: 0.9,
      damping: 0.1,
      length: 0,
      render: { visible: false }
    });

    // Agregar todo al mundo
    World.add(engineRef.current.world, [
      beamBody, 
      visualConstraint, 
      physicsConstraint1, 
      physicsConstraint2
    ]);

    // Sistema de viga híbrido
    const beamSystem = {
      beamBody: beamBody, // Para colisión física
      visualConstraint: visualConstraint, // Para visualización
      physicsConstraint1: physicsConstraint1,
      physicsConstraint2: physicsConstraint2,
      constraint: visualConstraint, // Para compatibilidad con código de estrés
      length: len,
      bodyA: bodyA,
      bodyB: bodyB,
      render: visualConstraint.render
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
        
        // Remover todos los componentes del sistema híbrido
        World.remove(engineRef.current.world, [
          beamSystem.beamBody,
          beamSystem.visualConstraint,
          beamSystem.physicsConstraint1,
          beamSystem.physicsConstraint2
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
      if (!beamSystem.visualConstraint) return false;
      
      // Verificar si el click está cerca de la línea de la viga
      const bodyA = beamSystem.bodyA;
      const bodyB = beamSystem.bodyB;
      
      if (!bodyA || !bodyB) return false;
      
      // Calcular distancia del punto a la línea
      const A = bodyA.position.x;
      const B = bodyA.position.y;
      const C = bodyB.position.x;
      const D = bodyB.position.y;
      
      const lengthSquared = (C - A) * (C - A) + (D - B) * (D - B);
      if (lengthSquared === 0) return false;
      
      const t = Math.max(0, Math.min(1, ((x - A) * (C - A) + (y - B) * (D - B)) / lengthSquared));
      const projection = {
        x: A + t * (C - A),
        y: B + t * (D - B)
      };
      
      const distance = Math.hypot(x - projection.x, y - projection.y);
      return distance < 15; // Tolerancia para click en viga
    });

    if (beamIdx >= 0) {
      const beamSystem = beamConstraints[beamIdx];
      
      // Remover todos los componentes del sistema híbrido
      World.remove(engineRef.current.world, [
        beamSystem.beamBody,
        beamSystem.visualConstraint,
        beamSystem.physicsConstraint1,
        beamSystem.physicsConstraint2
      ]);
      
      beamConstraints.splice(beamIdx, 1);
      beamMetaRef.current.splice(beamIdx, 1);
      stressLevelsRef.current.splice(beamIdx, 1);

      setBeamConstraints([...beamConstraints]);
      updateStats();
    }
  }, [nodeBodies, beamConstraints, engineRef, updateStats]);

  const applyLoadToNode = useCallback((nodeIdx, fy) => {
    // NOTA: Como los nodos son estáticos, las cargas se aplicarán principalmente 
    // a las vigas conectadas durante la simulación
    const meta = nodeMetaRef.current[nodeIdx];
    if (meta) {
      meta.load = { fx: 0, fy };
      meta.isLoad = true;
      // Cambiar color para indicar que tiene carga
      if (nodeBodies[nodeIdx]) {
        nodeBodies[nodeIdx].render.fillStyle = "#F59E0B";
      }
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
    // LOS NODOS SIEMPRE PERMANECEN ESTÁTICOS
    nodeBodies.forEach((body) => {
      Body.setStatic(body, true); // Siempre estáticos
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
    });

    // Control de las vigas híbridas
    beamConstraints.forEach(beamSystem => {
      if (beamSystem.beamBody) {
        if (makeStatic) {
          // Al parar simulación, detener movimiento de las vigas de colisión
          Body.setVelocity(beamSystem.beamBody, { x: 0, y: 0 });
          Body.setAngularVelocity(beamSystem.beamBody, 0);
        } else {
          // Durante simulación, asegurar propiedades correctas
          Body.setStatic(beamSystem.beamBody, false);
          beamSystem.beamBody.friction = 0.8;
          beamSystem.beamBody.frictionAir = 0.01;
          beamSystem.beamBody.restitution = 0.01;
        }
      }
      
      // Mantener constraints visuales
      if (beamSystem.visualConstraint) {
        beamSystem.visualConstraint.stiffness = 0.9;
        beamSystem.visualConstraint.damping = 0.1;
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