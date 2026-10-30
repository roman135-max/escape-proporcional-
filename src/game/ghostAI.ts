import { soundManager } from '../audio/soundManager';
import { getCurrentRoomName, isSolidTile, MAP_COLS, MAP_ROWS, ROOMS, SCHOOL_DOORS, TILE_SIZE } from './schoolMap';

export interface Point {
  x: number;
  y: number;
}

export type GhostState = 'PATROL' | 'CHASE' | 'SEARCH';
export type GhostPersonality = 'CAZADOR' | 'EMBOSCADOR' | 'RASTREADOR' | 'MERODEADOR' | 'PATRULLERO';

export interface GhostConfig {
  id: string;
  name: string;
  personality: GhostPersonality;
  color: string;
  glowColor: string;
  spawnCol: number;
  spawnRow: number;
  homeCol: number;
  homeRow: number;
  patrolSpeed: number; // px/sec
  chaseSpeed: number;  // px/sec (80% - 92% of player's 180 speed)
  visionRangeTiles: number;
  patrolRoute: Point[];
}

export interface Ghost {
  id: string;
  name: string;
  personality: GhostPersonality;
  color: string;
  glowColor: string;
  x: number;
  y: number;
  radius: number;
  facingAngle: number;
  state: GhostState;
  patrolRoute: Point[];
  currentWaypointIdx: number;
  patrolSpeed: number;
  chaseSpeed: number;
  visionRangeTiles: number;
  hearingRadius: number;
  searchTimer: number;
  lastKnownPlayerPos: Point | null;
  homeCol: number;
  homeRow: number;
  bobPhase: number;
  wispTrail: { x: number; y: number; opacity: number }[];
  currentPathTarget: { col: number; row: number } | null;
  pathRecalcCooldown: number;

  // Anti-campeo y comportamientos diferenciados
  timeInArea: number;
  lastAreaAnchor: Point;
  currentRoomName: string;
  timeInRoom: number;
  chaseDuration: number;
  timeSinceLastSeen: number;
  wanderTimer: number;
  wanderTarget: Point | null;
  antiCampTarget: Point | null;
  burstChaseTimer: number;
}

// Requisito: Constante configurable fácil de cambiar
export const CANTIDAD_FANTASMAS = 5;

// Player reference speed is 180 px/s
// Ghost speeds: 80% (144) to 92% (165.6) of player speed
export const GHOST_CONFIGURATIONS: GhostConfig[] = [
  // 1. Cazador (Rojo)
  // Patrullas largas por todo el mapa; va directo al jugador si lo ve; si lo pierde busca 3s y se va lejos
  {
    id: 'ghost_cazador',
    name: 'Cazador (Espectro Rojo)',
    personality: 'CAZADOR',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.55)',
    spawnCol: 44,
    spawnRow: 4, // Laboratorio de Informática (lejos de spawn 25, 10)
    homeCol: 46,
    homeRow: 3,
    patrolSpeed: 86,
    chaseSpeed: 165, // 91.6% de 180
    visionRangeTiles: 6,
    patrolRoute: [
      { x: 44 * TILE_SIZE, y: 4 * TILE_SIZE },  // Informática
      { x: 28 * TILE_SIZE, y: 4 * TILE_SIZE },  // Aula 102 Ciencias
      { x: 17 * TILE_SIZE, y: 4 * TILE_SIZE },  // Baños
      { x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },   // Aula 101 Matemáticas
      { x: 6 * TILE_SIZE, y: 15 * TILE_SIZE },  // Biblioteca
      { x: 27 * TILE_SIZE, y: 15 * TILE_SIZE }, // Patio Interior
      { x: 44 * TILE_SIZE, y: 15 * TILE_SIZE }  // Cafetería
    ]
  },

  // 2. Emboscador (Rosa)
  // Calcula a qué puerta o pasillo se dirige el jugador y se adelanta para cortarle la salida
  {
    id: 'ghost_emboscador',
    name: 'Emboscador (Espectro Rosa)',
    personality: 'EMBOSCADOR',
    color: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.55)',
    spawnCol: 6,
    spawnRow: 4, // Aula 101 Matemáticas (lejos de spawn 25, 10)
    homeCol: 3,
    homeRow: 3,
    patrolSpeed: 84,
    chaseSpeed: 158, // 87.7% de 180
    visionRangeTiles: 6,
    patrolRoute: [
      { x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },   // Aula 101
      { x: 14 * TILE_SIZE, y: 15 * TILE_SIZE }, // Pasillo Vertical Oeste
      { x: 18 * TILE_SIZE, y: 15 * TILE_SIZE }, // Aula de Arte
      { x: 27 * TILE_SIZE, y: 15 * TILE_SIZE }, // Patio Interior
      { x: 35 * TILE_SIZE, y: 15 * TILE_SIZE }  // Dirección
    ]
  },

  // 3. Rastreador (Cian)
  // Sigue el rastro de casillas por las que pasó el jugador en los últimos 10 s, más lento pero constante
  {
    id: 'ghost_rastreador',
    name: 'Rastreador (Espectro Cian)',
    personality: 'RASTREADOR',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    spawnCol: 17,
    spawnRow: 4, // Baños (lejos de spawn)
    homeCol: 15,
    homeRow: 3,
    patrolSpeed: 80,
    chaseSpeed: 146, // 81.1% de 180
    visionRangeTiles: 6,
    patrolRoute: [
      { x: 17 * TILE_SIZE, y: 4 * TILE_SIZE },  // Baños
      { x: 25 * TILE_SIZE, y: 10 * TILE_SIZE }, // Pasillo Norte
      { x: 44 * TILE_SIZE, y: 15 * TILE_SIZE }, // Cafetería
      { x: 35 * TILE_SIZE, y: 15 * TILE_SIZE }, // Dirección
      { x: 18 * TILE_SIZE, y: 15 * TILE_SIZE }  // Arte
    ]
  },

  // 4. Merodeador (Naranja)
  // Va de sala en sala eligiendo destinos al azar (cada 6-10 s); solo persigue si el jugador cruza a < 4 casillas
  {
    id: 'ghost_merodeador',
    name: 'Merodeador (Espectro Naranja)',
    personality: 'MERODEADOR',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.55)',
    spawnCol: 8,
    spawnRow: 26, // Enfermería (sur-oeste, lejos de spawn)
    homeCol: 3,
    homeRow: 27,
    patrolSpeed: 82,
    chaseSpeed: 152, // 84.4% de 180
    visionRangeTiles: 4, // Requisito: solo persigue si cruza a < 4 casillas
    patrolRoute: [
      { x: 8 * TILE_SIZE, y: 26 * TILE_SIZE },  // Enfermería
      { x: 17 * TILE_SIZE, y: 26 * TILE_SIZE }, // Sala de Música
      { x: 18 * TILE_SIZE, y: 15 * TILE_SIZE }, // Arte
      { x: 27 * TILE_SIZE, y: 15 * TILE_SIZE }, // Patio
      { x: 6 * TILE_SIZE, y: 15 * TILE_SIZE }   // Biblioteca
    ]
  },

  // 5. Patrullero (Púrpura)
  // Recorre todas las salas en orden siguiendo un circuito fijo continuo; persecución corta si lo ve de frente
  {
    id: 'ghost_patrullero',
    name: 'Patrullero (Espectro Púrpura)',
    personality: 'PATRULLERO',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    spawnCol: 45,
    spawnRow: 26, // Sótano / Calderas (sur-este, lejos de spawn)
    homeCol: 45,
    homeRow: 26,
    patrolSpeed: 85,
    chaseSpeed: 160, // 88.8% de 180
    visionRangeTiles: 6,
    patrolRoute: [
      { x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },   // Aula 101
      { x: 17 * TILE_SIZE, y: 4 * TILE_SIZE },  // Baños
      { x: 28 * TILE_SIZE, y: 4 * TILE_SIZE },  // Aula 102
      { x: 44 * TILE_SIZE, y: 4 * TILE_SIZE },  // Informática
      { x: 44 * TILE_SIZE, y: 15 * TILE_SIZE }, // Cafetería
      { x: 35 * TILE_SIZE, y: 15 * TILE_SIZE }, // Dirección
      { x: 27 * TILE_SIZE, y: 15 * TILE_SIZE }, // Patio
      { x: 18 * TILE_SIZE, y: 15 * TILE_SIZE }, // Arte
      { x: 6 * TILE_SIZE, y: 15 * TILE_SIZE },  // Biblioteca
      { x: 6 * TILE_SIZE, y: 26 * TILE_SIZE },  // Enfermería
      { x: 17 * TILE_SIZE, y: 26 * TILE_SIZE }, // Música
      { x: 35 * TILE_SIZE, y: 26 * TILE_SIZE }, // Gimnasio
      { x: 45 * TILE_SIZE, y: 26 * TILE_SIZE }  // Calderas
    ]
  }
];

// Registro de migajas del jugador durante los últimos 10 segundos (para Rastreador)
export interface Breadcrumb {
  x: number;
  y: number;
  col: number;
  row: number;
  timestamp: number;
}
let playerBreadcrumbs: Breadcrumb[] = [];

// Enfriamiento de 20s para la sala donde el jugador se escondió en un armario
let hiddenRoomCooldown: { roomName: string; expiresAt: number } | null = null;

export function resetGhostTracking() {
  playerBreadcrumbs = [];
  hiddenRoomCooldown = null;
}

export function createGhosts(count: number = CANTIDAD_FANTASMAS): Ghost[] {
  resetGhostTracking();
  const activeConfigs = GHOST_CONFIGURATIONS.slice(0, Math.max(1, count));

  return activeConfigs.map((cfg) => ({
    id: cfg.id,
    name: cfg.name,
    personality: cfg.personality,
    color: cfg.color,
    glowColor: cfg.glowColor,
    x: cfg.spawnCol * TILE_SIZE + TILE_SIZE / 2,
    y: cfg.spawnRow * TILE_SIZE + TILE_SIZE / 2,
    radius: 22,
    facingAngle: 0,
    state: 'PATROL',
    patrolRoute: cfg.patrolRoute,
    currentWaypointIdx: 0,
    patrolSpeed: cfg.patrolSpeed,
    chaseSpeed: cfg.chaseSpeed,
    visionRangeTiles: cfg.visionRangeTiles,
    hearingRadius: 75,
    searchTimer: 0,
    lastKnownPlayerPos: null,
    homeCol: cfg.homeCol,
    homeRow: cfg.homeRow,
    bobPhase: Math.random() * Math.PI * 2,
    wispTrail: [],
    currentPathTarget: null,
    pathRecalcCooldown: 0,

    timeInArea: 0,
    lastAreaAnchor: { x: cfg.spawnCol * TILE_SIZE, y: cfg.spawnRow * TILE_SIZE },
    currentRoomName: '',
    timeInRoom: 0,
    chaseDuration: 0,
    timeSinceLastSeen: 0,
    wanderTimer: 6 + Math.random() * 4,
    wanderTarget: null,
    antiCampTarget: null,
    burstChaseTimer: 0
  }));
}

// Raycast check for line of sight through walls and solid obstacles
export function hasLineOfSight(x1: number, y1: number, x2: number, y2: number, tiles: number[][]): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(2, Math.ceil(distance / 18));

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const checkX = x1 + dx * t;
    const checkY = y1 + dy * t;
    const col = Math.floor(checkX / TILE_SIZE);
    const row = Math.floor(checkY / TILE_SIZE);

    if (row >= 0 && row < tiles.length && col >= 0 && col < tiles[0].length) {
      if (isSolidTile(tiles[row][col])) {
        return false;
      }
    }
  }
  return true;
}

/**
 * REGLA ANTI-CAMPEO:
 * La puerta de salida y el Pasillo Principal Sur NO pueden ser destino de patrulla ni zona de espera.
 */
export function isForbiddenPatrolTarget(col: number, row: number): boolean {
  // Pasillo Principal Sur: filas 20..23
  if (row >= 20 && row <= 23) return true;
  // Puerta de Salida en pasillo sur: cols 24..26 filas 21..24
  if (col >= 23 && col <= 27 && row >= 21 && row <= 24) return true;

  // Sala actualmente en enfriamiento por jugador escondido
  if (hiddenRoomCooldown) {
    const tileX = (col + 0.5) * TILE_SIZE;
    const tileY = (row + 0.5) * TILE_SIZE;
    const rName = getCurrentRoomName(tileX, tileY);
    if (rName === hiddenRoomCooldown.roomName) return true;
  }

  return false;
}

/**
 * Busca una sala lejana (>= 12 casillas de distancia) válida para romper campeo o terminar búsqueda.
 */
export function findDistantPatrolSpot(
  currentX: number,
  currentY: number,
  tiles: number[][]
): Point {
  const currentTileCol = Math.floor(currentX / TILE_SIZE);
  const currentTileRow = Math.floor(currentY / TILE_SIZE);

  const candidateRooms = ROOMS.filter((room) => {
    if (room.name === 'Pasillo Principal Sur') return false;
    if (hiddenRoomCooldown && room.name === hiddenRoomCooldown.roomName) return false;
    const midC = Math.floor((room.x1 + room.x2) / 2);
    const midR = Math.floor((room.y1 + room.y2) / 2);
    return Math.hypot(midC - currentTileCol, midR - currentTileRow) >= 12;
  });

  const selectedRoom = candidateRooms.length > 0
    ? candidateRooms[Math.floor(Math.random() * candidateRooms.length)]
    : ROOMS[0];

  const targetC = Math.floor((selectedRoom.x1 + selectedRoom.x2) / 2);
  const targetR = Math.floor((selectedRoom.y1 + selectedRoom.y2) / 2);

  // Asegurar que la casilla destino no sea sólida
  if (!isSolidTile(tiles[targetR][targetC])) {
    return { x: targetC * TILE_SIZE + TILE_SIZE / 2, y: targetR * TILE_SIZE + TILE_SIZE / 2 };
  }

  // Buscar casilla libre dentro de la sala
  for (let r = selectedRoom.y1; r <= selectedRoom.y2; r++) {
    for (let c = selectedRoom.x1; c <= selectedRoom.x2; c++) {
      if (!isSolidTile(tiles[r][c])) {
        return { x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2 };
      }
    }
  }

  return { x: 25 * TILE_SIZE, y: 10 * TILE_SIZE }; // Pasillo Norte como respaldo seguro
}

/**
 * Grid-based BFS pathfinder: encuentra la siguiente casilla a la que avanzar
 * para llegar desde (startCol, startRow) hasta (targetCol, targetRow).
 */
export function findNextStepBFS(
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number,
  tiles: number[][]
): { col: number; row: number } {
  if (startCol === targetCol && startRow === targetRow) {
    return { col: startCol, row: startRow };
  }

  const tCol = Math.max(1, Math.min(MAP_COLS - 2, targetCol));
  const tRow = Math.max(1, Math.min(MAP_ROWS - 2, targetRow));

  let goalCol = tCol;
  let goalRow = tRow;
  if (isSolidTile(tiles[goalRow][goalCol])) {
    let found = false;
    for (let r = 1; r <= 3 && !found; r++) {
      const candidates = [
        { c: tCol, r: tRow - r },
        { c: tCol, r: tRow + r },
        { c: tCol - r, r: tRow },
        { c: tCol + r, r: tRow }
      ];
      for (const cand of candidates) {
        if (
          cand.c >= 1 &&
          cand.c < MAP_COLS - 1 &&
          cand.r >= 1 &&
          cand.r < MAP_ROWS - 1 &&
          !isSolidTile(tiles[cand.r][cand.c])
        ) {
          goalCol = cand.c;
          goalRow = cand.r;
          found = true;
          break;
        }
      }
    }
    if (!found) {
      return { col: startCol, row: startRow };
    }
  }

  const dCols = [0, 1, 0, -1];
  const dRows = [-1, 0, 1, 0];

  const visited: boolean[][] = Array(MAP_ROWS).fill(false).map(() => Array(MAP_COLS).fill(false));
  const parentMap: Map<number, number> = new Map();

  const startKey = startRow * MAP_COLS + startCol;
  const goalKey = goalRow * MAP_COLS + goalCol;

  visited[startRow][startCol] = true;
  const queue: [number, number][] = [[startCol, startRow]];

  let reached = false;
  let maxExpansions = 650;

  while (queue.length > 0 && maxExpansions-- > 0) {
    const [currCol, currRow] = queue.shift()!;
    const currKey = currRow * MAP_COLS + currCol;

    if (currKey === goalKey) {
      reached = true;
      break;
    }

    for (let i = 0; i < 4; i++) {
      const nextCol = currCol + dCols[i];
      const nextRow = currRow + dRows[i];

      if (
        nextCol >= 1 &&
        nextCol < MAP_COLS - 1 &&
        nextRow >= 1 &&
        nextRow < MAP_ROWS - 1 &&
        !visited[nextRow][nextCol] &&
        !isSolidTile(tiles[nextRow][nextCol])
      ) {
        visited[nextRow][nextCol] = true;
        const nextKey = nextRow * MAP_COLS + nextCol;
        parentMap.set(nextKey, currKey);
        queue.push([nextCol, nextRow]);
      }
    }
  }

  let endKey = goalKey;
  if (!reached) {
    let closestKey = startKey;
    let minDist = Infinity;
    for (let r = 1; r < MAP_ROWS - 1; r++) {
      for (let c = 1; c < MAP_COLS - 1; c++) {
        if (visited[r][c]) {
          const d = Math.hypot(c - goalCol, r - goalRow);
          if (d < minDist) {
            minDist = d;
            closestKey = r * MAP_COLS + c;
          }
        }
      }
    }
    endKey = closestKey;
  }

  let curr = endKey;
  let prev = curr;
  while (curr !== startKey) {
    prev = curr;
    const parent = parentMap.get(curr);
    if (parent === undefined) break;
    curr = parent;
  }

  const stepRow = Math.floor(prev / MAP_COLS);
  const stepCol = prev % MAP_COLS;
  return { col: stepCol, row: stepRow };
}

export function updateGhosts(
  ghosts: Ghost[],
  playerX: number,
  playerY: number,
  playerAngle: number,
  isPlayerMoving: boolean,
  isPlayerHidden: boolean,
  tiles: number[][],
  dt: number,
  onPlayerCaught: () => void,
  isInvulnerable: boolean = false
): boolean {
  const now = performance.now() * 0.001;
  let minGhostDist = Infinity;
  let isAnyGhostChasing = false;

  const playerCol = Math.floor(playerX / TILE_SIZE);
  const playerRow = Math.floor(playerY / TILE_SIZE);
  const playerRoomName = getCurrentRoomName(playerX, playerY);

  // Actualizar enfriamiento de la sala donde el jugador se escondió (20s)
  if (isPlayerHidden) {
    if (!hiddenRoomCooldown || hiddenRoomCooldown.roomName !== playerRoomName) {
      hiddenRoomCooldown = { roomName: playerRoomName, expiresAt: now + 20.0 };
    }
  } else if (hiddenRoomCooldown && now > hiddenRoomCooldown.expiresAt) {
    hiddenRoomCooldown = null;
  }

  // Actualizar rastro de migajas (últimos 10 segundos para Rastreador)
  if (!isPlayerHidden) {
    if (
      playerBreadcrumbs.length === 0 ||
      Math.hypot(playerX - playerBreadcrumbs[playerBreadcrumbs.length - 1].x, playerY - playerBreadcrumbs[playerBreadcrumbs.length - 1].y) > 20
    ) {
      playerBreadcrumbs.push({
        x: playerX,
        y: playerY,
        col: playerCol,
        row: playerRow,
        timestamp: now
      });
    }
  }
  playerBreadcrumbs = playerBreadcrumbs.filter((b) => now - b.timestamp <= 10.0);

  // Contar cuántos fantasmas ya están en persecución activa (máximo 2 persiguiendo al mismo tiempo)
  let activeChasersCount = ghosts.filter((g) => g.state === 'CHASE').length;

  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    ghost.bobPhase += dt * 3.5;
    ghost.pathRecalcCooldown -= dt;

    // Estela de partículas espectrales
    ghost.wispTrail = ghost.wispTrail
      .map((w) => ({ ...w, opacity: w.opacity - dt * 2.2 }))
      .filter((w) => w.opacity > 0);

    if (Math.random() < 0.35) {
      ghost.wispTrail.push({
        x: ghost.x + (Math.random() - 0.5) * 10,
        y: ghost.y + (Math.random() - 0.5) * 10,
        opacity: 0.6
      });
    }

    const distToPlayer = Math.hypot(playerX - ghost.x, playerY - ghost.y);
    if (!isPlayerHidden && distToPlayer < minGhostDist) {
      minGhostDist = distToPlayer;
    }

    // Regla de captura: radio check (solo si NO está escondido y NO es invulnerable)
    if (!isPlayerHidden && !isInvulnerable && distToPlayer < ghost.radius + 16) {
      onPlayerCaught();
      return true;
    }

    // Comprobación de detección según la personalidad del fantasma
    const maxVisionDist = ghost.visionRangeTiles * TILE_SIZE;
    let detectedPlayer = false;

    if (!isPlayerHidden) {
      const inLineOfSight = distToPlayer <= maxVisionDist && hasLineOfSight(ghost.x, ghost.y, playerX, playerY, tiles);

      if (ghost.personality === 'MERODEADOR') {
        // Merodeador: solo persigue si el jugador se cruza a menos de 4 casillas en su línea de visión
        if (distToPlayer <= 4 * TILE_SIZE && inLineOfSight) {
          detectedPlayer = true;
        }
      } else if (ghost.personality === 'PATRULLERO') {
        // Patrullero: persecución corta si lo ve de frente (dentro de 60 grados de su ángulo de visión)
        if (inLineOfSight) {
          const angleToPlayer = Math.atan2(playerY - ghost.y, playerX - ghost.x);
          let diffAngle = Math.abs(ghost.facingAngle - angleToPlayer);
          while (diffAngle > Math.PI) diffAngle = Math.abs(diffAngle - Math.PI * 2);
          if (diffAngle <= Math.PI / 3) {
            detectedPlayer = true;
          }
        }
      } else {
        // Cazador, Emboscador, Rastreador: visión completa ~6 casillas o sonido cercano
        if (inLineOfSight) {
          detectedPlayer = true;
        } else if (isPlayerMoving && distToPlayer <= ghost.hearingRadius) {
          detectedPlayer = true;
        }
      }
    }

    // SI EL JUGADOR SE ESCONDE EN UN ARMARIO:
    // El fantasma que lo perseguía busca como máximo 3 s y luego se aleja hacia otra sala lejana
    if (isPlayerHidden) {
      if (ghost.state === 'CHASE') {
        ghost.state = 'SEARCH';
        ghost.searchTimer = 3.0; // Máximo 3s de búsqueda
      } else if (ghost.state === 'SEARCH') {
        ghost.searchTimer = Math.min(ghost.searchTimer, 3.0);
      }
    }

    // GESTIÓN DE PERSECUCIÓN Y LÍMITE DE 2 FANTASMAS SIMULTÁNEOS
    if (detectedPlayer && !isPlayerHidden) {
      if (ghost.state === 'CHASE') {
        ghost.timeSinceLastSeen = 0;
        ghost.lastKnownPlayerPos = { x: playerX, y: playerY };
        ghost.chaseDuration += dt;

        // TIEMPO MÁXIMO DE PERSECUCIÓN CONTINUA: 12 s
        if (ghost.chaseDuration >= 12.0) {
          ghost.state = 'SEARCH';
          ghost.searchTimer = 3.0;
          ghost.chaseDuration = 0;
          ghost.antiCampTarget = findDistantPatrolSpot(ghost.x, ghost.y, tiles);
        }

        // Persecución corta para Patrullero (máximo 4.5 segundos)
        if (ghost.personality === 'PATRULLERO') {
          ghost.burstChaseTimer += dt;
          if (ghost.burstChaseTimer >= 4.5) {
            ghost.state = 'PATROL';
            ghost.burstChaseTimer = 0;
          }
        }
      } else {
        // Intentar iniciar persecución: solo si hay menos de 2 fantasmas persiguiendo
        if (activeChasersCount < 2) {
          soundManager.playGhostSpotted();
          ghost.state = 'CHASE';
          activeChasersCount++;
          ghost.chaseDuration = 0;
          ghost.timeSinceLastSeen = 0;
          ghost.burstChaseTimer = 0;
          ghost.lastKnownPlayerPos = { x: playerX, y: playerY };
          ghost.antiCampTarget = null;
        }
      }
    } else if (ghost.state === 'CHASE') {
      ghost.timeSinceLastSeen += dt;
      ghost.chaseDuration += dt;

      // Si pasaron 4 s sin verlo o persecución >= 12s: busca 3s y vuelve a patrullar
      if (ghost.timeSinceLastSeen >= 4.0 || ghost.chaseDuration >= 12.0) {
        ghost.state = 'SEARCH';
        ghost.searchTimer = 3.0;
        ghost.chaseDuration = 0;
        ghost.timeSinceLastSeen = 0;
        ghost.antiCampTarget = findDistantPatrolSpot(ghost.x, ghost.y, tiles);
      }
    }

    if (ghost.state === 'CHASE') {
      isAnyGhostChasing = true;
    }

    // ANTI-CAMPEO:
    // Ningún fantasma puede quedarse quieto ni patrullar en la misma zona (radio de 4 casillas)
    // por más de 10 s, ni permanecer en la misma sala más de 15 s sin estar persiguiendo.
    if (ghost.state !== 'CHASE') {
      const distFromAnchor = Math.hypot(ghost.x - ghost.lastAreaAnchor.x, ghost.y - ghost.lastAreaAnchor.y);
      if (distFromAnchor < 4 * TILE_SIZE) {
        ghost.timeInArea += dt;
      } else {
        ghost.lastAreaAnchor = { x: ghost.x, y: ghost.y };
        ghost.timeInArea = 0;
      }

      const ghostRoom = getCurrentRoomName(ghost.x, ghost.y);
      if (ghostRoom === ghost.currentRoomName) {
        ghost.timeInRoom += dt;
      } else {
        ghost.currentRoomName = ghostRoom;
        ghost.timeInRoom = 0;
      }

      if (ghost.timeInArea > 10.0 || ghost.timeInRoom > 15.0) {
        // Redirigir a una sala distinta a al menos 12 casillas de distancia
        ghost.antiCampTarget = findDistantPatrolSpot(ghost.x, ghost.y, tiles);
        ghost.timeInArea = 0;
        ghost.timeInRoom = 0;
        ghost.state = 'PATROL';
      }
    }

    // DETERMINACIÓN DEL OBJETIVO EN CUADRÍCULA SEGÚN PERSONALIDAD Y ANTI-CAMPEO
    const ghostCol = Math.floor(ghost.x / TILE_SIZE);
    const ghostRow = Math.floor(ghost.y / TILE_SIZE);

    let targetTileCol = ghostCol;
    let targetTileRow = ghostRow;
    let speed = ghost.patrolSpeed;

    if (ghost.state === 'CHASE') {
      speed = ghost.chaseSpeed;

      switch (ghost.personality) {
        case 'CAZADOR': {
          // a) Cazador: va directo al jugador
          targetTileCol = playerCol;
          targetTileRow = playerRow;
          break;
        }

        case 'EMBOSCADOR': {
          // b) Emboscador: calcula a qué puerta o pasillo se dirige el jugador y se adelanta
          // Proyecta 5 casillas en la dirección de movimiento del jugador
          const lookahead = 5;
          const projX = playerX + Math.cos(playerAngle) * lookahead * TILE_SIZE;
          const projY = playerY + Math.sin(playerAngle) * lookahead * TILE_SIZE;

          // Buscar la puerta de la sala hacia la que se dirige el jugador
          let bestDoorTarget: Point | null = null;
          let bestDist = Infinity;
          for (const door of SCHOOL_DOORS) {
            const doorCenterX = (door.c1 + door.c2 + 1) * 0.5 * TILE_SIZE;
            const doorCenterY = (door.r1 + door.r2 + 1) * 0.5 * TILE_SIZE;
            const d = Math.hypot(projX - doorCenterX, projY - doorCenterY);
            if (d < bestDist) {
              bestDist = d;
              bestDoorTarget = { x: doorCenterX, y: doorCenterY };
            }
          }

          if (bestDoorTarget && bestDist < 8 * TILE_SIZE) {
            targetTileCol = Math.floor(bestDoorTarget.x / TILE_SIZE);
            targetTileRow = Math.floor(bestDoorTarget.y / TILE_SIZE);
          } else {
            targetTileCol = Math.max(1, Math.min(MAP_COLS - 2, Math.floor(projX / TILE_SIZE)));
            targetTileRow = Math.max(1, Math.min(MAP_ROWS - 2, Math.floor(projY / TILE_SIZE)));
          }
          break;
        }

        case 'RASTREADOR': {
          // c) Rastreador: sigue el rastro de casillas por las que pasó el jugador en los últimos 10 s
          // Sigue las migajas de forma constante (no va en línea recta)
          if (playerBreadcrumbs.length > 0) {
            // Encontrar la migaja más antigua por delante del fantasma
            let chosenCrumb = playerBreadcrumbs[0];
            for (let b = 0; b < playerBreadcrumbs.length; b++) {
              const crumb = playerBreadcrumbs[b];
              const d = Math.hypot(crumb.x - ghost.x, crumb.y - ghost.y);
              if (d > 35) {
                chosenCrumb = crumb;
                break;
              }
            }
            targetTileCol = chosenCrumb.col;
            targetTileRow = chosenCrumb.row;
          } else {
            targetTileCol = playerCol;
            targetTileRow = playerRow;
          }
          break;
        }

        case 'MERODEADOR': {
          // d) Merodeador: persecución directa a corta distancia
          targetTileCol = playerCol;
          targetTileRow = playerRow;
          break;
        }

        case 'PATRULLERO': {
          // e) Patrullero: persecución directa
          targetTileCol = playerCol;
          targetTileRow = playerRow;
          break;
        }
      }
    } else if (ghost.state === 'SEARCH') {
      ghost.searchTimer -= dt;
      if (ghost.searchTimer <= 0 || !ghost.lastKnownPlayerPos) {
        ghost.state = 'PATROL';
        ghost.lastKnownPlayerPos = null;
        // Al terminar de buscar, alejarse hacia una sala lejana (>= 12 casillas)
        ghost.antiCampTarget = findDistantPatrolSpot(ghost.x, ghost.y, tiles);
      } else {
        targetTileCol = Math.floor(ghost.lastKnownPlayerPos.x / TILE_SIZE);
        targetTileRow = Math.floor(ghost.lastKnownPlayerPos.y / TILE_SIZE);
        speed = ghost.patrolSpeed * 0.95;
      }
    }

    if (ghost.state === 'PATROL') {
      speed = ghost.patrolSpeed;

      // Si tiene asignado un objetivo anti-campeo o de dispersión lejana, navegar hacia él
      if (ghost.antiCampTarget) {
        targetTileCol = Math.floor(ghost.antiCampTarget.x / TILE_SIZE);
        targetTileRow = Math.floor(ghost.antiCampTarget.y / TILE_SIZE);

        const distToAntiCamp = Math.hypot(ghost.antiCampTarget.x - ghost.x, ghost.antiCampTarget.y - ghost.y);
        if (distToAntiCamp < 40) {
          ghost.antiCampTarget = null;
        }
      } else if (ghost.personality === 'MERODEADOR') {
        // Merodeador: va de sala en sala eligiendo destinos al azar (cada 6-10 s)
        ghost.wanderTimer -= dt;
        if (ghost.wanderTimer <= 0 || !ghost.wanderTarget) {
          ghost.wanderTimer = 6 + Math.random() * 4;
          ghost.wanderTarget = findDistantPatrolSpot(ghost.x, ghost.y, tiles);
        }

        targetTileCol = Math.floor(ghost.wanderTarget.x / TILE_SIZE);
        targetTileRow = Math.floor(ghost.wanderTarget.y / TILE_SIZE);

        const distToWander = Math.hypot(ghost.wanderTarget.x - ghost.x, ghost.wanderTarget.y - ghost.y);
        if (distToWander < 40) {
          ghost.wanderTarget = null;
        }
      } else {
        // Cazador, Emboscador, Rastreador, Patrullero: siguen su ruta de waypoints
        const targetWaypoint = ghost.patrolRoute[ghost.currentWaypointIdx];
        targetTileCol = Math.floor(targetWaypoint.x / TILE_SIZE);
        targetTileRow = Math.floor(targetWaypoint.y / TILE_SIZE);

        // Si el waypoint cae en área prohibida (Pasillo Sur o salida), avanzar
        if (isForbiddenPatrolTarget(targetTileCol, targetTileRow)) {
          ghost.currentWaypointIdx = (ghost.currentWaypointIdx + 1) % ghost.patrolRoute.length;
        }

        const distToWaypoint = Math.hypot(targetWaypoint.x - ghost.x, targetWaypoint.y - ghost.y);
        if (distToWaypoint < 30) {
          ghost.currentWaypointIdx = (ghost.currentWaypointIdx + 1) % ghost.patrolRoute.length;
        }
      }

      // SEPARACIÓN ENTRE FANTASMAS EN PATRULLA:
      // Mantener una separación mínima de ~6 casillas (360px) para evitar agrupaciones
      for (let j = 0; j < ghosts.length; j++) {
        if (i === j) continue;
        const otherGhost = ghosts[j];
        if (otherGhost.state === 'PATROL') {
          const sepDist = Math.hypot(ghost.x - otherGhost.x, ghost.y - otherGhost.y);
          if (sepDist < 6 * TILE_SIZE && sepDist > 0.001) {
            // Vector de repulsión suave
            const repelX = (ghost.x - otherGhost.x) / sepDist;
            const repelY = (ghost.y - otherGhost.y) / sepDist;
            targetTileCol = Math.max(1, Math.min(MAP_COLS - 2, targetTileCol + Math.round(repelX * 2)));
            targetTileRow = Math.max(1, Math.min(MAP_ROWS - 2, targetTileRow + Math.round(repelY * 2)));
          }
        }
      }
    }

    // BÚSQUEDA DE CAMINOS BASADA EN CUADRÍCULA (BFS)
    if (ghost.pathRecalcCooldown <= 0 || !ghost.currentPathTarget) {
      ghost.pathRecalcCooldown = 0.22;
      ghost.currentPathTarget = findNextStepBFS(ghostCol, ghostRow, targetTileCol, targetTileRow, tiles);
    }

    // Mover suavemente hacia el centro de la casilla decidida por BFS
    const stepTargetX = (ghost.currentPathTarget.col + 0.5) * TILE_SIZE;
    const stepTargetY = (ghost.currentPathTarget.row + 0.5) * TILE_SIZE;

    const angle = Math.atan2(stepTargetY - ghost.y, stepTargetX - ghost.x);
    ghost.facingAngle = angle;
    const moveDist = speed * dt;

    const nextX = ghost.x + Math.cos(angle) * moveDist;
    const nextY = ghost.y + Math.sin(angle) * moveDist;

    const nextCol = Math.floor(nextX / TILE_SIZE);
    const nextRow = Math.floor(nextY / TILE_SIZE);

    if (nextRow > 0 && nextRow < tiles.length - 1 && nextCol > 0 && nextCol < tiles[0].length - 1) {
      if (!isSolidTile(tiles[nextRow][nextCol])) {
        ghost.x = nextX;
        ghost.y = nextY;
      } else {
        // Deslizamiento lateral suave en esquinas
        const altColX = Math.floor((ghost.x + Math.cos(angle) * moveDist) / TILE_SIZE);
        const altRowX = Math.floor(ghost.y / TILE_SIZE);
        if (!isSolidTile(tiles[altRowX][altColX])) {
          ghost.x += Math.cos(angle) * moveDist;
        } else {
          const altColY = Math.floor(ghost.x / TILE_SIZE);
          const altRowY = Math.floor((ghost.y + Math.sin(angle) * moveDist) / TILE_SIZE);
          if (!isSolidTile(tiles[altRowY][altColY])) {
            ghost.y += Math.sin(angle) * moveDist;
          }
        }
      }
    }
  }

  // Latido auditivo según proximidad
  if (!isPlayerHidden && minGhostDist < 400) {
    const intensity = Math.max(0, Math.min(1, 1 - (minGhostDist - 40) / 360));
    soundManager.updateProximityHeartbeat(intensity);
  } else {
    soundManager.updateProximityHeartbeat(0);
  }

  return isAnyGhostChasing;
}
