import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, Ring } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { BudgetProgress3DData } from '../visualizationTypes';
import * as THREE from 'three';

interface BudgetProgress3DProps {
  data: BudgetProgress3DData[];
  height?: number;
}

function ProgressRings({ items, colors, reducedMotion }: { items: BudgetProgress3DData[]; colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
  });

  const count = items.length;
  const positions = useMemo(() => {
    return items.map((_, i) => {
      const angle = count <= 1 ? 0 : (i / count) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(count, 4) * 0.6;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });
  }, [items, count]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {items.map((item, i) => {
        const pct = Math.min(item.percentUsed / 100, 1);
        const barColor = pct > 0.9 ? colors.error : pct > 0.7 ? colors.warning : colors.success;
        const pos = positions[i] || { x: 0, z: 0 };
        return (
          <Float key={item.label} speed={reducedMotion ? 0 : 0.3} rotationIntensity={0} floatIntensity={reducedMotion ? 0 : 0.05}>
            <group position={[pos.x, 0, pos.z]}>
              <RoundedBox args={[0.35, pct * 2.5 + 0.1, 0.35]} radius={0.03}>
                <meshPhysicalMaterial color={barColor} metalness={0.3} roughness={0.4} transparent opacity={0.85} />
              </RoundedBox>
              <Text position={[0, -0.6, 0]} fontSize={0.1} color={colors.text} anchorX="center" anchorY="top" maxWidth={0.6}>
                {item.label}
              </Text>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

export function BudgetProgress3D({ data, height = 250 }: BudgetProgress3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, color: 'var(--text-muted)' }}>
        <span className="text-sm">No budget data</span>
      </div>
    );
  }

  return (
    <Scene3D
      camera={{ position: [0, 0.5, 4.5], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <ProgressRings items={data} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}
