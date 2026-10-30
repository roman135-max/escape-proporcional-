import { Ghost } from './ghostAI';
import { isSolidTile, MAP_COLS, MAP_ROWS, SchoolItem, TILE_SIZE } from './schoolMap';

export interface RenderState {
  playerX: number;
  playerY: number;
  playerAngle: number;
  isPlayerHidden: boolean;
  activeLockerId: string | null;
  keysCollected: {
    bronze: boolean;
    silver: boolean;
    gold: boolean;
  };
  hasCodePiece1: boolean;
  hasCodePiece2: boolean;
  codePiece1Digits: string;
  codePiece2Digits: string;
  items: SchoolItem[];
  ghosts: Ghost[];
  tiles: number[][];
  visitedTiles: boolean[][];
  isAnyGhostChasing: boolean;
  ghostProximity: number; // 0 to 1 based on distance < 5 tiles (300px)
  isInvulnerable?: boolean;
  cameraX: number;
  cameraY: number;
  viewportWidth: number;
  viewportHeight: number;
  time: number;
}

export const PLAYER_VISION_RADIUS = 220; // ~3.6 casillas de 60px

export function renderGame(ctx: CanvasRenderingContext2D, state: RenderState) {
  const {
    playerX,
    playerY,
    playerAngle,
    isPlayerHidden,
    keysCollected,
    hasCodePiece1,
    hasCodePiece2,
    items,
    ghosts,
    tiles,
    visitedTiles,
    isAnyGhostChasing,
    ghostProximity,
    isInvulnerable,
    cameraX,
    cameraY,
    viewportWidth,
    viewportHeight,
    time
  } = state;

  ctx.save();
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);

  // Pure dark void base
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  // Apply camera translation for game world
  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // 1. RENDER TILES (Solo visibles dentro del radio de la linterna - sin memoria de zonas anteriores)
  // Culling de alto rendimiento: solo se recorren las casillas en el área cercana al jugador (~8x8 casillas)
  const MAX_VISION = PLAYER_VISION_RADIUS + 30; // ~250px límite exterior
  const INNER_VISION = PLAYER_VISION_RADIUS - 40; // ~180px iluminación plena

  const startCol = Math.max(0, Math.floor((playerX - MAX_VISION) / TILE_SIZE));
  const endCol = Math.min(MAP_COLS, Math.ceil((playerX + MAX_VISION) / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor((playerY - MAX_VISION) / TILE_SIZE));
  const endRow = Math.min(MAP_ROWS, Math.ceil((playerY + MAX_VISION) / TILE_SIZE) + 1);

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tileCenterX = (c + 0.5) * TILE_SIZE;
      const tileCenterY = (r + 0.5) * TILE_SIZE;
      const dist = Math.hypot(tileCenterX - playerX, tileCenterY - playerY);

      if (dist > MAX_VISION) {
        continue; // Fuera de visión: queda en negro absoluto (culled)
      }

      // Fundido corto de cuadrados en el borde del radio de visión
      let tileAlpha = 1.0;
      if (dist > INNER_VISION) {
        tileAlpha = Math.max(0, 1.0 - (dist - INNER_VISION) / (MAX_VISION - INNER_VISION));
      }
      if (tileAlpha <= 0.03) continue;

      ctx.globalAlpha = tileAlpha;

      const tile = tiles[r][c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (tile === 0) {
        // Hallway tile (60px) - dark desaturated navy slate
        ctx.fillStyle = (r + c) % 2 === 0 ? '#101726' : '#151e30';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 2) {
        // Classroom floor (Aula 101, 102) - dark navy wood planks
        ctx.fillStyle = (r + c) % 2 === 0 ? '#131b26' : '#182230';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#202d3f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 15); ctx.lineTo(x + TILE_SIZE, y + 15);
        ctx.moveTo(x, y + 30); ctx.lineTo(x + TILE_SIZE, y + 30);
        ctx.moveTo(x, y + 45); ctx.lineTo(x + TILE_SIZE, y + 45);
        ctx.stroke();
      } else if (tile === 3) {
        // Library floor - dark desaturated indigo/violet carpet
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1640' : '#201b4c';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 4) {
        // Gym court - dark desaturated amber court wood
        ctx.fillStyle = (r + c) % 2 === 0 ? '#381904' : '#421d06';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        if (r === 26 && c >= 30 && c <= 39) {
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(x, y + 30); ctx.lineTo(x + TILE_SIZE, y + 30);
          ctx.stroke();
        }
      } else if (tile === 5) {
        // Restroom tiles - dark desaturated blue/teal tiles
        ctx.fillStyle = (r + c) % 2 === 0 ? '#072a33' : '#0b323c';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 6) {
        // Office carpet (Dirección y Profesores) - deep executive dark plum/charcoal carpet (much darker than walls)
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1b1722' : '#221c2c';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(168, 162, 158, 0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 9) {
        // Cafetería / Comedor - dark checkered dining floor
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1715' : '#221f1d';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(214, 211, 209, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 10) {
        // Laboratorio de Informática - dark tech obsidian digital floor
        ctx.fillStyle = (r + c) % 2 === 0 ? '#07101e' : '#0a1628';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (tile === 11) {
        // Aula de Arte - dark studio wood with paint splatters
        ctx.fillStyle = (r + c) % 2 === 0 ? '#221206' : '#2a1708';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Subtle decorative paint specks
        ctx.fillStyle = (r * 7 + c * 13) % 3 === 0 ? '#f43f5e' : (r * 7 + c * 13) % 3 === 1 ? '#38bdf8' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + 18, y + 22, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 42, y + 38, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile === 12) {
        // Sala de Música / Auditorio - dark burgundy/crimson velvet carpet
        ctx.fillStyle = (r + c) % 2 === 0 ? '#22030c' : '#2a040f';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 13) {
        // Enfermería - dark clinic mint/teal tiles
        ctx.fillStyle = (r + c) % 2 === 0 ? '#03201f' : '#052826';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 14) {
        // Sótano / Sala de Calderas - dark industrial iron tread with warm boiler glow
        ctx.fillStyle = (r + c) % 2 === 0 ? '#131110' : '#161412';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
        ctx.moveTo(x + TILE_SIZE, y); ctx.lineTo(x, y + TILE_SIZE);
        ctx.stroke();
        const boilerGlow = 0.08 + Math.sin(time * 2.5 + r + c) * 0.04;
        ctx.fillStyle = `rgba(239, 68, 68, ${boilerGlow})`;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 15) {
        // Patio Interior - dark nocturnal cobblestone & lawn with soft moonlight wash
        ctx.fillStyle = (r + c) % 2 === 0 ? '#051b14' : '#072219';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        const moonGlow = 0.10 + Math.sin(time * 1.5) * 0.03;
        ctx.fillStyle = `rgba(56, 189, 248, ${moonGlow})`;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === 1) {
        // Solid wall - neutral lighter slate blue with glowing top edge (visibly lighter than all floors)
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#596c84';
        ctx.fillRect(x, y, TILE_SIZE, 9);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + TILE_SIZE, y);
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y + TILE_SIZE - 5, TILE_SIZE, 5);
        ctx.fillRect(x + TILE_SIZE - 5, y, 5, TILE_SIZE);
      } else if (tile === 8) {
        // Obstáculo: el suelo base coincide con el ambiente de la sala para integración impecable
        if (r <= 8 && c <= 11) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#131b26' : '#182230';
        } else if (r <= 8 && c <= 21) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#072a33' : '#0b323c';
        } else if (r <= 8 && c <= 34) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#131b26' : '#182230';
        } else if (r <= 8 && c >= 36) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#07101e' : '#0a1628';
        } else if (r >= 12 && r <= 19 && c <= 12) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1640' : '#201b4c';
        } else if (r >= 12 && r <= 19 && c <= 21) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#221206' : '#2a1708';
        } else if (r >= 12 && r <= 19 && c <= 31) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#051b14' : '#072219';
        } else if (r >= 12 && r <= 19 && c <= 38) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1b1722' : '#221c2c';
        } else if (r >= 12 && r <= 19 && c >= 40) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1a1715' : '#221f1d';
        } else if (r >= 23 && c <= 10) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#03201f' : '#052826';
        } else if (r >= 23 && c <= 21) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#22030c' : '#2a040f';
        } else if (r >= 23 && c <= 40) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#381904' : '#421d06';
        } else if (r >= 23 && c >= 41) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#131110' : '#161412';
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#101726' : '#151e30';
        }
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        if (r === 1 && c >= 4 && c <= 7) {
          // Pizarrón en Aula 101 (orientado hacia el sur)
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(x + 4, y + 12, TILE_SIZE - 8, 30);
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 4, y + 12, TILE_SIZE - 8, 30);
          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('y = k·x', x + 8, y + 30);
        } else if (c >= 36 && r <= 8) {
          // Computadoras en Laboratorio de Informática (~proporción 2:1 orientadas al frente)
          // Mesa rectangular de trabajo (50px x 25px)
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 5, y + 12, 50, 25);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 5, y + 12, 50, 25);
          // Monitor con pantalla brillante hacia el jugador
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 14, y + 14, 24, 13);
          ctx.fillStyle = (r + c) % 2 === 0 ? '#38bdf8' : '#34d399';
          ctx.fillRect(x + 16, y + 16, 20, 9);
          // Teclado
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 17, y + 29, 18, 5);
          // Asiento / silla de oficina detrás
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 16, y + 43, 28, 9);
        } else if (r >= 12 && r <= 19 && c >= 40) {
          // Mesas largas y bancos de Cafetería / Comedor (~proporción 2:1: 52px x 26px)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(x + 4, y + 12, 52, 26);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 4, y + 12, 52, 26);
          // Bandeja de comedor con plato y vaso
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(x + 14, y + 16, 14, 10);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 32, y + 17, 6, 8);
          // Banco largo detrás de la mesa
          ctx.fillStyle = '#5c2b09';
          ctx.fillRect(x + 8, y + 44, 44, 8);
        } else if (r >= 12 && r <= 19 && c >= 16 && c <= 21) {
          // Caballetes y mesas en Aula de Arte
          ctx.fillStyle = '#b45309';
          ctx.fillRect(x + 6, y + 12, 48, 25);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 6, y + 12, 48, 25);
          // Lienzo con mezcla de colores
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ec4899' : '#eab308';
          ctx.fillRect(x + 14, y + 15, 20, 14);
        } else if (r >= 12 && r <= 19 && c >= 23 && c <= 31) {
          // Bancos y canteros del Patio Interior bajo la luna (~2:1)
          if ((r === 15 || r === 16) && c === 27) {
            // Fuente central / cantero de noche
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 12, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Banco de plaza rectangular
            ctx.fillStyle = '#92400e';
            ctx.fillRect(x + 5, y + 14, 50, 24);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 5, y + 14, 50, 24);
            // Listones de madera del banco
            ctx.fillStyle = '#b45309';
            ctx.fillRect(x + 8, y + 17, 44, 6);
            ctx.fillRect(x + 8, y + 26, 44, 6);
          }
        } else if (r >= 12 && r <= 19 && c >= 33 && c <= 38) {
          // Dirección y Profesores: Escritorio ejecutivo de caoba (~proporción 2:1)
          if (r === 14 && (c === 35 || c === 36)) {
            ctx.fillStyle = '#5c2308';
            ctx.fillRect(x + 4, y + 12, 52, 26);
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 4, y + 12, 52, 26);
            // Vademécum de cuero verde y lámpara de bronce
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(x + 14, y + 16, 20, 14);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(x + 38, y + 15, 7, 7);
          } else {
            // Archivero metálico
            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 8, y + 10, 44, 40);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 8, y + 10, 44, 40);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(x + 16, y + 20, 28, 4);
            ctx.fillRect(x + 16, y + 34, 28, 4);
          }
        } else if (r >= 23 && c <= 10) {
          // Camillas en Enfermería (~proporción 2:1: 48px x 26px)
          ctx.fillStyle = '#0f766e';
          ctx.fillRect(x + 6, y + 12, 48, 26);
          // Sábana blanca clínica
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + 10, y + 14, 40, 22);
          // Almohada médica azul
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 12, y + 16, 12, 12);
        } else if (r >= 23 && c >= 11 && c <= 21) {
          // Butacas de terciopelo o piano en Sala de Música / Auditorio
          if (r === 28 && (c === 15 || c === 16)) {
            // Piano de cola en escenario (fila 28)
            ctx.fillStyle = '#020617';
            ctx.fillRect(x + 4, y + 10, TILE_SIZE - 8, 38);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 4, y + 10, TILE_SIZE - 8, 38);
            // Teclas de piano
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x + 8, y + 36, TILE_SIZE - 16, 8);
          } else {
            // Butacas de terciopelo de teatro (~proporción 2:1: 48px x 24px)
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(x + 6, y + 14, 48, 24);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 6, y + 14, 48, 24);
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(x + 10, y + 18, 40, 14);
          }
        } else if (r >= 23 && c >= 41) {
          // Calderas pesadas y tuberías en el Sótano
          ctx.fillStyle = '#292524';
          ctx.fillRect(x + 4, y + 6, TILE_SIZE - 8, TILE_SIZE - 12);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 6, TILE_SIZE - 8, TILE_SIZE - 12);
          // Glowing coal furnace door
          const fireP = 0.6 + Math.sin(time * 6 + c) * 0.4;
          ctx.fillStyle = `rgba(239, 68, 68, ${fireP})`;
          ctx.fillRect(x + 14, y + 20, TILE_SIZE - 28, 14);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 18, y + 24, TILE_SIZE - 36, 6);
        } else if (c === 40 && r >= 24 && r <= 27) {
          // Graderías de Gimnasio (~2:1: 50px x 26px)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(x + 5, y + 12, 50, 26);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(x + 9, y + 16, 42, 16);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 5, y + 12, 50, 26);
        } else if (c >= 3 && c <= 10 && (r === 14 || r === 16 || r === 18)) {
          // Estanterías de Biblioteca (~2:1)
          ctx.fillStyle = '#5c2b09';
          ctx.fillRect(x + 4, y + 10, 52, 28);
          ctx.strokeStyle = '#9a3412';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 4, y + 10, 52, 28);
          const colors = ['#ef4444', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'];
          for (let b = 0; b < 5; b++) {
            ctx.fillStyle = colors[(r + c + b) % colors.length];
            ctx.fillRect(x + 8 + b * 9, y + 14, 7, 20);
          }
        } else if (c >= 23 && c <= 34 && (r === 3 || r === 6)) {
          // Mesas de laboratorio en Aula 102 (Ciencias) (~proporción 2:1 orientadas al pizarrón)
          // Mesa rectangular de madera resistente (50px x 25px)
          ctx.fillStyle = '#713f12';
          ctx.fillRect(x + 5, y + 12, 50, 25);
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 5, y + 12, 50, 25);
          // Gradilla con tubos de ensayo y matraces químicos
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 12, y + 16, 4, 10);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(x + 18, y + 16, 4, 10);
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(x + 24, y + 17, 5, 8);
          // Taburete de laboratorio detrás
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(x + 16, y + 43, 28, 9);
        } else if (
          (r === 1 && (c === 1 || c === 23)) ||
          (r === 9 && c === 1) ||
          (r === 20 && c === 1) ||
          (r === 13 && c === 2) ||
          (r === 14 && c === 16) ||
          (r === 13 && c === 33) ||
          (r === 24 && c === 1) ||
          (r === 13 && (c === 24 || c === 30)) ||
          (r === 18 && (c === 24 || c === 30))
        ) {
          // Plantas decorativas en macetones (enriquecen el ambiente sin bloquear)
          ctx.fillStyle = '#9a3412'; // Maceta de terracota
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 6, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Hojas verdes frondosas
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2 - 6, y + TILE_SIZE / 2 - 2, 9, 0, Math.PI * 2);
          ctx.arc(x + TILE_SIZE / 2 + 6, y + TILE_SIZE / 2 - 2, 9, 0, Math.PI * 2);
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 - 8, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2 - 4, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (
          (r === 1 && (c === 34 || c === 45)) ||
          (r === 18 && c === 2) ||
          (r === 17 && c === 16) ||
          (r === 18 && c === 33) ||
          (r === 17 && c === 40) ||
          (r === 28 && (c === 10 || c === 29 || c === 48)) ||
          (r === 24 && c === 21)
        ) {
          // Cajas de almacenamiento / provisiones / herramientas
          const isMetalToolbox = r === 28 && c === 48;
          ctx.fillStyle = isMetalToolbox ? '#44403c' : '#78350f';
          ctx.fillRect(x + 8, y + 10, TILE_SIZE - 16, TILE_SIZE - 20);
          ctx.strokeStyle = isMetalToolbox ? '#ef4444' : '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 8, y + 10, TILE_SIZE - 16, TILE_SIZE - 20);
          // Flejes / detalles de la caja
          ctx.fillStyle = isMetalToolbox ? '#dc2626' : '#d97706';
          ctx.fillRect(x + 14, y + 10, 4, TILE_SIZE - 20);
          ctx.fillRect(x + TILE_SIZE - 18, y + 10, 4, TILE_SIZE - 20);
        } else {
          // Pupitres y bancos escolares rectangulares (~proporción 2:1 orientados hacia el pizarrón)
          // 1. Superficie del pupitre: 50px de ancho x 25px de alto (proporción 2:1)
          ctx.fillStyle = '#78350f'; // Sombra/borde inferior
          ctx.fillRect(x + 5, y + 12, 50, 25);
          ctx.fillStyle = '#92400e'; // Tapa de madera cálida
          ctx.fillRect(x + 6, y + 13, 48, 22);
          ctx.fillStyle = '#a16207'; // Brillo superior
          ctx.fillRect(x + 7, y + 14, 46, 6);
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 5, y + 12, 50, 25);

          // Ranura para lápices en el borde superior
          ctx.fillStyle = '#451a03';
          ctx.fillRect(x + 10, y + 15, 26, 2);

          // Cuaderno o hoja de examen con problemas
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + 36, y + 18, 12, 13);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x + 38, y + 21, 8, 1.5);
          ctx.fillRect(x + 38, y + 24, 8, 1.5);
          ctx.fillRect(x + 38, y + 27, 6, 1.5);

          // Patas metálicas tubulares
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 6, y + 12, 3, 3);
          ctx.fillRect(x + 51, y + 12, 3, 3);

          // 2. Banco / asiento del alumno detrás del pupitre (mirando hacia el norte / pizarrón)
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(x + 12, y + 43, 36, 10);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 12, y + 43, 36, 10);

          // Estructura metálica que une el pupitre con el banco
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 16, y + 37, 3, 6);
          ctx.fillRect(x + 41, y + 37, 3, 6);
        }
      }
    }
  }
  ctx.globalAlpha = 1.0;

  // 2. RENDER ITEMS & LOCKERS (Culling: solo se dibujan si están dentro del radio de la linterna)
  for (const item of items) {
    if (item.collected) continue;

    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;
    const distToPlayer = Math.hypot(itemCenterX - playerX, itemCenterY - playerY);

    if (distToPlayer > MAX_VISION + 25) {
      continue; // Fuera de la linterna: no se dibuja (culled)
    }

    const ix = item.x;
    const iy = item.y;
    const pulse = Math.sin(time * 4);

    if (item.type === 'key_bronze') {
      const floatOffset = Math.sin(time * 3) * 4;

      ctx.strokeStyle = `rgba(245, 158, 11, ${0.5 + pulse * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 22 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      const aura = ctx.createRadialGradient(ix + 16, iy + 16 + floatOffset, 3, ix + 16, iy + 16 + floatOffset, 26);
      aura.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
      aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 10 + floatOffset, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(ix + 13, iy + 14 + floatOffset, 6, 14);
      ctx.fillRect(ix + 19, iy + 21 + floatOffset, 6, 4);

    } else if (item.type === 'key_silver') {
      const floatOffset = Math.sin(time * 3 + 1) * 4;

      ctx.strokeStyle = `rgba(226, 232, 240, ${0.6 + pulse * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 22 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      const aura = ctx.createRadialGradient(ix + 16, iy + 16 + floatOffset, 3, ix + 16, iy + 16 + floatOffset, 26);
      aura.addColorStop(0, 'rgba(248, 250, 252, 0.8)');
      aura.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 10 + floatOffset, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(ix + 13, iy + 14 + floatOffset, 6, 14);
      ctx.fillRect(ix + 19, iy + 21 + floatOffset, 6, 4);

    } else if (item.type === 'key_gold') {
      const floatOffset = Math.sin(time * 3 + 2) * 4;

      ctx.strokeStyle = `rgba(250, 204, 21, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 24 + pulse * 5, 0, Math.PI * 2);
      ctx.stroke();

      const aura = ctx.createRadialGradient(ix + 16, iy + 16 + floatOffset, 3, ix + 16, iy + 16 + floatOffset, 28);
      aura.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      aura.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 10 + floatOffset, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ix + 13, iy + 15 + floatOffset, 6, 15);
      ctx.fillRect(ix + 19, iy + 22 + floatOffset, 6, 4);

    } else if (item.type === 'code_piece_1' || item.type === 'code_piece_2') {
      const floatOffset = Math.sin(time * 2.5) * 3;

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 + pulse * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 22 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      const aura = ctx.createRadialGradient(ix + 16, iy + 16 + floatOffset, 3, ix + 16, iy + 16 + floatOffset, 26);
      aura.addColorStop(0, 'rgba(186, 230, 253, 0.7)');
      aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(ix + 16, iy + 16 + floatOffset, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ix + 4, iy + 4 + floatOffset, 24, 24);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix + 4, iy + 4 + floatOffset, 24, 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.codeDigits || '??', ix + 16, iy + 19 + floatOffset);

    } else if (item.type === 'locker') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(ix, iy, item.width, item.height);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, item.width, item.height);

      ctx.fillStyle = '#1e293b';
      for (let l = 0; l < 4; l++) {
        ctx.fillRect(ix + 8, iy + 8 + l * 6, item.width - 16, 3);
      }
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(ix + item.width - 10, iy + 24, 4, 10);

      const dist = Math.hypot(playerX - (ix + item.width / 2), playerY - (iy + item.height / 2));
      if (dist < 75) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.95)';
        ctx.lineWidth = 3;
        ctx.strokeRect(ix - 3, iy - 3, item.width + 6, item.height + 6);
      }

    } else if (item.type === 'exit_door') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ix, iy, item.width, item.height);

      ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + pulse * 0.25})`;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(ix - 2, iy - 2, item.width + 4, item.height + 4);

      ctx.fillStyle = '#334155';
      ctx.fillRect(ix + 6, iy + 6, item.width / 2 - 9, item.height - 12);
      ctx.fillRect(ix + item.width / 2 + 3, iy + 6, item.width / 2 - 9, item.height - 12);

      // 3 Keys status LEDs
      ctx.fillStyle = keysCollected.bronze ? '#f59e0b' : '#ef4444';
      ctx.beginPath(); ctx.arc(ix + 24, iy + 22, 6, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = keysCollected.silver ? '#f1f5f9' : '#ef4444';
      ctx.beginPath(); ctx.arc(ix + item.width / 2, iy + 22, 6, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = keysCollected.gold ? '#facc15' : '#ef4444';
      ctx.beginPath(); ctx.arc(ix + item.width - 24, iy + 22, 6, 0, Math.PI * 2); ctx.fill();

      // Code status LED
      const hasFullCode = hasCodePiece1 && hasCodePiece2;
      ctx.fillStyle = hasFullCode ? '#22c55e' : (hasCodePiece1 || hasCodePiece2) ? '#f59e0b' : '#ef4444';
      ctx.fillRect(ix + item.width / 2 - 14, iy + 32, 28, 10);
    }
  }

  // 3. RENDER PLAYER (1.5x scaled)
  if (!isPlayerHidden) {
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.rotate(playerAngle);

    // If invulnerable, apply soft flicker and protective shield
    if (isInvulnerable) {
      const flicker = Math.sin(time * 18) > 0 ? 0.35 : 0.95;
      ctx.globalAlpha = flicker;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 20, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.ellipse(-3, 0, 16, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-19, -9, 10, 18);

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(3, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Cap
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Flashlight
    ctx.fillStyle = '#64748b';
    ctx.fillRect(11, 5, 11, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(20, 5, 4, 6);

    ctx.restore();
  }

  // 4. RENDER GHOSTS (ONLY IF WITHIN PLAYER VISION RADIUS)
  // Requirement: "Los fantasmas solo se ven dentro del radio de visión del jugador."
  for (const ghost of ghosts) {
    const distToPlayer = Math.hypot(ghost.x - playerX, ghost.y - playerY);
    if (distToPlayer > PLAYER_VISION_RADIUS) {
      continue;
    }

    for (const wisp of ghost.wispTrail) {
      ctx.fillStyle = ghost.color;
      ctx.globalAlpha = wisp.opacity * 0.5;
      ctx.beginPath();
      ctx.arc(wisp.x, wisp.y, ghost.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const gy = ghost.y + Math.sin(ghost.bobPhase) * 5;
    const gx = ghost.x;

    // Glowing aura
    const auraGradient = ctx.createRadialGradient(gx, gy, 5, gx, gy, ghost.radius * 2.8);
    auraGradient.addColorStop(0, ghost.glowColor);
    auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(gx, gy, ghost.radius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(gx, gy - 2, ghost.radius, Math.PI, 0, false);
    ctx.lineTo(gx + ghost.radius, gy + ghost.radius);
    ctx.quadraticCurveTo(gx + ghost.radius * 0.5, gy + ghost.radius - 5, gx, gy + ghost.radius);
    ctx.quadraticCurveTo(gx - ghost.radius * 0.5, gy + ghost.radius + 5, gx - ghost.radius, gy + ghost.radius);
    ctx.closePath();
    ctx.fill();

    // Eyes
    const isChasing = ghost.state === 'CHASE';
    ctx.fillStyle = isChasing ? '#ef4444' : '#0f172a';
    ctx.beginPath();
    ctx.arc(gx - 6, gy - 3, isChasing ? 5 : 3.5, 0, Math.PI * 2);
    ctx.arc(gx + 6, gy - 3, isChasing ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (isChasing) {
      ctx.fillStyle = '#fee2e2';
      ctx.beginPath();
      ctx.arc(gx - 6, gy - 3, 2, 0, Math.PI * 2);
      ctx.arc(gx + 6, gy - 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // "!" icon above ghost head
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', gx, gy - ghost.radius - 10);
    }
  }

  // Restore camera translation
  ctx.restore();

  // 5. PURE CONTINUOUS RADIAL GRADIENT MASK (ZERO HARD RECTANGLES, ZERO SQUARES)
  // Inside PLAYER_VISION_RADIUS: completely clear and bright.
  // Smooth continuous transition to 80% darkness for visited areas; unvisited remain black.
  const screenPlayerX = playerX - cameraX;
  const screenPlayerY = playerY - cameraY;

  ctx.save();
  const darkMask = ctx.createRadialGradient(
    screenPlayerX,
    screenPlayerY,
    PLAYER_VISION_RADIUS - 60,
    screenPlayerX,
    screenPlayerY,
    PLAYER_VISION_RADIUS + 15
  );
  darkMask.addColorStop(0, 'rgba(3, 7, 18, 0)');
  darkMask.addColorStop(1, '#030712'); // 100% oscuridad absoluta fuera del radio de visión

  ctx.fillStyle = darkMask;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  ctx.restore();

  // 6. SOFT DANGER VIGNETTE BREATHING INWARD FROM SCREEN EDGES (Requirement 6)
  // Transition is slow and gradual (slow ease-in-out), with no hard lines or abrupt flashing
  if (ghostProximity > 0.02) {
    ctx.save();
    // Gentle breathing ease-in-out pulse (smooth sine wave)
    const breathFreq = 1.8 + ghostProximity * 1.6;
    const breathFactor = 0.5 + 0.5 * Math.sin(time * breathFreq);
    const maxAlpha = (0.15 + ghostProximity * 0.45) * (0.45 + 0.55 * breathFactor);

    // Soft radial vignette breathing from the outer edges toward the center
    const outerRadius = Math.max(viewportWidth, viewportHeight) * 0.75;
    const innerRadius = Math.min(viewportWidth, viewportHeight) * (0.34 - ghostProximity * 0.08);

    const redVignette = ctx.createRadialGradient(
      viewportWidth / 2,
      viewportHeight / 2,
      Math.max(15, innerRadius),
      viewportWidth / 2,
      viewportHeight / 2,
      outerRadius
    );
    redVignette.addColorStop(0, 'rgba(239, 68, 68, 0)');
    redVignette.addColorStop(0.6, `rgba(239, 68, 68, ${maxAlpha * 0.35})`);
    redVignette.addColorStop(1, `rgba(220, 38, 38, ${maxAlpha})`);

    ctx.fillStyle = redVignette;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.restore();
  }

  // 7. IF IN LOCKER: RENDER LOCKER SLAT OVERLAY
  if (isPlayerHidden) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    const slatCount = 14;
    const slatHeight = viewportHeight / slatCount;
    for (let s = 0; s < slatCount; s++) {
      if (s % 2 === 0) {
        ctx.fillRect(0, s * slatHeight, viewportWidth, slatHeight * 0.35);
      }
    }

    ctx.restore();
  }

  ctx.restore();
}
