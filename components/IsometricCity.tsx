
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AccountItem, FinancialHealth, Goal, WeeklyBuild, AppView, Subscription } from '../types';

// ============ COLORS ============
const COLORS = {
  // Buildings by type
  savings: '#FFD54F',      // Gold for savings
  investment: '#66BB6A',   // Green for growth
  super: '#AB47BC',        // Purple for super
  cash: '#42A5F5',         // Blue for cash
  debt: '#EF5350',         // Red for debt
  
  // Environment
  grass: '#7CB342',
  road: '#37474F',
  roadMarking: '#FFFFFF',
  sidewalk: '#BDBDBD',
  
  // Features
  water: '#29B6F6',
  waterNegative: '#EF5350',
  dock: '#8D6E63',
  concrete: '#78909C',
  
  // Rockets & Construction
  rocket: '#ECEFF1',
  rocketAccent: '#E53935',
  crane: '#FFC107',
  scaffolding: '#8D6E63',
  construction: '#FFB74D',
  
  // Nature
  tree: '#4CAF50',
  treeDark: '#2E7D32',
  trunk: '#6D4C41',
  cloud: '#FFFFFF',
  stormCloud: '#78909C',
  
  // Traffic
  trafficRed: '#EF5350',
  trafficGreen: '#66BB6A',
  trafficYellow: '#FFC107',
  
  // Special
  taxVault: '#7E57C2',
  window: '#81D4FA',
  smoke: '#455A64',
};

const CAR_COLORS = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xab47bc];
const PEOPLE_COLORS = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0xab47bc];

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

// ============ BASIC COMPONENTS ============

const Window = ({ position, size }: { position: [number, number, number]; size: [number, number, number] }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={COLORS.window} emissive="#4FC3F7" emissiveIntensity={0.2} />
  </mesh>
);

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

const TrafficLight = ({ position, rotation, isGreen, isYellow }: { 
  position: [number, number, number]; 
  rotation?: number;
  isGreen: boolean;
  isYellow: boolean;
}) => (
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
      <meshStandardMaterial color={COLORS.trafficRed} emissive={COLORS.trafficRed} emissiveIntensity={!isGreen && !isYellow ? 2 : 0.1} />
    </mesh>
    <mesh position={[0, 0.85, 0.045]}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshStandardMaterial color={COLORS.trafficYellow} emissive={COLORS.trafficYellow} emissiveIntensity={isYellow ? 2 : 0.1} />
    </mesh>
    <mesh position={[0, 0.77, 0.045]}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshStandardMaterial color={COLORS.trafficGreen} emissive={COLORS.trafficGreen} emissiveIntensity={isGreen && !isYellow ? 2 : 0.1} />
    </mesh>
  </group>
);

const Crosswalk = ({ position, rotation }: { position: [number, number, number]; rotation?: number }) => (
  <group position={position} rotation={[0, rotation || 0, 0]}>
    {[0, 1, 2, 3, 4].map(i => (
      <mesh key={i} position={[0, 0.05, -0.4 + i * 0.2]}>
        <boxGeometry args={[0.8, 0.01, 0.12]} />
        <meshStandardMaterial color={COLORS.roadMarking} />
      </mesh>
    ))}
  </group>
);

// ============ CLOUDS ============
const Cloud = ({ position, scale = 1, isStorm = false }: { position: [number, number, number]; scale?: number; isStorm?: boolean }) => {
  const color = isStorm ? COLORS.stormCloud : COLORS.cloud;
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
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.x += speed * delta;
      if (ref.current.position.x > 12) ref.current.position.x = -12;
    }
  });
  return <group ref={ref} position={initialPosition}><Cloud position={[0, 0, 0]} scale={scale} isStorm={isStorm} /></group>;
};

// ============ CASHFLOW FOUNTAIN (CENTER) ============
const CashflowFountain = ({ surplus, maxSurplus }: { surplus: number; maxSurplus: number }) => {
  const sprayRef = useRef<THREE.Mesh>(null);
  const waterLevel = Math.max(0.2, Math.min(1, (surplus + maxSurplus) / (maxSurplus * 2)));
  const isNegative = surplus < 0;
  
  useFrame(({ clock }) => {
    if (sprayRef.current && !isNegative) {
      sprayRef.current.scale.y = 0.5 + waterLevel * (0.8 + Math.sin(clock.elapsedTime * 4) * 0.2);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base */}
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[1.1, 1.2, 0.08, 24]} /><meshStandardMaterial color="#E0E0E0" /></mesh>
      {/* Pool rim */}
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.85, 0.95, 0.12, 20]} /><meshStandardMaterial color="#78909C" /></mesh>
      {/* Water */}
      <mesh position={[0, 0.08 + waterLevel * 0.04, 0]}>
        <cylinderGeometry args={[0.8, 0.8, waterLevel * 0.08, 20]} />
        <meshStandardMaterial color={isNegative ? COLORS.waterNegative : COLORS.water} transparent opacity={0.8} />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.06, 0.08, 0.25, 8]} /><meshStandardMaterial color="#607D8B" /></mesh>
      {/* Spray */}
      {!isNegative && (
        <mesh ref={sprayRef} position={[0, 0.42, 0]}>
          <coneGeometry args={[0.06 + waterLevel * 0.04, 0.35 * waterLevel, 8]} />
          <meshStandardMaterial color="#B3E5FC" transparent opacity={0.6} />
        </mesh>
      )}
      {/* Negative warning */}
      {isNegative && (
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={COLORS.waterNegative} emissive={COLORS.waterNegative} emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Status ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.25, 24]} />
        <meshStandardMaterial color={isNegative ? COLORS.waterNegative : '#4CAF50'} emissive={isNegative ? COLORS.waterNegative : '#4CAF50'} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

// ============ ASSET BUILDING (NW QUADRANT) ============
const AssetBuilding = ({ position, height, type, balance, name }: { 
  position: [number, number, number]; 
  height: number; 
  type: string;
  balance: number;
  name?: string;
}) => {
  const getColor = () => {
    switch(type) {
      case 'SAVINGS': return COLORS.savings;
      case 'INVESTMENT': return COLORS.investment;
      case 'SUPER': return COLORS.super;
      default: return COLORS.cash;
    }
  };
  
  const floors = Math.min(Math.floor(height / 0.35), 10);
  const width = 0.95; // Slightly larger for mobile visibility
  
  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={getColor()} roughness={0.4} />
      </mesh>
      {/* Windows on all sides */}
      {Array.from({ length: floors }).map((_, f) => (
        <group key={f}>
          <Window position={[width/2 + 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.14, width * 0.6]} />
          <Window position={[-width/2 - 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.14, width * 0.6]} />
          <Window position={[0, 0.22 + f * 0.35, width/2 + 0.01]} size={[width * 0.6, 0.14, 0.02]} />
          <Window position={[0, 0.22 + f * 0.35, -width/2 - 0.01]} size={[width * 0.6, 0.14, 0.02]} />
        </group>
      ))}
      {/* Roof feature by type */}
      {type === 'SAVINGS' && (
        <mesh position={[0, height + 0.01, 0]}>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FFC107" metalness={0.7} roughness={0.2} />
        </mesh>
      )}
      {type === 'INVESTMENT' && (
        <group position={[0, height, 0]}>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.025, 0.035, 0.35, 6]} /><meshStandardMaterial color="#607D8B" /></mesh>
          <mesh position={[0, 0.38, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#4CAF50" emissive="#4CAF50" emissiveIntensity={0.6} /></mesh>
        </group>
      )}
      {type === 'SUPER' && (
        <mesh position={[0, height + 0.1, 0]}>
          <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#9C27B0" metalness={0.5} />
        </mesh>
      )}
      {type === 'CASH' && (
        <mesh position={[0, height + 0.08, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color="#1565C0" />
        </mesh>
      )}
    </group>
  );
};

// ============ DEBT BUILDING (NE QUADRANT) ============
const DebtBuilding = ({ position, height, type, balance }: { 
  position: [number, number, number]; 
  height: number; 
  type: string;
  balance: number;
}) => {
  const smokeRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (smokeRef.current) {
      smokeRef.current.children.forEach((child, i) => {
        child.position.y = 0.12 + Math.sin(clock.elapsedTime * 2 + i) * 0.1 + i * 0.12;
        (child as THREE.Mesh).scale.setScalar(0.8 + Math.sin(clock.elapsedTime * 3 + i) * 0.25);
      });
    }
  });
  
  const floors = Math.min(Math.floor(height / 0.35), 8);
  const width = 0.9;
  
  return (
    <group position={position}>
      {/* Main building */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={COLORS.debt} roughness={0.5} />
      </mesh>
      {/* Windows */}
      {Array.from({ length: floors }).map((_, f) => (
        <group key={f}>
          <Window position={[width/2 + 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.12, width * 0.55]} />
          <Window position={[-width/2 - 0.01, 0.22 + f * 0.35, 0]} size={[0.02, 0.12, width * 0.55]} />
          <Window position={[0, 0.22 + f * 0.35, width/2 + 0.01]} size={[width * 0.55, 0.12, 0.02]} />
          <Window position={[0, 0.22 + f * 0.35, -width/2 - 0.01]} size={[width * 0.55, 0.12, 0.02]} />
        </group>
      ))}
      {/* Warning beacon - larger and more visible */}
      <mesh position={[0, height + 0.15, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={1} />
      </mesh>
      {/* Smoke - larger puffs */}
      <group ref={smokeRef} position={[0, height + 0.25, 0]}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[0, i * 0.12, 0]}>
            <sphereGeometry args={[0.06 + i * 0.02, 8, 8]} />
            <meshStandardMaterial color={COLORS.smoke} transparent opacity={0.4 - i * 0.08} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ============ LAUNCHPAD WITH ROCKET (SW QUADRANT) ============
const LaunchPad = ({ position, goal }: { position: [number, number, number]; goal: Goal }) => {
  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const flameRef = useRef<THREE.Mesh>(null);
  const rocketHeight = 0.4 + progress * 0.7;
  
  useFrame(({ clock }) => {
    if (flameRef.current && progress >= 1) {
      flameRef.current.scale.y = 0.8 + Math.sin(clock.elapsedTime * 15) * 0.3;
    }
  });
  
  return (
    <group position={position}>
      {/* Launch platform - larger for mobile visibility */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.65, 0.16, 16]} />
        <meshStandardMaterial color={COLORS.concrete} />
      </mesh>
      {/* Platform inner ring */}
      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshStandardMaterial color={progress >= 1 ? '#4CAF50' : '#FFC107'} />
      </mesh>
      {/* Support tower - taller */}
      <mesh position={[0.45, 0.65, 0]}>
        <boxGeometry args={[0.1, 1.3, 0.1]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      {/* Tower arm */}
      <mesh position={[0.25, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.06]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      {/* Rocket */}
      {progress > 0.05 && (
        <group position={[0, 0.2, 0]}>
          {/* Body - larger */}
          <mesh position={[0, rocketHeight / 2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, rocketHeight, 12]} />
            <meshStandardMaterial color={COLORS.rocket} metalness={0.3} />
          </mesh>
          {/* Nose cone */}
          <mesh position={[0, rocketHeight + 0.12, 0]}>
            <coneGeometry args={[0.1, 0.25, 12]} />
            <meshStandardMaterial color={COLORS.rocketAccent} />
          </mesh>
          {/* Fins - larger */}
          {[0, 1, 2].map(i => (
            <mesh key={i} position={[Math.cos(i * Math.PI * 2 / 3) * 0.12, 0.15, Math.sin(i * Math.PI * 2 / 3) * 0.12]} rotation={[0, i * Math.PI * 2 / 3, 0]}>
              <boxGeometry args={[0.025, 0.15, 0.1]} />
              <meshStandardMaterial color={COLORS.rocketAccent} />
            </mesh>
          ))}
          {/* Flame when ready - bigger */}
          {progress >= 1 && (
            <mesh ref={flameRef} position={[0, -0.02, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.35, 8]} />
              <meshStandardMaterial color="#FF9800" emissive="#FF5722" emissiveIntensity={1.5} transparent opacity={0.9} />
            </mesh>
          )}
        </group>
      )}
      {/* Progress ring - outer glow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.68, 32, 1, 0, progress * Math.PI * 2]} />
        <meshStandardMaterial color={progress >= 1 ? '#4CAF50' : '#2196F3'} emissive={progress >= 1 ? '#4CAF50' : '#2196F3'} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

// ============ CONSTRUCTION SITE (IMPULSE ITEMS) ============
const ConstructionSite = ({ position, progress, name }: { position: [number, number, number]; progress: number; name?: string }) => {
  const builtH = 0.2 + progress * 1.2;
  
  return (
    <group position={position}>
      {/* Foundation */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.08, 1.0]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
      {/* Building in progress */}
      <mesh position={[0, 0.08 + builtH / 2, 0]} castShadow>
        <boxGeometry args={[0.8, builtH, 0.8]} />
        <meshStandardMaterial color={COLORS.construction} transparent opacity={0.85} />
      </mesh>
      {/* Scaffolding */}
      {[[-0.45, -0.45], [-0.45, 0.45], [0.45, -0.45], [0.45, 0.45]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx, 0.08 + (builtH + 0.2) / 2, sz]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, builtH + 0.2, 6]} />
          <meshStandardMaterial color={COLORS.scaffolding} />
        </mesh>
      ))}
      {/* Crane (if not complete) */}
      {progress < 0.9 && (
        <>
          <mesh position={[0.3, 0.8, 0.3]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1.4, 8]} />
            <meshStandardMaterial color={COLORS.crane} />
          </mesh>
          <mesh position={[-0.15, 1.5, 0.3]}>
            <boxGeometry args={[0.9, 0.04, 0.04]} />
            <meshStandardMaterial color={COLORS.crane} />
          </mesh>
        </>
      )}
    </group>
  );
};

// ============ HARBOR DOCK (SE QUADRANT) ============
const HarborDock = ({ position, savings }: { position: [number, number, number]; savings: number }) => {
  const waterLevel = Math.max(0.3, Math.min(1, savings / 50000));
  const boat1Ref = useRef<THREE.Group>(null);
  const boat2Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (boat1Ref.current) {
      boat1Ref.current.rotation.z = Math.sin(t * 1.5) * 0.03;
      boat1Ref.current.position.y = 0.06 + Math.sin(t * 1.2) * 0.02;
    }
    if (boat2Ref.current) {
      boat2Ref.current.rotation.z = Math.sin(t * 1.3 + 1) * 0.04;
      boat2Ref.current.position.y = 0.06 + Math.sin(t * 1.4 + 0.5) * 0.02;
    }
  });

  return (
    <group position={position}>
      {/* Water basin */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.12 * waterLevel, 2.0]} />
        <meshStandardMaterial color={COLORS.water} transparent opacity={0.85} />
      </mesh>
      {/* Dock */}
      <mesh position={[0.6, 0.06, 0]}>
        <boxGeometry args={[0.35, 0.06, 1.8]} />
        <meshStandardMaterial color={COLORS.dock} />
      </mesh>
      {/* Dock posts */}
      {[-0.7, 0, 0.7].map((z, i) => (
        <mesh key={i} position={[0.78, -0.04, z]}>
          <cylinderGeometry args={[0.04, 0.05, 0.28, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      ))}
      {/* Boats */}
      <group ref={boat1Ref} position={[-0.25, 0.06, -0.4]}>
        <mesh><boxGeometry args={[0.5, 0.1, 0.22]} /><meshStandardMaterial color="#ECEFF1" /></mesh>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.06, 0.25, 0.02]} /><meshStandardMaterial color="#795548" /></mesh>
        <mesh position={[0.06, 0.18, 0]}><boxGeometry args={[0.16, 0.14, 0.01]} /><meshStandardMaterial color="#1E88E5" /></mesh>
      </group>
      <group ref={boat2Ref} position={[-0.4, 0.06, 0.5]}>
        <mesh><boxGeometry args={[0.38, 0.08, 0.18]} /><meshStandardMaterial color="#FFF9C4" /></mesh>
      </group>
    </group>
  );
};

// ============ TAX VAULT (SE QUADRANT) ============
const TaxVault = ({ position, amount }: { position: [number, number, number]; amount: number }) => {
  const fillLevel = Math.min(1, amount / 3000);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (pulseRef.current && fillLevel > 0.3) {
      pulseRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.08);
    }
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.7, 0.24, 0.7]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
      {/* Vault body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.6, 0.42, 0.6]} />
        <meshStandardMaterial color={COLORS.taxVault} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Vault door */}
      <mesh position={[0.31, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
        <meshStandardMaterial color="#424242" metalness={0.6} />
      </mesh>
      {/* Fill indicator */}
      {fillLevel > 0 && (
        <mesh position={[0, 0.28 + fillLevel * 0.15, 0]}>
          <boxGeometry args={[0.4, fillLevel * 0.3, 0.4]} />
          <meshStandardMaterial color="#FFD54F" transparent opacity={0.7} />
        </mesh>
      )}
      {/* Beacon */}
      <mesh ref={pulseRef} position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={COLORS.taxVault} emissive={COLORS.taxVault} emissiveIntensity={fillLevel > 0.3 ? 1 : 0.3} />
      </mesh>
    </group>
  );
};

// ============ CAR ============
type CarDirection = 'EAST' | 'WEST' | 'NORTH' | 'SOUTH';

const Car = ({ direction, laneOffset, startPos, speed, color, horizontalGreen }: { 
  direction: CarDirection; laneOffset: number; startPos: number; speed: number; color: number; horizontalGreen: boolean;
}) => {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(startPos);
  
  const config = useMemo(() => {
    switch (direction) {
      case 'EAST': return { axis: 'x' as const, dir: 1, lanePos: -laneOffset, rotation: Math.PI / 2 };
      case 'WEST': return { axis: 'x' as const, dir: -1, lanePos: laneOffset, rotation: -Math.PI / 2 };
      case 'SOUTH': return { axis: 'z' as const, dir: 1, lanePos: laneOffset, rotation: Math.PI };
      case 'NORTH': return { axis: 'z' as const, dir: -1, lanePos: -laneOffset, rotation: 0 };
    }
  }, [direction, laneOffset]);
  
  const canGo = config.axis === 'x' ? horizontalGreen : !horizontalGreen;
  
  useFrame(() => {
    if (!ref.current) return;
    const pos = posRef.current;
    const approachingStop = config.dir > 0 ? (pos > -2.5 && pos < -1.8) : (pos < 2.5 && pos > 1.8);
    if (!(!canGo && approachingStop)) {
      posRef.current += speed * config.dir;
      if (config.dir > 0 && posRef.current > 7) posRef.current = -7;
      else if (config.dir < 0 && posRef.current < -7) posRef.current = 7;
    }
    if (config.axis === 'x') { ref.current.position.x = posRef.current; ref.current.position.z = config.lanePos; }
    else { ref.current.position.z = posRef.current; ref.current.position.x = config.lanePos; }
  });

  return (
    <group ref={ref} position={[config.axis === 'x' ? startPos : config.lanePos, 0.06, config.axis === 'z' ? startPos : config.lanePos]} rotation={[0, config.rotation, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow><boxGeometry args={[0.22, 0.12, 0.4]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.17, 0.02]}><boxGeometry args={[0.18, 0.08, 0.18]} /><meshStandardMaterial color={0x90caf9} /></mesh>
    </group>
  );
};

// ============ PEDESTRIAN ============
type PedestrianPath = 'QUADRANT_NW' | 'QUADRANT_NE' | 'QUADRANT_SW' | 'QUADRANT_SE';

const getPedestrianWaypoints = (path: PedestrianPath): [number, number][] => {
  const O = 5.5, I = 1.6;
  switch (path) {
    case 'QUADRANT_NW': return [[-O, -I], [-O, -O], [-I, -O], [-I, -I]];
    case 'QUADRANT_NE': return [[I, -O], [O, -O], [O, -I], [I, -I]];
    case 'QUADRANT_SW': return [[-I, O], [-O, O], [-O, I], [-I, I]];
    case 'QUADRANT_SE': return [[O, I], [O, O], [I, O], [I, I]];
  }
};

const Person = ({ pedestrianPath, startProgress, speed, color, horizontalGreen }: { 
  pedestrianPath: PedestrianPath; startProgress: number; speed: number; color: number; horizontalGreen: boolean;
}) => {
  const ref = useRef<THREE.Group>(null);
  const progressRef = useRef(startProgress);
  const waypoints = useMemo(() => getPedestrianWaypoints(pedestrianPath), [pedestrianPath]);

  useFrame(() => {
    if (!ref.current) return;
    const n = waypoints.length;
    const t = progressRef.current * n;
    const seg = Math.floor(t) % n;
    const p = t - Math.floor(t);
    const nearCross = seg >= 2;
    const shouldWait = nearCross && p > 0.7 && ((pedestrianPath.includes('NW') || pedestrianPath.includes('NE')) ? horizontalGreen : !horizontalGreen);
    if (!shouldWait) { progressRef.current += speed * 0.0008; if (progressRef.current >= 1) progressRef.current -= 1; }
    const s = waypoints[seg], e = waypoints[(seg + 1) % n];
    ref.current.position.x = s[0] + (e[0] - s[0]) * p;
    ref.current.position.z = s[1] + (e[1] - s[1]) * p;
  });

  return (
    <group ref={ref} position={[waypoints[0][0], 0.08, waypoints[0][1]]}>
      <mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.08, 0.14, 0.06]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.26, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color={0xffccbc} /></mesh>
    </group>
  );
};

// ============ CITY SCENE ============
const CityScene = ({ accounts, health, goals, weeklyBuilds, autoRotate, subscriptions = [] }: { 
  accounts: AccountItem[]; health: FinancialHealth; goals: Goal[]; weeklyBuilds: WeeklyBuild[]; autoRotate: boolean; subscriptions?: Subscription[];
}) => {
  const cityRef = useRef<THREE.Group>(null);
  const { horizontalGreen, isYellow } = useTrafficLight();
  const activityLevel = health.score / 100;
  const numCars = Math.floor(2 + activityLevel * 4);
  const numPeople = Math.floor(4 + activityLevel * 8);
  const isLowScore = health.score < 40;

  useFrame((_, delta) => { if (cityRef.current && autoRotate) cityRef.current.rotation.y += delta * 0.04; });

  const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
  const maxSurplus = Math.max(health.monthlyIncome, 5000);

  // Organize data
  const assets = useMemo(() => accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type)), [accounts]);
  const debts = useMemo(() => accounts.filter(a => ['LOAN', 'CREDIT_CARD', 'HECS'].includes(a.type)), [accounts]);
  const maxBalance = useMemo(() => Math.max(...accounts.map(a => a.balance), 1), [accounts]);

  // COMPACT positions - tighter groupings for better mobile visibility
  // NW: Assets - 2x2 grid
  const assetPositions: [number, number, number][] = [
    [-4.0, 0.1, -4.0], [-2.8, 0.1, -4.0], 
    [-4.0, 0.1, -2.8], [-2.8, 0.1, -2.8]
  ];
  // NE: Debts - tight cluster
  const debtPositions: [number, number, number][] = [
    [4.0, 0.1, -4.0], [2.8, 0.1, -4.0], 
    [4.0, 0.1, -2.8]
  ];
  // SW: Launchpads - row formation
  const launchPositions: [number, number, number][] = [
    [-4.2, 0.1, 3.5], [-3.0, 0.1, 3.5], [-4.2, 0.1, 4.8]
  ];
  // Construction next to launchpads
  const constructionPositions: [number, number, number][] = [[-2.8, 0.1, 4.8]];

  // Traffic
  const directions: CarDirection[] = ['EAST', 'WEST', 'NORTH', 'SOUTH'];
  const pedPaths: PedestrianPath[] = ['QUADRANT_NW', 'QUADRANT_NE', 'QUADRANT_SW', 'QUADRANT_SE'];

  // Tree positions - denser for better visual fill
  const treePositions: [number, number, number][] = [
    // Corners
    [-5.5, 0.08, -5.5], [5.5, 0.08, -5.5], [-5.5, 0.08, 5.5], [5.5, 0.08, 5.5],
    // Edges
    [-5.5, 0.08, -2.0], [-5.5, 0.08, 2.0], [5.5, 0.08, -2.0], [5.5, 0.08, 2.0],
    [-2.0, 0.08, -5.5], [2.0, 0.08, -5.5], [-2.0, 0.08, 5.5], [2.0, 0.08, 5.5],
    // Fill corners inside quadrants
    [-5.0, 0.08, -1.8], [5.0, 0.08, -1.8], [-5.0, 0.08, 1.8], [5.0, 0.08, 1.8],
    [-1.8, 0.08, -5.0], [1.8, 0.08, -5.0], [-1.8, 0.08, 5.0], [1.8, 0.08, 5.0],
  ];

  const lampPositions: [number, number, number][] = [
    [-1.6, 0.08, 2.2], [1.6, 0.08, 2.2], [-1.6, 0.08, -2.2], [1.6, 0.08, -2.2],
    [2.2, 0.08, -1.6], [2.2, 0.08, 1.6], [-2.2, 0.08, -1.6], [-2.2, 0.08, 1.6],
  ];

  return (
    <group ref={cityRef}>
      {/* BASE */}
      <mesh position={[0, -0.15, 0]} receiveShadow><boxGeometry args={[14, 0.3, 14]} /><meshStandardMaterial color="#37474F" /></mesh>

      {/* QUADRANT GRASS - Each with distinct shade */}
      {/* NW - Assets (rich green) */}
      <mesh position={[-3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color="#7CB342" /></mesh>
      {/* NE - Debts (darker) */}
      <mesh position={[3.8, 0.05, -3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color={isLowScore ? '#8D6E63' : '#689F38'} /></mesh>
      {/* SW - Launchpad (vibrant) */}
      <mesh position={[-3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color="#8BC34A" /></mesh>
      {/* SE - Harbor (lighter) */}
      <mesh position={[3.8, 0.05, 3.8]} receiveShadow><boxGeometry args={[5, 0.1, 5]} /><meshStandardMaterial color="#81C784" /></mesh>

      {/* ROADS */}
      <mesh position={[-4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={COLORS.road} /></mesh>
      <mesh position={[4.5, 0.02, 0]} receiveShadow><boxGeometry args={[5, 0.04, 2.2]} /><meshStandardMaterial color={COLORS.road} /></mesh>
      <mesh position={[0, 0.02, -4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={COLORS.road} /></mesh>
      <mesh position={[0, 0.02, 4.5]} receiveShadow><boxGeometry args={[2.2, 0.04, 5]} /><meshStandardMaterial color={COLORS.road} /></mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow><boxGeometry args={[2.2, 0.04, 2.2]} /><meshStandardMaterial color={COLORS.road} /></mesh>

      {/* Road markings */}
      {[-5.5, -4.2, -2.9, 2.9, 4.2, 5.5].map((pos, i) => (
        <mesh key={`hm-${i}`} position={[pos, 0.05, 0]}><boxGeometry args={[0.5, 0.01, 0.06]} /><meshStandardMaterial color={COLORS.roadMarking} /></mesh>
      ))}
      {[-5.5, -4.2, -2.9, 2.9, 4.2, 5.5].map((pos, i) => (
        <mesh key={`vm-${i}`} position={[0, 0.05, pos]}><boxGeometry args={[0.06, 0.01, 0.5]} /><meshStandardMaterial color={COLORS.roadMarking} /></mesh>
      ))}

      {/* Crosswalks */}
      <Crosswalk position={[-1.9, 0, 0]} rotation={0} />
      <Crosswalk position={[1.9, 0, 0]} rotation={0} />
      <Crosswalk position={[0, 0, -1.9]} rotation={Math.PI / 2} />
      <Crosswalk position={[0, 0, 1.9]} rotation={Math.PI / 2} />

      {/* Sidewalks */}
      {[[-3.8, -3.8], [-3.8, 3.8], [3.8, -3.8], [3.8, 3.8]].map(([bx, bz], i) => (
        <group key={i}>
          <mesh position={[bx, 0.11, bz > 0 ? bz - 2.4 : bz + 2.4]} receiveShadow><boxGeometry args={[5.1, 0.08, 0.4]} /><meshStandardMaterial color={COLORS.sidewalk} /></mesh>
          <mesh position={[bx > 0 ? bx - 2.4 : bx + 2.4, 0.11, bz]} receiveShadow><boxGeometry args={[0.4, 0.08, 5.1]} /><meshStandardMaterial color={COLORS.sidewalk} /></mesh>
        </group>
      ))}

      {/* Traffic Lights */}
      <TrafficLight position={[-1.5, 0, -1.5]} rotation={Math.PI / 4} isGreen={horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[1.5, 0, -1.5]} rotation={-Math.PI / 4} isGreen={!horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[-1.5, 0, 1.5]} rotation={Math.PI * 3 / 4} isGreen={!horizontalGreen} isYellow={isYellow} />
      <TrafficLight position={[1.5, 0, 1.5]} rotation={-Math.PI * 3 / 4} isGreen={horizontalGreen} isYellow={isYellow} />

      {/* === CASHFLOW FOUNTAIN (CENTER) === */}
      <CashflowFountain surplus={monthlySurplus} maxSurplus={maxSurplus} />

      {/* === NW QUADRANT: ASSET BUILDINGS === */}
      {assets.slice(0, assetPositions.length).map((acc, i) => (
        <AssetBuilding
          key={acc.id}
          position={assetPositions[i]}
          height={Math.max(1.2, (acc.balance / maxBalance) * 4.0)}
          type={acc.type}
          balance={acc.balance}
          name={acc.name}
        />
      ))}

      {/* === NE QUADRANT: DEBT BUILDINGS === */}
      {debts.slice(0, debtPositions.length).map((acc, i) => (
        <DebtBuilding
          key={acc.id}
          position={debtPositions[i]}
          height={Math.max(1.0, (acc.balance / maxBalance) * 3.0)}
          type={acc.type}
          balance={acc.balance}
        />
      ))}

      {/* === SW QUADRANT: LAUNCHPADS (GOALS) === */}
      {goals.slice(0, launchPositions.length).map((goal, i) => (
        <LaunchPad key={goal.id} position={launchPositions[i]} goal={goal} />
      ))}

      {/* === SW QUADRANT: CONSTRUCTION (IMPULSE ITEMS) === */}
      {weeklyBuilds.slice(0, constructionPositions.length).map((build, i) => (
        <ConstructionSite key={build.id} position={constructionPositions[i]} progress={build.saved / build.target} name={build.name} />
      ))}

      {/* === SE QUADRANT: HARBOR === */}
      <HarborDock position={[3.5, 0.08, 3.8]} savings={health.savings} />

      {/* === SE QUADRANT: TAX VAULT === */}
      {health.taxVault > 0 && <TaxVault position={[4.8, 0.1, 2.8]} amount={health.taxVault} />}

      {/* Trees */}
      {treePositions.map((pos, i) => <Tree key={i} position={pos} scale={0.75 + (i % 3) * 0.15} />)}

      {/* Street Lamps */}
      {lampPositions.map((pos, i) => <StreetLamp key={i} position={pos} />)}

      {/* Cars */}
      {Array.from({ length: numCars }).map((_, i) => (
        <Car key={i} direction={directions[i % 4]} laneOffset={0.45} startPos={-6 + (i * 3) % 12} speed={0.025 + (i % 3) * 0.005} color={CAR_COLORS[i % CAR_COLORS.length]} horizontalGreen={horizontalGreen} />
      ))}

      {/* Pedestrians */}
      {Array.from({ length: numPeople }).map((_, i) => (
        <Person key={i} pedestrianPath={pedPaths[i % 4]} startProgress={(i * 0.22) % 1} speed={0.8 + (i % 3) * 0.2} color={PEOPLE_COLORS[i % PEOPLE_COLORS.length]} horizontalGreen={horizontalGreen} />
      ))}

      {/* Clouds */}
      <DriftingCloud initialPosition={[-8, 8, -6]} speed={0.15} scale={1.2} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[5, 9, -3]} speed={0.12} scale={0.9} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[-3, 7.5, 4]} speed={0.18} scale={1.0} isStorm={isLowScore} />
      <DriftingCloud initialPosition={[8, 8.5, 2]} speed={0.1} scale={1.3} isStorm={isLowScore} />
      {isLowScore && <>
        <DriftingCloud initialPosition={[0, 7, -8]} speed={0.2} scale={1.4} isStorm={true} />
        <DriftingCloud initialPosition={[-5, 8, 0]} speed={0.16} scale={1.2} isStorm={true} />
      </>}
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
  minimal?: boolean; // When true, hides all overlays for cleaner embedding
}

export const IsometricCity: React.FC<IsometricCityProps> = ({ onNavigate, accounts, health, goals, hasWeeds, isFuture, weeklyBuilds, subscriptions = [], minimal = false }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const isLowScore = health.score < 40;
  const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
  const totalSubCost = subscriptions.reduce((sum, s) => sum + (s.cycle === 'YEARLY' ? s.amount / 12 : s.cycle === 'WEEKLY' ? s.amount * 4 : s.amount), 0);

  const getSkyClass = () => {
    if (isFuture) return "bg-gradient-to-b from-indigo-900 to-purple-900";
    if (isLowScore) return "bg-gradient-to-b from-slate-500 to-slate-600";
    if (health.score > 70) return "bg-gradient-to-b from-sky-300 to-sky-400";
    return "bg-gradient-to-b from-sky-400 to-slate-400";
  };

  return (
    <div className={`w-full h-full ${minimal ? '' : 'h-[500px] md:h-[600px]'} ${getSkyClass()} relative rounded-2xl overflow-hidden`}>
      {/* Overlays - only show when not in minimal mode */}
      {!minimal && (
        <>
          {/* Header */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <h2 className="text-slate-800 font-black text-xl drop-shadow-md">{isFuture ? 'FUTURE CITY' : 'WEALTH CITY'}</h2>
            <p className="text-slate-700 text-xs font-bold">{accounts.length} accounts • {goals.length} goals</p>
          </div>

          {/* Score & Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold shadow ${health.score > 70 ? 'bg-green-500 text-white' : health.score > 40 ? 'bg-yellow-500 text-slate-800' : 'bg-red-500 text-white'}`}>
              Score: {health.score}
            </div>
            <button onClick={() => setAutoRotate(!autoRotate)} className={`px-2.5 py-1.5 rounded-full text-xs shadow cursor-pointer ${autoRotate ? 'bg-blue-500 text-white' : 'bg-white/80 text-slate-600'}`}>⟳</button>
          </div>

          {/* Cashflow Indicator */}
          <div className="absolute top-16 left-4 z-10 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow text-xs flex items-center gap-2">
            <span className={`font-bold ${monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlySurplus >= 0 ? '↑' : '↓'} ${Math.abs(monthlySurplus).toLocaleString()}/mo
            </span>
            {totalSubCost > 0 && <>
              <span className="text-slate-400">|</span>
              <span className="text-orange-600">💧 ${Math.round(totalSubCost)}/mo</span>
            </>}
          </div>

          {/* Goals Panel */}
          <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg max-w-[180px]">
            <p className="text-slate-500 text-xs font-semibold mb-1.5 flex justify-between">
              <span>🚀 MISSIONS</span>
              {hasWeeds && <span className="text-red-500 animate-pulse">🌿</span>}
            </p>
            {goals.length === 0 && <p className="text-[10px] text-slate-400">No active goals.</p>}
            {goals.slice(0, 3).map(g => {
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
          <div className="absolute bottom-4 left-4 z-10 bg-white/80 backdrop-blur rounded-lg p-2 shadow text-[10px] space-y-0.5">
            <div className="font-semibold text-slate-600 mb-1">QUADRANTS</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-yellow-400"></div> NW: Banks</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-red-400"></div> NE: Debts</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-400"></div> SW: Goals</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-cyan-400"></div> SE: Harbor</div>
          </div>
        </>
      )}

      <Canvas shadows dpr={[1, 2]}>
        {/* Increased zoom for better mobile visibility */}
        <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={62} near={-50} far={200} />
        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={0.5} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 3} />
        <ambientLight intensity={isFuture ? 0.4 : isLowScore ? 0.5 : 0.7} />
        <directionalLight position={[10, 20, 10]} intensity={isFuture ? 0.4 : isLowScore ? 0.6 : 0.8} castShadow shadow-mapSize={[1024, 1024]} />
        {isFuture && <pointLight position={[-5, 5, -5]} intensity={1} color="#bc13fe" distance={20} />}
        <CityScene accounts={accounts} health={health} goals={goals} weeklyBuilds={weeklyBuilds} autoRotate={false} subscriptions={subscriptions} />
      </Canvas>
    </div>
  );
};
