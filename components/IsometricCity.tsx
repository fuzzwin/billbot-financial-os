
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AccountItem, FinancialHealth, Goal, WeeklyBuild, AppView, Subscription } from '../types';

// ============ CONSTANTS ============
const COLORS = {
  // Buildings
  savings: '#FFD54F',
  liability: '#EF5350',
  checking: '#42A5F5',
  investment: '#66BB6A',
  super: '#AB47BC',
  divineGold: '#FFD700',
  
  // Environment
  grass: '#7CB342',
  grassDark: '#689F38',
  road: '#37474F',
  roadMarking: '#FFFFFF',
  sidewalk: '#BDBDBD',
  
  // Nature
  tree: '#4CAF50',
  treeDark: '#2E7D32',
  trunk: '#6D4C41',
  cloud: '#FFFFFF',
  stormCloud: '#607D8B',
  
  // Structures
  window: '#81D4FA',
  roof: '#78909C',
  construction: '#FFB74D',
  scaffolding: '#8D6E63',
  crane: '#FFC107',
  concrete: '#78909C',
  
  // Water/Cashflow
  water: '#29B6F6',
  waterDeep: '#0288D1',
  waterNegative: '#EF5350',
  fountain: '#90CAF9',
  
  // Harbor
  dock: '#8D6E63',
  boat: '#ECEFF1',
  boatAccent: '#1E88E5',
  
  // Rockets
  rocket: '#ECEFF1',
  rocketAccent: '#E53935',
  
  // Traffic
  trafficRed: '#EF5350',
  trafficGreen: '#66BB6A',
  trafficYellow: '#FFC107',
  
  // Special
  subscription: '#FF7043',
  taxVault: '#7E57C2',
  willpower: '#00E5FF',
  smoke: '#455A64',
};

const CAR_COLORS = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xab47bc, 0xff7043];
const PEOPLE_COLORS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xab47bc, 0xff7043, 0x00acc1];

// Traffic light timing
const LIGHT_CYCLE_DURATION = 8;
const GREEN_DURATION = 3;
const YELLOW_DURATION = 1;

// ============ UTILITY ============
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============ TRAFFIC LIGHT SYSTEM ============
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
    } else if (cycleTime < GREEN_DURATION * 2 + YELLOW_DURATION * 2) {
      setIsYellow(true);
    }
  });
  
  return { horizontalGreen, isYellow };
};

// ============ SUB-COMPONENTS ============

const Window = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={COLORS.window} emissive="#4FC3F7" emissiveIntensity={0.15} />
  </mesh>
);

// Traffic Light Component
const TrafficLight = ({ position, rotation, isGreen, isYellow }: { 
  position: [number, number, number]; 
  rotation?: number;
  isGreen: boolean;
  isYellow: boolean;
}) => {
  const redOn = !isGreen && !isYellow;
  const yellowOn = isYellow;
  const greenOn = isGreen && !isYellow;
  
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.12, 0.3, 0.08]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[0, 0.93, 0.045]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={COLORS.trafficRed} emissive={COLORS.trafficRed} emissiveIntensity={redOn ? 2 : 0.1} />
      </mesh>
      <mesh position={[0, 0.85, 0.045]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={COLORS.trafficYellow} emissive={COLORS.trafficYellow} emissiveIntensity={yellowOn ? 2 : 0.1} />
      </mesh>
      <mesh position={[0, 0.77, 0.045]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={COLORS.trafficGreen} emissive={COLORS.trafficGreen} emissiveIntensity={greenOn ? 2 : 0.1} />
      </mesh>
    </group>
  );
};

// ============ WEATHER SYSTEM ============
// Clouds that respond to health score
const Cloud = ({ position, scale = 1, isStorm = false }: { position: [number, number, number]; scale?: number; isStorm?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  
  useFrame(() => {
    if (!groupRef.current || !matRef.current) return;
    const cloudWorldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(cloudWorldPos);
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const toCloud = cloudWorldPos.clone().sub(camera.position).normalize();
    const dot = cameraDir.dot(toCloud);
    const verticalFactor = Math.max(0, 1 - Math.abs(cloudWorldPos.y - camera.position.y) / 30);
    const baseTrans = dot > 0.3 ? Math.max(0.1, 1 - dot * 1.2) : 0.85;
    matRef.current.opacity = baseTrans * (0.5 + verticalFactor * 0.5);
  });
  
  const cloudColor = isStorm ? COLORS.stormCloud : COLORS.cloud;
  
  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8 * scale, 12, 10]} />
        <meshStandardMaterial ref={matRef} color={cloudColor} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[0.6 * scale, -0.1, 0.2 * scale]}>
        <sphereGeometry args={[0.6 * scale, 10, 8]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={[-0.5 * scale, 0.1, 0.1 * scale]}>
        <sphereGeometry args={[0.55 * scale, 10, 8]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={[0.3 * scale, 0.2, -0.3 * scale]}>
        <sphereGeometry args={[0.5 * scale, 10, 8]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={0.75} depthWrite={false} />
      </mesh>
    </group>
  );
};

const DriftingCloud = ({ initialPosition, speed, scale, isStorm = false }: { 
  initialPosition: [number, number, number]; 
  speed: number;
  scale: number;
  isStorm?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += speed * delta;
      if (groupRef.current.position.x > 12) groupRef.current.position.x = -12;
    }
  });
  
  return (
    <group ref={groupRef} position={initialPosition}>
      <Cloud position={[0, 0, 0]} scale={scale} isStorm={isStorm} />
    </group>
  );
};

// ============ CASHFLOW FOUNTAIN ============
// Central fountain showing surplus/deficit
const CashflowFountain = ({ surplus, maxSurplus }: { surplus: number; maxSurplus: number }) => {
  const sprayRef = useRef<THREE.Mesh>(null);
  const waterLevel = Math.max(0.1, Math.min(1, (surplus + maxSurplus) / (maxSurplus * 2)));
  const isNegative = surplus < 0;
  
  useFrame(({ clock }) => {
    if (sprayRef.current && !isNegative) {
      sprayRef.current.scale.y = 0.5 + waterLevel * (0.8 + Math.sin(clock.elapsedTime * 4) * 0.2);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base platform */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.2, 1.3, 0.08, 24]} />
        <meshStandardMaterial color="#E0E0E0" />
      </mesh>
      {/* Pool rim */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.9, 1.0, 0.12, 20]} />
        <meshStandardMaterial color="#78909C" />
      </mesh>
      {/* Water pool */}
      <mesh position={[0, 0.1 + waterLevel * 0.05, 0]}>
        <cylinderGeometry args={[0.85, 0.85, waterLevel * 0.1, 20]} />
        <meshStandardMaterial 
          color={isNegative ? COLORS.waterNegative : COLORS.water} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      {/* Central pillar */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      {/* Water spray (only when positive) */}
      {!isNegative && (
        <mesh ref={sprayRef} position={[0, 0.45, 0]}>
          <coneGeometry args={[0.08 + waterLevel * 0.05, 0.4 * waterLevel, 8]} />
          <meshStandardMaterial color="#B3E5FC" transparent opacity={0.6} />
        </mesh>
      )}
      {/* Negative indicator (red glow) */}
      {isNegative && (
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color={COLORS.waterNegative} emissive={COLORS.waterNegative} emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Status indicator ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.35, 24]} />
        <meshStandardMaterial 
          color={isNegative ? COLORS.waterNegative : '#4CAF50'} 
          emissive={isNegative ? COLORS.waterNegative : '#4CAF50'} 
          emissiveIntensity={0.3} 
        />
      </mesh>
    </group>
  );
};

// ============ TAX VAULT ============
// Building showing quarantined gig tax
const TaxVault = ({ position, taxAmount, maxTax }: { position: [number, number, number]; taxAmount: number; maxTax: number }) => {
  const fillLevel = Math.min(1, taxAmount / Math.max(maxTax, 1000));
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
      {/* Vault body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshStandardMaterial color={COLORS.taxVault} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Vault door */}
      <mesh position={[0.36, 0.55, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#424242" metalness={0.6} />
      </mesh>
      {/* Fill indicator */}
      <mesh position={[0, 0.35 + fillLevel * 0.2, 0]}>
        <boxGeometry args={[0.5, fillLevel * 0.4, 0.5]} />
        <meshStandardMaterial color="#FFD54F" transparent opacity={0.7} />
      </mesh>
      {/* Top beacon */}
      <mesh ref={pulseRef} position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color={COLORS.taxVault} 
          emissive={COLORS.taxVault} 
          emissiveIntensity={fillLevel > 0.5 ? 1 : 0.3} 
        />
      </mesh>
      {/* Label post */}
      <mesh position={[0.5, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.6, 0.02]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
    </group>
  );
};

// ============ SUBSCRIPTION DRAIN ============
// Visual representation of recurring expenses
const SubscriptionDrain = ({ position, amount, name }: { position: [number, number, number]; amount: number; name: string }) => {
  const flowRef = useRef<THREE.Mesh>(null);
  const intensity = Math.min(1, amount / 50); // Normalize to $50 max
  
  useFrame(({ clock }) => {
    if (flowRef.current) {
      flowRef.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 3) * 0.1;
      flowRef.current.scale.y = 0.8 + Math.sin(clock.elapsedTime * 4) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Pipe base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      {/* Pipe top */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#455A64" />
      </mesh>
      {/* Flow indicator */}
      <mesh ref={flowRef} position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.05 + intensity * 0.03, 8, 8]} />
        <meshStandardMaterial 
          color={COLORS.subscription} 
          emissive={COLORS.subscription} 
          emissiveIntensity={0.5 + intensity * 0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Amount ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 8]} />
        <meshStandardMaterial color={COLORS.subscription} emissive={COLORS.subscription} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

// ============ WILLPOWER TOWER ============
// Tower that grows with willpower points
const WillpowerTower = ({ position, points, maxPoints }: { position: [number, number, number]; points: number; maxPoints: number }) => {
  const height = 0.5 + (points / Math.max(maxPoints, 500)) * 1.5;
  const beaconRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.1, 12]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
      {/* Tower body */}
      <mesh position={[0, 0.1 + height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, height, 8]} />
        <meshStandardMaterial color="#00838F" metalness={0.3} />
      </mesh>
      {/* Glowing segments */}
      {Array.from({ length: Math.floor(points / 100) }).slice(0, 5).map((_, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.25, 0]}>
          <torusGeometry args={[0.2, 0.02, 8, 16]} />
          <meshStandardMaterial color={COLORS.willpower} emissive={COLORS.willpower} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Top beacon */}
      <mesh ref={beaconRef} position={[0, 0.1 + height + 0.1, 0]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color={COLORS.willpower} emissive={COLORS.willpower} emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

// ============ BUILDING COMPONENT ============
interface BuildingProps {
  position: [number, number, number];
  height: number;
  accountType: string;
  hasRocket?: boolean;
  rocketProgress?: number;
  isDivineValue?: boolean;
  accountName?: string;
}

const Building = ({ position, height, accountType, hasRocket, rocketProgress = 0, isDivineValue = false }: BuildingProps) => {
  const flameRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const isLiability = ['LOAN', 'CREDIT_CARD', 'HECS'].includes(accountType);
  const isSavings = accountType === 'SAVINGS';
  const isInvestment = accountType === 'INVESTMENT';
  const isSuper = accountType === 'SUPER';

  const getStyle = () => {
    if (isSavings) return { dims: [0.9, 0.9] as [number, number], color: COLORS.savings, hasColumns: true };
    if (isInvestment) return { dims: [0.75, 0.75] as [number, number], color: COLORS.investment, hasAntenna: true };
    if (isSuper) return { dims: [0.85, 0.85] as [number, number], color: COLORS.super, hasDome: true };
    if (isLiability) return { dims: [0.8, 0.8] as [number, number], color: COLORS.liability, hasBeacon: true };
    return { dims: [0.85, 0.85] as [number, number], color: COLORS.checking, hasFlag: false };
  };

  const style = getStyle();
  const floors = Math.min(Math.floor(height / 0.45), 10);

  useFrame(({ clock }) => {
    if (flameRef.current && hasRocket && rocketProgress >= 1) {
      flameRef.current.scale.y = 0.8 + Math.sin(clock.elapsedTime * 15) * 0.3;
      flameRef.current.scale.x = 0.9 + Math.sin(clock.elapsedTime * 12) * 0.15;
    }
    if (glowRef.current && isDivineValue) {
      glowRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Divine Value glow effect */}
      {isDivineValue && (
        <mesh ref={glowRef} position={[0, height / 2, 0]}>
          <sphereGeometry args={[height * 0.6, 16, 16]} />
          <meshStandardMaterial color={COLORS.divineGold} transparent opacity={0.15} />
        </mesh>
      )}
      
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[style.dims[0], height, style.dims[1]]} />
        <meshStandardMaterial 
          color={isDivineValue ? COLORS.divineGold : style.color} 
          roughness={isDivineValue ? 0.2 : 0.5} 
          metalness={isDivineValue ? 0.5 : 0}
        />
      </mesh>

      {Array.from({ length: floors }).map((_, f) => {
        const y = 0.28 + f * 0.45;
        return (
          <group key={f}>
            <Window position={[style.dims[0] / 2 + 0.01, y, 0]} size={[0.02, 0.18, style.dims[1] * 0.55]} />
            <Window position={[-style.dims[0] / 2 - 0.01, y, 0]} size={[0.02, 0.18, style.dims[1] * 0.55]} />
          </group>
        );
      })}

      {isSavings && !hasRocket && (
        <mesh position={[0, height, 0]}>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FFC107" metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {isInvestment && !hasRocket && (
        <group position={[0, height, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.4, 6]} />
            <meshStandardMaterial color="#607D8B" />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#F44336" emissive="#F44336" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {isLiability && (
        <>
          <mesh position={[0, height + 0.15, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={0.6} />
          </mesh>
          {/* Smoke effect for debt */}
          <Smoke position={[0, height + 0.3, 0]} />
        </>
      )}

      {hasRocket && (
        <group position={[0, height, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.32, 0.35, 0.04, 16]} />
            <meshStandardMaterial color={COLORS.concrete} />
          </mesh>
          {rocketProgress > 0.1 && (
            <group>
              <mesh position={[0, 0.04 + (0.25 + rocketProgress * 0.5) / 2, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 0.25 + rocketProgress * 0.5, 10]} />
                <meshStandardMaterial color={COLORS.rocket} metalness={0.3} />
              </mesh>
              <mesh position={[0, 0.04 + 0.25 + rocketProgress * 0.5 + 0.1, 0]}>
                <coneGeometry args={[0.07, 0.2, 10]} />
                <meshStandardMaterial color={COLORS.rocketAccent} />
              </mesh>
              {[0, 1, 2].map(i => (
                <mesh key={i} position={[Math.cos(i * Math.PI * 2 / 3) * 0.09, 0.15, Math.sin(i * Math.PI * 2 / 3) * 0.09]} rotation={[0, i * Math.PI * 2 / 3, 0]}>
                  <boxGeometry args={[0.02, 0.1, 0.06]} />
                  <meshStandardMaterial color={COLORS.rocketAccent} />
                </mesh>
              ))}
              {rocketProgress >= 1 && (
                <mesh ref={flameRef} position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.05, 0.2, 8]} />
                  <meshStandardMaterial color="#FF9800" emissive="#FF5722" emissiveIntensity={1} transparent opacity={0.9} />
                </mesh>
              )}
            </group>
          )}
        </group>
      )}
    </group>
  );
};

// ============ SMOKE EFFECT FOR DEBT ============
const Smoke = ({ position }: { position: [number, number, number] }) => {
  const smokeRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (smokeRef.current) {
      smokeRef.current.children.forEach((child, i) => {
        child.position.y = Math.sin(clock.elapsedTime * 2 + i) * 0.1 + i * 0.08;
        (child as THREE.Mesh).scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 3 + i * 0.5) * 0.2);
      });
    }
  });

  return (
    <group ref={smokeRef} position={position}>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, i * 0.08, 0]}>
          <sphereGeometry args={[0.05 + i * 0.02, 8, 8]} />
          <meshStandardMaterial color={COLORS.smoke} transparent opacity={0.4 - i * 0.1} />
        </mesh>
      ))}
    </group>
  );
};

// ============ CONSTRUCTION SITE ============
const ConstructionSite = ({ position, progress, name }: { position: [number, number, number]; progress: number; name?: string }) => {
  const builtH = 0.25 + progress * 1.5;

  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.08, 1.1]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
      <mesh position={[0, 0.08 + builtH / 2, 0]} castShadow>
        <boxGeometry args={[0.9, builtH, 0.9]} />
        <meshStandardMaterial color={COLORS.construction} transparent opacity={0.85} />
      </mesh>
      {[[-0.5, -0.5], [-0.5, 0.5], [0.5, -0.5], [0.5, 0.5]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx, 0.08 + (builtH + 0.3) / 2, sz]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, builtH + 0.3, 6]} />
          <meshStandardMaterial color={COLORS.scaffolding} />
        </mesh>
      ))}
      {progress < 0.75 && (
        <>
          <mesh position={[0.35, 1.0, 0.35]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
            <meshStandardMaterial color={COLORS.crane} />
          </mesh>
          <mesh position={[-0.2, 1.9, 0.35]}>
            <boxGeometry args={[1.2, 0.05, 0.05]} />
            <meshStandardMaterial color={COLORS.crane} />
          </mesh>
        </>
      )}
    </group>
  );
};

// ============ HARBOR DISTRICT ============
const HarborDistrict = ({ position, savings, maxSavings }: { position: [number, number, number]; savings: number; maxSavings: number }) => {
  const waterLevel = Math.max(0.3, Math.min(1, savings / Math.max(maxSavings, 10000)));
  const boat1Ref = useRef<THREE.Group>(null);
  const boat2Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (boat1Ref.current) {
      boat1Ref.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      boat1Ref.current.position.y = 0.08 + Math.sin(t * 1.2) * 0.02;
    }
    if (boat2Ref.current) {
      boat2Ref.current.rotation.z = Math.sin(t * 1.3 + 1) * 0.04;
      boat2Ref.current.position.y = 0.08 + Math.sin(t * 1.4 + 0.5) * 0.02;
    }
  });

  return (
    <group position={position}>
      {/* Water basin */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.15 * waterLevel, 2.5]} />
        <meshStandardMaterial color={COLORS.water} transparent opacity={0.85} />
      </mesh>
      {/* Dock */}
      <mesh position={[0.8, 0.08, 0]}>
        <boxGeometry args={[0.4, 0.08, 2.2]} />
        <meshStandardMaterial color={COLORS.dock} />
      </mesh>
      {/* Dock posts */}
      {[-0.9, 0, 0.9].map((z, i) => (
        <mesh key={i} position={[1.0, -0.05, z]}>
          <cylinderGeometry args={[0.05, 0.06, 0.35, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      ))}
      {/* Boats */}
      <group ref={boat1Ref} position={[-0.3, 0.08, -0.5]}>
        <mesh>
          <boxGeometry args={[0.6, 0.12, 0.25]} />
          <meshStandardMaterial color={COLORS.boat} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.3, 0.02]} />
          <meshStandardMaterial color="#795548" />
        </mesh>
        <mesh position={[0.08, 0.22, 0]}>
          <boxGeometry args={[0.2, 0.18, 0.01]} />
          <meshStandardMaterial color={COLORS.boatAccent} />
        </mesh>
      </group>
      <group ref={boat2Ref} position={[-0.5, 0.08, 0.6]}>
        <mesh>
          <boxGeometry args={[0.45, 0.1, 0.2]} />
          <meshStandardMaterial color="#FFF9C4" />
        </mesh>
      </group>
      {/* Water level indicator */}
      <mesh position={[-1.5, 0.3, 0]}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      <mesh position={[-1.5, waterLevel * 0.3, 0]}>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshStandardMaterial color={COLORS.water} emissive={COLORS.water} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// ============ TREE ============
const Tree = ({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) => (
  <group position={position}>
    <mesh position={[0, 0.12 * scale, 0]} castShadow>
      <cylinderGeometry args={[0.04 * scale, 0.06 * scale, 0.24 * scale, 8]} />
      <meshStandardMaterial color={COLORS.trunk} />
    </mesh>
    <mesh position={[0, 0.32 * scale, 0]} castShadow>
      <sphereGeometry args={[0.22 * scale, 10, 8]} />
      <meshStandardMaterial color={COLORS.tree} />
    </mesh>
    <mesh position={[0, 0.48 * scale, 0]} castShadow>
      <sphereGeometry args={[0.14 * scale, 10, 8]} />
      <meshStandardMaterial color={COLORS.treeDark} />
    </mesh>
  </group>
);

// ============ STREET LAMP ============
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
      <meshStandardMaterial color="#FFF9C4" emissive="#FFF59D" emissiveIntensity={0.3} />
    </mesh>
  </group>
);

// ============ CROSSWALK ============
const Crosswalk = ({ position, rotation }: { position: [number, number, number]; rotation?: number }) => {
  const stripes = 5;
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh key={i} position={[0, 0.05, -0.4 + i * 0.2]}>
          <boxGeometry args={[0.8, 0.01, 0.12]} />
          <meshStandardMaterial color={COLORS.roadMarking} />
        </mesh>
      ))}
    </group>
  );
};

// ============ CAR SYSTEM ============
type CarDirection = 'EAST' | 'WEST' | 'NORTH' | 'SOUTH';

interface CarProps {
  direction: CarDirection;
  laneOffset: number;
  startPos: number;
  speed: number;
  color: number;
  horizontalGreen: boolean;
}

const Car = ({ direction, laneOffset, startPos, speed, color, horizontalGreen }: CarProps) => {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(startPos);
  const ROAD_MIN = -6.5;
  const ROAD_MAX = 6.5;
  const STOP_LINE = 1.8;
  
  const config = useMemo(() => {
    switch (direction) {
      case 'EAST': return { axis: 'x' as const, dir: 1, lanePos: -laneOffset, rotation: Math.PI / 2 };
      case 'WEST': return { axis: 'x' as const, dir: -1, lanePos: laneOffset, rotation: -Math.PI / 2 };
      case 'SOUTH': return { axis: 'z' as const, dir: 1, lanePos: laneOffset, rotation: Math.PI };
      case 'NORTH': return { axis: 'z' as const, dir: -1, lanePos: -laneOffset, rotation: 0 };
    }
  }, [direction, laneOffset]);
  
  const isHorizontal = config.axis === 'x';
  const canGo = isHorizontal ? horizontalGreen : !horizontalGreen;
  
  useFrame(() => {
    if (!ref.current) return;
    const pos = posRef.current;
    const approachingStop = config.dir > 0 
      ? (pos > -STOP_LINE - 1.5 && pos < -STOP_LINE)
      : (pos < STOP_LINE + 1.5 && pos > STOP_LINE);
    const shouldStop = !canGo && approachingStop;
    
    if (!shouldStop) {
      posRef.current += speed * config.dir;
      if (config.dir > 0 && posRef.current > ROAD_MAX + 1) posRef.current = ROAD_MIN - 1;
      else if (config.dir < 0 && posRef.current < ROAD_MIN - 1) posRef.current = ROAD_MAX + 1;
    }
    
    if (config.axis === 'x') {
      ref.current.position.x = posRef.current;
      ref.current.position.z = config.lanePos;
    } else {
      ref.current.position.z = posRef.current;
      ref.current.position.x = config.lanePos;
    }
  });
  
  const initX = config.axis === 'x' ? startPos : config.lanePos;
  const initZ = config.axis === 'z' ? startPos : config.lanePos;

  return (
    <group ref={ref} position={[initX, 0.06, initZ]} rotation={[0, config.rotation, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.24, 0.14, 0.45]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.19, 0.02]}>
        <boxGeometry args={[0.2, 0.1, 0.2]} />
        <meshStandardMaterial color={0x90caf9} />
      </mesh>
      <mesh position={[0.09, 0.08, -0.22]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#FFF9C4" emissive="#FFF59D" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.09, 0.08, -0.22]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#FFF9C4" emissive="#FFF59D" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// ============ PEDESTRIAN SYSTEM ============
type PedestrianPath = 'QUADRANT_NW' | 'QUADRANT_NE' | 'QUADRANT_SW' | 'QUADRANT_SE';

interface PersonProps {
  pedestrianPath: PedestrianPath;
  startProgress: number;
  speed: number;
  color: number;
  horizontalGreen: boolean;
}

const getPedestrianWaypoints = (path: PedestrianPath): [number, number][] => {
  const OUTER = 5.5;
  const INNER = 1.5;
  const OFFSET = 0.15;
  
  switch (path) {
    case 'QUADRANT_NW':
      return [[-OUTER, -INNER - OFFSET], [-OUTER, -OUTER], [-INNER - OFFSET, -OUTER], [-INNER - OFFSET, -INNER - OFFSET]];
    case 'QUADRANT_NE':
      return [[INNER + OFFSET, -OUTER], [OUTER, -OUTER], [OUTER, -INNER - OFFSET], [INNER + OFFSET, -INNER - OFFSET]];
    case 'QUADRANT_SW':
      return [[-INNER - OFFSET, OUTER], [-OUTER, OUTER], [-OUTER, INNER + OFFSET], [-INNER - OFFSET, INNER + OFFSET]];
    case 'QUADRANT_SE':
      return [[OUTER, INNER + OFFSET], [OUTER, OUTER], [INNER + OFFSET, OUTER], [INNER + OFFSET, INNER + OFFSET]];
  }
};

const Person = ({ pedestrianPath, startProgress, speed, color, horizontalGreen }: PersonProps) => {
  const ref = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(startProgress);
  const phaseRef = useRef(Math.random() * Math.PI * 2);
  const waypoints = useMemo(() => getPedestrianWaypoints(pedestrianPath), [pedestrianPath]);
  
  const isNearCrosswalk = (segmentIndex: number) => segmentIndex === 2 || segmentIndex === 3;
  const canCross = (segmentIndex: number) => {
    const crossingHorizontalRoad = pedestrianPath === 'QUADRANT_NW' || pedestrianPath === 'QUADRANT_NE';
    if (crossingHorizontalRoad && segmentIndex >= 2) return !horizontalGreen;
    const crossingVerticalRoad = pedestrianPath === 'QUADRANT_SW' || pedestrianPath === 'QUADRANT_SE';
    if (crossingVerticalRoad && segmentIndex >= 2) return horizontalGreen;
    return true;
  };

  useFrame(() => {
    if (!ref.current) return;
    phaseRef.current += speed * 20;
    const swing = Math.sin(phaseRef.current) * 0.3;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    
    const numSegments = waypoints.length;
    const totalProgress = progressRef.current * numSegments;
    const segmentIndex = Math.floor(totalProgress) % numSegments;
    const segmentProgress = totalProgress - Math.floor(totalProgress);
    const shouldWait = isNearCrosswalk(segmentIndex) && !canCross(segmentIndex) && segmentProgress > 0.7;
    
    if (!shouldWait) {
      progressRef.current += speed * 0.0008;
      if (progressRef.current >= 1) progressRef.current -= 1;
    }
    
    const startIdx = segmentIndex;
    const endIdx = (segmentIndex + 1) % numSegments;
    const start = waypoints[startIdx];
    const end = waypoints[endIdx];
    const x = start[0] + (end[0] - start[0]) * segmentProgress;
    const z = start[1] + (end[1] - start[1]) * segmentProgress;
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const rotation = Math.atan2(dx, -dz);
    
    ref.current.position.x = x;
    ref.current.position.z = z;
    ref.current.rotation.y = rotation;
  });
  
  const initSegment = Math.floor(startProgress * waypoints.length) % waypoints.length;
  const initProgress = (startProgress * waypoints.length) - initSegment;
  const initStart = waypoints[initSegment];
  const initEnd = waypoints[(initSegment + 1) % waypoints.length];
  const initX = initStart[0] + (initEnd[0] - initStart[0]) * initProgress;
  const initZ = initStart[1] + (initEnd[1] - initStart[1]) * initProgress;

  return (
    <group ref={ref} position={[initX, 0.08, initZ]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={0xffccbc} />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.02, 0.04, 0]}>
        <boxGeometry args={[0.03, 0.1, 0.03]} />
        <meshStandardMaterial color={0x37474f} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.02, 0.04, 0]}>
        <boxGeometry args={[0.03, 0.1, 0.03]} />
        <meshStandardMaterial color={0x37474f} />
      </mesh>
    </group>
  );
};

// ============ CITY SCENE ============
const CityScene = ({ 
  accounts, 
  health, 
  goals, 
  weeklyBuilds, 
  autoRotate,
  subscriptions = []
}: { 
  accounts: AccountItem[]; 
  health: FinancialHealth; 
  goals: Goal[]; 
  weeklyBuilds: WeeklyBuild[]; 
  autoRotate: boolean;
  subscriptions?: Subscription[];
}) => {
  const cityRef = useRef<THREE.Group>(null);
  const activityLevel = health.score / 100;
  const numCars = Math.floor(2 + activityLevel * 4);
  const numPeople = Math.floor(4 + activityLevel * 8);
  const speedMult = 0.3 + activityLevel * 0.5;
  const isLowScore = health.score < 40;
  
  const { horizontalGreen, isYellow } = useTrafficLight();

  useFrame((_, delta) => {
    if (cityRef.current && autoRotate) {
      cityRef.current.rotation.y += delta * 0.04;
    }
  });

  // Calculate surplus
  const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
  const maxSurplus = Math.max(health.monthlyIncome, 5000);
  
  // Organize accounts by type for themed quadrants
  const { assetBuildings, debtBuildings, cars, people } = useMemo(() => {
    const maxVal = Math.max(...accounts.map(a => a.balance), 1);
    
    // Asset accounts for NW quadrant
    const assets = accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type));
    const debts = accounts.filter(a => ['LOAN', 'CREDIT_CARD', 'HECS'].includes(a.type));
    
    // Asset building spots (NW quadrant)
    const assetSpots = [
      { x: -4.8, z: -4.8 }, { x: -3.2, z: -4.8 }, 
      { x: -4.8, z: -3.2 }, { x: -3.2, z: -3.2 },
    ];
    
    // Debt building spots (NE quadrant)
    const debtSpots = [
      { x: 3.2, z: -4.8 }, { x: 4.8, z: -4.8 },
      { x: 3.2, z: -3.2 },
    ];
    
    // Goal rocket spots (SW quadrant)
    // Construction/impulse spots (SE quadrant)
    
    const assetBldgs = assets.slice(0, assetSpots.length).map((acc, i) => {
      const h = Math.max(0.8, (acc.balance / maxVal) * 3.8);
      const hasRocket = i < goals.length;
      const rocketProgress = hasRocket ? Math.min(goals[i].currentAmount / goals[i].targetAmount, 1) : 0;
      return { 
        ...assetSpots[i], 
        height: h, 
        type: acc.type, 
        hasRocket, 
        rocketProgress, 
        id: acc.id,
        isDivineValue: acc.isValueBuilding || false,
        name: acc.name
      };
    });
    
    const debtBldgs = debts.slice(0, debtSpots.length).map((acc, i) => {
      const h = Math.max(0.8, (acc.balance / maxVal) * 3.0);
      return { 
        ...debtSpots[i], 
        height: h, 
        type: acc.type, 
        hasRocket: false, 
        rocketProgress: 0, 
        id: acc.id,
        isDivineValue: false,
        name: acc.name
      };
    });

    // Cars
    const directions: CarDirection[] = ['EAST', 'WEST', 'NORTH', 'SOUTH'];
    const carData = Array.from({ length: numCars }).map((_, i) => ({
      direction: directions[i % 4],
      laneOffset: 0.45,
      startPos: -6 + (i * 2.5) % 12,
      speed: 0.025 + (i % 3) * 0.005,
      color: CAR_COLORS[i % CAR_COLORS.length],
    }));

    // Pedestrians
    const pedPaths: PedestrianPath[] = ['QUADRANT_NW', 'QUADRANT_NE', 'QUADRANT_SW', 'QUADRANT_SE'];
    const peopleData = Array.from({ length: numPeople }).map((_, i) => ({
      pedestrianPath: pedPaths[i % 4],
      startProgress: (i * 0.2 + Math.random() * 0.15) % 1,
      speed: (0.8 + Math.random() * 0.4) * speedMult,
      color: PEOPLE_COLORS[i % PEOPLE_COLORS.length],
    }));

    return { 
      assetBuildings: assetBldgs, 
      debtBuildings: debtBldgs, 
      cars: carData, 
      people: peopleData 
    };
  }, [accounts, goals, numCars, numPeople, speedMult]);

  // Subscription drain positions (around the perimeter)
  const subscriptionPositions = useMemo(() => {
    const positions: [number, number, number][] = [
      [-5.5, 0.08, -2], [-5.5, 0.08, 0], [-5.5, 0.08, 2],
      [5.5, 0.08, -2], [5.5, 0.08, 0], [5.5, 0.08, 2],
    ];
    return positions;
  }, []);

  const treePositions: [number, number, number][] = [
    [-5.8, 0.08, -5.8], [5.8, 0.08, -5.8], [-5.8, 0.08, 5.8], [5.8, 0.08, 5.8],
    [-5.8, 0.08, -2.5], [-5.8, 0.08, 2.5], [5.8, 0.08, 2.5],
    [-2.5, 0.08, -5.8], [2.5, 0.08, -5.8], [-2.5, 0.08, 5.8], [2.5, 0.08, 5.8],
  ];

  const lampPositions: [number, number, number][] = [
    [-1.6, 0.08, 2.5], [1.6, 0.08, 2.5], [-1.6, 0.08, -2.5], [1.6, 0.08, -2.5],
    [2.5, 0.08, -1.6], [2.5, 0.08, 1.6], [-2.5, 0.08, -1.6], [-2.5, 0.08, 1.6],
  ];

  // Construction spots in SW quadrant
  const constructionSpots: [number, number, number][] = [
    [-4.5, 0.08, 3.5], [-3.0, 0.08, 4.5]
  ];

  return (
    <group ref={cityRef}>
      {/* Base */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[14, 0.3, 14]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>

      {/* Grass quadrants with themed colors */}
      {/* NW - Assets (lush green) */}
      <mesh position={[-3.8, 0.05, -3.8]} receiveShadow>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#7CB342" />
      </mesh>
      {/* NE - Debts (slightly darker) */}
      <mesh position={[3.8, 0.05, -3.8]} receiveShadow>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color={isLowScore ? '#8D6E63' : '#689F38'} />
      </mesh>
      {/* SW - Goals/Construction (vibrant) */}
      <mesh position={[-3.8, 0.05, 3.8]} receiveShadow>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#8BC34A" />
      </mesh>
      {/* SE - Harbor/Income */}
      <mesh position={[3.8, 0.05, 3.8]} receiveShadow>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#81C784" />
      </mesh>

      {/* Roads */}
      <mesh position={[-4.5, 0.02, 0]} receiveShadow>
        <boxGeometry args={[5, 0.04, 2.2]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      <mesh position={[4.5, 0.02, 0]} receiveShadow>
        <boxGeometry args={[5, 0.04, 2.2]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      <mesh position={[0, 0.02, -4.5]} receiveShadow>
        <boxGeometry args={[2.2, 0.04, 5]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      <mesh position={[0, 0.02, 4.5]} receiveShadow>
        <boxGeometry args={[2.2, 0.04, 5]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      
      {/* Central intersection */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.04, 2.2]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>

      {/* Road markings */}
      {[-5.5, -4.2, -2.9].map((pos, i) => (
        <mesh key={`neg-${i}`} position={[pos, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.06]} />
          <meshStandardMaterial color={COLORS.roadMarking} />
        </mesh>
      ))}
      {[2.9, 4.2, 5.5].map((pos, i) => (
        <mesh key={`pos-${i}`} position={[pos, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.06]} />
          <meshStandardMaterial color={COLORS.roadMarking} />
        </mesh>
      ))}
      {[-5.5, -4.2, -2.9].map((pos, i) => (
        <mesh key={`zn-${i}`} position={[0, 0.05, pos]}>
          <boxGeometry args={[0.06, 0.01, 0.5]} />
          <meshStandardMaterial color={COLORS.roadMarking} />
        </mesh>
      ))}
      {[2.9, 4.2, 5.5].map((pos, i) => (
        <mesh key={`zp-${i}`} position={[0, 0.05, pos]}>
          <boxGeometry args={[0.06, 0.01, 0.5]} />
          <meshStandardMaterial color={COLORS.roadMarking} />
        </mesh>
      ))}

      {/* Crosswalks */}
      <Crosswalk position={[-1.9, 0, 0]} rotation={0} />
      <Crosswalk position={[1.9, 0, 0]} rotation={0} />
      <Crosswalk position={[0, 0, -1.9]} rotation={Math.PI / 2} />
      <Crosswalk position={[0, 0, 1.9]} rotation={Math.PI / 2} />

      {/* Sidewalks */}
      {[[-3.8, -3.8], [-3.8, 3.8], [3.8, -3.8], [3.8, 3.8]].map(([bx, bz], i) => (
        <group key={i}>
          <mesh position={[bx, 0.11, bz > 0 ? bz - 2.4 : bz + 2.4]} receiveShadow>
            <boxGeometry args={[5.1, 0.08, 0.4]} />
            <meshStandardMaterial color={COLORS.sidewalk} />
          </mesh>
          <mesh position={[bx > 0 ? bx - 2.4 : bx + 2.4, 0.11, bz]} receiveShadow>
            <boxGeometry args={[0.4, 0.08, 5.1]} />
            <meshStandardMaterial color={COLORS.sidewalk} />
          </mesh>
        </group>
      ))}

      {/* Traffic Lights */}
      <TrafficLight position={[-1.5, 0, -1.5]} rotation={Math.PI / 4} isGreen={horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[1.5, 0, -1.5]} rotation={-Math.PI / 4} isGreen={!horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[-1.5, 0, 1.5]} rotation={Math.PI * 3 / 4} isGreen={!horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[1.5, 0, 1.5]} rotation={-Math.PI * 3 / 4} isGreen={horizontalGreen} isYellow={isYellow} />

      {/* === CENTRAL CASHFLOW FOUNTAIN === */}
      <CashflowFountain surplus={monthlySurplus} maxSurplus={maxSurplus} />

      {/* === ASSET BUILDINGS (NW) === */}
      {assetBuildings.map((b) => (
        <Building 
          key={b.id} 
          position={[b.x, 0.1, b.z]} 
          height={b.height} 
          accountType={b.type} 
          hasRocket={b.hasRocket} 
          rocketProgress={b.rocketProgress}
          isDivineValue={b.isDivineValue}
          accountName={b.name}
        />
      ))}

      {/* === DEBT BUILDINGS (NE) === */}
      {debtBuildings.map((b) => (
        <Building 
          key={b.id} 
          position={[b.x, 0.1, b.z]} 
          height={b.height} 
          accountType={b.type}
          accountName={b.name}
        />
      ))}

      {/* === TAX VAULT (SE corner) === */}
      {health.taxVault > 0 && (
        <TaxVault 
          position={[4.5, 0.1, 4.5]} 
          taxAmount={health.taxVault} 
          maxTax={health.monthlyIncome * 0.3 * 3} 
        />
      )}

      {/* === WILLPOWER TOWER (SW corner) === */}
      {health.willpowerPoints > 0 && (
        <WillpowerTower 
          position={[-4.5, 0.1, 4.5]} 
          points={health.willpowerPoints} 
          maxPoints={500} 
        />
      )}

      {/* === HARBOR DISTRICT (SE) === */}
      <HarborDistrict 
        position={[3.5, 0.08, 3.5]} 
        savings={health.savings} 
        maxSavings={50000} 
      />

      {/* === SUBSCRIPTION DRAINS === */}
      {subscriptions.slice(0, subscriptionPositions.length).map((sub, i) => (
        <SubscriptionDrain 
          key={sub.id} 
          position={subscriptionPositions[i]} 
          amount={sub.amount} 
          name={sub.name} 
        />
      ))}

      {/* === CONSTRUCTION SITES (SW) === */}
      {weeklyBuilds.slice(0, 2).map((build, i) => (
        <ConstructionSite 
          key={build.id} 
          position={constructionSpots[i]} 
          progress={build.saved / build.target}
          name={build.name}
        />
      ))}

      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.8 + (i % 3) * 0.15} />
      ))}

      {/* Street Lamps */}
      {lampPositions.map((pos, i) => (
        <StreetLamp key={i} position={pos} />
      ))}

      {/* Cars */}
      {cars.map((c, i) => (
        <Car key={i} {...c} horizontalGreen={horizontalGreen} />
      ))}

      {/* Pedestrians */}
      {people.map((p, i) => (
        <Person key={i} {...p} horizontalGreen={horizontalGreen} />
      ))}

      {/* === WEATHER CLOUDS === */}
      <DriftingCloud initialPosition={[-8, 8, -6]} speed={0.15} scale={1.2} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[5, 9, -3]} speed={0.12} scale={0.9} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[-3, 7.5, 4]} speed={0.18} scale={1.0} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[8, 8.5, 2]} speed={0.1} scale={1.4} isStorm={isLowScore} />
      {isLowScore && (
        <>
          <DriftingCloud initialPosition={[0, 7, -8]} speed={0.2} scale={1.5} isStorm={true} />
          <DriftingCloud initialPosition={[-5, 8, 0]} speed={0.16} scale={1.3} isStorm={true} />
        </>
      )}
    </group>
  );
};

// ============ MAIN COMPONENT ============
interface IsometricCityProps {
  onNavigate: (view: AppView) => void;
  accounts: AccountItem[];
  health: FinancialHealth;
  goals: Goal[];
  hasWeeds: boolean;
  isFuture: boolean;
  weeklyBuilds: WeeklyBuild[];
  subscriptions?: Subscription[];
}

export const IsometricCity: React.FC<IsometricCityProps> = ({
  onNavigate,
  accounts,
  health,
  goals,
  hasWeeds,
  isFuture,
  weeklyBuilds,
  subscriptions = []
}) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const isLowScore = health.score < 40;

  // Dynamic sky based on health score and future mode
  const getSkyClass = () => {
    if (isFuture) return "bg-gradient-to-b from-indigo-900 to-purple-900";
    if (isLowScore) return "bg-gradient-to-b from-slate-500 to-slate-600";
    if (health.score > 70) return "bg-gradient-to-b from-sky-300 to-sky-400";
    return "bg-gradient-to-b from-sky-400 to-slate-400";
  };

  const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
  const totalSubCost = subscriptions.reduce((sum, s) => sum + (s.cycle === 'YEARLY' ? s.amount / 12 : s.cycle === 'WEEKLY' ? s.amount * 4 : s.amount), 0);

  return (
    <div className={`w-full h-[500px] md:h-[600px] ${getSkyClass()} relative rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-slate-800 font-black text-xl drop-shadow-md mix-blend-hard-light">
          {isFuture ? 'FUTURE CITY' : 'WEALTH CITY'}
        </h2>
        <p className="text-slate-700 text-xs font-bold">
          {accounts.length} structures • {goals.length} active missions
        </p>
      </div>

      {/* Score & Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className={`px-3 py-1.5 rounded-full text-sm font-bold shadow ${
          health.score > 70 ? 'bg-green-500 text-white' : 
          health.score > 40 ? 'bg-yellow-500 text-slate-800' : 
          'bg-red-500 text-white'
        }`}>
          Score: {health.score}
        </div>
        <button 
          onClick={() => setAutoRotate(!autoRotate)} 
          className={`px-2.5 py-1 rounded-full text-xs shadow cursor-pointer ${autoRotate ? 'bg-blue-500 text-white' : 'bg-white/80 text-slate-600'}`}
        >
          ⟳
        </button>
      </div>

      {/* Cashflow Indicator */}
      <div className="absolute top-16 left-4 z-10 bg-white/90 backdrop-blur rounded-lg p-2 shadow">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold ${monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthlySurplus >= 0 ? '↑' : '↓'} ${Math.abs(monthlySurplus).toLocaleString()}/mo
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-orange-600 font-medium">
            💧 ${totalSubCost.toFixed(0)}/mo subs
          </span>
        </div>
      </div>

      {/* Goals Panel */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg max-w-[180px]">
        <p className="text-slate-500 text-xs font-semibold mb-1.5 flex justify-between">
          <span>🚀 GOALS</span>
          {hasWeeds && <span className="text-red-500 animate-pulse" title="Weeds detected!">🌿</span>}
        </p>
        {goals.length === 0 && <p className="text-[10px] text-slate-400">No active missions.</p>}
        {goals.map(g => {
          const p = Math.min(g.currentAmount / g.targetAmount, 1);
          return (
            <div key={g.id} className="text-xs mb-1.5">
              <div className="flex justify-between text-slate-700">
                <span className="truncate max-w-[80px]">{g.name}</span>
                <span className={p >= 1 ? 'text-green-600 font-bold' : ''}>{p >= 1 ? '✓' : `${Math.round(p * 100)}%`}</span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-0.5">
                <div className={`h-full rounded-full ${p >= 1 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${p * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/80 backdrop-blur rounded-lg p-2 shadow text-[10px] space-y-1">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-400"></div> Assets</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400"></div> Debts</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-400"></div> Tax Vault</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-400"></div> Willpower</div>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={-50} far={200} />
        <OrbitControls 
          autoRotate={autoRotate} 
          autoRotateSpeed={0.5} 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 3} 
        />
        
        <ambientLight intensity={isFuture ? 0.4 : isLowScore ? 0.5 : 0.7} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={isFuture ? 0.4 : isLowScore ? 0.6 : 0.8} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        {isFuture && <pointLight position={[-5, 5, -5]} intensity={1} color="#bc13fe" distance={20} />}
        {isLowScore && <pointLight position={[0, 10, 0]} intensity={0.3} color="#ff6b6b" distance={15} />}

        <CityScene 
          accounts={accounts} 
          health={health} 
          goals={goals} 
          weeklyBuilds={weeklyBuilds} 
          autoRotate={false}
          subscriptions={subscriptions}
        />
      </Canvas>
    </div>
  );
};
