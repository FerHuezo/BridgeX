import { useRef, useCallback } from 'react';

// Matter.js importado desde CDN
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint } = Matter;

const CANVAS_WIDTH = 1400; // Mantener el ancho original
const CANVAS_HEIGHT = 700;

const usePhysicsEngine = (settings) => {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);

  const createTerrain = useCallback((engine) => {
    // Suelo principal más ancho
    const ground = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 60, { 
      isStatic: true, 
      render: { 
        fillStyle: "#2d3748",
        strokeStyle: "#4a5568",
        lineWidth: 2
      },
      friction: 1.0,
      restitution: 0.1,
      collisionFilter: {
        category: 0x0008, // Categoría de terreno
        mask: 0x0001 | 0x0002 | 0x0004 // Colisiona con todo
      }
    });

    // PLATAFORMA IZQUIERDA MEJORADA - Más grande y estable
    const leftPlatformBase = Bodies.rectangle(150, CANVAS_HEIGHT - 90, 240, 120, {
      isStatic: true,
      render: { 
        fillStyle: "#4a5568",
        strokeStyle: "#2d3748",
        lineWidth: 3
      },
      friction: 1.0,
      restitution: 0.1,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // Superficie superior de la plataforma izquierda para mejor agarre
    const leftPlatformTop = Bodies.rectangle(150, CANVAS_HEIGHT - 155, 220, 10, {
      isStatic: true,
      render: { 
        fillStyle: "#374151",
        strokeStyle: "#1f2937",
        lineWidth: 2
      },
      friction: 2.0, // Máxima fricción para el vehículo
      restitution: 0.05,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // PLATAFORMA DERECHA MEJORADA - Más grande y estable
    const rightPlatformBase = Bodies.rectangle(CANVAS_WIDTH - 150, CANVAS_HEIGHT - 90, 240, 120, {
      isStatic: true,
      render: { 
        fillStyle: "#4a5568",
        strokeStyle: "#2d3748",
        lineWidth: 3
      },
      friction: 1.0,
      restitution: 0.1,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // Superficie superior de la plataforma derecha
    const rightPlatformTop = Bodies.rectangle(CANVAS_WIDTH - 150, CANVAS_HEIGHT - 155, 220, 10, {
      isStatic: true,
      render: { 
        fillStyle: "#374151",
        strokeStyle: "#1f2937",
        lineWidth: 2
      },
      friction: 2.0, // Máxima fricción para el vehículo
      restitution: 0.05,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // RAMPAS DE ACCESO para transiciones suaves
    const leftRamp = Bodies.rectangle(270, CANVAS_HEIGHT - 140, 60, 8, {
      isStatic: true,
      angle: -0.1, // Ligera inclinación
      render: { 
        fillStyle: "#6b7280",
        strokeStyle: "#374151",
        lineWidth: 2
      },
      friction: 1.5,
      restitution: 0.05,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    const rightRamp = Bodies.rectangle(CANVAS_WIDTH - 270, CANVAS_HEIGHT - 140, 60, 8, {
      isStatic: true,
      angle: 0.1, // Ligera inclinación opuesta
      render: { 
        fillStyle: "#6b7280",
        strokeStyle: "#374151",
        lineWidth: 2
      },
      friction: 1.5,
      restitution: 0.05,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // Agua entre las plataformas (peligro visual)
    const water = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 80, 800, 40, {
      isStatic: true,
      isSensor: true, // No afecta físicamente pero es visual
      render: { 
        fillStyle: "#4299e1",
        strokeStyle: "#3182ce",
        lineWidth: 1
      }
    });

    // MUROS LATERALES INVISIBLES para evitar que el vehículo se salga
    const leftWall = Bodies.rectangle(-10, CANVAS_HEIGHT/2, 20, CANVAS_HEIGHT, {
      isStatic: true,
      render: { fillStyle: "transparent" },
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001
      }
    });

    const rightWall = Bodies.rectangle(CANVAS_WIDTH + 10, CANVAS_HEIGHT/2, 20, CANVAS_HEIGHT, {
      isStatic: true,
      render: { fillStyle: "transparent" },
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001
      }
    });

    // TECHO INVISIBLE para evitar que elementos vuelen demasiado alto
    const ceiling = Bodies.rectangle(CANVAS_WIDTH/2, -50, CANVAS_WIDTH * 2, 100, {
      isStatic: true,
      render: { fillStyle: "transparent" },
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    World.add(engine.world, [
      ground, 
      leftPlatformBase, leftPlatformTop, leftRamp,
      rightPlatformBase, rightPlatformTop, rightRamp,
      water, 
      leftWall, rightWall, ceiling
    ]);
  }, []);

  const initializeEngine = useCallback((sceneElement) => {
    const engine = Engine.create();
    
    // CONFIGURACIÓN DE MOTOR MEJORADA PARA ESTABILIDAD
    engine.gravity.y = settings.gravity;
    engine.gravity.scale = 0.001; // Escala de gravedad más controlada
    
    // Configuraciones del mundo para mayor estabilidad
    engine.world.gravity.y = settings.gravity;
    
    // Configurar el solver para mayor precisión
    engine.timing.timeScale = 1;
    engine.constraintIterations = 3; // Más iteraciones para constraints más estables
    engine.positionIterations = 8;   // Más iteraciones para posiciones más precisas
    engine.velocityIterations = 6;   // Más iteraciones para velocidades más estables
    
    engineRef.current = engine;

    const render = Render.create({
      element: sceneElement,
      engine: engine,
      options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: "linear-gradient(to bottom, #87CEEB, #98FB98)",
        showVelocity: false,
        showAngleIndicator: false,
        showDebug: false,
        pixelRatio: 'auto', // Mejor calidad de renderizado
        hasBounds: true,
      },
    });
    renderRef.current = render;

    const runner = Runner.create({
      delta: 16.666, // 60 FPS fijo para consistencia
      isFixed: true   // Delta fijo para simulación estable
    });
    runnerRef.current = runner;
    
    Runner.run(runner, engine);
    Render.run(render);

    createTerrain(engine);

    // Mouse constraint mejorado para manipulación más suave
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { 
        stiffness: 0.05,  // Menor rigidez para manipulación más suave
        render: { visible: false },
        angularStiffness: 0.01 // Menor rigidez angular
      },
    });
    mouseConstraintRef.current = mouseConstraint;

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      render.textures = {};
    };
  }, [settings.gravity, createTerrain]);

  return {
    engineRef,
    renderRef,
    runnerRef,
    mouseConstraintRef,
    initializeEngine,
    createTerrain
  };
};

export default usePhysicsEngine;