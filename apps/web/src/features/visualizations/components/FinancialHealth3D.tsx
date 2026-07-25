import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float, Sphere, RoundedBox } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { FinancialHealth3DData } from '../visualizationTypes';
import * as THREE from 'three';

interface FinancialHealth3DProps {
  data: FinancialHealth3DData;
  height?: number;
}

function HealthDome({ score, maxScore, components, colors, reducedMotion }: FinancialHealth3DData & { colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const pct = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  const domeH = pct * 2.5;
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  const compRows = useMemo(() => {
    return components.map((c, i) => {
      const angle = (i / components.length) * Math.PI * 2;
      const radius = 1.8;
      return { ...c, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });
  }, [components]);

  const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <Float speed={reducedMotion ? 0 : 0.5} rotationIntensity={0} floatIntensity={reducedMotion ? 0 : 0.1}>
        <group position={[0, domeH / 2, 0]}>
          <Sphere args={[0.4, 24, 24]}>
            <meshPhysicalMaterial color={scoreColor} metalness={0.5} roughness={0.2} emissive={scoreColor} emissiveIntensity={0.15} transparent opacity={0.9} />
          </Sphere>
          <Text position={[0, 0, 0.45]} fontSize={0.2} color={colors.text} anchorX="center" anchorY="middle">
            {score}
          </Text>
        </group>
      </Float>

      {compRows.map((comp) => {
        const compPct = comp.maxScore > 0 ? Math.min(comp.score / comp.maxScore, 1) : 0;
        return (
          <Float key={comp.label} speed={reducedMotion ? 0 : 0.3} rotationIntensity={0.02} floatIntensity={reducedMotion ? 0 : 0.05}>
            <group position={[comp.x, compPct * 1.2 / 2, comp.z]}>
              <RoundedBox args={[0.25, compPct * 1.2 + 0.05, 0.25]} radius={0.03}>
                <meshPhysicalMaterial color={comp.color || colors.accent} metalness={0.2} roughness={0.5} transparent opacity={0.8} />
              </RoundedBox>
              <Text position={[0, -0.3, 0]} fontSize={0.08} color={colors.text} anchorX="center" anchorY="top" maxWidth={0.5}>
                {comp.label}
              </Text>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

export function FinancialHealth3D({ data, height = 300 }: FinancialHealth3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  return (
    <Scene3D
      camera={{ position: [0, 0.5, 5], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <HealthDome score={data.score} maxScore={data.maxScore} label={data.label} components={data.components} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}
