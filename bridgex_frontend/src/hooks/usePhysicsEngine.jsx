import { useRef, useCallback } from 'react';

// Matter.js importado desde CDN
const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint } = Matter;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

const usePhysicsEngine = (settings) => {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);

  const createTerrain = useCallback((engine) => {
    const ground = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 60, { 
      isStatic: true, 
      render: { 
        fillStyle: "#2d3748",
        strokeStyle: "#4a5568",
        lineWidth: 2
      } 
    });

    const leftPlatform = Bodies.rectangle(100, CANVAS_HEIGHT - 120, 180, 120, {
      isStatic: true,
      render: { fillStyle: "#4a5568" }
    });
    
    const rightPlatform = Bodies.rectangle(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 120, 180, 120, {
      isStatic: true,
      render: { fillStyle: "#4a5568" }
    });

    const water = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 80, 600, 40, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "#4299e1" }
    });

    World.add(engine.world, [ground, leftPlatform, rightPlatform, water]);
  }, []);

  const initializeEngine = useCallback((sceneElement) => {
    const engine = Engine.create();
    engine.gravity.y = settings.gravity;
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
      },
    });
    renderRef.current = render;

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    createTerrain(engine);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { 
        stiffness: 0.1, 
        render: { visible: false },
        angularStiffness: 0
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