import { Suspense, lazy, useRef, useMemo, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Canvas, type CameraProps } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei';

function getThemeColors() {
  if (typeof document === 'undefined') {
    return { text: '#ffffff', canvas: '#0f0f1a', canvas2: '#1a1a2e', accent: '#6366f1', success: '#22c55e', warning: '#eab308', error: '#ef4444' };
  }
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || (isDark ? '#e2e8f0' : '#1e293b'),
    canvas: getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || (isDark ? '#0f0f1a' : '#f8fafc'),
    canvas2: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || (isDark ? '#1a1a2e' : '#ffffff'),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6366f1',
    success: getComputedStyle(document.documentElement).getPropertyValue('--status-success').trim() || '#22c55e',
    warning: getComputedStyle(document.documentElement).getPropertyValue('--status-warning').trim() || '#eab308',
    error: getComputedStyle(document.documentElement).getPropertyValue('--status-error').trim() || '#ef4444',
  };
}

export function useThemeColors() {
  const [colors, setColors] = useState(getThemeColors);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(getThemeColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return colors;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useGpuTier() {
  const [tier, setTier] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getGPUTier } = await import('detect-gpu');
        const result = await getGPUTier();
        if (!cancelled) setTier(result.tier);
      } catch {
        if (!cancelled) setTier(1);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return tier;
}

interface Scene3DProps {
  children: ReactNode;
  className?: string;
  camera?: { position?: [number, number, number]; fov?: number; near?: number; far?: number; zoom?: number };
  dpr?: [number, number] | number;
  gl?: Record<string, unknown>;
  style?: React.CSSProperties;
}

export function Scene3D({ children, className = '', camera, dpr = [1, 1.5], gl, style }: Scene3DProps) {
  const reducedMotion = useReducedMotion();
  const gpuTier = useGpuTier();
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveDpr = useMemo(() => {
    if (reducedMotion) return [0.5, 1] as [number, number];
    if (gpuTier !== null && gpuTier < 1) return [0.5, 1] as [number, number];
    return dpr;
  }, [reducedMotion, gpuTier, dpr]);

  const frameRate = reducedMotion ? 0 : undefined;

  if (gpuTier !== null && gpuTier < 1) {
    return <div className={className} style={{ minHeight: 200, ...style }} />;
  }

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', minHeight: 200, ...style }}>
      <Canvas
        dpr={effectiveDpr}
        gl={{ antialias: !reducedMotion, alpha: true, ...gl }}
        camera={{ position: [0, 0, 5], fov: 45, ...camera }}
        frameloop={frameRate !== undefined ? 'never' : 'always'}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
}

interface LoadingFallbackProps {
  height?: number;
}

export function SceneFallback({ height = 200 }: LoadingFallbackProps) {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{ height, background: 'var(--bg-elevated)' }}
    />
  );
}
