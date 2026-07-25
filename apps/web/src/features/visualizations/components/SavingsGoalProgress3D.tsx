import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, Sphere } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { BudgetProgress3DData } from '../visualizationTypes';
import * as THREE from 'three';

interface SavingsGoalProgress3DProps {
  data: Array<{ name: string; current: number; target: number; color?: string }>;
  height?: number;
}

function SavingsSpheres({ goals, colors, reducedMotion }: { goals: Array<{ name: string; current: number; target: number; color?: string }>; colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const maxTarget = Math.max(...goals.map(g => g.target), 1);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {goals.map((goal, i) => {
        const fillRatio = Math.min(goal.current / goal.target, 1);
        const sphereSize = 0.8 + (fillRatio * 0.5);
        const xPos = (i % 3) * 2 - 2;
        const zPos = Math.floor(i / 3) * 2;
        const color = goal.color || colors.success;

        return (
          <Float key={goal.name} speed={reducedMotion ? 0 : 0.3} rotationIntensity={0.02} floatIntensity={reducedMotion ? 0 : 0.05}>
            <group position={[xPos, fillRatio * 0.8 - 0.4, zPos]}>
              <Sphere args={[0.4 + sphereSize * 0.1, 16, 16]}>
                <meshPhysicalMaterial 
                  color={color} 
                  metalness={0.3} 
                  roughness={0.4} 
                  transparent 
                  opacity={0.85} 
                  emissive={fillRatio > 0.8 ? color : '#000000'} 
                  emissiveIntensity={fillRatio > 0.8 ? 0.15 : 0} 
                />
              </Sphere>
              <Text position={[0, -1.2, 0]} fontSize={0.12} color={colors.text} anchorX="center" anchorY="top" maxWidth={1.5}>
                {goal.name}
              </Text>
              <Text position={[0, -1.5, 0]} fontSize={0.15} color={colors.success} anchorX="center" anchorY="top">
                {fillRatio > 1 ? '100%' : `${(fillRatio * 100).toFixed(0)}%`}
              </Text>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

export function SavingsGoalProgress3D({ data, height = 300 }: SavingsGoalProgress3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, color: 'var(--text-muted)' }}>
        <span className="text-sm">No savings goals</span>
      </div>
    );
  }

  // Convert to expected format for Scene3D
  const budgetProgressData: BudgetProgress3DData[] = data.map((goal, i) => {
    const target = goal.target > 0 ? goal.target : 1000;
    const current = goal.current || 0;
    const color = goal.color || ['#10b981', '#3b82f6', '#8b5cf6'][i % 3];
    return {
      label: goal.name,
      budgeted: target,
      spent: target - current,
      remaining: current,
      percentUsed: current / target * 100,
    };
  });

  return (
    <Scene3D
      camera={{ position: [0, 0.5, 6], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <SavingsSpheres goals={data} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}