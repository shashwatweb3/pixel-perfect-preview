export type Building = {
  id: string;
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  color: string;
  accent: string;
  label: string;
  sublabel: string;
};

export type PlazaObstacle = {
  id: string;
  position: readonly [number, number, number];
  size: readonly [number, number, number];
};

export const PLAYER_START = { x: 0, y: 0, z: 7 };
export const PLAYER_RADIUS = 0.42;
export const PLAZA_BOUNDS = { minX: -21, maxX: 21, minZ: -17, maxZ: 17 };

export const BUILDINGS: Building[] = [
  {
    id: "builders",
    position: [-12.4, 2.7, -7.5],
    size: [7.04, 4.96, 4.12],
    color: "#4b3b69",
    accent: "#b7f36d",
    label: "VARA BUILDERS HUB",
    sublabel: "MAKE · TEST · SHIP",
  },
  {
    id: "labs",
    position: [12.1, 3.1, -7.4],
    size: [7.5, 6.2, 5.1],
    color: "#e47c52",
    accent: "#d9c5ff",
    label: "PROJECT LABS",
    sublabel: "BUILDER SHOWCASE",
  },
  {
    id: "pass-it-on",
    position: [12, 2.55, 9.2],
    size: [7.4, 5.1, 4.6],
    color: "#40334e",
    accent: "#ffb35c",
    label: "PASS IT ON",
    sublabel: "HELP MOVES FORWARD",
  },
  {
    id: "mumbai-room",
    position: [-12.3, 2.3, 9.4],
    size: [6.8, 4.6, 4.4],
    color: "#394c57",
    accent: "#b7f36d",
    label: "MUMBAI OFFSTAGE",
    sublabel: "COMMUNITY ROOM",
  },
  {
    id: "studio",
    position: [0, 2.35, -14],
    size: [6.4, 4.7, 3.4],
    color: "#665276",
    accent: "#ffc46b",
    label: "OPEN STUDIO",
    sublabel: "IDEAS IN PROGRESS",
  },
];

export const PLAZA_OBSTACLES: PlazaObstacle[] = [
  { id: "fountain", position: [0, 0.5, 0], size: [3.5, 1, 3.5] },
  { id: "planter-north", position: [0, 0.4, -4.8], size: [5.2, 0.8, 1] },
  { id: "planter-south", position: [0, 0.4, 4.8], size: [5.2, 0.8, 1] },
];

function escapeObstacle(x: number, z: number, obstacle: PlazaObstacle) {
  const [width, , depth] = obstacle.size;
  const [centerX, , centerZ] = obstacle.position;
  const minX = centerX - width / 2 - PLAYER_RADIUS;
  const maxX = centerX + width / 2 + PLAYER_RADIUS;
  const minZ = centerZ - depth / 2 - PLAYER_RADIUS;
  const maxZ = centerZ + depth / 2 + PLAYER_RADIUS;
  if (x <= minX || x >= maxX || z <= minZ || z >= maxZ) return { x, z };
  const options = [
    { distance: Math.abs(x - minX), x: minX, z },
    { distance: Math.abs(x - maxX), x: maxX, z },
    { distance: Math.abs(z - minZ), x, z: minZ },
    { distance: Math.abs(z - maxZ), x, z: maxZ },
  ];
  return options.sort((a, b) => a.distance - b.distance)[0] ?? { x, z };
}

export function resolvePlazaMovement(next: { x: number; z: number }) {
  let x = Math.min(
    PLAZA_BOUNDS.maxX - PLAYER_RADIUS,
    Math.max(PLAZA_BOUNDS.minX + PLAYER_RADIUS, next.x),
  );
  let z = Math.min(
    PLAZA_BOUNDS.maxZ - PLAYER_RADIUS,
    Math.max(PLAZA_BOUNDS.minZ + PLAYER_RADIUS, next.z),
  );
  const blockers: PlazaObstacle[] = [
    ...BUILDINGS.map(({ id, position, size }) => ({ id, position, size })),
    ...PLAZA_OBSTACLES,
  ];
  for (const obstacle of blockers) {
    const escaped = escapeObstacle(x, z, obstacle);
    x = escaped.x;
    z = escaped.z;
  }
  return { x, z };
}
