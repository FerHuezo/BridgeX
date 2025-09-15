import { useRef, useCallback } from 'react';

// Matter.js importado desde CDN
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint } = Matter;

const usePhysicsEngine = (settings, canvasSize) => {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);

  const createTerrain = useCallback((engine) => {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasSize;
    
    // Suelo principal escalado
    const ground = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 40, { 
      isStatic: true, 
      render: { 
        fillStyle: "#2d3748",
        strokeStyle: "#4a5568",
        lineWidth: 2
      },
      friction: 1.0,
      restitution: 0.1,
      collisionFilter: {
        category: 0x0008,
        mask: 0x0001 | 0x0002 | 0x0004
      }
    });

    // Calcular dimensiones proporcionales
    const platformWidth = CANVAS_WIDTH * 0.17; // 17% del ancho
    const platformHeight = CANVAS_HEIGHT * 0.17; // 17% de la altura
    const platformOffset = CANVAS_WIDTH * 0.125; // 12.5% desde los bordes
    
    // PLATAFORMA IZQUIERDA escalada
    const leftPlatformBase = Bodies.rectangle(
      platformOffset, 
      CANVAS_HEIGHT - 60, 
      platformWidth, 
      platformHeight, 
      {
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
      }
    );

    // Superficie superior de la plataforma izquierda
    const leftPlatformTop = Bodies.rectangle(
      platformOffset, 
      CANVAS_HEIGHT - 110, 
      platformWidth * 0.9, 
      8, 
      {
        isStatic: true,
        render: { 
          fillStyle: "#374151",
          strokeStyle: "#1f2937",
          lineWidth: 2
        },
        friction: 2.0,
        restitution: 0.05,
        collisionFilter: {
          category: 0x0008,
          mask: 0x0001 | 0x0002 | 0x0004
        }
      }
    );

    // PLATAFORMA DERECHA escalada
    const rightPlatformBase = Bodies.rectangle(
      CANVAS_WIDTH - platformOffset, 
      CANVAS_HEIGHT - 60, 
      platformWidth, 
      platformHeight, 
      {
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
      }
    );

    // Superficie superior de la plataforma derecha
    const rightPlatformTop = Bodies.rectangle(
      CANVAS_WIDTH - platformOffset, 
      CANVAS_HEIGHT - 110, 
      platformWidth * 0.9, 
      8, 
      {
        isStatic: true,
        render: { 
          fillStyle: "#374151",
          strokeStyle: "#1f2937",
          lineWidth: 2
        },
        friction: 2.0,
        restitution: 0.05,
        collisionFilter: {
          category: 0x0008,
          mask: 0x0001 | 0x0002 | 0x0004
        }
      }
    );

    // RAMPAS DE ACCESO escaladas
    const rampWidth = CANVAS_WIDTH * 0.04; // 4% del ancho
    const leftRampX = platformOffset + (platformWidth * 0.45);
    const rightRampX = CANVAS_WIDTH - platformOffset - (platformWidth * 0.45);
    
    const leftRamp = Bodies.rectangle(
      leftRampX, 
      CANVAS_HEIGHT - 100, 
      rampWidth, 
      6, 
      {
        isStatic: true,
        angle: -0.1,
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
      }
    );

    const rightRamp = Bodies.rectangle(
      rightRampX, 
      CANVAS_HEIGHT - 100, 
      rampWidth, 
      6, 
      {
        isStatic: true,
        angle: 0.1,
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
      }
    );

    // Agua entre las plataformas escalada
    const waterWidth = CANVAS_WIDTH * 0.57; // 57% del ancho
    const water = Bodies.rectangle(
      CANVAS_WIDTH/2, 
      CANVAS_HEIGHT - 50, 
      waterWidth, 
      30, 
      {
        isStatic: true,
        isSensor: true,
        render: { 
          fillStyle: "#4299e1",
          strokeStyle: "#3182ce",
          lineWidth: 1
        }
      }
    );

    // MUROS LATERALES INVISIBLES
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

    // TECHO INVISIBLE
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
  }, [canvasSize]);

  const initializeEngine = useCallback((sceneElement) => {
    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasSize;
    
    const engine = Engine.create();
    
    // CONFIGURACIÓN DE MOTOR MEJORADA
    engine.gravity.y = settings.gravity;
    engine.gravity.scale = 0.001;
    
    engine.world.gravity.y = settings.gravity;
    
    engine.timing.timeScale = 1;
    engine.constraintIterations = 3;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    
    engineRef.current = engine;

    // Limpiar renderizador anterior si existe
    if (renderRef.current) {
      Render.stop(renderRef.current);
      if (renderRef.current.canvas) {
        renderRef.current.canvas.remove();
      }
    }

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
        pixelRatio: window.devicePixelRatio || 1,
        hasBounds: true,
      },
    });
    renderRef.current = render;

    const runner = Runner.create({
      delta: 16.666,
      isFixed: true
    });
    runnerRef.current = runner;
    
    Runner.run(runner, engine);
    Render.run(render);

    createTerrain(engine);

    // Mouse constraint responsive
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { 
        stiffness: 0.05,
        render: { visible: false },
        angularStiffness: 0.01
      },
    });
    mouseConstraintRef.current = mouseConstraint;

    // Cleanup function
    return () => {
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (renderRef.current) {
        Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      Engine.clear(engine);
      renderRef.current = null;
      runnerRef.current = null;
      mouseConstraintRef.current = null;
    };
  }, [settings.gravity, createTerrain, canvasSize]);

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