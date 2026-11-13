import { Html, PointerLockControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

import {
  BUILDINGS,
  PLAZA_BOUNDS,
  PLAZA_OBSTACLES,
  PLAYER_START,
  resolvePlazaMovement,
  type Building,
} from "./layout";
import { createOriginalWalkClip } from "./avatar-animation";
import type { PlayerState } from "@/world/offstage-state";

type MotionState = "idle" | "walk" | "run";
type WorldProps = {
  onNearbyChange: (nearby: boolean) => void;
  onInteract: () => void;
  onWorldPointerDown: () => void;
  onLocalMove: (update: { x: number; z: number; yaw: number; movement: MotionState }) => void;
  remoteIds: string[];
  getRemotePlayer: (id: string) => PlayerState | undefined;
};
const WorldContext = createContext<WorldProps | null>(null);
const NPC: readonly [number, number, number] = [-1.9, 0, 2.2];

const KENNEY_CHARACTER_ASSETS = {
  model: "/assets/offstage/kenney/character/characterMedium.fbx",
  idle: "/assets/offstage/kenney/character/idle.fbx",
  run: "/assets/offstage/kenney/character/run.fbx",
};

function AnimatedAvatar({
  motion,
  skin,
}: {
  motion?: MutableRefObject<MotionState>;
  skin: string;
}) {
  const model = useLoader(FBXLoader, KENNEY_CHARACTER_ASSETS.model);
  const idleSource = useLoader(FBXLoader, KENNEY_CHARACTER_ASSETS.idle);
  const runSource = useLoader(FBXLoader, KENNEY_CHARACTER_ASSETS.run);
  const skinMap = useLoader(THREE.TextureLoader, skin);
  const character = useMemo(() => cloneSkinned(model), [model]);
  const mixer = useMemo(() => new THREE.AnimationMixer(character), [character]);
  const walkClip = useMemo(() => createOriginalWalkClip(character), [character]);
  const actions = useMemo(
    () => ({
      idle: mixer.clipAction(
        idleSource.animations.find((clip) => clip.name.includes("Idle")) ??
          idleSource.animations[0]!,
      ),
      run: mixer.clipAction(
        runSource.animations.find((clip) => clip.name.includes("Run")) ?? runSource.animations[0]!,
      ),
      walk: mixer.clipAction(walkClip),
    }),
    [idleSource.animations, mixer, runSource.animations, walkClip],
  );
  const active = useRef<THREE.AnimationAction | null>(null);
  const lastState = useRef<MotionState | null>(null);
  useEffect(() => {
    skinMap.colorSpace = THREE.SRGBColorSpace;
    character.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({
        map: skinMap,
        roughness: 0.83,
        metalness: 0,
        flatShading: true,
      });
    });
    actions.idle.play();
    active.current = actions.idle;
    return () => mixer.stopAllAction();
  }, [actions, character, mixer, skinMap]);
  useFrame((_, delta) => {
    mixer.update(delta);
    const state = motion?.current ?? "idle";
    const next = state === "idle" ? actions.idle : state === "walk" ? actions.walk : actions.run;
    next.timeScale = state === "run" ? 1.05 : 1;
    if (lastState.current !== state) {
      next.reset().play();
      if (active.current && active.current !== next) active.current.crossFadeTo(next, 0.18, false);
      active.current = next;
      lastState.current = state;
    }
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.43, 16]} />
        <meshBasicMaterial color="#242031" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <primitive object={character} scale={0.005} rotation-y={Math.PI} />
    </group>
  );
}

function KenneyBuildersHub({ building }: { building: Building }) {
  const gltf = useLoader(GLTFLoader, "/assets/offstage/kenney/builders-hub/building-type-d.glb");
  const asset = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const [width, height, depth] = building.size;
  const [x, , z] = building.position;
  useEffect(() => {
    asset.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => (material.flatShading = true));
      } else {
        child.material.flatShading = true;
      }
    });
  }, [asset]);
  return (
    <RigidBody type="fixed" colliders={false} position={[x, 0, z]}>
      <CuboidCollider args={[width / 2, height / 2, depth / 2]} position={[0, height / 2, 0]} />
      <primitive object={asset} scale={4} />
      <group position={[0, 1.02, depth / 2 + 0.22]}>
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[4.7, 0.48, 0.2]} />
          <meshStandardMaterial color="#b7f36d" />
        </mesh>
        <Html position={[0, 0, 0.13]} center distanceFactor={14}>
          <div className="pointer-events-none w-40 select-none bg-[#2b2340]/90 px-2 py-1 text-center font-mono text-[9px] font-bold tracking-[0.14em] text-[#f3f8e8]">
            VARA BUILDERS HUB
          </div>
        </Html>
      </group>
      <Html position={[0, height + 0.7, depth / 2 + 0.12]} center distanceFactor={15}>
        <div className="pointer-events-none w-44 select-none border border-[#b7f36d]/60 bg-[#241d35]/90 px-2 py-1.5 text-center shadow-lg">
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-white">
            VARA BUILDERS HUB
          </p>
          <p className="mt-0.5 font-mono text-[7px] tracking-[0.16em] text-[#b7f36d]">
            MAKE · TEST · SHIP
          </p>
        </div>
      </Html>
    </RigidBody>
  );
}

function BuildingFacade({ building }: { building: Building }) {
  if (building.id === "builders") return <KenneyBuildersHub building={building} />;
  const [width, height, depth] = building.size;
  const [x, y, z] = building.position;
  const isHub = building.id === "builders";
  const isLabs = building.id === "labs";
  const isPass = building.id === "pass-it-on";
  const isMumbai = building.id === "mumbai-room";
  const isStudio = building.id === "studio";
  const windows = Array.from(
    { length: Math.max(2, Math.floor(width / 1.45)) },
    (_, index) => -width / 2 + 0.82 + index * 1.42,
  );
  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]}>
      <CuboidCollider args={[width / 2, height / 2, depth / 2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={building.color} roughness={0.78} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.36 - y, depth / 2 + 0.08]}>
        <boxGeometry args={[width + 0.2, 0.7, 0.16]} />
        <meshStandardMaterial color="#342b45" />
      </mesh>
      <mesh castShadow position={[0, height / 2 + 0.18, 0]}>
        <boxGeometry args={[width + 0.34, 0.34, depth + 0.34]} />
        <meshStandardMaterial color={building.accent} flatShading />
      </mesh>
      {isStudio ? (
        <group position={[0, height / 2 + 0.62, 0]}>
          <mesh castShadow rotation-y={Math.PI / 4}>
            <coneGeometry args={[width * 0.63, 1.52, 4]} />
            <meshStandardMaterial color="#312943" flatShading />
          </mesh>
          <mesh position={[0, 0.25, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[1.8, 1.1]} />
            <meshStandardMaterial color="#9dcfd2" emissive="#537790" emissiveIntensity={0.25} />
          </mesh>
        </group>
      ) : (
        <mesh castShadow position={[0, height / 2 + 0.48, 0]} rotation-y={isLabs ? 0 : 0.32}>
          <coneGeometry args={[Math.max(width, depth) * 0.58, isMumbai ? 0.72 : 1.14, 4]} />
          <meshStandardMaterial color={isPass ? "#5b4365" : "#332c48"} flatShading />
        </mesh>
      )}
      <mesh position={[0, 1.15 - y, depth / 2 + 0.12]} castShadow>
        <boxGeometry args={[1.12, 2.12, 0.14]} />
        <meshStandardMaterial color="#252335" />
      </mesh>
      <mesh position={[0, 1.18 - y, depth / 2 + 0.205]}>
        <boxGeometry args={[0.06, 1.9, 0.035]} />
        <meshStandardMaterial color={building.accent} />
      </mesh>
      <mesh position={[0, 2.38 - y, depth / 2 + 0.2]}>
        <boxGeometry args={[1.55, 0.12, 0.1]} />
        <meshStandardMaterial color={building.accent} />
      </mesh>
      <mesh position={[0, 0.18 - y, depth / 2 + 0.48]} castShadow>
        <boxGeometry args={[1.75, 0.22, 0.72]} />
        <meshStandardMaterial color="#d8c7b2" />
      </mesh>
      {windows.map((windowX) => (
        <group key={windowX} position={[windowX, 2.3 - y, depth / 2 + 0.045]}>
          <mesh>
            <boxGeometry args={[0.74, 0.94, 0.08]} />
            <meshStandardMaterial color="#b8dcdb" emissive="#314b64" emissiveIntensity={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <boxGeometry args={[0.06, 1.02, 0.03]} />
            <meshStandardMaterial color={building.accent} />
          </mesh>
          <mesh position={[0, 0, 0.057]}>
            <boxGeometry args={[0.84, 0.06, 0.03]} />
            <meshStandardMaterial color={building.accent} />
          </mesh>
        </group>
      ))}
      {windows.map((windowX) => (
        <group key={`upper-${windowX}`} position={[windowX, 3.75 - y, depth / 2 + 0.045]}>
          <mesh>
            <boxGeometry args={[0.64, 0.6, 0.08]} />
            <meshStandardMaterial color="#a7cccf" emissive="#314b64" emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[0, 0, 0.055]}>
            <boxGeometry args={[0.05, 0.72, 0.03]} />
            <meshStandardMaterial color="#f1d8a2" />
          </mesh>
        </group>
      ))}
      {[-width / 2 + 0.42, width / 2 - 0.42].map((edge) => (
        <mesh key={edge} position={[edge, height / 2 - 0.4, depth / 2 + 0.13]} castShadow>
          <boxGeometry args={[0.2, height - 0.65, 0.18]} />
          <meshStandardMaterial color={building.accent} />
        </mesh>
      ))}
      <mesh position={[0, 2.92 - y, depth / 2 + 0.4]} castShadow>
        <boxGeometry args={[Math.min(4.4, width - 1), 0.28, 0.65]} />
        <meshStandardMaterial color={isPass ? "#ffb35c" : "#f2d6a1"} />
      </mesh>
      {(isLabs || isPass || isHub) && (
        <group position={[0, 2.56 - y, depth / 2 + 0.76]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[Math.min(3.7, width - 1.2), 0.18, 0.95]} />
            <meshStandardMaterial color={isLabs ? "#d9c5ff" : building.accent} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 1.47, -0.5, 0]}>
              <boxGeometry args={[0.1, 1, 0.1]} />
              <meshStandardMaterial color="#322943" />
            </mesh>
          ))}
        </group>
      )}
      {isHub && (
        <group position={[-width / 2 - 0.18, 1.4 - y, depth / 2 - 0.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 2.7, 1.1]} />
            <meshStandardMaterial color="#b7f36d" />
          </mesh>
          <mesh position={[-0.13, 0.35, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[0.8, 0.55]} />
            <meshStandardMaterial color="#302743" />
          </mesh>
        </group>
      )}
      {isMumbai && (
        <group position={[width / 2 + 0.1, height / 2 - 0.5, -depth / 2 + 0.8]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 1.9, 1.4]} />
            <meshStandardMaterial color="#efac5c" />
          </mesh>
          <mesh position={[0.11, 0.1, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[1.12, 1.34]} />
            <meshStandardMaterial color="#2f5f70" />
          </mesh>
        </group>
      )}
      <Html position={[0, height / 2 + 0.94, depth / 2 + 0.08]} center distanceFactor={15}>
        <div className="pointer-events-none w-44 select-none border border-white/30 bg-[#241d35]/90 px-2 py-1.5 text-center shadow-lg">
          <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-white">
            {building.label}
          </p>
          <p
            className="mt-0.5 font-mono text-[7px] tracking-[0.16em]"
            style={{ color: building.accent }}
          >
            {building.sublabel}
          </p>
        </div>
      </Html>
    </RigidBody>
  );
}

function Tree({
  position,
  scale = 1,
}: {
  position: readonly [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.16, 0.23, 1.7, 6]} />
        <meshStandardMaterial color="#6c4b3a" flatShading />
      </mesh>
      <mesh castShadow position={[-0.28, 2.22, 0.03]} rotation-z={0.35}>
        <coneGeometry args={[0.72, 1.4, 7]} />
        <meshStandardMaterial color="#5b986b" flatShading />
      </mesh>
      <mesh castShadow position={[0.36, 2.34, -0.08]} rotation-z={-0.28}>
        <coneGeometry args={[0.78, 1.55, 7]} />
        <meshStandardMaterial color="#72ad70" flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.88, 0]}>
        <dodecahedronGeometry args={[0.74, 1]} />
        <meshStandardMaterial color="#8bc77b" flatShading />
      </mesh>
      <mesh castShadow position={[-0.5, 1.95, 0.15]}>
        <dodecahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial color="#79b776" flatShading />
      </mesh>
    </group>
  );
}
function Bench({
  position,
  rotation = 0,
}: {
  position: readonly [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <boxGeometry args={[1.7, 0.14, 0.42]} />
        <meshStandardMaterial color="#efac5c" />
      </mesh>
      <mesh castShadow position={[0, 0.87, 0.18]} rotation-x={-0.16}>
        <boxGeometry args={[1.7, 0.55, 0.1]} />
        <meshStandardMaterial color="#efac5c" />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} castShadow position={[x, 0.23, 0]}>
          <boxGeometry args={[0.11, 0.5, 0.32]} />
          <meshStandardMaterial color="#383047" />
        </mesh>
      ))}
    </group>
  );
}
function StreetLight({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.3, 8]} />
        <meshStandardMaterial color="#312941" />
      </mesh>
      <mesh castShadow position={[0, 3.18, 0]}>
        <sphereGeometry args={[0.25, 8, 6]} />
        <meshStandardMaterial color="#fff0bb" emissive="#ffcc75" emissiveIntensity={0.55} />
      </mesh>
      <mesh castShadow position={[0, 2.75, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.045, 0.82, 8]} />
        <meshStandardMaterial color="#312941" />
      </mesh>
      {[-0.43, 0.43].map((side) => (
        <mesh key={side} position={[side, 2.7, 0]} castShadow>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial color="#fff0bb" emissive="#ffcc75" emissiveIntensity={0.45} />
        </mesh>
      ))}
      <pointLight color="#ffc875" intensity={0.55} distance={7} position={[0, 3.15, 0]} />
    </group>
  );
}
function Planter({
  position,
  width = 2.2,
}: {
  position: readonly [number, number, number];
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[width, 0.7, 0.82]} />
        <meshStandardMaterial color="#51415d" />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[width - 0.16, 0.12, 0.64]} />
        <meshStandardMaterial color="#6e9e68" />
      </mesh>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} castShadow position={[x * (width / 2), 1, 0]}>
          <sphereGeometry args={[0.32, 6, 5]} />
          <meshStandardMaterial color="#91c16d" flatShading />
        </mesh>
      ))}
    </group>
  );
}
function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.rotation.z = clock.elapsedTime * 0.5;
  });
  return (
    <group>
      <mesh receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.35, 2.55, 0.22, 32]} />
        <meshStandardMaterial color="#cec4b9" />
      </mesh>
      <mesh ref={water} position={[0, 0.23, 0]}>
        <cylinderGeometry args={[1.85, 1.85, 0.12, 32]} />
        <meshStandardMaterial color="#5eb6c4" roughness={0.28} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[0, 0.69, 0]}>
        <cylinderGeometry args={[0.55, 0.8, 0.9, 12]} />
        <meshStandardMaterial color="#f4af5d" flatShading />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#d9c5ff" emissive="#c4a1ff" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#d8c7ff" intensity={1.1} distance={6} position={[0, 2.4, 0]} />
    </group>
  );
}

function CafeTable({ position }: { position: readonly [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 10]} />
        <meshStandardMaterial color="#f2d6a1" flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 0.86, 8]} />
        <meshStandardMaterial color="#3a304d" />
      </mesh>
      {[
        [-0.78, 0, 0],
        [0.78, 0, 0],
      ].map(([x, , z]) => (
        <group key={x} position={[x, 0, z]} rotation-y={x > 0 ? -Math.PI / 2 : Math.PI / 2}>
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[0.48, 0.12, 0.42]} />
            <meshStandardMaterial color="#ef8caf" />
          </mesh>
          <mesh castShadow position={[0, 0.72, 0.16]} rotation-x={-0.12}>
            <boxGeometry args={[0.48, 0.5, 0.1]} />
            <meshStandardMaterial color="#ef8caf" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TownFlag({
  position,
  color,
}: {
  position: readonly [number, number, number];
  color: string;
}) {
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 1.3) * 0.12;
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 3.4, 8]} />
        <meshStandardMaterial color="#352d45" />
      </mesh>
      <mesh ref={flag} position={[0.62, 2.65, 0]} rotation-y={0.06}>
        <planeGeometry args={[1.25, 0.72]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.46, 0]}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color="#f2d6a1" />
      </mesh>
    </group>
  );
}

function Npc() {
  const motion = useRef<MotionState>("idle");
  return (
    <group position={NPC}>
      <AnimatedAvatar motion={motion} skin="/assets/offstage/kenney/character/cyborgFemaleA.png" />
      <Html position={[0, 2.55, 0]} center distanceFactor={13}>
        <div className="pointer-events-none select-none whitespace-nowrap text-center">
          <p className="font-mono text-xs font-bold tracking-[0.12em] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
            AANYA SHAH
          </p>
          <p className="mt-1 font-mono text-[9px] tracking-[0.16em] text-[#b7f36d]">
            COMMUNITY GUIDE
          </p>
        </div>
      </Html>
    </group>
  );
}

function RemotePlayer({ id }: { id: string }) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef<MotionState>("idle");
  const target = useMemo(() => new THREE.Vector3(), []);
  const context = useContext(WorldContext);
  useFrame((_, delta) => {
    const player = context?.getRemotePlayer(id);
    if (!player || !group.current) return;
    target.set(player.x, PLAYER_START.y, player.z);
    group.current.position.lerp(target, 1 - Math.exp(-11 * delta));
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      player.yaw,
      1 - Math.exp(-12 * delta),
    );
    motion.current = player.movement;
  });
  const player = context?.getRemotePlayer(id);
  return (
    <group ref={group} position={[player?.x ?? 0, PLAYER_START.y, player?.z ?? 7]}>
      <AnimatedAvatar
        motion={motion}
        skin={
          id.charCodeAt(0) % 2 === 0
            ? "/assets/offstage/kenney/character/skaterFemaleA.png"
            : "/assets/offstage/kenney/character/cyborgFemaleA.png"
        }
      />
      <Html position={[0, 2.7, 0]} center distanceFactor={13}>
        <div
          data-testid={`remote-player-${id}`}
          className="pointer-events-none select-none whitespace-nowrap text-center"
        >
          <p className="font-mono text-xs font-bold tracking-[0.12em] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
            {player?.name ?? "BUILDER"}
          </p>
          <p className="mt-1 font-mono text-[9px] tracking-[0.16em] text-[#f7c3d8]">ONLINE</p>
        </div>
      </Html>
    </group>
  );
}
function RemotePlayers() {
  const context = useContext(WorldContext);
  return (
    <>
      {context?.remoteIds.map((id) => (
        <RemotePlayer key={id} id={id} />
      ))}
    </>
  );
}

function Player() {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const position = useRef({ ...PLAYER_START });
  const keys = useRef(new Set<string>());
  const motion = useRef<MotionState>("idle");
  const nearby = useRef(false);
  const wasMoving = useRef(false);
  const lastNetworkUpdate = useRef(0);
  const context = useContext(WorldContext);
  const { camera } = useThree();
  const scratch = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      move: new THREE.Vector3(),
      target: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );
  useEffect(() => {
    camera.position.set(0, 5.4, 12.8);
    camera.lookAt(0, 1.1, 5);
  }, [camera]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        keys.current.add(event.code);
        event.preventDefault();
      }
      if (event.code === "KeyE" && nearby.current) {
        event.preventDefault();
        context?.onInteract();
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [context]);
  useFrame((_, delta) => {
    const forwardInput = Number(keys.current.has("KeyW")) - Number(keys.current.has("KeyS"));
    const sideInput = Number(keys.current.has("KeyD")) - Number(keys.current.has("KeyA"));
    const active = forwardInput !== 0 || sideInput !== 0;
    const running = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight");
    motion.current = active ? (running ? "run" : "walk") : "idle";
    camera.getWorldDirection(scratch.forward).setY(0);
    if (scratch.forward.lengthSq() < 0.001) scratch.forward.set(0, 0, -1);
    scratch.forward.normalize();
    scratch.right.crossVectors(scratch.forward, scratch.up).normalize();
    scratch.move
      .copy(scratch.forward)
      .multiplyScalar(forwardInput)
      .addScaledVector(scratch.right, sideInput);
    let yaw = visual.current?.rotation.y ?? 0;
    if (active) {
      scratch.move.normalize();
      const next = resolvePlazaMovement({
        x: position.current.x + scratch.move.x * (running ? 7.7 : 4.15) * delta,
        z: position.current.z + scratch.move.z * (running ? 7.7 : 4.15) * delta,
      });
      position.current.x = next.x;
      position.current.z = next.z;
      body.current?.setNextKinematicTranslation(position.current);
      if (visual.current) {
        visual.current.rotation.y = THREE.MathUtils.lerp(
          visual.current.rotation.y,
          Math.atan2(scratch.move.x, scratch.move.z),
          1 - Math.exp(-15 * delta),
        );
        yaw = visual.current.rotation.y;
      }
    }
    const now = performance.now();
    if ((active && now - lastNetworkUpdate.current > 50) || active !== wasMoving.current) {
      context?.onLocalMove({
        x: position.current.x,
        z: position.current.z,
        yaw,
        movement: motion.current,
      });
      lastNetworkUpdate.current = now;
      wasMoving.current = active;
    }
    const isNearby = Math.hypot(position.current.x - NPC[0], position.current.z - NPC[2]) < 2.45;
    if (isNearby !== nearby.current) {
      nearby.current = isNearby;
      context?.onNearbyChange(isNearby);
    }
    scratch.target.set(position.current.x, 1.65, position.current.z);
    scratch.desired
      .copy(scratch.target)
      .addScaledVector(scratch.forward, -6.2)
      .addScaledVector(scratch.up, 3.5);
    const safeCamera = resolvePlazaMovement({ x: scratch.desired.x, z: scratch.desired.z });
    scratch.desired.x = safeCamera.x;
    scratch.desired.z = safeCamera.z;
    camera.position.lerp(scratch.desired, 1 - Math.exp(-7 * delta));
    camera.lookAt(scratch.target);
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[PLAYER_START.x, PLAYER_START.y, PLAYER_START.z]}
      enabledRotations={[false, false, false]}
    >
      <CuboidCollider args={[0.36, 0.95, 0.36]} position={[0, 0.95, 0]} />
      <group ref={visual}>
        <AnimatedAvatar motion={motion} skin="/assets/offstage/kenney/character/skaterMaleA.png" />
      </group>
    </RigidBody>
  );
}

const treePositions: readonly (readonly [number, number, number])[] = [
  [-19, 0, -13],
  [-16, 0, -2],
  [-19, 0, 6],
  [-18, 0, 14],
  [19, 0, -12],
  [18, 0, -2],
  [19, 0, 5],
  [18, 0, 14],
  [-7.5, 0, -13],
  [7.5, 0, -13],
  [-7.5, 0, 14],
  [7.5, 0, 14],
];
const roadDashes = Array.from({ length: 9 }, (_, index) => -15 + index * 3.8);
const crosswalkStripes = [-2.4, -1.2, 0, 1.2, 2.4];
function Town() {
  return (
    <>
      <color attach="background" args={["#8fc6dc"]} />
      <fog attach="fog" args={["#8fc6dc", 30, 72]} />
      <hemisphereLight args={["#d9ecff", "#354633", 2.1]} />
      <directionalLight
        castShadow
        position={[12, 20, 8]}
        intensity={2.7}
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-far={65}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <Physics gravity={[0, -18, 0]} colliders={false} interpolation={false}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[24, 0.25, 21]} position={[0, -0.25, 0]} />
          <mesh receiveShadow rotation-x={-Math.PI / 2}>
            <planeGeometry args={[48, 42]} />
            <meshStandardMaterial color="#6b9c69" roughness={1} />
          </mesh>
        </RigidBody>
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
          <planeGeometry args={[10.5, 37]} />
          <meshStandardMaterial color="#484359" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.017, 0]}>
          <planeGeometry args={[39, 8.5]} />
          <meshStandardMaterial color="#484359" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
          <circleGeometry args={[7.2, 48]} />
          <meshStandardMaterial color="#d8c7b2" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.032, 0]}>
          <ringGeometry args={[2.75, 2.93, 40]} />
          <meshStandardMaterial color="#7e6b92" roughness={0.85} />
        </mesh>
        {[-5.85, 5.85].map((x) => (
          <group key={x}>
            <mesh receiveShadow rotation-x={-Math.PI / 2} position={[x, 0.018, 0]}>
              <planeGeometry args={[1.15, 37]} />
              <meshStandardMaterial color="#ded1bd" roughness={0.92} />
            </mesh>
            <mesh castShadow position={[x + (x < 0 ? 0.48 : -0.48), 0.13, 0]}>
              <boxGeometry args={[0.16, 0.26, 37]} />
              <meshStandardMaterial color="#c0a994" />
            </mesh>
          </group>
        ))}
        {[-4.8, 4.8].map((z) => (
          <group key={z}>
            <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, 0.02, z]}>
              <planeGeometry args={[39, 1.18]} />
              <meshStandardMaterial color="#ded1bd" roughness={0.92} />
            </mesh>
            <mesh castShadow position={[0, 0.13, z + (z < 0 ? 0.5 : -0.5)]}>
              <boxGeometry args={[39, 0.26, 0.16]} />
              <meshStandardMaterial color="#c0a994" />
            </mesh>
          </group>
        ))}
        {roadDashes.map((z) => (
          <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.04, z]}>
            <planeGeometry args={[0.2, 1.42]} />
            <meshStandardMaterial color="#f4d77e" />
          </mesh>
        ))}
        {roadDashes.slice(0, 8).map((x) => (
          <mesh key={`h-${x}`} rotation-x={-Math.PI / 2} position={[x, 0.04, 0]}>
            <planeGeometry args={[1.42, 0.2]} />
            <meshStandardMaterial color="#f4d77e" />
          </mesh>
        ))}
        {crosswalkStripes.map((x) => (
          <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.045, -5.6]}>
            <planeGeometry args={[0.65, 1.25]} />
            <meshStandardMaterial color="#f8f3e7" />
          </mesh>
        ))}
        {BUILDINGS.map((building) => (
          <BuildingFacade key={building.id} building={building} />
        ))}
        {PLAZA_OBSTACLES.map((obstacle) => (
          <RigidBody key={obstacle.id} type="fixed" colliders={false} position={obstacle.position}>
            <CuboidCollider
              args={[obstacle.size[0] / 2, obstacle.size[1] / 2, obstacle.size[2] / 2]}
            />
          </RigidBody>
        ))}
        <Fountain />
        <Planter position={[0, 0, -4.8]} width={5.2} />
        <Planter position={[0, 0, 4.8]} width={5.2} />
        {treePositions.map((position, index) => (
          <Tree key={position.join("-")} position={position} scale={index % 3 === 0 ? 1.15 : 0.9} />
        ))}
        <Bench position={[-5.1, 0, 1.9]} rotation={0.35} />
        <Bench position={[5.1, 0, -1.9]} rotation={-2.8} />
        <Bench position={[-4.8, 0, -5.8]} rotation={-0.2} />
        <Bench position={[5.3, 0, 5.8]} rotation={Math.PI} />
        <CafeTable position={[-8.2, 0, 4.6]} />
        <CafeTable position={[8.4, 0, 4.6]} />
        <StreetLight position={[-4.4, 0, 3.2]} />
        <StreetLight position={[4.4, 0, -3.2]} />
        <StreetLight position={[-8.3, 0, -0.5]} />
        <StreetLight position={[8.3, 0, 0.5]} />
        <StreetLight position={[0, 0, -9.7]} />
        <TownFlag position={[-3.85, 0, -1.4]} color="#b7f36d" />
        <TownFlag position={[3.85, 0, 1.4]} color="#d9c5ff" />
        <TownFlag position={[10, 0, 4.8]} color="#ffb35c" />
        <TownFlag position={[-10, 0, 4.8]} color="#ef8caf" />
        <group position={[5.9, 0, -3.7]} rotation-y={-0.28}>
          <mesh castShadow position={[0, 1.2, 0]}>
            <boxGeometry args={[1.55, 2.2, 0.18]} />
            <meshStandardMaterial color="#2f2941" />
          </mesh>
          <mesh position={[0, 1.2, 0.11]}>
            <boxGeometry args={[1.25, 1.65, 0.03]} />
            <meshStandardMaterial color="#d9c5ff" emissive="#5f4a83" emissiveIntensity={0.3} />
          </mesh>
          <Html position={[0, 1.25, 0.15]} center distanceFactor={12}>
            <div className="w-20 text-center font-mono text-[7px] font-bold leading-relaxed tracking-[0.12em] text-[#312943]">
              VARA
              <br />
              PROJECT
              <br />
              WALL
            </div>
          </Html>
        </group>
        <group position={[-7.6, 0, -2.7]} rotation-y={0.2}>
          <mesh castShadow position={[0, 1.05, 0]}>
            <boxGeometry args={[2.6, 1.8, 0.2]} />
            <meshStandardMaterial color="#413753" />
          </mesh>
          <Html position={[0, 1.15, 0.13]} center distanceFactor={12}>
            <div className="w-28 border border-[#b7f36d]/60 bg-[#231d35]/90 px-2 py-2 text-center font-mono text-[8px] leading-relaxed tracking-[0.12em] text-[#e9f9d7]">
              TODAY AT OFFSTAGE
              <br />
              <span className="text-[#ffbc6c]">BUILD · SHARE · PASS IT ON</span>
            </div>
          </Html>
        </group>
        <Npc />
        <RemotePlayers />
        <Player />
      </Physics>
      <group position={[0, 5.2, -1.2]}>
        {[-4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5].map((x) => (
          <group key={x} position={[x, Math.abs(x) * 0.035, 0]}>
            <mesh>
              <sphereGeometry args={[0.1, 8, 6]} />
              <meshStandardMaterial
                color={x % 2 === 0 ? "#b7f36d" : "#ffb35c"}
                emissive={x % 2 === 0 ? "#5a9130" : "#a7502a"}
                emissiveIntensity={0.45}
              />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[-31, 9, -39]} rotation-z={0.4}>
        <coneGeometry args={[13, 19, 5]} />
        <meshStandardMaterial color="#7e91a6" flatShading />
      </mesh>
      <mesh position={[27, 8, -42]} rotation-z={-0.35}>
        <coneGeometry args={[15, 20, 5]} />
        <meshStandardMaterial color="#8096ab" flatShading />
      </mesh>
      <ambientLight intensity={0.25} />
    </>
  );
}
function SceneContext({ children, ...props }: WorldProps & { children: ReactNode }) {
  return <WorldContext.Provider value={props}>{children}</WorldContext.Provider>;
}
export function WorldExperience(props: WorldProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 5.4, 12.8], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerDown={props.onWorldPointerDown}
      aria-label="Interactive 3D OFFSTAGE town"
    >
      <Suspense fallback={null}>
        <SceneContext {...props}>
          <Town />
          <PointerLockControls makeDefault />
        </SceneContext>
      </Suspense>
    </Canvas>
  );
}
