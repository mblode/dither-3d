import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'

export default function KeyboardControls() {
  const { camera } = useThree()
  const keys = useRef<{ [key: string]: boolean }>({})
  const velocity = useRef(new Vector3())
  const direction = useRef(new Vector3())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const speed = 10
    const forward = new Vector3()
    const right = new Vector3()
    const up = new Vector3(0, 1, 0)

    // Get camera direction vectors
    camera.getWorldDirection(forward)
    right.crossVectors(forward, up).normalize()

    // Reset velocity
    velocity.current.set(0, 0, 0)

    // WASD movement
    if (keys.current['w'] || keys.current['arrowup']) {
      velocity.current.add(forward.multiplyScalar(speed * delta))
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      velocity.current.add(forward.multiplyScalar(-speed * delta))
    }
    if (keys.current['a'] || keys.current['arrowleft']) {
      velocity.current.add(right.multiplyScalar(-speed * delta))
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      velocity.current.add(right.multiplyScalar(speed * delta))
    }

    // Up/Down with Space/Shift
    if (keys.current[' ']) {
      velocity.current.add(up.multiplyScalar(speed * delta))
    }
    if (keys.current['shift']) {
      velocity.current.add(up.multiplyScalar(-speed * delta))
    }

    // Apply velocity to camera position
    camera.position.add(velocity.current)
  })

  return null
}
