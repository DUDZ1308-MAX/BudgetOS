import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, RoundedBox, Float } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { CashFlow3DData } from '../visualizationTypes';
import * as THREE from 'three';

interface CashFlow3DProps {
  data: CashFlow3DData;
  height?: number;
}

function CashFlowWaterfall({ income, expenses, savings, remaining, colors, reducedMotion }: CashFlow3DData & { colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const maxVal = Math.max(income, expenses, savings, remaining, 1);
  const incomeH = (income / maxVal) * 3;
  const expenseH = (expenses / maxVal) * 3;
  const savingsH = (savings / maxVal) * 3;
  const remainingH = Math.max((Math.abs(remaining) / maxVal) * 3, 0.05);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  const segments = useMemo(() => [
    { label: 'Income', height: incomeH, color: colors.success, x: -1.8, delay: 0 },
    { label: 'Expenses', height: expenseH, color: colors.error, x: -0.6, delay: 0.15 },
    { label: 'Savings', height: savingsH, color: colors.accent, x: 0.6, delay: 0.3 },
    { label: remaining >= 0 ? 'Remaining' : 'Deficit', height: remainingH, color: remaining >= 0 ? colors.warning : colors.error, x: 1.8, delay: 0.45 },
  ], [incomeH, expenseH, savingsH, remainingH, remaining, colors]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {segments.map((seg) => (
        <Float key={seg.label} speed={reducedMotion ? 0 : 0.3} rotationIntensity={0} floatIntensity={reducedMotion ? 0 : 0.05}>
          <group position={[seg.x, seg.height / 2, 0]}>
            <RoundedBox args={[0.5, seg.height, 0.5]} radius={0.04}>
              <meshPhysicalMaterial color={seg.color} metalness={0.2} roughness={0.5} transparent opacity={0.85} />
            </RoundedBox>
            <Text position={[0, -seg.height / 2 - 0.4, 0]} fontSize={0.13} color={colors.text} anchorX="center" anchorY="top">
              {seg.label}
            </Text>
          </group>
        </Float>
      ))}
    </group>
  );
}

export function CashFlow3D({ data, height = 250 }: CashFlow3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  return (
    <Scene3D
      camera={{ position: [0, 0.5, 5.5], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <CashFlowWaterfall income={data.income} expenses={data.expenses} savings={data.savings} remaining={data.remaining} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}
