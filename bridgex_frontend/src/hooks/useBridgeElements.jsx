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
  }, [nodeBodies, engineRef, updateStats]);

  const removeElement = useCallback((x, y) => {
    const nodeIdx = nodeBodies.findIndex(b => 
      Math.hypot(b.position.x - x, b.position.y - y) < 20
    );
    
    if (nodeIdx >= 0) {
      const body = nodeBodies[nodeIdx];
      
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
  }, [nodeBodies]);

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