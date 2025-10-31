import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Vector2, Raycaster, Object3D } from 'three'
import { useGame, INITIAL_CAMERA_POSITION } from '../Game'

// Movement constants
const BASE_SPEED = 30 // Starting forward speed (units per second)
const SPEED_SCALE_POINTS = 500 // Points needed for each speed tier
const SPEED_SCALE_MULTIPLIER = 1.2 // Speed multiplier per tier (20% increase)
const MAX_SPEED = 150 // Maximum speed cap (units per second)
const SLOW_MOTION_MULTIPLIER = 0.5 // Speed multiplier when in slow-motion
const SLOW_MOTION_COST_PER_SECOND = 200 // Score points deducted per second of slow-motion (2x kill rate)

// Combat constants
const SHOT_COOLDOWN_MS = 200 // Milliseconds between shots

// Collision constants
const ASTEROID_VISUAL_RADIUS_MULTIPLIER = 1.25 // Displacement makes asteroids ~25% larger
const PLAYER_COLLISION_RADIUS = 0.5 // Player collision sphere radius

export const GameControls = () => {
  const { camera, scene, gl } = useThree()
  const { isPlaying, isGameOver, distance, updateDistance, endGame, startGame, asteroids, incrementKills, removeAsteroid, setCameraPosition, addExplosion, setLastShotTime, setLastHitTime, updateScore, score } = useGame()

  const keysPressed = useRef<{ [key: string]: boolean }>({})
  const lastShotTime = useRef<number>(0)
  const startPosition = useRef<Vector3>(new Vector3(...INITIAL_CAMERA_POSITION))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow restart with spacebar or Enter when game is over
      if (isGameOver && (e.key === ' ' || e.key === 'Enter')) {
        startGame()
        return
      }

      keysPressed.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false
    }

    const handleClick = () => {
      // Allow restart by clicking anywhere when game is over
      if (isGameOver) {
        startGame()
        return
      }

      if (!isPlaying) return

      const now = Date.now()

      if (now - lastShotTime.current < SHOT_COOLDOWN_MS) return
      lastShotTime.current = now
      setLastShotTime(now)

      // Raycasting from camera center
      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(0, 0), camera) // Center of screen

      // Find all asteroid meshes by traversing the scene directly
      const asteroidMeshes: Object3D[] = []
      scene.traverse((obj) => {
        if (obj.type === 'Mesh' && obj.userData.asteroidId !== undefined) {
          asteroidMeshes.push(obj)
        }
      })

      if (asteroidMeshes.length === 0) return

      const intersects = raycaster.intersectObjects(asteroidMeshes, false)

      if (intersects.length > 0) {
        // Hit! Find which asteroid was hit
        const hitMesh = intersects[0].object
        const hitPosition = intersects[0].point
        const asteroidId = hitMesh.userData.asteroidId

        // Create explosion at hit position
        addExplosion([hitPosition.x, hitPosition.y, hitPosition.z])
        setLastHitTime(now)

        // Remove asteroid
        removeAsteroid(asteroidId)
        incrementKills()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    gl.domElement.addEventListener('pointerdown', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      gl.domElement.removeEventListener('pointerdown', handleClick)
    }
  }, [isPlaying, isGameOver, startGame, camera, incrementKills, removeAsteroid, addExplosion, setLastShotTime, setLastHitTime, scene, gl])

  // Reset game state when restarting
  useEffect(() => {
    if (isPlaying && !isGameOver) {
      camera.position.set(...INITIAL_CAMERA_POSITION)
      startPosition.current.set(...INITIAL_CAMERA_POSITION)
      keysPressed.current = {}
    }
  }, [isPlaying, isGameOver, camera])

  useFrame((_, delta) => {
    if (!isPlaying) return

    // Progressive speed system - gets faster as score increases
    const speedTier = Math.max(0, score) / SPEED_SCALE_POINTS
    const scaledSpeed = Math.min(MAX_SPEED, BASE_SPEED * Math.pow(SPEED_SCALE_MULTIPLIER, speedTier))

    // Slow-mo activated via keyboard (spacebar) - mobile uses button that simulates spacebar
    const isSlowMo = (keysPressed.current[' '] || keysPressed.current['spacebar']) && score > 0

    // Calculate current speed (with slow-motion multiplier if active)
    const currentSpeed = isSlowMo ? scaledSpeed * SLOW_MOTION_MULTIPLIER : scaledSpeed

    // Deduct score if in slow-mo
    if (isSlowMo) {
      updateScore(-SLOW_MOTION_COST_PER_SECOND * delta)
    }

    // Get camera forward direction
    const forward = new Vector3()
    camera.getWorldDirection(forward)

    // Apply constant forward movement
    camera.position.addScaledVector(forward, currentSpeed * delta)

    // Update game state with current camera position (for asteroid spawning)
    setCameraPosition([camera.position.x, camera.position.y, camera.position.z])

    // Update distance score (total distance from start)
    const newDistance = camera.position.distanceTo(startPosition.current)
    updateDistance(newDistance)

    // Collision detection with asteroids
    for (const asteroid of asteroids) {
      const dx = camera.position.x - asteroid.position[0]
      const dy = camera.position.y - asteroid.position[1]
      const dz = camera.position.z - asteroid.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Account for displacement (±22% from noise) and player collision sphere
      const visualRadius = asteroid.radius * ASTEROID_VISUAL_RADIUS_MULTIPLIER

      if (dist < visualRadius + PLAYER_COLLISION_RADIUS) {
        // Collision! End game
        endGame()
        break
      }
    }
  })

  return null
}
