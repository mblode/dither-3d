import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGame } from "./Game";
import type { Asteroid } from "./Game";
import { Explosions } from "./components/Explosion";
import { AsteroidGeometry } from "./components/AsteroidMesh";
import { AsteroidMaterial } from "./components/AsteroidMaterial";

const MAX_ASTEROIDS = 30;
const SPAWN_INTERVAL = 0.8; // seconds
const SPAWN_DISTANCE_MIN = 60; // Spawn ahead of camera
const SPAWN_DISTANCE_MAX = 150;
const REMOVE_DISTANCE = 200; // Remove when far from camera (any direction)
const MIN_SPAWN_SAFETY = 15; // Minimum distance from camera when spawning

// Helper function to create asteroid properties (avoids code duplication)
function createAsteroidProperties(id: number): Omit<Asteroid, "position"> {
  // Random linear velocity
  const dirX = (Math.random() - 0.5) * 2;
  const dirY = (Math.random() - 0.5) * 2;
  const dirZ = (Math.random() - 0.5) * 2;
  const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
  const speed = 0.5 + Math.random() * 10; // 0.5-10.5 units/sec

  const velocityX = (dirX / length) * speed;
  const velocityY = (dirY / length) * speed;
  const velocityZ = (dirZ / length) * speed;

  // Varied asteroid sizes
  const radius = 2 + Math.random() * 6; // 2-8 units

  // Very bright colors
  const gray = Math.floor(Math.random() * 10 + 245)
    .toString(16)
    .padStart(2, "0"); // 245-255

  const roughness = Math.random() * 0.4 + 0.3; // 0.3-0.7

  return {
    id,
    radius,
    color: `#${gray}${gray}${gray}`,
    roughness,
    velocity: [velocityX, velocityY, velocityZ],
    rotation: [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ],
    rotationSpeed: [
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
    ],
    shapeSeed: Math.random() * 10000,
  };
}

export default function Scene() {
  const { camera } = useThree();
  const { asteroids, setAsteroids, isPlaying, isGameOver } = useGame();

  const nextIdRef = useRef(0);
  const spawnAccumulator = useRef(0);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const initializedRef = useRef(false);

  // Generate static background stars once
  const backgroundStars = useMemo(() => {
    return Array.from({ length: 100 }).map(() => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 300 + Math.random() * 200;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      return {
        position: [x, y, z] as [number, number, number],
        size: 0.2 + Math.random() * 0.3, // 0.2-0.5 units (tiny pixels)
      };
    });
  }, []);

  // Initialize asteroids on mount and when game restarts
  useEffect(() => {
    if ((!isPlaying || isGameOver) && initializedRef.current) {
      // Game ended, reset
      initializedRef.current = false;
      asteroidsRef.current = [];
      setAsteroids([]);
      return;
    }

    if (!isPlaying || isGameOver || initializedRef.current) return;

    // Reset for new game
    nextIdRef.current = 0;
    spawnAccumulator.current = 0;
    initializedRef.current = true;

    // Start with some initial asteroids
    const initialAsteroids: Asteroid[] = [];
    const numInitial = 10;
    const startPos = camera.position;

    for (let i = 0; i < numInitial; i++) {
      // Spawn in front of camera in a wide spread
      const spreadX = (Math.random() - 0.5) * 80;
      const spreadY = (Math.random() - 0.5) * 60;
      const distance =
        SPAWN_DISTANCE_MIN +
        Math.random() * (SPAWN_DISTANCE_MAX - SPAWN_DISTANCE_MIN);

      const x = startPos.x + spreadX;
      const y = startPos.y + spreadY;
      const z = startPos.z - distance; // Negative Z is forward in Three.js

      // Check minimum safety distance
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      const dz = z - startPos.z;
      const distFromCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distFromCamera < MIN_SPAWN_SAFETY) {
        i--; // Retry this iteration
        continue;
      }

      // Create asteroid with helper function
      initialAsteroids.push({
        ...createAsteroidProperties(nextIdRef.current++),
        position: [x, y, z],
      });
    }

    asteroidsRef.current = initialAsteroids;
    setAsteroids(initialAsteroids);
  }, [isPlaying, isGameOver, setAsteroids, camera]);

  // Sync ref to context when context changes (from external removal like shooting)
  useEffect(() => {
    asteroidsRef.current = asteroids;
  }, [asteroids]);

  // Update asteroid positions and spawn new ones
  useFrame((_, delta) => {
    if (!isPlaying || !initializedRef.current) return;

    let needsStateUpdate = false;
    const currentCameraPos = camera.position;

    // Update positions - positions are stored in ref and read directly during render
    // No need to update React state for position changes - only for add/remove
    asteroidsRef.current = asteroidsRef.current.map((asteroid) => ({
      ...asteroid,
      position: [
        asteroid.position[0] + asteroid.velocity[0] * delta,
        asteroid.position[1] + asteroid.velocity[1] * delta,
        asteroid.position[2] + asteroid.velocity[2] * delta,
      ] as [number, number, number],
      rotation: [
        asteroid.rotation[0] + asteroid.rotationSpeed[0] * delta,
        asteroid.rotation[1] + asteroid.rotationSpeed[1] * delta,
        asteroid.rotation[2] + asteroid.rotationSpeed[2] * delta,
      ] as [number, number, number],
    }));

    // Remove asteroids that are too far from camera (any direction)
    const beforeCount = asteroidsRef.current.length;
    asteroidsRef.current = asteroidsRef.current.filter((asteroid) => {
      const dx = asteroid.position[0] - currentCameraPos.x;
      const dy = asteroid.position[1] - currentCameraPos.y;
      const dz = asteroid.position[2] - currentCameraPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance < REMOVE_DISTANCE;
    });
    if (asteroidsRef.current.length !== beforeCount) {
      needsStateUpdate = true;
    }

    // Spawn new asteroids using accumulated time
    spawnAccumulator.current += delta;

    if (
      spawnAccumulator.current >= SPAWN_INTERVAL &&
      asteroidsRef.current.length < MAX_ASTEROIDS
    ) {
      spawnAccumulator.current = 0;
      needsStateUpdate = true;

      const numToSpawn = Math.min(
        Math.floor(Math.random() * 2) + 1,
        MAX_ASTEROIDS - asteroidsRef.current.length,
      );

      for (let i = 0; i < numToSpawn; i++) {
        const spreadX = (Math.random() - 0.5) * 100;
        const spreadY = (Math.random() - 0.5) * 80;
        const distance =
          SPAWN_DISTANCE_MIN +
          Math.random() * (SPAWN_DISTANCE_MAX - SPAWN_DISTANCE_MIN);

        const x = currentCameraPos.x + spreadX;
        const y = currentCameraPos.y + spreadY;
        const z = currentCameraPos.z - distance;

        // Check minimum safety distance
        const dx = x - currentCameraPos.x;
        const dy = y - currentCameraPos.y;
        const dz = z - currentCameraPos.z;
        const distFromCamera = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distFromCamera < MIN_SPAWN_SAFETY) {
          i--; // Retry this iteration
          continue;
        }

        // Create asteroid with helper function
        asteroidsRef.current.push({
          ...createAsteroidProperties(nextIdRef.current++),
          position: [x, y, z],
        });
      }
    }

    // Only update React state when asteroids added/removed
    if (needsStateUpdate) {
      setAsteroids([...asteroidsRef.current]);
    }
  });

  return (
    <>
      {/* Background stars - distant static points */}
      {backgroundStars.map((star, i) => (
        <mesh key={`star-${i}`} position={star.position}>
          <sphereGeometry args={[star.size, 4, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Dynamic asteroids - render from ref for real-time position updates */}
      {asteroidsRef.current.map((asteroid) => (
        <mesh
          key={asteroid.id}
          position={asteroid.position}
          rotation={asteroid.rotation}
          userData={{ asteroidId: asteroid.id }}
          castShadow
        >
          <AsteroidGeometry
            radius={asteroid.radius}
            shapeSeed={asteroid.shapeSeed}
          />
          <AsteroidMaterial
            color={asteroid.color}
            roughness={asteroid.roughness}
            shapeSeed={asteroid.shapeSeed}
          />
        </mesh>
      ))}

      {/* Explosion effects */}
      <Explosions />
    </>
  );
}
