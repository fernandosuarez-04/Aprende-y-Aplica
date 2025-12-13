'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.1}
          metalness={0.5}
          opacity={0.1}
          transparent
        />
      </mesh>
    </Float>
  )
}

function FloatingTorus() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.2
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 2
      meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.4) * 1.5
    }
  })

  return (
    <Float speed={0.8} rotationIntensity={0.15} floatIntensity={0.3}>
      <mesh ref={meshRef} position={[-3, 2, -2]}>
        <torusGeometry args={[0.8, 0.3, 16, 100]} />
        <MeshDistortMaterial
          color="#10b981"
          attach="material"
          distort={0.2}
          speed={1.2}
          roughness={0.1}
          metalness={0.6}
          opacity={0.08}
          transparent
        />
      </mesh>
    </Float>
  )
}

function FloatingBox() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.15
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.15
      meshRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.2) * 2.5
      meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.25) * 2
    }
  })

  return (
    <Float speed={0.6} rotationIntensity={0.12} floatIntensity={0.25}>
      <mesh ref={meshRef} position={[3, -2, -1.5]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.25}
          speed={1.3}
          roughness={0.1}
          metalness={0.5}
          opacity={0.09}
          transparent
        />
      </mesh>
    </Float>
  )
}

export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      {/* Ambient light for subtle illumination */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.3} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#10b981" />

      {/* 3D Geometries */}
      <FloatingGeometry />
      <FloatingTorus />
      <FloatingBox />

      {/* Disable controls for background effect */}
      <OrbitControls enabled={false} />
    </Canvas>
  )
}
