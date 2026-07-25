import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Circle, RoundedBox, Sphere } from '@react-three/drei';
import { useThemeColors } from './Scene3D';
import * as THREE from 'three';

interface FloatingMetricProps {
  position: { x: number; y: number; z: number };
  value: number;
  maxValue: number;
  label: string;
  icon: string;
  color: string;
  index: number;
}

function FloatingMetric({ position, value, maxValue, label, icon, color, index }: FloatingMetricProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Mesh>(null);
  
  const normalizedValue = Math.min(value / maxValue, 1);
  const sphereSize = 0.3 + normalizedValue * 0.4;
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (0.5 + index * 0.1);
      meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * (1 + index * 0.2)) * 0.1;
    }
    if (textRef.current) {
      textRef.current.position.y = position.y + sphereSize + 0.3;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Floating sphere */}
      <Sphere args={[sphereSize, 12, 12]} ref={meshRef}>
        <meshPhysicalMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.4} 
          transparent 
          opacity={0.85} 
          emissive={normalizedValue > 0.7 ? color : '#000000'} 
          emissiveIntensity={normalizedValue > 0.7 ? 0.2 : 0}
        />
      </Sphere>
      
      {/* Label */}
      <Text
        ref={textRef}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {label}
      </Text>
      
      {/* Value */}
      <Text
        position={[0, -sphereSize - 0.6, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {(normalizedValue * 100).toFixed(0)}%
      </Text>
    </group>
  );
}

interface SphericalProgressProps {
  position: { x: number; y: number; z: number };
  size: number;
  segments: number;
  colors: string[];
  data: Record<string, number>;
}

function SphericalProgress({ position, size, segments, colors, data }: SphericalProgressProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]} rotation={[Math.PI / 2, 0, 0]} ref={groupRef}>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2;
        const fillRatio = Object.values(data)[i] || 0;
        const radius = size * 0.3;
        const height = size * 0.15 * fillRatio;
        
        return (
          <mesh position={[Math.cos(angle) * radius, -height / 2, Math.sin(angle) * radius]}>
            <cylinderGeometry args={[0.08, 0.08, height, 8]} />
            <meshPhysicalMaterial 
              color={colors[i % colors.length]} 
              metalness={0.4} 
              roughness={0.3} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Re-export for convenience
export { FloatingMetric, SphericalProgress };