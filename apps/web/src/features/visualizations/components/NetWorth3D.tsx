import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float, Sparkles } from '@react-three/drei';
import { useReducedMotion, useThemeColors, Scene3D } from './Scene3D';
import type { NetWorth3DData } from '../visualizationTypes';
import * as THREE from 'three';

interface NetWorth3DProps {
  data: NetWorth3DData;
  height?: number;
}

function AssetBlocks({ assets, liabilities, netWorth, colors, reducedMotion }: { assets: number; liabilities: number; netWorth: number; colors: ReturnType<typeof useThemeColors>; reducedMotion: boolean }) {
  const maxVal = Math.max(assets, liabilities, netWorth, 1);
  const assetH = (assets / maxVal) * 3;
  const liabH = (liabilities / maxVal) * 3;
  const netH = netWorth > 0 ? (netWorth / maxVal) * 3 : 0.1;

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={reducedMotion ? 0 : 0.5} rotationIntensity={reducedMotion ? 0 : 0.05} floatIntensity={reducedMotion ? 0 : 0.1}>
        <group position={[-1.2, assetH / 2 - 0.5, 0]}>
          <RoundedBox args={[0.6, assetH, 0.6]} radius={0.05}>
            <meshPhysicalMaterial color={colors.success} metalness={0.3} roughness={0.4} transparent opacity={0.9} />
          </RoundedBox>
          <Text position={[0, -0.5, 0]} fontSize={0.15} color={colors.text} anchorX="center" anchorY="top">
            Assets
          </Text>
        </group>
      </Float>

      <Float speed={reducedMotion ? 0 : 0.5} rotationIntensity={reducedMotion ? 0 : 0.05} floatIntensity={reducedMotion ? 0 : 0.1}>
        <group position={[1.2, liabH / 2 - 0.5, 0]}>
          <RoundedBox args={[0.6, liabH, 0.6]} radius={0.05}>
            <meshPhysicalMaterial color={colors.error} metalness={0.3} roughness={0.4} transparent opacity={0.9} />
          </RoundedBox>
          <Text position={[0, -0.5, 0]} fontSize={0.15} color={colors.text} anchorX="center" anchorY="top">
            Liabilities
          </Text>
        </group>
      </Float>

      <Float speed={reducedMotion ? 0 : 0.5} rotationIntensity={reducedMotion ? 0 : 0.05} floatIntensity={reducedMotion ? 0 : 0.1}>
        <group position={[0, netH / 2 - 0.5, 1]}>
          <RoundedBox args={[0.6, netH, 0.6]} radius={0.05}>
            <meshPhysicalMaterial color={netWorth >= 0 ? colors.accent : colors.warning} metalness={0.4} roughness={0.3} transparent opacity={0.9} />
          </RoundedBox>
          <Text position={[0, -0.5, 0]} fontSize={0.15} color={colors.text} anchorX="center" anchorY="top">
            Net Worth
          </Text>
        </group>
      </Float>

      {!reducedMotion && <Sparkles scale={[3, 2, 3]} count={20} speed={0.3} size={0.03} color={colors.accent} />}
    </group>
  );
}

export function NetWorth3D({ data, height = 250 }: NetWorth3DProps) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  return (
    <Scene3D
      camera={{ position: [0, 0.5, 5], fov: 40 }}
      dpr={reducedMotion ? [0.5, 1] : [1, 1.5]}
      className="w-full"
      style={{ height }}
    >
      <AssetBlocks assets={data.assets} liabilities={data.liabilities} netWorth={data.netWorth} colors={colors} reducedMotion={reducedMotion} />
    </Scene3D>
  );
}
