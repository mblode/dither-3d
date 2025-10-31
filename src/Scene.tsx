export default function Scene() {
  // Generate scattered asteroids/objects in space
  const asteroids = []
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 100
    const y = (Math.random() - 0.5) * 100
    const z = (Math.random() - 0.5) * 100
    const size = Math.random() * 2 + 0.5
    const gray = Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')

    asteroids.push(
      <mesh key={i} position={[x, y, z]} castShadow>
        <sphereGeometry args={[size, 8, 8]} />
        <meshStandardMaterial color={`#${gray}${gray}${gray}`} flatShading />
      </mesh>
    )
  }

  // Generate some larger structures
  const structures = []
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 80
    const y = (Math.random() - 0.5) * 80
    const z = (Math.random() - 0.5) * 80
    const type = Math.floor(Math.random() * 4)
    const gray = Math.floor(Math.random() * 100 + 100).toString(16).padStart(2, '0')

    if (type === 0) {
      // Cube
      structures.push(
        <mesh key={`struct-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color={`#${gray}${gray}${gray}`} />
        </mesh>
      )
    } else if (type === 1) {
      // Torus
      structures.push(
        <mesh key={`struct-${i}`} position={[x, y, z]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} castShadow>
          <torusGeometry args={[2, 0.5, 16, 32]} />
          <meshStandardMaterial color={`#${gray}${gray}${gray}`} />
        </mesh>
      )
    } else if (type === 2) {
      // Cone
      structures.push(
        <mesh key={`struct-${i}`} position={[x, y, z]} rotation={[Math.random() * Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[1.5, 4, 8]} />
          <meshStandardMaterial color={`#${gray}${gray}${gray}`} />
        </mesh>
      )
    } else {
      // Octahedron
      structures.push(
        <mesh key={`struct-${i}`} position={[x, y, z]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} castShadow>
          <octahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial color={`#${gray}${gray}${gray}`} />
        </mesh>
      )
    }
  }

  return (
    <>
      {/* Ambient space */}
      {asteroids}
      {structures}

      {/* A few nearby reference objects */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>

      <mesh position={[5, 2, -3]} castShadow>
        <torusKnotGeometry args={[1, 0.3, 64, 8]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>

      <mesh position={[-4, -2, 4]} castShadow>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </>
  )
}
