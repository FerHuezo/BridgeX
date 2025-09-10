import React, { useEffect, useRef, useState, useCallback } from "react";
import Matter, {
  Engine,
  Render,
  Runner,
  World,
  Bodies,
  Body,
  Composite,
  Constraint
} from "matter-js";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Truck,
  Car,
  Bus
} from "lucide-react";

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

export default function BridgeSimulator() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const beamsRef = useRef([]);
  const nodesRef = useRef([]);
  const stressLevelsRef = useRef([]);
  const [gameStatus, setGameStatus] = useState("building");
  const [vehicle, setVehicle] = useState(null);
  const [vehicleProgress, setVehicleProgress] = useState(0);
  const [gameStats, setGameStats] = useState({
    stress: 0,
    beamsBroken: 0,
    time: 0
  });
  const [settings, setSettings] = useState({
    gravity: 0.8,
    vehicleSpeed: 0.0008,
    vehicleWeight: 3000,
    stressThreshold: 0.7,
    showStress: true,
    autoBreak: true,
    vehicleType: "car" // 👈 agregado para que el select no sea undefined
  });

  // Crear terreno base
  const createTerrain = (engine) => {
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT, CANVAS_WIDTH, 60, {
      isStatic: true,
      render: { fillStyle: "#2d3748" }
    });

    const leftRamp = Bodies.rectangle(150, CANVAS_HEIGHT - 100, 200, 100, {
      isStatic: true,
      angle: Math.PI * 0.05,
      render: { fillStyle: "#4a5568" }
    });

    const rightRamp = Bodies.rectangle(CANVAS_WIDTH - 150, CANVAS_HEIGHT - 100, 200, 100, {
      isStatic: true,
      angle: -Math.PI * 0.05,
      render: { fillStyle: "#4a5568" }
    });

    World.add(engine.world, [ground, leftRamp, rightRamp]);
  };

  // 🚗 Spawnear vehículo según tipo
  const spawnVehicle = useCallback(() => {
    if (!engineRef.current) return;

    // Eliminar vehículo anterior si existe
    if (vehicle?.parts) {
      Object.values(vehicle.parts).forEach((part) => {
        if (part.type === "body" || part.type === "constraint") {
          World.remove(engineRef.current.world, part);
        }
      });
    }

    const startX = 100;
    const startY = CANVAS_HEIGHT - 200;

    // Configuración por tipo
    let width = 100,
      height = 30,
      wheelRadius = 18;
    switch (settings.vehicleType) {
      case "truck":
        width = 150;
        height = 40;
        wheelRadius = 22;
        break;
      case "bus":
        width = 200;
        height = 45;
        wheelRadius = 24;
        break;
      default:
        width = 100;
        height = 30;
        wheelRadius = 18;
    }

    const chassis = Bodies.rectangle(startX, startY, width, height, {
      density: 0.002,
      friction: 0.6,
      render: {
        fillStyle: "#EF4444",
        strokeStyle: "#991B1B",
        lineWidth: 2
      }
    });

    const wheelA = Bodies.circle(startX - width / 3, startY + height / 2, wheelRadius, {
      density: 0.004,
      friction: 1.2,
      restitution: 0.1,
      render: { fillStyle: "#1F2937", strokeStyle: "#374151", lineWidth: 2 }
    });

    const wheelB = Bodies.circle(startX + width / 3, startY + height / 2, wheelRadius, {
      density: 0.004,
      friction: 1.2,
      restitution: 0.1,
      render: { fillStyle: "#1F2937", strokeStyle: "#374151", lineWidth: 2 }
    });

    const axleA = Constraint.create({
      bodyA: chassis,
      pointA: { x: -width / 3, y: height / 2 },
      bodyB: wheelA,
      stiffness: 0.8,
      length: 10,
      render: { visible: false }
    });

    const axleB = Constraint.create({
      bodyA: chassis,
      pointA: { x: width / 3, y: height / 2 }, // 👈 arreglado, antes estaba pointB
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
  }, [vehicle, settings.vehicleType]);

  // Update stats
  const updateStats = useCallback(() => {
    if (!vehicle) return;
    const elapsed = (Date.now() - vehicle.startTime) / 1000;
    const avgStress = stressLevelsRef.current.length
      ? stressLevelsRef.current.reduce((a, b) => a + b, 0) / stressLevelsRef.current.length
      : 0;

    setGameStats({
      stress: avgStress,
      beamsBroken: beamsRef.current.filter((beam) => beam.isBroken).length,
      time: elapsed
    });

    if (vehicle.parts?.chassis) {
      const progress = vehicle.parts.chassis.position.x / CANVAS_WIDTH;
      setVehicleProgress(progress);

      if (progress > 0.95) {
        setGameStatus("success");
      }
    }
  }, [vehicle]);

  // Reset world
  const resetSimulation = () => {
    if (engineRef.current) {
      Composite.clear(engineRef.current.world, true);
      World.clear(engineRef.current.world, false);
      Engine.clear(engineRef.current);
      createTerrain(engineRef.current);
      beamsRef.current = [];
      nodesRef.current = [];
      stressLevelsRef.current = [];
      setVehicle(null);
      setVehicleProgress(0);
      setGameStatus("building");
      setGameStats({ stress: 0, beamsBroken: 0, time: 0 });
    }
  };

  // Init simulation
  useEffect(() => {
    if (!sceneRef.current) return;

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
        background: "#E5E7EB"
      }
    });
    renderRef.current = render;

    createTerrain(engine);
    Render.run(render);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    const interval = setInterval(updateStats, 100);
    return () => {
      clearInterval(interval);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      World.clear(engine.world, false);
    };
  }, [updateStats, settings.gravity]);

  // Move vehicle
  useEffect(() => {
    if (!engineRef.current || !vehicle?.parts) return;
    const { wheelA, wheelB } = vehicle.parts;
    const torque = settings.vehicleSpeed * settings.vehicleWeight;

    const applyTorque = () => {
      if (gameStatus === "testing" && wheelA && wheelB) {
        Body.setAngularVelocity(wheelA, torque);
        Body.setAngularVelocity(wheelB, torque);
      }
    };

    const interval = setInterval(applyTorque, 16);
    return () => clearInterval(interval);
  }, [vehicle, gameStatus, settings.vehicleSpeed, settings.vehicleWeight]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={spawnVehicle}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600"
          >
            <Play size={20} /> Test
          </button>
          <button
            onClick={resetSimulation}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600"
          >
            <RotateCcw size={20} /> Reset
          </button>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            Vehicle:
            <select
              value={settings.vehicleType}
              onChange={(e) => setSettings({ ...settings, vehicleType: e.target.value })}
              className="border rounded px-2 py-1"
            >
              <option value="car">🚗 Car</option>
              <option value="truck">🚚 Truck</option>
              <option value="bus">🚌 Bus</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-200">
        <div ref={sceneRef} className="w-full h-full" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${vehicleProgress * 100}%` }}
          className="absolute bottom-0 left-0 h-2 bg-green-500"
        />
      </div>

      <div className="bg-white shadow-lg p-4 grid grid-cols-3 gap-4">
        <div>Stress: {gameStats.stress.toFixed(2)}</div>
        <div>Beams Broken: {gameStats.beamsBroken}</div>
        <div>Time: {gameStats.time.toFixed(1)}s</div>
      </div>
    </div>
  );
}
