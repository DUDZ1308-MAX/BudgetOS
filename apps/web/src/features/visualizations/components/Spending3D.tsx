import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, Sphere } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { SpendingCategory3D } from '../visualizationTypes';
import * as THREE from 'three';

interface Spending3DProps {
  categories: SpendingCategory3D[];
  height?: number;
}

function SpendingRings({ categories, colors, reducedMotion }: { categories: SpendingCategory3D[]; colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const topCats = useMemo(() => categories.slice(0, 6), [categories]);
  const maxPct = useMemo(() => Math.max(...topCats.map((c) => c.percent), 1), [topCats]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const positions = useMemo(() => {
    return topCats.map((_, i) => {
      const angle = (i / topCats.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 1.8;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });
  }, [topCats]);

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {topCats.map((cat, i) => {
        const height = Math.max((cat.percent / maxPct) * 2.5, 0.1);
        return (
          <Float key={cat.name} speed={reducedMotion ? 0 : 0.4} rotationIntensity={0.03} floatIntensity={reducedMotion ? 0 : 0.08}>
            <group position={[positions[i]!.x, height / 2, positions[i]!.z]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.15 + (cat.percent / maxPct) * 0.15, 0.2 + (cat.percent / maxPct) * 0.2, height, 16]} />
                <meshPhysicalMaterial color={cat.color || colors.accent} metalness={0.3} roughness={0.4} transparent opacity={0.85} />
              </mesh>
              <Text position={[0, -height / 2 - 0.3, 0]} fontSize={0.1} color={colors.text} anchorX="center" anchorY="top" maxWidth={0.8}>
                {cat.name}
              </Text>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

export function Spending3D({ categories, height = 250 }: Spending3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, color: 'var(--text-muted)' }}>
        <span className="text-sm">No spending data</span>
      </div>
    );
  }

  return (
    <Scene3D
      camera={{ position: [0, 0.8, 4.5], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <SpendingRings categories={categories} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}
