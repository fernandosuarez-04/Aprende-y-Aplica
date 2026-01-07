'use client'

/**
 * Scene3D - Simplified version without Three.js for performance
 * Previously used @react-three/fiber, @react-three/drei, and Three.js
 * with 60fps animation loops causing performance issues.
 * 
 * Now returns null (no visual effect) to eliminate GPU overhead.
 */
export function Scene3D() {
  // Return null - removed 3D effects for performance optimization
  return null
}
