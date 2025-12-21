
import React, { useMemo, useRef, useState, createContext, useContext } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AccountItem, FinancialHealth, Goal, WeeklyBuild, Subscription } from '../types';
import { LEDIndicator } from './ui/LEDIndicator';
import { ChassisWell } from './ui/ChassisWell';

// ============ TOOLTIP CONTEXT ============
interface TooltipInfo {
  type: 'asset' | 'debt' | 'goal' | 'fountain' | 'harbor' | 'taxvault' | 'construction' | 'tree';
  title: string;
  subtitle?: string;
  value?: string;
  description: string;
  icon: string;
  color: string;
}

const TooltipContext = createContext<{
  showTooltip: (info: TooltipInfo) => void;
  hideTooltip: () => void;
}>({ showTooltip: () => {}, hideTooltip: () => {} });

// ============ COLORS ============
const COLORS = {
  // Buildings by type (Industrial Palette)
  savings: '#F3CF44',      // Muted Yellow
  investment: '#0055FF',   // Cobalt Blue
  super: '#9C27B0',        // Purple (keeping for distinction)
  cash: '#E0E0E0',         // Gray
  debt: '#FF4F00',         // International Orange
  
  // Environment
  grass: '#D1D1D1',        // Concrete gray-green
  road: '#1A1A1A',         // Deep black
  roadMarking: '#FFFFFF',
  sidewalk: '#E0E0E0',
  
  // Features
  water: '#0055FF',        // Cobalt Blue
  waterNegative: '#FF4F00', // International Orange
  dock: '#5D4037',
  concrete: '#BDBDBD',
  
  // Rockets & Construction
  rocket: '#EBEBEB',
  rocketAccent: '#FF4F00',
  crane: '#F3CF44',
  scaffolding: '#424242',
  construction: '#FF4F00',
  
  // Nature (Industrial/Muted)
  tree: '#689F38',
  treeDark: '#33691E',
  trunk: '#4E342E',
  cloud: '#FFFFFF',
  stormCloud: '#9E9E9E',
  
  // Traffic
  trafficRed: '#FF4F00',
  trafficGreen: '#4CAF50',
  trafficYellow: '#F3CF44',
  
  // Special
  taxVault: '#1A1A1A',
  window: '#E3F2FD',
  smoke: '#1A1A1A',
};

// Traffic timing
const LIGHT_CYCLE_DURATION = 8;
const GREEN_DURATION = 3;
const YELLOW_DURATION = 1;

// ============ TRAFFIC LIGHT HOOK ============
const useTrafficLight = () => {
  const timeRef = useRef(0);
  const [horizontalGreen, setHorizontalGreen] = useState(true);
  const [isYellow, setIsYellow] = useState(false);
  
  useFrame((_, delta) => {
    timeRef.current += delta;
    const cycleTime = timeRef.current % LIGHT_CYCLE_DURATION;
    if (cycleTime < GREEN_DURATION) {
      setHorizontalGreen(true);
      setIsYellow(false);
    } else if (cycleTime < GREEN_DURATION + YELLOW_DURATION) {
      setIsYellow(true);
    } else if (cycleTime < GREEN_DURATION * 2 + YELLOW_DURATION) {
      setHorizontalGreen(false);
      setIsYellow(false);
    } else {
      setIsYellow(true);
    }
  });
  
  return { horizontalGreen, isYellow };
};

interface IsometricCityProps {
  accounts: AccountItem[];
  health: FinancialHealth;
  goals: Goal[];
  theme?: 'light' | 'mid' | 'dark';
  hasWeeds?: boolean;
  isFuture?: boolean;
  onNavigate?: (view: any) => void;
  minimal?: boolean;
  weeklyBuilds?: WeeklyBuild[];
  subscriptions?: Subscription[];
}

export const IsometricCity: React.FC<IsometricCityProps> = ({
  accounts,
  health,
  goals,
  theme = 'light',
  hasWeeds = false,
  isFuture = false,
  onNavigate,
  minimal = false,
  weeklyBuilds = [],
  subscriptions = []
}) => {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [zoom, setZoom] = useState(minimal ? 45 : 35);
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewMode, setViewMode] = useState<'isometric' | 'birdseye'>('isometric');
  const [showLegend, setShowLegend] = useState(false);

  // DEV: Harbor water override (for visual tuning)
  const isDev = (import.meta as any)?.env?.DEV === true;
  const [showHarborDev, setShowHarborDev] = useState(false);
  const [harborOverrideEnabled, setHarborOverrideEnabled] = useState(false);
  const [harborOverrideMax, setHarborOverrideMax] = useState(10000);
  const [harborOverridePct, setHarborOverridePct] = useState(100);
  
  const isDark = theme === 'dark';
  const isMid = theme === 'mid';
  const isLowScore = health.score < 40;
  
  const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
  const totalSubCost = subscriptions.reduce((sum, s) => {
    if (s.cycle === 'WEEKLY') return sum + (s.amount * 4.33);
    if (s.cycle === 'YEARLY') return sum + (s.amount / 12);
    return sum + s.amount;
  }, 0);

  // Theme colors: light = bright, mid = softer grey, dark = full dark
  const themeColors = useMemo(() => ({
    ...COLORS,
    grass: isDark ? '#064E3B' : isMid ? '#15803D' : '#22C55E', // Rich greens
    sidewalk: isDark ? '#1E293B' : isMid ? '#94A3B8' : '#F1F5F9',
    road: isDark ? '#020617' : isMid ? '#334155' : '#1E293B',
    concrete: isDark ? '#1E293B' : isMid ? '#475569' : '#CBD5E1',
    window: isDark ? '#1E293B' : isMid ? '#94A3B8' : '#E3F2FD',
    cloud: isDark ? '#334155' : isMid ? '#CBD5E1' : '#FFFFFF',
    stormCloud: isDark ? '#475569' : isMid ? '#64748B' : '#94A3B8',
    tree: isDark ? '#10B981' : isMid ? '#22C55E' : '#4ADE80',
    treeDark: isDark ? '#065F46' : isMid ? '#166534' : '#15803D',
    trunk: isDark ? '#020617' : isMid ? '#1E293B' : '#451A03',
    cash: isDark ? '#94A3B8' : isMid ? '#CBD5E1' : '#F1F5F9',
    savings: isDark ? '#CA8A04' : isMid ? '#EAB308' : '#FACC15',
    investment: isDark ? '#0071E3' : isMid ? '#0071E3' : '#3B82F6',
    super: isDark ? '#7E22CE' : isMid ? '#9333EA' : '#A855F7',
    debt: isDark ? '#EF4444' : isMid ? '#EF4444' : '#F87171',
    taxVault: isDark ? '#020617' : isMid ? '#1E293B' : '#0F172A',
    water: isDark ? '#0071E3' : isMid ? '#60A5FA' : '#93C5FD', // Brighter blues
    waterNegative: isDark ? '#EF4444' : isMid ? '#EF4444' : '#F87171',
    rocket: isDark ? '#94A3B8' : isMid ? '#CBD5E1' : '#F1F5F9',
    rocketAccent: isDark ? '#EF4444' : isMid ? '#EF4444' : '#F87171',
    construction: isDark ? '#EF4444' : isMid ? '#EF4444' : '#F87171',
    crane: isDark ? '#CA8A04' : isMid ? '#EAB308' : '#FACC15',
    scaffolding: isDark ? '#020617' : isMid ? '#1E293B' : '#334155',
    trafficRed: isDark ? '#EF4444' : isMid ? '#EF4444' : '#F87171',
    trafficGreen: isDark ? '#10B981' : isMid ? '#10B981' : '#34D399',
    trafficYellow: isDark ? '#F59E0B' : isMid ? '#F59E0B' : '#FBBF24',
    roadMarking: isDark ? '#334155' : isMid ? '#64748B' : '#FFFFFF',
    dock: isDark ? '#020617' : isMid ? '#1E293B' : '#451A03',
  }), [isDark, isMid]);

  // ============ SUB-COMPONENTS ============

  const RoadLines = ({ position, rotation }: { position: [number, number, number]; rotation?: number }) => (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[0, 0.021, -3.5 + i * 1.0]}>
          <boxGeometry args={[0.05, 0.001, 0.5]} />
          <meshStandardMaterial color={themeColors.roadMarking} transparent opacity={isDark ? 0.2 : 0.4} />
        </mesh>
      ))}
    </group>
  );

  const SidewalkDetail = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      {/* Bench */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.15]} />
        <meshStandardMaterial color={isDark ? "#1E293B" : "#5D4037"} />
      </mesh>
      <mesh position={[0, 0.02, 0.06]}><boxGeometry args={[0.4, 0.04, 0.02]} /><meshStandardMaterial color="#424242" /></mesh>
      <mesh position={[0, 0.02, -0.06]}><boxGeometry args={[0.4, 0.04, 0.02]} /><meshStandardMaterial color="#424242" /></mesh>
    </group>
  );

  const StreetLamp = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.9, 6]} />
        <meshStandardMaterial color={isDark ? "#2D3748" : "#607D8B"} metalness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.88, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.02]} />
        <meshStandardMaterial color={isDark ? "#2D3748" : "#607D8B"} />
      </mesh>
      <mesh position={[0.2, 0.84, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color="#FFF9C4" 
          emissive="#FFF59D" 
          emissiveIntensity={isDark ? 1.2 : 0.18} 
        />
      </mesh>
      {isDark && (
        <pointLight position={[0.2, 0.8, 0]} intensity={0.6} distance={4} color="#FFF59D" />
      )}
    </group>
  );

  const QuadrantSign = ({
    position,
    label,
    emoji,
    accentColor,
  }: {
    position: [number, number, number];
    label: string;
    emoji: string;
    accentColor: string;
  }) => {
    // NOTE: Use Html sprite labels so text never mirrors/flips at different camera angles.
    const rotY = useMemo(() => Math.atan2(0 - position[0], 0 - position[2]), [position]);
    return (
      <group position={position} rotation={[0, rotY, 0]}>
        {/* Post */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.04, 0.36, 8]} />
          <meshStandardMaterial color={isDark ? '#0B1220' : '#334155'} roughness={0.9} metalness={0.02} />
        </mesh>
        {/* Sign board */}
        <mesh position={[0, 0.42, 0.06]} castShadow>
          <boxGeometry args={[0.62, 0.28, 0.06]} />
          <meshStandardMaterial color={isDark ? '#111827' : '#F1F5F9'} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Accent strip */}
        <mesh position={[0, 0.42, 0.095]} castShadow>
          <boxGeometry args={[0.62, 0.04, 0.01]} />
          <meshStandardMaterial color={accentColor} roughness={0.7} metalness={0.02} />
        </mesh>

        {/* Crisp label (screen-space) */}
        <Html
          center
          transform
          sprite
          position={[0, 0.42, 0.14]}
          distanceFactor={12}
          style={{ pointerEvents: 'none' }}
        >
          <div className="select-none">
            <div className="px-2.5 py-1.5 rounded-lg bg-industrial-base/85 backdrop-blur-sm border border-white/15 shadow-tactile-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-[11px] font-black uppercase tracking-tight text-industrial-text">
                  {label}
                </span>
              </div>
            </div>
          </div>
        </Html>
      </group>
    );
  };

  const Window = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => {
    const isOn = useMemo(() => Math.random() > 0.4, []);
    return (
      <mesh position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={isDark ? (isOn ? "#60A5FA" : "#0F172A") : themeColors.window} 
          emissive={isDark && isOn ? "#4FC3F7" : "#000000"} 
          emissiveIntensity={isDark && isOn ? 0.7 : 0} 
        />
      </mesh>
    );
  };

  const Tree = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => {
    const { showTooltip } = useContext(TooltipContext);
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      showTooltip({
        type: 'tree',
        title: 'Green Space',
        description: 'Trees represent financial health. More trees appear when your city is thriving.',
        icon: '🌳',
        color: themeColors.tree
      });
    };
    return (
      <group position={position}>
        <mesh position={[0, 0.12 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.04 * scale, 0.06 * scale, 0.24 * scale, 8]} />
          <meshStandardMaterial color={themeColors.trunk} />
        </mesh>
        <mesh position={[0, 0.32 * scale, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}>
          <sphereGeometry args={[0.22 * scale, 10, 8]} />
          <meshStandardMaterial color={themeColors.tree} />
        </mesh>
        <mesh position={[0, 0.48 * scale, 0]} castShadow>
          <sphereGeometry args={[0.14 * scale, 10, 8]} />
          <meshStandardMaterial color={themeColors.treeDark} />
        </mesh>
      </group>
    );
  };

  const TrafficLight = ({ position, rotation, isGreen, isYellow }: { position: [number, number, number]; rotation?: number; isGreen: boolean; isYellow: boolean }) => (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.03, 0.04, 0.8, 8]} /><meshStandardMaterial color="#424242" /></mesh>
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.12, 0.3, 0.08]} /><meshStandardMaterial color="#212121" /></mesh>
      <mesh position={[0, 0.93, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficRed} emissive={themeColors.trafficRed} emissiveIntensity={!isGreen && !isYellow ? 1.0 : 0.06} /></mesh>
      <mesh position={[0, 0.85, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficYellow} emissive={themeColors.trafficYellow} emissiveIntensity={isYellow ? 1.0 : 0.06} /></mesh>
      <mesh position={[0, 0.77, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficGreen} emissive={themeColors.trafficGreen} emissiveIntensity={isGreen && !isYellow ? 1.0 : 0.06} /></mesh>
    </group>
  );

  const Crosswalk = ({ position, rotation }: { position: [number, number, number]; rotation?: number }) => (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[0, 0.05, -0.4 + i * 0.2]}>
          <boxGeometry args={[0.8, 0.01, 0.12]} />
          <meshStandardMaterial color={themeColors.roadMarking} />
        </mesh>
      ))}
    </group>
  );

  const Cloud = ({ position, scale = 1, isStorm = false }: { position: [number, number, number]; scale?: number; isStorm?: boolean }) => {
    const color = isStorm ? themeColors.stormCloud : themeColors.cloud;
    return (
      <group position={position}>
        <mesh><sphereGeometry args={[0.8 * scale, 12, 10]} /><meshStandardMaterial color={color} transparent opacity={0.85} depthWrite={false} /></mesh>
        <mesh position={[0.6 * scale, -0.1, 0.2 * scale]}><sphereGeometry args={[0.6 * scale, 10, 8]} /><meshStandardMaterial color={color} transparent opacity={0.8} depthWrite={false} /></mesh>
        <mesh position={[-0.5 * scale, 0.1, 0.1 * scale]}><sphereGeometry args={[0.55 * scale, 10, 8]} /><meshStandardMaterial color={color} transparent opacity={0.8} depthWrite={false} /></mesh>
      </group>
    );
  };

  const DriftingCloud = ({ initialPosition, speed, scale, isStorm = false }: { initialPosition: [number, number, number]; speed: number; scale: number; isStorm?: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, delta) => { if (ref.current) { ref.current.position.x += speed * delta; if (ref.current.position.x > 12) ref.current.position.x = -12; } });
    return <group ref={ref} position={initialPosition}><Cloud position={[0, 0, 0]} scale={scale} isStorm={isStorm} /></group>;
  };

  const AssetBuilding = ({ position, height, type, balance, name }: { position: [number, number, number]; height: number; type: string; balance: number; name?: string }) => {
    const { showTooltip } = useContext(TooltipContext);
    const getColor = () => {
      switch(type) {
        case 'SAVINGS': return themeColors.savings;
        case 'INVESTMENT': return themeColors.investment;
        case 'SUPER': return themeColors.super;
        default: return themeColors.cash;
      }
    };
    const floors = Math.min(Math.floor(height / 0.35), 10);
    const width = 0.95;
    const hasHelipad = useMemo(() => height > 2.5 && Math.random() > 0.5, [height]);
    
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      showTooltip({ type: 'asset', title: name || type, subtitle: type, value: `$${balance.toLocaleString()}`, description: 'Your bank account storage.', icon: '🏦', color: getColor() });
    };
    
    return (
      <group position={position}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial color={getColor()} roughness={0.82} metalness={0.05} />
        </mesh>
        
        {/* Roof Detail */}
        <group position={[0, height, 0]}>
          <mesh position={[0, 0.05, 0]}><boxGeometry args={[width * 0.85, 0.1, width * 0.85]} /><meshStandardMaterial color="#333" /></mesh>
          {hasHelipad ? (
            <group position={[0, 0.11, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.3, 16]} />
                <meshStandardMaterial color="#444" />
              </mesh>
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.25, 0.28, 16]} />
                <meshStandardMaterial color="#FFF" />
              </mesh>
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.2, 0.02, 0.01]} />
                <meshStandardMaterial color="#FFF" />
              </mesh>
            </group>
          ) : (
            <mesh position={[0.2, 0.15, 0.2]}><cylinderGeometry args={[0.05, 0.05, 0.2, 8]} /><meshStandardMaterial color="#222" /></mesh>
          )}
        </group>

        {Array.from({ length: floors }).map((_, f) => (
          <group key={f}>
            <Window position={[width/2 + 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.14, width * 0.6]} />
            <Window position={[-width/2 - 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.14, width * 0.6]} />
            <Window position={[0, 0.22 + f * 0.35, width/2 + 0.01]} size={[width * 0.6, 0.14, 0.02]} />
            <Window position={[0, 0.22 + f * 0.35, -width/2 - 0.01]} size={[width * 0.6, 0.14, 0.02]} />
          </group>
        ))}
      </group>
    );
  };

  const DebtBuilding = ({ position, height, type, balance, name }: { position: [number, number, number]; height: number; type: string; balance: number; name?: string }) => {
    const { showTooltip } = useContext(TooltipContext);
    const smokeRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => { if (smokeRef.current) { smokeRef.current.children.forEach((child, i) => { child.position.y = 0.12 + Math.sin(clock.elapsedTime * 2 + i) * 0.1 + i * 0.12; (child as THREE.Mesh).scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 3 + i) * 0.25); }); } });
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'debt', title: name || type.replace('_', ' '), subtitle: 'Debt', value: `-$${balance.toLocaleString()}`, description: 'Money you owe.', icon: '📉', color: themeColors.debt }); };
    const floors = Math.min(Math.floor(height / 0.35), 8);
    const width = 0.9;
    return (
      <group position={position}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial color={themeColors.debt} roughness={0.85} metalness={0.03} />
        </mesh>
        {Array.from({ length: floors }).map((_, f) => (
          <group key={f}>
            <Window position={[width/2 + 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.12, width * 0.55]} />
            <Window position={[-width/2 - 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.12, width * 0.55]} />
            <Window position={[0, 0.22 + f * 0.35, width/2 + 0.01]} size={[width * 0.55, 0.12, 0.02]} />
            <Window position={[0, 0.22 + f * 0.35, -width/2 - 0.01]} size={[width * 0.55, 0.12, 0.02]} />
          </group>
        ))}
        <group ref={smokeRef} position={[0, height + 0.25, 0]}>
          {[0, 1, 2, 3].map(i => (
            <mesh key={i} position={[0, i * 0.12, 0]}>
              <sphereGeometry args={[0.06 + i * 0.02, 8, 8]} />
              <meshStandardMaterial color={themeColors.smoke} transparent opacity={0.4 - i * 0.08} />
            </mesh>
          ))}
        </group>
      </group>
    );
  };

  const LaunchPad = ({ position, goal }: { position: [number, number, number]; goal: Goal }) => {
    const { showTooltip } = useContext(TooltipContext);
    const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
    const rocketHeight = 0.4 + progress * 0.7;
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'goal', title: goal.name, subtitle: `${goal.valueTag} Goal`, value: `$${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}`, description: 'A financial goal you are saving for.', icon: '🚀', color: progress >= 1 ? themeColors.trafficGreen : themeColors.investment }); };
    return (
      <group position={position}>
        <mesh position={[0, 0.08, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[0.6, 0.65, 0.16, 16]} /><meshStandardMaterial color={themeColors.concrete} /></mesh>
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.4, 0.5, 16]} /><meshStandardMaterial color={progress >= 1 ? themeColors.trafficGreen : themeColors.trafficYellow} /></mesh>
        {progress > 0.05 && (
          <group position={[0, 0.2, 0]}>
            <mesh position={[0, rocketHeight / 2, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[0.1, 0.12, rocketHeight, 12]} /><meshStandardMaterial color={themeColors.rocket} metalness={0.05} roughness={0.75} /></mesh>
            <mesh position={[0, rocketHeight + 0.12, 0]} onClick={handleClick} onPointerDown={handleClick}><coneGeometry args={[0.1, 0.25, 12]} /><meshStandardMaterial color={themeColors.rocketAccent} /></mesh>
          </group>
        )}
      </group>
    );
  };

  const TaxVault = ({ position, amount }: { position: [number, number, number]; amount: number }) => {
    const { showTooltip } = useContext(TooltipContext);
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'taxvault', title: 'Tax Vault', value: `$${amount.toLocaleString()}`, description: 'Quarantined tax reserves.', icon: '🏛️', color: themeColors.taxVault }); };
    return (
      <group position={position}>
        <mesh position={[0, 0.12, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}><boxGeometry args={[0.7, 0.24, 0.7]} /><meshStandardMaterial color="#37474F" /></mesh>
        <mesh position={[0, 0.45, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}><boxGeometry args={[0.6, 0.42, 0.6]} /><meshStandardMaterial color={themeColors.taxVault} metalness={0.08} roughness={0.85} /></mesh>
      </group>
    );
  };

  const HarborDock = ({
    position,
    savings,
    maxSavingsRef
  }: {
    position: [number, number, number];
    savings: number;
    maxSavingsRef: number;
  }) => {
    const { showTooltip } = useContext(TooltipContext);
    const rippleRef = useRef<THREE.Group>(null);
    const boatsRef = useRef<THREE.Group>(null);

    const savingsRatio = useMemo(() => {
      const denom = Math.max(maxSavingsRef, 1);
      return Math.min(Math.max(savings / denom, 0), 1);
    }, [savings, maxSavingsRef]);

    // Recessed basin dimensions (clay/diorama vibe)
    const basin = useMemo(() => ({
      w: 3.2,
      d: 2.4,
      wall: 0.16,
      floorY: -0.06,
      maxWaterY: 0.06,
      minWaterY: -0.05,
    }), []);

    const waterY = useMemo(() => {
      return basin.minWaterY + (basin.maxWaterY - basin.minWaterY) * savingsRatio;
    }, [basin, savingsRatio]);

    const boatConfigs = useMemo(() => {
      // Keep boats inside inner basin (avoid clipping walls)
      const innerW = basin.w - basin.wall * 2 - 0.25;
      const innerD = basin.d - basin.wall * 2 - 0.25;
      return Array.from({ length: 2 }, (_, i) => ({
        id: `boat-${i}`,
        x: (Math.random() - 0.5) * innerW * 0.55,
        z: (Math.random() - 0.5) * innerD * 0.55,
        rot: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        scale: 0.9 + Math.random() * 0.25,
      }));
    }, [basin]);

    useFrame(({ clock }) => {
      if (rippleRef.current) {
        rippleRef.current.children.forEach((child, i) => {
          child.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + i) * 0.05);
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.opacity = 0.35 + Math.sin(clock.elapsedTime * 2 + i) * 0.12;
        });
      }
      if (boatsRef.current) {
        boatsRef.current.children.forEach((child, i) => {
          // Gentle bob + micro rock
          child.position.y = waterY + 0.02 + Math.sin(clock.elapsedTime * 1.6 + i) * 0.015;
          child.rotation.z = Math.sin(clock.elapsedTime * 1.2 + i) * 0.04;
          child.rotation.x = Math.cos(clock.elapsedTime * 1.1 + i) * 0.03;
        });
      }
    });
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      showTooltip({
        type: 'harbor',
        title: 'Liquidity Harbor',
        value: `$${savings.toLocaleString()}`,
        description: 'This basin fills with your liquid savings (cash + savings + investments + super). Higher water = more runway.',
        icon: '⚓',
        color: themeColors.water
      });
    };
    return (
      <group position={position}>
        {/* Basin floor */}
        <mesh position={[0, basin.floorY, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[basin.w, 0.08, basin.d]} />
          <meshStandardMaterial color={isDark ? '#0B1220' : '#CBD5E1'} roughness={0.9} metalness={0.02} />
        </mesh>

        {/* Walls */}
        <mesh position={[0, basin.floorY + 0.12, (basin.d / 2) - (basin.wall / 2)]} receiveShadow>
          <boxGeometry args={[basin.w, 0.24, basin.wall]} />
          <meshStandardMaterial color={isDark ? '#111827' : '#E2E8F0'} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0, basin.floorY + 0.12, -(basin.d / 2) + (basin.wall / 2)]} receiveShadow>
          <boxGeometry args={[basin.w, 0.24, basin.wall]} />
          <meshStandardMaterial color={isDark ? '#111827' : '#E2E8F0'} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[(basin.w / 2) - (basin.wall / 2), basin.floorY + 0.12, 0]} receiveShadow>
          <boxGeometry args={[basin.wall, 0.24, basin.d]} />
          <meshStandardMaterial color={isDark ? '#111827' : '#E2E8F0'} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[-(basin.w / 2) + (basin.wall / 2), basin.floorY + 0.12, 0]} receiveShadow>
          <boxGeometry args={[basin.wall, 0.24, basin.d]} />
          <meshStandardMaterial color={isDark ? '#111827' : '#E2E8F0'} roughness={0.85} metalness={0.02} />
        </mesh>

        {/* Water (height = savings) */}
        <mesh position={[0, waterY, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[basin.w - basin.wall * 2, 0.06, basin.d - basin.wall * 2]} />
          <meshStandardMaterial color={themeColors.water} transparent opacity={0.78} roughness={0.35} metalness={0.02} />
        </mesh>

        {/* Ripples */}
        <group ref={rippleRef}>
          <mesh position={[0, waterY + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.75, 0.9, 16]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <mesh position={[0.3, waterY + 0.036, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.43, 16]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.12} depthWrite={false} />
          </mesh>
        </group>

        {/* Simple dock + posts */}
        <mesh position={[0.95, basin.floorY + 0.18, 0]} onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[0.42, 0.06, basin.d * 0.75]} />
          <meshStandardMaterial color={themeColors.dock} roughness={0.9} metalness={0.02} />
        </mesh>
        {[0.7, -0.7].map((z, i) => (
          <mesh key={i} position={[1.1, basin.floorY + 0.26, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
            <meshStandardMaterial color={isDark ? '#0B1220' : '#334155'} roughness={0.95} metalness={0.02} />
          </mesh>
        ))}

        {/* Boats */}
        <group ref={boatsRef}>
          {boatConfigs.map(b => (
            <group key={b.id} position={[b.x, waterY + 0.02, b.z]} rotation={[0, b.rot, 0]} scale={[b.scale, b.scale, b.scale]}>
              <mesh castShadow>
                <boxGeometry args={[0.28, 0.08, 0.14]} />
                <meshStandardMaterial color={isDark ? '#0B1220' : '#334155'} roughness={0.85} metalness={0.02} />
              </mesh>
              <mesh position={[0, 0.06, 0]} castShadow>
                <boxGeometry args={[0.22, 0.06, 0.11]} />
                <meshStandardMaterial color={isDark ? '#111827' : '#E2E8F0'} roughness={0.9} metalness={0.02} />
              </mesh>
              <mesh position={[0.08, 0.14, 0]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.18, 8]} />
                <meshStandardMaterial color={isDark ? '#334155' : '#64748B'} roughness={0.95} metalness={0.02} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    );
  };

  const CashflowFountain = ({
    surplus,
    position = [0, 0, 0],
    scale = 1,
  }: {
    surplus: number;
    maxSurplus: number;
    position?: [number, number, number];
    scale?: number;
  }) => {
    const { showTooltip } = useContext(TooltipContext);
    const waterRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Group>(null);
    
    useFrame(({ clock }) => {
      if (waterRef.current) {
        waterRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 4) * 0.1;
      }
      if (particlesRef.current) {
        particlesRef.current.children.forEach((p, i) => {
          p.position.y = 0.2 + (Math.sin(clock.elapsedTime * 5 + i) + 1) * 0.15;
          p.scale.setScalar(0.5 + Math.sin(clock.elapsedTime * 3 + i) * 0.2);
        });
      }
    });
    
    const isNegative = surplus < 0;
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'fountain', title: 'Cashflow Fountain', value: `${isNegative ? '-' : '+'}$${Math.abs(surplus).toLocaleString()}/mo`, description: 'Your monthly money left over.', icon: isNegative ? '🔴' : '⛲', color: isNegative ? themeColors.trafficRed : themeColors.trafficGreen }); };
    
    return (
      <group position={position} scale={[scale, scale, scale]}>
        {/* Base Pool */}
        <mesh position={[0, 0.04, 0]} onClick={handleClick} onPointerDown={handleClick}>
          <cylinderGeometry args={[0.72, 0.78, 0.08, 24]} />
          <meshStandardMaterial color={isDark ? "#1A202C" : "#E0E0E0"} />
        </mesh>
        {/* Water Surface */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.66, 0.66, 0.02, 24]} />
          <meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.6} />
        </mesh>
        {/* Tier 1 */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.38, 0.44, 0.12, 16]} />
          <meshStandardMaterial color={isDark ? "#2D3748" : "#BDBDBD"} />
        </mesh>
        {/* Tier 2 (Water Column) */}
        <mesh ref={waterRef} position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.14, 0.2, 0.26, 12]} />
          <meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.8} />
        </mesh>
        {/* Particles/Splashes */}
        <group ref={particlesRef}>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.26, 0.32, Math.sin(i) * 0.26]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      </group>
    );
  };

  // ============ TRAFFIC SYSTEM ============
  const CAR_COLORS = [0xFF4F00, 0x0055FF, 0xF3CF44, 0x1A1A1A, 0xFFFFFF];
  const PEOPLE_COLORS = [0xFF4F00, 0x0055FF, 0xF3CF44, 0x1A1A1A];
  const STOP_LINE = 1.8;

  // World props that cars should never clip through (even if we add new props later)
  const CASHFLOW_FOUNTAIN_POS: [number, number, number] = [-2.4, 0.02, 2.4];
  const NO_DRIVE_ZONES = [
    { id: 'cashflowFountain', x: CASHFLOW_FOUNTAIN_POS[0], z: CASHFLOW_FOUNTAIN_POS[2], r: 0.95 },
  ] as const;

  const wouldEnterNoDriveZone = (nextX: number, nextZ: number) => {
    for (const zone of NO_DRIVE_ZONES) {
      const dx = nextX - zone.x;
      const dz = nextZ - zone.z;
      if (dx * dx + dz * dz <= zone.r * zone.r) return true;
    }
    return false;
  };
  
  type CarDirection = 'EAST' | 'WEST' | 'NORTH' | 'SOUTH';
  
  const Car = ({ direction, speed, horizontalGreen }: { direction: CarDirection; speed: number; horizontalGreen: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    const color = useMemo(() => CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], []);
    
    const getInitialPosition = (): [number, number, number] => {
      switch(direction) {
        case 'EAST': return [-7, 0.12, -0.4];
        case 'WEST': return [7, 0.12, 0.4];
        case 'NORTH': return [0.4, 0.12, 7];
        case 'SOUTH': return [-0.4, 0.12, -7];
      }
    };
    
    const getRotation = (): number => {
      switch(direction) {
        case 'EAST': return 0;
        case 'WEST': return Math.PI;
        case 'NORTH': return -Math.PI / 2;
        case 'SOUTH': return Math.PI / 2;
      }
    };
    
    const initialPos = useMemo(() => getInitialPosition(), [direction]);
    
    useFrame((_, delta) => {
      if (!ref.current) return;
      const pos = ref.current.position;
      
      const isHorizontal = direction === 'EAST' || direction === 'WEST';
      const canGo = isHorizontal ? horizontalGreen : !horizontalGreen;
      
      let shouldStop = false;
      if (!canGo) {
        if (direction === 'EAST' && pos.x < -STOP_LINE && pos.x > -STOP_LINE - 1) shouldStop = true;
        if (direction === 'WEST' && pos.x > STOP_LINE && pos.x < STOP_LINE + 1) shouldStop = true;
        if (direction === 'SOUTH' && pos.z < -STOP_LINE && pos.z > -STOP_LINE - 1) shouldStop = true;
        if (direction === 'NORTH' && pos.z > STOP_LINE && pos.z < STOP_LINE + 1) shouldStop = true;
      }
      
      const move = speed * delta * 60;
      const nextX =
        direction === 'EAST' ? pos.x + move :
        direction === 'WEST' ? pos.x - move :
        pos.x;
      const nextZ =
        direction === 'SOUTH' ? pos.z + move :
        direction === 'NORTH' ? pos.z - move :
        pos.z;

      // Never allow cars to enter prop zones (prevents clipping through fountain/statues/etc.)
      if (!shouldStop && wouldEnterNoDriveZone(nextX, nextZ)) shouldStop = true;

      if (!shouldStop) {
        switch(direction) {
          case 'EAST': pos.x = nextX; if (pos.x > 8) pos.x = -8; break;
          case 'WEST': pos.x = nextX; if (pos.x < -8) pos.x = 8; break;
          case 'NORTH': pos.z = nextZ; if (pos.z < -8) pos.z = 8; break;
          case 'SOUTH': pos.z = nextZ; if (pos.z > 8) pos.z = -8; break;
        }
      }
    });
    
    return (
      <group ref={ref} position={initialPos} rotation={[0, getRotation(), 0]}>
        <mesh castShadow><boxGeometry args={[0.4, 0.15, 0.22]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[0.22, 0.1, 0.18]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0.12, 0.02, 0.12]}><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#212121" /></mesh>
        <mesh position={[0.12, 0.02, -0.12]}><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#212121" /></mesh>
        <mesh position={[-0.12, 0.02, 0.12]}><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#212121" /></mesh>
        <mesh position={[-0.12, 0.02, -0.12]}><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#212121" /></mesh>
        {/* Headlights */}
        <mesh position={[0.18, 0.06, 0.08]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.55} /></mesh>
        <mesh position={[0.18, 0.06, -0.08]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.55} /></mesh>
      </group>
    );
  };
  
  type PedestrianQuadrant = 'NW' | 'NE' | 'SW' | 'SE';
  
  const Pedestrian = ({ quadrant, speed, horizontalGreen }: { quadrant: PedestrianQuadrant; speed: number; horizontalGreen: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    const legRef = useRef<THREE.Group>(null);
    const color = useMemo(() => PEOPLE_COLORS[Math.floor(Math.random() * PEOPLE_COLORS.length)], []);
    const skinColor = 0xFFD5B5;
    
    const corners = useMemo(() => {
      const offset = 4.5;
      const inner = 1.5;
      switch(quadrant) {
        // NW quadrant: Asset buildings area (sidewalk around buildings)
        case 'NW': return [[-offset, inner], [-offset, -offset], [-inner, -offset], [-inner, inner]];
        // NE quadrant: Debt buildings area (sidewalk around buildings)
        case 'NE': return [[inner, -offset], [offset, -offset], [offset, inner], [inner, inner]];
        // SW quadrant: Goals/Launchpad area (sidewalk around rockets)
        case 'SW': return [[-inner, offset], [-offset, offset], [-offset, -inner], [-inner, -inner]];
        // SE quadrant: Only the outer edge sidewalk (avoid harbor/water at center)
        case 'SE': return [[offset, inner], [offset, offset], [inner, offset], [inner, inner]];
      }
    }, [quadrant]);
    
    const cornerIdxRef = useRef(Math.floor(Math.random() * 4));
    const progressRef = useRef(Math.random());
    
    useFrame((_, delta) => {
      if (!ref.current) return;
      
      const currentCorner = corners[cornerIdxRef.current];
      const nextCorner = corners[(cornerIdxRef.current + 1) % 4];
      
      progressRef.current += speed * delta * 0.5;
      
      if (progressRef.current >= 1) {
        progressRef.current = 0;
        cornerIdxRef.current = (cornerIdxRef.current + 1) % 4;
      }
      
      const x = currentCorner[0] + (nextCorner[0] - currentCorner[0]) * progressRef.current;
      const z = currentCorner[1] + (nextCorner[1] - currentCorner[1]) * progressRef.current;
      
      ref.current.position.set(x, 0.12, z);
      
      const dx = nextCorner[0] - currentCorner[0];
      const dz = nextCorner[1] - currentCorner[1];
      ref.current.rotation.y = Math.atan2(dx, dz);
      
      if (legRef.current) {
        legRef.current.rotation.x = Math.sin(progressRef.current * Math.PI * 8) * 0.4;
      }
    });
    
    return (
      <group ref={ref}>
        <mesh position={[0, 0.18, 0]} castShadow><capsuleGeometry args={[0.06, 0.12, 4, 8]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.35, 0]} castShadow><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color={skinColor} /></mesh>
        <group ref={legRef} position={[0, 0.05, 0]}>
          <mesh position={[0.02, 0, 0]}><capsuleGeometry args={[0.02, 0.06, 4, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
          <mesh position={[-0.02, 0, 0]}><capsuleGeometry args={[0.02, 0.06, 4, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
        </group>
      </group>
    );
  };

  const StarField = () => {
    const stars = useMemo(() => {
      return Array.from({ length: 100 }, () => ({
        position: [
          (Math.random() - 0.5) * 30,
          8 + Math.random() * 5,
          (Math.random() - 0.5) * 30
        ] as [number, number, number],
        size: 0.02 + Math.random() * 0.03,
        opacity: 0.2 + Math.random() * 0.8
      }));
    }, []);

    return (
      <group>
        {stars.map((s, i) => (
          <mesh key={i} position={s.position}>
            <sphereGeometry args={[s.size, 4, 4]} />
            <meshBasicMaterial color="#FFF" transparent opacity={s.opacity} />
          </mesh>
        ))}
      </group>
    );
  };

  const CityScene = () => {
    const cityRef = useRef<THREE.Group>(null);
    const { horizontalGreen, isYellow } = useTrafficLight();
    useFrame((_, delta) => { if (cityRef.current && autoRotate) cityRef.current.rotation.y += delta * 0.04; });
    const assetsAcc = useMemo(() => accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type)), [accounts]);
    const debtsAcc = useMemo(() => accounts.filter(a => ['LOAN', 'CREDIT_CARD', 'HECS'].includes(a.type)), [accounts]);
    const maxBalance = useMemo(() => Math.max(...accounts.map(a => a.balance), 1), [accounts]);
    const harborDisplay = useMemo(() => {
      if (!harborOverrideEnabled) return { savings: health.savings, maxRef: Math.max(health.savings * 1.2, 1000) };
      const maxRef = Math.max(harborOverrideMax, 1);
      const savings = Math.round((harborOverridePct / 100) * maxRef);
      return { savings, maxRef };
    }, [harborOverrideEnabled, harborOverrideMax, harborOverridePct, health.savings]);
    
    // Traffic density based on health score
    const numCars = health.score > 70 ? 6 : health.score > 40 ? 4 : 2;
    const numPedestrians = health.score > 70 ? 12 : health.score > 40 ? 8 : 4;
    
    const carConfigs = useMemo(() => {
      const directions: CarDirection[] = ['EAST', 'WEST', 'NORTH', 'SOUTH'];
      return Array.from({ length: numCars }, (_, i) => ({
        id: `car-${i}`,
        direction: directions[i % 4],
        speed: 0.025 + Math.random() * 0.01
      }));
    }, [numCars]);
    
    const pedestrianConfigs = useMemo(() => {
      const quadrants: PedestrianQuadrant[] = ['NW', 'NE', 'SW', 'SE'];
      return Array.from({ length: numPedestrians }, (_, i) => ({
        id: `ped-${i}`,
        quadrant: quadrants[i % 4],
        speed: 0.3 + Math.random() * 0.2
      }));
    }, [numPedestrians]);
    
    return (
      <group ref={cityRef}>
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[14, 0.3, 14]} />
          <meshStandardMaterial color={isDark ? "#0F172A" : "#37474F"} />
        </mesh>
        
        {/* Ground Grid for "Grid" feel */}
        <gridHelper args={[14, 14, isDark ? "#1E293B" : "#455A64", isDark ? "#020617" : "#37474F"]} position={[0, 0.01, 0]} />

        <mesh position={[-3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={themeColors.grass} /></mesh>
        <mesh position={[3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={themeColors.grass} /></mesh>
        <mesh position={[-3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={themeColors.grass} /></mesh>
        <mesh position={[3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={themeColors.grass} /></mesh>
        
        <mesh position={[-4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, -4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, 4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[2.2, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>

        {/* Road Lines */}
        <RoadLines position={[-4.5, 0.02, 0]} rotation={Math.PI / 2} />
        <RoadLines position={[4.5, 0.02, 0]} rotation={Math.PI / 2} />
        <RoadLines position={[0, 0.02, -4.5]} />
        <RoadLines position={[0, 0.02, 4.5]} />

        {[[-3.8, -3.8], [-3.8, 3.8], [3.8, -3.8], [3.8, 3.8]].map(([bx, bz], i) => (
          <group key={i}>
            <mesh position={[bx, 0.11, bz > 0 ? bz - 2.4 : bz + 2.4]} receiveShadow><boxGeometry args={[5.1, 0.08, 0.4]} /><meshStandardMaterial color={themeColors.sidewalk} /></mesh>
            <mesh position={[bx > 0 ? bx - 2.4 : bx + 2.4, 0.11, bz]} receiveShadow><boxGeometry args={[0.4, 0.08, 5.1]} /><meshStandardMaterial color={themeColors.sidewalk} /></mesh>
            
            {/* Sidewalk details */}
            <SidewalkDetail position={[bx > 0 ? bx - 1.2 : bx + 1.2, 0.15, bz > 0 ? bz - 2.2 : bz + 2.2]} />
            <SidewalkDetail position={[bx > 0 ? bx - 2.2 : bx + 2.2, 0.15, bz > 0 ? bz - 1.2 : bz + 1.2]} />

            {/* Street Lamps on corners */}
            <StreetLamp position={[bx > 0 ? bx - 2.1 : bx + 2.1, 0.15, bz > 0 ? bz - 2.1 : bz + 2.1]} />
          </group>
        ))}
        
        {/* Traffic Lights */}
        <TrafficLight position={[-1.3, 0, -1.3]} rotation={Math.PI / 4} isGreen={horizontalGreen} isYellow={isYellow && horizontalGreen} />
        <TrafficLight position={[1.3, 0, 1.3]} rotation={-Math.PI * 3 / 4} isGreen={horizontalGreen} isYellow={isYellow && horizontalGreen} />
        <TrafficLight position={[1.3, 0, -1.3]} rotation={-Math.PI / 4} isGreen={!horizontalGreen} isYellow={isYellow && !horizontalGreen} />
        <TrafficLight position={[-1.3, 0, 1.3]} rotation={Math.PI * 3 / 4} isGreen={!horizontalGreen} isYellow={isYellow && !horizontalGreen} />
        
        {/* Crosswalks */}
        <Crosswalk position={[-1.5, 0, 0]} rotation={0} />
        <Crosswalk position={[1.5, 0, 0]} rotation={0} />
        <Crosswalk position={[0, 0, -1.5]} rotation={Math.PI / 2} />
        <Crosswalk position={[0, 0, 1.5]} rotation={Math.PI / 2} />
        
        {/* Cars */}
        {carConfigs.map(cfg => (
          <Car key={cfg.id} direction={cfg.direction} speed={cfg.speed} horizontalGreen={horizontalGreen} />
        ))}
        
        {/* Pedestrians */}
        {pedestrianConfigs.map(cfg => (
          <Pedestrian key={cfg.id} quadrant={cfg.quadrant} speed={cfg.speed} horizontalGreen={horizontalGreen} />
        ))}
        
        {/* Cashflow fountain lives in the SW “plaza” (off the intersection) so traffic never clips it */}
        <CashflowFountain
          surplus={monthlySurplus}
          maxSurplus={Math.max(health.monthlyIncome, 5000)}
          position={CASHFLOW_FOUNTAIN_POS}
          scale={1}
        />
        {/* Asset Buildings - NW Quadrant (max 4) */}
        {assetsAcc.slice(0, 4).map((acc, i) => {
          const positions: [number, number, number][] = [[-4.0, 0.1, -4.0], [-2.8, 0.1, -4.0], [-4.0, 0.1, -2.8], [-2.8, 0.1, -2.8]];
          return <AssetBuilding key={acc.id} position={positions[i]} height={Math.max(1.2, (acc.balance / maxBalance) * 4.0)} type={acc.type} balance={acc.balance} name={acc.name} />;
        })}
        {assetsAcc.length < 4 && Array.from({ length: 4 - assetsAcc.length }).map((_, i) => {
          const positions: [number, number, number][] = [[-4.0, 0.1, -4.0], [-2.8, 0.1, -4.0], [-4.0, 0.1, -2.8], [-2.8, 0.1, -2.8]];
          const pos = positions[assetsAcc.length + i];
          return (
            <group key={`empty-asset-${i}`} position={pos}>
              <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[0.95, 0.1, 0.95]} />
                <meshStandardMaterial color={isDark ? "#1A202C" : "#BDBDBD"} transparent opacity={0.3} />
              </mesh>
              {i % 2 === 0 ? <Tree position={[0, 0, 0]} scale={0.5} /> : null}
            </group>
          );
        })}
        {/* Debt Buildings - NE Quadrant (max 3) */}
        {debtsAcc.slice(0, 3).map((acc, i) => {
          const positions: [number, number, number][] = [[4.0, 0.1, -4.0], [2.8, 0.1, -4.0], [4.0, 0.1, -2.8]];
          return <DebtBuilding key={acc.id} position={positions[i]} height={Math.max(1.0, (acc.balance / maxBalance) * 3.0)} type={acc.type} balance={acc.balance} name={acc.name} />;
        })}
        {debtsAcc.length < 3 && Array.from({ length: 3 - debtsAcc.length }).map((_, i) => {
          const positions: [number, number, number][] = [[4.0, 0.1, -4.0], [2.8, 0.1, -4.0], [4.0, 0.1, -2.8]];
          const pos = positions[debtsAcc.length + i];
          return (
            <group key={`empty-debt-${i}`} position={pos}>
              <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[0.9, 0.1, 0.9]} />
                <meshStandardMaterial color={isDark ? "#1A202C" : "#BDBDBD"} transparent opacity={0.3} />
              </mesh>
              <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.05, 0.4, 0.05]} />
                <meshStandardMaterial color={themeColors.scaffolding} />
              </mesh>
            </group>
          );
        })}
        {/* Launch Pads - SW Quadrant (max 3) */}
        {goals.slice(0, 3).map((goal, i) => {
          const positions: [number, number, number][] = [[-4.2, 0.1, 3.5], [-3.0, 0.1, 3.5], [-4.2, 0.1, 4.8]];
          return <LaunchPad key={goal.id} position={positions[i]} goal={goal} />;
        })}
        {goals.length < 3 && Array.from({ length: 3 - goals.length }).map((_, i) => {
          const positions: [number, number, number][] = [[-4.2, 0.1, 3.5], [-3.0, 0.1, 3.5], [-4.2, 0.1, 4.8]];
          const pos = positions[goals.length + i];
          return (
            <group key={`empty-goal-${i}`} position={pos}>
              <mesh position={[0, 0.05, 0]} receiveShadow>
                <cylinderGeometry args={[0.6, 0.65, 0.1, 16]} />
                <meshStandardMaterial color={isDark ? "#1A202C" : "#BDBDBD"} transparent opacity={0.5} />
              </mesh>
              <mesh position={[0.4, 0.3, 0.4]} rotation={[0, Math.PI / 4, 0]}>
                <boxGeometry args={[0.1, 0.6, 0.1]} />
                <meshStandardMaterial color={themeColors.scaffolding} />
              </mesh>
            </group>
          );
        })}
        <HarborDock position={[3.6, 0.08, 3.9]} savings={harborDisplay.savings} maxSavingsRef={harborDisplay.maxRef} />
        {health.taxVault > 0 && <TaxVault position={[4.8, 0.1, 2.8]} amount={health.taxVault} />}
        {([[-5.5, 0.08, -5.5], [5.5, 0.08, -5.5], [-5.5, 0.08, 5.5], [5.5, 0.08, 5.5], [-2.5, 0.08, -5.5], [2.5, 0.08, -5.5], [-5.5, 0.08, -2.5], [5.5, 0.08, -2.5]].map((pos, i) => <Tree key={i} position={pos as [number, number, number]} scale={0.7 + Math.random() * 0.3} />))}

        {/* In-world quadrant signage */}
        <QuadrantSign position={[-5.2, 0.08, -5.2]} label="Banks" emoji="🏦" accentColor={themeColors.savings} />
        <QuadrantSign position={[5.2, 0.08, -5.2]} label="Debts" emoji="⚠️" accentColor={themeColors.debt} />
        <QuadrantSign position={[-5.2, 0.08, 5.2]} label="Goals" emoji="🚀" accentColor={themeColors.investment} />
        <QuadrantSign position={[5.2, 0.08, 5.2]} label="Harbor" emoji="⚓" accentColor={themeColors.water} />

        <DriftingCloud initialPosition={[-8, 8, -6]} speed={0.15} scale={1.2} isStorm={isLowScore} />
        <DriftingCloud initialPosition={[5, 9, -3]} speed={0.12} scale={0.9} isStorm={isLowScore} />
        <DriftingCloud initialPosition={[-3, 7, 5]} speed={0.1} scale={1.1} isStorm={isLowScore} />
        {isDark && <StarField />}
      </group>
    );
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 8, 70));
  const handleZoomOut = () => setZoom(z => Math.max(z - 8, 22));
  const toggleView = () => setViewMode(v => v === 'isometric' ? 'birdseye' : 'isometric');

  const showTooltip = (info: TooltipInfo) => setTooltip(info);
  const hideTooltip = () => setTooltip(null);

  const getSkyClass = () => {
    if (isFuture) return "bg-gradient-to-b from-[#140022] via-[#0B1020] to-[#020617]";
    // Theme-based sky: light = bright, mid = soft grey, dark = near black
    if (isLowScore) {
      if (isDark) return "bg-gradient-to-b from-[#0B1220] via-[#060914] to-[#020617]";
      if (isMid) return "bg-gradient-to-b from-[#94A3B8] via-[#64748B] to-[#334155]";
      return "bg-gradient-to-b from-[#CBD5E1] via-[#94A3B8] to-[#64748B]";
    }
    if (health.score > 70) {
      if (isDark) return "bg-gradient-to-b from-[#0B1220] via-[#020617] to-[#020617]";
      if (isMid) return "bg-gradient-to-b from-[#93C5FD] via-[#3B82F6] to-[#1D4ED8]";
      return "bg-gradient-to-b from-[#E0F2FE] via-[#BFDBFE] to-[#93C5FD]";
    }
    if (isDark) return "bg-gradient-to-b from-[#0B1220] via-[#0F172A] to-[#020617]";
    if (isMid) return "bg-gradient-to-b from-[#BFDBFE] via-[#60A5FA] to-[#3B82F6]";
    return "bg-gradient-to-b from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]";
  };

  const cameraPosition: [number, number, number] = viewMode === 'birdseye' 
    ? [0, 30, 0.1]  
    : [20, 20, 20]; 
  
  const polarAngle = viewMode === 'birdseye' 
    ? { min: 0, max: 0.1 }  
    : { min: Math.PI / 4, max: Math.PI / 3 }; 

  return (
    <div className={`w-full h-full ${minimal ? '' : 'h-[500px] md:h-[600px]'} ${getSkyClass()} relative rounded-2xl overflow-hidden shadow-inner`}>
      {/* Subtle vignette for depth (keep very light; fog already adds haze) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/18" />
      
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <div className="flex flex-col bg-industrial-base rounded-xl overflow-hidden shadow-tactile-raised border-t border-l border-white/40">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-11 h-11 flex items-center justify-center text-industrial-text hover:bg-black/5 transition-colors text-lg font-black active:shadow-inner"
          >
            +
          </button>
          <div className="h-px w-full bg-black/10"></div>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-11 h-11 flex items-center justify-center text-industrial-text hover:bg-black/5 transition-colors text-lg font-black active:shadow-inner"
          >
            −
          </button>
        </div>
        
        <button
          onClick={toggleView}
          aria-label={viewMode === 'birdseye' ? 'Switch to isometric view' : 'Switch to birdseye view'}
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-tactile-raised border-t border-l border-white/40 active:translate-y-[1px] ${viewMode === 'birdseye' ? 'bg-industrial-blue text-white' : 'bg-industrial-base text-industrial-text'}`}
        >
          {viewMode === 'birdseye' ? '🦅' : '🏙️'}
        </button>
        
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          aria-label={autoRotate ? 'Disable auto rotate' : 'Enable auto rotate'}
          className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-tactile-raised border-t border-l border-white/40 active:translate-y-[1px] ${autoRotate ? 'bg-industrial-blue text-white' : 'bg-industrial-base text-industrial-text'}`}
        >
          ⟳
        </button>

        <button
          onClick={() => setShowLegend(s => !s)}
          aria-label={showLegend ? 'Hide legend' : 'Show legend'}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-tactile-raised border-t border-l border-white/40 active:translate-y-[1px] bg-industrial-base text-industrial-text"
        >
          ?
        </button>

        {isDev && (
          <button
            onClick={() => setShowHarborDev(s => !s)}
            aria-label={showHarborDev ? 'Hide harbor dev tools' : 'Show harbor dev tools'}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-tactile-raised border-t border-l border-white/40 active:translate-y-[1px] ${showHarborDev ? 'bg-industrial-yellow text-industrial-dark-base' : 'bg-industrial-base text-industrial-text'}`}
            title="DEV: Harbor water override"
          >
            🧪
          </button>
        )}
      </div>

      {!minimal && (
        <>
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h2 className="text-industrial-text font-black text-xl uppercase tracking-tighter drop-shadow-sm">{isFuture ? 'Sector 7 // Future' : 'Grid // Primary'}</h2>
            <p className="tactile-label text-industrial-subtext/60">{accounts.length} ACCOUNTS • {goals.length} TARGETS</p>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-tactile-sm border-t border-l border-white/60 ${health.score > 70 ? 'bg-emerald-500 text-white' : health.score > 40 ? 'bg-industrial-yellow text-industrial-dark-base' : 'bg-industrial-orange text-white'}`}>
              SCORE: {health.score}
            </div>
          </div>

          <div className="absolute top-16 left-4 z-10 bg-industrial-base/90 backdrop-blur rounded-xl px-4 py-2 shadow-tactile-sm border-t border-l border-white/60 flex items-center gap-3">
            <span className={`text-[10px] font-black tracking-tighter ${monthlySurplus >= 0 ? 'text-emerald-500' : 'text-industrial-orange'}`}>
              {monthlySurplus >= 0 ? '↑' : '↓'} ${Math.abs(monthlySurplus).toLocaleString()} / MO
            </span>
            {totalSubCost > 0 && <>
              <div className="w-px h-3 bg-industrial-well-shadow-light/50"></div>
              <span className="text-[10px] font-black text-industrial-blue uppercase tracking-tighter">BURN: ${Math.round(totalSubCost)}</span>
            </>}
          </div>

          <div className="absolute bottom-4 right-4 z-10 bg-industrial-base/90 backdrop-blur rounded-2xl p-4 shadow-tactile-raised border-t border-l border-white/60 max-w-[200px]">
            <div className="flex justify-between items-center mb-3">
              <span className="tactile-label text-industrial-subtext/60">Target Modules</span>
              <LEDIndicator active={hasWeeds} color="yellow" />
            </div>
            {goals.length === 0 && <p className="text-[10px] font-bold text-industrial-subtext/40 uppercase">System idle.</p>}
            {goals.slice(0, 3).map(g => {
              const p = Math.min(g.currentAmount / g.targetAmount, 1);
              return (
                <div key={g.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-industrial-text uppercase tracking-tighter truncate max-w-[100px]">{g.name}</span>
                    <span className={`text-[10px] font-black ${p >= 1 ? 'text-emerald-500' : 'text-industrial-subtext/40'}`}>{Math.round(p * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-industrial-well-bg rounded-full shadow-well p-0.5">
                    <div className={`h-full rounded-full transition-all duration-1000 ${p >= 1 ? 'bg-emerald-500' : 'bg-industrial-blue'}`} style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-4 z-10 bg-industrial-base/80 backdrop-blur rounded-xl p-3 shadow-tactile-sm border-t border-l border-white/10 space-y-1.5">
            <div className="tactile-label text-industrial-subtext/60 mb-2">Sector Index</div>
            <div className="flex items-center gap-2 text-[9px] font-black text-industrial-text/80 uppercase tracking-tight"><div className="w-2.5 h-2.5 rounded bg-industrial-yellow shadow-sm"></div> NW: Banks</div>
            <div className="flex items-center gap-2 text-[9px] font-black text-industrial-text/80 uppercase tracking-tight"><div className="w-2.5 h-2.5 rounded bg-industrial-orange shadow-sm"></div> NE: Debts</div>
            <div className="flex items-center gap-2 text-[9px] font-black text-industrial-text/80 uppercase tracking-tight"><div className="w-2.5 h-2.5 rounded bg-industrial-blue shadow-sm"></div> SW: Goals</div>
            <div className="flex items-center gap-2 text-[9px] font-black text-industrial-text/80 uppercase tracking-tight"><div className="w-2.5 h-2.5 rounded bg-white shadow-sm border border-black/10"></div> SE: Harbor</div>
          </div>
        </>
      )}

      {showLegend && (
        <div className="absolute top-24 left-4 z-30 max-w-[280px] w-[85vw] sm:w-[280px]" onClick={(e) => e.stopPropagation()}>
          <ChassisWell label="Legend" className="animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-industrial-text/90">What you’re seeing</p>
              <button
                onClick={() => setShowLegend(false)}
                aria-label="Close legend"
                className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-industrial-text transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-industrial-yellow" />
                <span className="text-industrial-subtext/80">Savings & cash</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-industrial-blue" />
                <span className="text-industrial-subtext/80">Investments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-industrial-orange" />
                <span className="text-industrial-subtext/80">Debt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-industrial-subtext/80">Goals in progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded bg-white border border-black/10" />
                <span className="text-industrial-subtext/80">Harbor (liquidity)</span>
              </div>
            </div>
          </ChassisWell>
        </div>
      )}

      {isDev && showHarborDev && (
        <div className="absolute top-24 right-4 z-30 max-w-[320px] w-[90vw] sm:w-[320px]" onClick={(e) => e.stopPropagation()}>
          <ChassisWell label="DEV // Harbor Water" className="animate-in zoom-in-95 duration-150">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-industrial-subtext/80 font-semibold">Override</span>
                <button
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm ${harborOverrideEnabled ? 'bg-industrial-blue text-white' : 'bg-industrial-base text-industrial-text'}`}
                  onClick={() => setHarborOverrideEnabled(v => !v)}
                >
                  {harborOverrideEnabled ? 'On' : 'Off'}
                </button>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm"
                  onClick={() => { setHarborOverrideEnabled(true); setHarborOverridePct(0); }}
                >
                  Empty
                </button>
                <button
                  className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm"
                  onClick={() => { setHarborOverrideEnabled(true); setHarborOverridePct(50); }}
                >
                  50%
                </button>
                <button
                  className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm"
                  onClick={() => { setHarborOverrideEnabled(true); setHarborOverridePct(100); }}
                >
                  Full
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-industrial-subtext/70">Water Level</span>
                  <span className="text-[11px] font-black text-industrial-text">{harborOverridePct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={harborOverridePct}
                  onChange={(e) => setHarborOverridePct(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-industrial-subtext/70">Max Range (AUD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={harborOverrideMax}
                    onChange={(e) => setHarborOverrideMax(Math.max(1, parseInt(e.target.value || '0')))}
                    className="flex-1 bg-industrial-well-bg rounded-xl shadow-well border border-black/5 px-3 py-2 text-sm font-bold text-industrial-text"
                  />
                  <button
                    className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm"
                    onClick={() => setHarborOverrideMax(10000)}
                  >
                    10k
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm" onClick={() => setHarborOverrideMax(1000)}>1k</button>
                  <button className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm" onClick={() => setHarborOverrideMax(5000)}>5k</button>
                  <button className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm" onClick={() => setHarborOverrideMax(25000)}>25k</button>
                  <button className="px-3 py-2 rounded-xl bg-industrial-base text-industrial-text text-[10px] font-black uppercase tracking-widest border border-black/10 shadow-tactile-sm" onClick={() => setHarborOverrideMax(100000)}>100k</button>
                </div>
              </div>
            </div>
          </ChassisWell>
        </div>
      )}

      {tooltip && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40" onClick={(e) => e.stopPropagation()}>
          <ChassisWell label="Module Diagnostics" className="max-w-[300px] w-full animate-in zoom-in-95 duration-200">
            <button
              onClick={hideTooltip}
              aria-label="Close"
              className="absolute top-3 right-3 w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-industrial-text transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-industrial-well-bg rounded-xl flex items-center justify-center text-3xl shadow-well shrink-0">{tooltip.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-industrial-text uppercase tracking-tighter mb-1 truncate pr-6">{tooltip.title}</h3>
                {tooltip.subtitle && <p className="tactile-label text-industrial-subtext/60 mb-2">{tooltip.subtitle}</p>}
                {tooltip.value && <p className="text-2xl font-black tracking-tighter" style={{ color: tooltip.color }}>{tooltip.value}</p>}
                <p className="text-[11px] font-medium text-industrial-subtext/80 mt-3 leading-relaxed">{tooltip.description}</p>
              </div>
            </div>
          </ChassisWell>
        </div>
      )}

      <Canvas shadows dpr={[1, 2]} onClick={() => tooltip && hideTooltip()}>
        <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
          {/* Atmosphere */}
          <fog attach="fog" args={[isDark ? '#020617' : isMid ? '#BFDBFE' : '#E0F2FE', 55, 140]} />
          <OrthographicCamera makeDefault position={cameraPosition} zoom={zoom} near={-50} far={200} />
          <OrbitControls autoRotate={autoRotate} autoRotateSpeed={0.5} enableZoom={false} enablePan={false} minPolarAngle={polarAngle.min} maxPolarAngle={polarAngle.max} />
          <ambientLight intensity={isFuture ? 0.35 : isLowScore ? 0.45 : 0.6} />
          <hemisphereLight intensity={isFuture ? 0.25 : 0.35} groundColor={isDark ? '#020617' : '#0F172A'} color={isDark ? '#93C5FD' : '#FFFFFF'} />
          <directionalLight position={[12, 18, 10]} intensity={isFuture ? 0.35 : isLowScore ? 0.55 : 0.75} castShadow shadow-mapSize={[1024, 1024]} />
          {isDark && <spotLight position={[0, 10, 0]} intensity={0.25} angle={Math.PI / 3} penumbra={1} color="#93C5FD" />}
          {isFuture && <pointLight position={[-5, 5, -5]} intensity={1} color="#bc13fe" distance={20} />}
          <CityScene />
        </TooltipContext.Provider>
      </Canvas>
    </div>
  );
};
