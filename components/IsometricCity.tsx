
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
    grass: isDark ? '#1A1A1A' : isMid ? '#A0A0A0' : '#D1D1D1',
    sidewalk: isDark ? '#2A2A2A' : isMid ? '#B8B8B8' : '#E0E0E0',
    road: isDark ? '#0A0A0A' : isMid ? '#2A2A2A' : '#1A1A1A',
    concrete: isDark ? '#2A2A2A' : isMid ? '#9E9E9E' : '#BDBDBD',
    window: isDark ? '#1A1A1A' : isMid ? '#B8D4E8' : '#E3F2FD',
    cloud: isDark ? '#424242' : isMid ? '#E8E8E8' : '#FFFFFF',
    stormCloud: isDark ? '#616161' : isMid ? '#808080' : '#9E9E9E',
    tree: isDark ? '#33691E' : isMid ? '#5A8F32' : '#689F38',
    treeDark: isDark ? '#1B5E20' : isMid ? '#2E7D32' : '#33691E',
    trunk: isDark ? '#212121' : isMid ? '#3E2723' : '#4E342E',
    cash: isDark ? '#B0B0B0' : isMid ? '#C8C8C8' : '#E0E0E0',
    savings: isDark ? '#C2A636' : isMid ? '#D4B83D' : '#F3CF44',
    investment: isDark ? '#0033AA' : isMid ? '#0044CC' : '#0055FF',
    super: isDark ? '#6A1B9A' : isMid ? '#7B1FA2' : '#9C27B0',
    debt: isDark ? '#CC3F00' : isMid ? '#E04500' : '#FF4F00',
    taxVault: isDark ? '#0A0A0A' : isMid ? '#2A2A2A' : '#1A1A1A',
    water: isDark ? '#0033AA' : isMid ? '#0044CC' : '#0055FF',
    waterNegative: isDark ? '#CC3F00' : isMid ? '#E04500' : '#FF4F00',
    rocket: isDark ? '#B0B0B0' : isMid ? '#D0D0D0' : '#EBEBEB',
    rocketAccent: isDark ? '#CC3F00' : isMid ? '#E04500' : '#FF4F00',
    construction: isDark ? '#CC3F00' : isMid ? '#E04500' : '#FF4F00',
    crane: isDark ? '#C2A636' : isMid ? '#D4B83D' : '#F3CF44',
    scaffolding: isDark ? '#212121' : isMid ? '#3A3A3A' : '#424242',
    trafficRed: isDark ? '#CC3F00' : isMid ? '#E04500' : '#FF4F00',
    trafficGreen: isDark ? '#388E3C' : isMid ? '#43A047' : '#4CAF50',
    trafficYellow: isDark ? '#C2A636' : isMid ? '#D4B83D' : '#F3CF44',
    roadMarking: isDark ? '#B0B0B0' : isMid ? '#D8D8D8' : '#FFFFFF',
    dock: isDark ? '#3E2723' : isMid ? '#4E342E' : '#5D4037',
  }), [isDark, isMid]);

  // ============ SUB-COMPONENTS ============

  const StreetLamp = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.9, 6]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      <mesh position={[0.1, 0.88, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      <mesh position={[0.2, 0.84, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#FFF9C4" emissive="#FFF59D" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );

  const Window = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={themeColors.window} emissive="#4FC3F7" emissiveIntensity={0.2} />
    </mesh>
  );

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
    const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      showTooltip({ type: 'asset', title: name || type, subtitle: type, value: `$${balance.toLocaleString()}`, description: 'Liquidity storage node.', icon: '🏦', color: getColor() });
    };
    return (
      <group position={position}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow onClick={handleClick} onPointerDown={handleClick}>
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial color={getColor()} roughness={0.4} />
        </mesh>
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
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'debt', title: name || type.replace('_', ' '), subtitle: 'Liability', value: `-$${balance.toLocaleString()}`, description: 'Liability extraction point.', icon: '📉', color: themeColors.debt }); };
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
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'goal', title: goal.name, subtitle: `${goal.valueTag} Goal`, value: `$${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}`, description: 'Strategic target module.', icon: '🚀', color: progress >= 1 ? '#4CAF50' : '#2196F3' }); };
    return (
      <group position={position}>
        <mesh position={[0, 0.08, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[0.6, 0.65, 0.16, 16]} /><meshStandardMaterial color={themeColors.concrete} /></mesh>
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.4, 0.5, 16]} /><meshStandardMaterial color={progress >= 1 ? '#4CAF50' : '#FFC107'} /></mesh>
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
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'harbor', title: 'Liquidity Harbor', value: `$${savings.toLocaleString()}`, description: 'Available liquid reserves.', icon: '⚓', color: themeColors.water }); };
    return (
      <group position={position}>
        <mesh position={[0, -0.02, 0]} receiveShadow onClick={handleClick} onPointerDown={handleClick}><boxGeometry args={[2.8, 0.12, 2.0]} /><meshStandardMaterial color={themeColors.water} transparent opacity={0.85} /></mesh>
        <mesh position={[0.6, 0.06, 0]} onClick={handleClick} onPointerDown={handleClick}><boxGeometry args={[0.35, 0.06, 1.8]} /><meshStandardMaterial color={themeColors.dock} /></mesh>
      </group>
    );
  };

  const CashflowFountain = ({ surplus }: { surplus: number; maxSurplus: number }) => {
    const { showTooltip } = useContext(TooltipContext);
    const isNegative = surplus < 0;
    const handleClick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); showTooltip({ type: 'fountain', title: 'Cashflow Fountain', value: `${isNegative ? '-' : '+'}$${Math.abs(surplus).toLocaleString()}/mo`, description: 'System liquidity generator.', icon: isNegative ? '🔴' : '⛲', color: isNegative ? '#EF5350' : '#4CAF50' }); };
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.04, 0]} onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[1.1, 1.2, 0.08, 24]} /><meshStandardMaterial color="#E0E0E0" /></mesh>
        <mesh position={[0, 0.08, 0]} onClick={handleClick} onPointerDown={handleClick}><cylinderGeometry args={[0.8, 0.8, 0.08, 20]} /><meshStandardMaterial color={isNegative ? themeColors.waterNegative : themeColors.water} transparent opacity={0.8} /></mesh>
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
        case 'SE': return [[offset, inner], [offset, offset], [inner + 2.5, offset], [inner + 2.5, inner]];
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
        <mesh position={[0, -0.15, 0]} receiveShadow><boxGeometry args={[14, 0.3, 14]} /><meshStandardMaterial color="#37474F" /></mesh>
        <mesh position={[-3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={isDark ? '#2E3B1E' : isMid ? '#5A7A3C' : '#7CB342'} /></mesh>
        <mesh position={[3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={isDark ? '#1A1A1A' : isMid ? '#4A7A2E' : '#689F38'} /></mesh>
        <mesh position={[-3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={isDark ? '#334D20' : isMid ? '#6B943A' : '#8BC34A'} /></mesh>
        <mesh position={[3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={isDark ? '#2D4A2F' : isMid ? '#5E9060' : '#81C784'} /></mesh>
        <mesh position={[-4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, -4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, 4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[2.2, 0.04, 2.2]} /><meshStandardMaterial color={themeColors.road} /></mesh>
        {[[-3.8, -3.8], [-3.8, 3.8], [3.8, -3.8], [3.8, 3.8]].map(([bx, bz], i) => (
          <group key={i}>
            <mesh position={[bx, 0.11, bz > 0 ? bz - 2.4 : bz + 2.4]} receiveShadow><boxGeometry args={[5.1, 0.08, 0.4]} /><meshStandardMaterial color={themeColors.sidewalk} /></mesh>
            <mesh position={[bx > 0 ? bx - 2.4 : bx + 2.4, 0.11, bz]} receiveShadow><boxGeometry args={[0.4, 0.08, 5.1]} /><meshStandardMaterial color={themeColors.sidewalk} /></mesh>
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
        {/* Debt Buildings - NE Quadrant (max 3) */}
        {debtsAcc.slice(0, 3).map((acc, i) => {
          const positions: [number, number, number][] = [[4.0, 0.1, -4.0], [2.8, 0.1, -4.0], [4.0, 0.1, -2.8]];
          return <DebtBuilding key={acc.id} position={positions[i]} height={Math.max(1.0, (acc.balance / maxBalance) * 3.0)} type={acc.type} balance={acc.balance} name={acc.name} />;
        })}
        {/* Launch Pads - SW Quadrant (max 3) */}
        {goals.slice(0, 3).map((goal, i) => {
          const positions: [number, number, number][] = [[-4.2, 0.1, 3.5], [-3.0, 0.1, 3.5], [-4.2, 0.1, 4.8]];
          return <LaunchPad key={goal.id} position={positions[i]} goal={goal} />;
        })}
        <HarborDock position={[3.5, 0.08, 3.8]} savings={health.savings} />
        {health.taxVault > 0 && <TaxVault position={[4.8, 0.1, 2.8]} amount={health.taxVault} />}
        {([[-5.5, 0.08, -5.5], [5.5, 0.08, -5.5], [-5.5, 0.08, 5.5], [5.5, 0.08, 5.5]] as [number, number, number][]).map((pos, i) => <Tree key={i} position={pos} scale={0.8} />)}
        <DriftingCloud initialPosition={[-8, 8, -6]} speed={0.15} scale={1.2} isStorm={isLowScore} />
        <DriftingCloud initialPosition={[5, 9, -3]} speed={0.12} scale={0.9} isStorm={isLowScore} />
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
      if (isMid) return "bg-[#A8A8A8]";
      return "bg-[#D1D1D1]";
    }
    if (health.score > 70) {
      if (isDark) return "bg-[#1A1A1A]";
      if (isMid) return "bg-[#B8B8B8]";
      return "bg-[#E8E8E8]";
    }
    if (isDark) return "bg-[#111111]";
    if (isMid) return "bg-[#C0C0C0]";
    return "bg-[#DEDEDE]";
  };

  const cameraPosition: [number, number, number] = viewMode === 'birdseye' 
    ? [0, 30, 0.1]  
    : [20, 20, 20]; 
  
  const polarAngle = viewMode === 'birdseye' 
    ? { min: 0, max: 0.1 }  
    : { min: Math.PI / 4, max: Math.PI / 3 }; 

  return (
    <div className={`w-full h-full ${minimal ? '' : 'h-[500px] md:h-[600px]'} ${getSkyClass()} relative rounded-2xl overflow-hidden`}>
      
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        <div className="flex flex-col bg-industrial-base rounded-xl overflow-hidden shadow-tactile-sm border-t border-l border-white/60">
          <button onClick={handleZoomIn} className="px-3 py-2 text-industrial-text hover:bg-white/10 transition-colors text-sm font-black">+</button>
          <div className="h-px w-full bg-industrial-well-shadow-light/50 shadow-well"></div>
          <button onClick={handleZoomOut} className="px-3 py-2 text-industrial-text hover:bg-white/10 transition-colors text-sm font-black">−</button>
        </div>
        
        <button onClick={toggleView} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-tactile-sm border-t border-l border-white/60 ${viewMode === 'birdseye' ? 'bg-industrial-blue text-white' : 'bg-industrial-base text-industrial-text'}`}>
          {viewMode === 'birdseye' ? '🦅' : '🏙️'}
        </button>
        
        <button onClick={() => setAutoRotate(!autoRotate)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-tactile-sm border-t border-l border-white/60 ${autoRotate ? 'bg-industrial-orange text-white' : 'bg-industrial-base text-industrial-text'}`}>
          ⟳
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
              <LEDIndicator active={hasWeeds} color="orange" />
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

      {tooltip && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40" onClick={(e) => e.stopPropagation()}>
          <ChassisWell label="Module Diagnostics" className="max-w-[300px] w-full animate-in zoom-in-95 duration-200">
            <button onClick={hideTooltip} className="absolute top-4 right-4 tactile-label text-industrial-subtext/40 hover:text-industrial-text">[X]</button>
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
          {isFuture && <pointLight position={[-5, 5, -5]} intensity={1} color="#bc13fe" distance={20} />}
          <CityScene />
        </TooltipContext.Provider>
      </Canvas>
    </div>
  );
};
