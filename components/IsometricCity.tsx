
import React, { useMemo, useRef, useState, createContext, useContext } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
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
          emissiveIntensity={isDark ? 4 : 0.4} 
        />
      </mesh>
      {isDark && (
        <pointLight position={[0.2, 0.8, 0]} intensity={1.2} distance={4} color="#FFF59D" />
      )}
    </group>
  );

  const Window = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => {
    const isOn = useMemo(() => Math.random() > 0.4, []);
    return (
      <mesh position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={isDark ? (isOn ? "#60A5FA" : "#0F172A") : themeColors.window} 
          emissive={isDark && isOn ? "#4FC3F7" : "#000000"} 
          emissiveIntensity={isDark && isOn ? 1.5 : 0} 
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
      <mesh position={[0, 0.93, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficRed} emissive={themeColors.trafficRed} emissiveIntensity={!isGreen && !isYellow ? 2 : 0.1} /></mesh>
      <mesh position={[0, 0.85, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficYellow} emissive={themeColors.trafficYellow} emissiveIntensity={isYellow ? 2 : 0.1} /></mesh>
      <mesh position={[0, 0.77, 0.045]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={themeColors.trafficGreen} emissive={themeColors.trafficGreen} emissiveIntensity={isGreen && !isYellow ? 2 : 0.1} /></mesh>
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
          <meshStandardMaterial color={getColor()} roughness={0.3} metalness={0.2} />
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
          <meshStandardMaterial color={themeColors.debt} roughness={0.5} />
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
            <mesh position={[0, rocketHeight / 2, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[0.1, 0.12, rocketHeight, 12]} /><meshStandardMaterial color={themeColors.rocket} metalness={0.3} /></mesh>
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
        <mesh position={[0, 0.45, 0]} castShadow onClick={handleClick} onPointerDown={handleClick}><boxGeometry args={[0.6, 0.42, 0.6]} /><meshStandardMaterial color={themeColors.taxVault} metalness={0.4} roughness={0.3} /></mesh>
      </group>
    );
  };

  const HarborDock = ({ position, savings }: { position: [number, number, number]; savings: number }) => {
    const { showTooltip } = useContext(TooltipContext);
    const rippleRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
      if (rippleRef.current) {
        rippleRef.current.children.forEach((child, i) => {
          child.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + i) * 0.05);
          (child as THREE.Mesh).material.opacity = 0.6 + Math.sin(clock.elapsedTime * 2 + i) * 0.2;
        });
      }
    });
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'harbor', title: 'Liquidity Harbor', value: `$${savings.toLocaleString()}`, description: 'Available liquid reserves.', icon: '⚓', color: themeColors.water }); };
    return (
      <group position={position}>
        <mesh position={[0, -0.02, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[2.8, 0.12, 2.0]} />
          <meshStandardMaterial color={themeColors.water} transparent opacity={0.85} />
        </mesh>
        <group ref={rippleRef}>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 16]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
          </mesh>
        </group>
        <mesh position={[0.6, 0.06, 0]} onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[0.35, 0.06, 1.8]} />
          <meshStandardMaterial color={themeColors.dock} />
        </mesh>
      </group>
    );
  };

  const CashflowFountain = ({ surplus }: { surplus: number; maxSurplus: number }) => {
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
      <group position={[0, 0, 0]}>
        {/* Base Pool */}
        <mesh position={[0, 0.04, 0]} onClick={handleClick} onPointerDown={handleClick}>
          <cylinderGeometry args={[1.2, 1.3, 0.1, 24]} />
          <meshStandardMaterial color={isDark ? "#1A202C" : "#E0E0E0"} />
        </mesh>
        {/* Water Surface */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.02, 24]} />
          <meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.6} />
        </mesh>
        {/* Tier 1 */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.15, 16]} />
          <meshStandardMaterial color={isDark ? "#2D3748" : "#BDBDBD"} />
        </mesh>
        {/* Tier 2 (Water Column) */}
        <mesh ref={waterRef} position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
          <meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.8} />
        </mesh>
        {/* Particles/Splashes */}
        <group ref={particlesRef}>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.4, 0.4, Math.sin(i) * 0.4]}>
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
      
      if (!shouldStop) {
        const move = speed * delta * 60;
        switch(direction) {
          case 'EAST': pos.x += move; if (pos.x > 8) pos.x = -8; break;
          case 'WEST': pos.x -= move; if (pos.x < -8) pos.x = 8; break;
          case 'NORTH': pos.z -= move; if (pos.z < -8) pos.z = 8; break;
          case 'SOUTH': pos.z += move; if (pos.z > 8) pos.z = -8; break;
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
        <mesh position={[0.18, 0.06, 0.08]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2} /></mesh>
        <mesh position={[0.18, 0.06, -0.08]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2} /></mesh>
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
        
        <CashflowFountain surplus={monthlySurplus} maxSurplus={Math.max(health.monthlyIncome, 5000)} />
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
        <HarborDock position={[3.5, 0.08, 3.8]} savings={health.savings} />
        {health.taxVault > 0 && <TaxVault position={[4.8, 0.1, 2.8]} amount={health.taxVault} />}
        {([[-5.5, 0.08, -5.5], [5.5, 0.08, -5.5], [-5.5, 0.08, 5.5], [5.5, 0.08, 5.5], [-2.5, 0.08, -5.5], [2.5, 0.08, -5.5], [-5.5, 0.08, -2.5], [5.5, 0.08, -2.5]].map((pos, i) => <Tree key={i} position={pos as [number, number, number]} scale={0.7 + Math.random() * 0.3} />))}
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
    if (isFuture) return "bg-[#1A1A1A]";
    // Theme-based sky: light = bright, mid = soft grey, dark = near black
    if (isLowScore) {
      if (isDark) return "bg-[#0A0A0A]";
      if (isMid) return "bg-[#64748B]"; // Desaturated blue-gray
      return "bg-[#94A3B8]";
    }
    if (health.score > 70) {
      if (isDark) return "bg-[#020617]"; // Deep night sky
      if (isMid) return "bg-[#3B82F6]"; // Vibrant mid blue
      return "bg-[#BFDBFE]"; // Bright sky blue
    }
    if (isDark) return "bg-[#0F172A]";
    if (isMid) return "bg-[#60A5FA]"; // Friendly blue
    return "bg-[#DBEAFE]"; // Soft light blue
  };

  const cameraPosition: [number, number, number] = viewMode === 'birdseye' 
    ? [0, 30, 0.1]  
    : [20, 20, 20]; 
  
  const polarAngle = viewMode === 'birdseye' 
    ? { min: 0, max: 0.1 }  
    : { min: Math.PI / 4, max: Math.PI / 3 }; 

  return (
    <div className={`w-full h-full ${minimal ? '' : 'h-[500px] md:h-[600px]'} ${getSkyClass()} relative rounded-2xl overflow-hidden shadow-inner`}>
      
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
          <OrthographicCamera makeDefault position={cameraPosition} zoom={zoom} near={-50} far={200} />
          <OrbitControls autoRotate={autoRotate} autoRotateSpeed={0.5} enableZoom={false} enablePan={false} minPolarAngle={polarAngle.min} maxPolarAngle={polarAngle.max} />
          <ambientLight intensity={isFuture ? 0.4 : isLowScore ? 0.5 : 0.7} />
          <directionalLight position={[10, 20, 10]} intensity={isFuture ? 0.4 : isLowScore ? 0.6 : 0.8} castShadow shadow-mapSize={[1024, 1024]} />
          {isDark && <spotLight position={[0, 10, 0]} intensity={0.5} angle={Math.PI / 3} penumbra={1} color="#4FC3F7" />}
          {isFuture && <pointLight position={[-5, 5, -5]} intensity={1} color="#bc13fe" distance={20} />}
          <CityScene />
        </TooltipContext.Provider>
      </Canvas>
    </div>
  );
};
