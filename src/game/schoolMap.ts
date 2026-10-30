export const TILE_SIZE = 60; // 60px tile
export const MAP_COLS = 50; // ~50% enlarged (was 36x24 = 864, now 50x30 = 1500 tiles)
export const MAP_ROWS = 30;

export const DEFAULT_SECRET_CODE = '7429';

// Tile definitions:
// 0: Floor (Hallway)
// 1: Solid Wall
// 2: Classroom Floor (Aula 101, Aula 102)
// 3: Library Carpet
// 4: Gym Wooden Court
// 5: Restroom Tiles
// 6: Office Carpet (Dirección y Profesores)
// 7: Window / Grate (solid)
// 8: Obstacle (desks, computers, easels, beds, boilers, benches, bookshelves)
// 9: Cafetería / Comedor Checkered Floor
// 10: Laboratorio de Informática Tech Floor
// 11: Aula de Arte Studio Floor
// 12: Sala de Música / Auditorio Velvet Carpet
// 13: Enfermería Clinic Floor
// 14: Sótano / Sala de Calderas Industrial Rust Grate (Zona Peligrosa)
// 15: Patio Interior Moonlit Cobblestone & Night Lawn

export interface SchoolItem {
  id: string;
  type: 'key_bronze' | 'key_silver' | 'key_gold' | 'code_piece_1' | 'code_piece_2' | 'exit_door' | 'locker';
  name: string;
  roomName: string;
  spotName: string;
  x: number; // world pixel coords
  y: number;
  width: number;
  height: number;
  collected?: boolean;
  codeDigits?: string;
  description: string;
}

export interface RoomZone {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const ROOMS: RoomZone[] = [
  // North Wing (Rows 1..8)
  { name: 'Aula 101 (Matemáticas)', x1: 1, y1: 1, x2: 11, y2: 8 },
  { name: 'Baños Escolares', x1: 13, y1: 1, x2: 21, y2: 8 },
  { name: 'Aula 102 (Ciencias)', x1: 23, y1: 1, x2: 34, y2: 8 },
  { name: 'Laboratorio de Informática', x1: 36, y1: 1, x2: 48, y2: 8 },

  // Corredor Principal Norte
  { name: 'Pasillo Principal Norte', x1: 1, y1: 9, x2: 48, y2: 11 },

  // Central Wing (Rows 12..19)
  { name: 'Biblioteca', x1: 1, y1: 12, x2: 12, y2: 19 },
  { name: 'Aula de Arte', x1: 16, y1: 12, x2: 21, y2: 19 },
  { name: 'Patio Interior', x1: 23, y1: 12, x2: 31, y2: 19 },
  { name: 'Dirección y Sala de Profesores', x1: 33, y1: 12, x2: 38, y2: 19 },
  { name: 'Cafetería / Comedor', x1: 40, y1: 12, x2: 48, y2: 19 },

  // Corredor Principal Sur (con la salida principal en el centro)
  { name: 'Pasillo Principal Sur', x1: 1, y1: 20, x2: 48, y2: 23 },

  // South Wing (Rows 24..29)
  { name: 'Enfermería', x1: 1, y1: 24, x2: 10, y2: 28 },
  { name: 'Sala de Música y Auditorio', x1: 12, y1: 24, x2: 21, y2: 28 },
  { name: 'Gimnasio Escolar', x1: 30, y1: 24, x2: 40, y2: 28 },
  { name: 'Sótano / Sala de Calderas', x1: 42, y1: 24, x2: 48, y2: 28 }
];

export function buildSchoolTiles(): number[][] {
  const map: number[][] = Array(MAP_ROWS).fill(0).map(() => Array(MAP_COLS).fill(0));

  // 1. Outer boundary walls
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        map[r][c] = 1;
      }
    }
  }

  // --- AULA 101 (MATEMÁTICAS) (Rows 1..8, Cols 1..11) ---
  for (let r = 1; r <= 8; r++) {
    for (let c = 1; c <= 11; c++) map[r][c] = 2;
  }
  for (let r = 1; r <= 8; r++) map[r][12] = 1; // Wall to Baños
  for (let c = 1; c <= 12; c++) {
    // Puertas de 2 casillas en fila 8
    if ((c < 4 || c > 5) && (c < 8 || c > 9)) map[8][c] = 1;
  }
  map[1][4] = 8; map[1][5] = 8; map[1][6] = 8; map[1][7] = 8; // Pizarrón orientado al norte
  map[3][3] = 8; map[3][5] = 8; map[3][7] = 8; map[3][9] = 8; // Pupitres fila 1 (orientados al pizarrón)
  // Filas 4 y 5 quedan libres: pasillo amplio de al menos 2 casillas de ancho
  map[6][3] = 8; map[6][5] = 8; map[6][7] = 8; map[6][9] = 8; // Pupitres fila 2 (orientados al pizarrón)
  map[1][1] = 8; // Planta en maceta en esquina

  // --- BAÑOS ESCOLARES (Rows 1..8, Cols 13..21) ---
  for (let r = 1; r <= 8; r++) {
    for (let c = 13; c <= 21; c++) map[r][c] = 5;
  }
  for (let r = 1; r <= 8; r++) map[r][22] = 1; // Wall to Aula 102
  for (let c = 13; c <= 22; c++) {
    // Puertas de 2 casillas en fila 8 (cols 16..17)
    if (c < 16 || c > 17) map[8][c] = 1;
  }
  map[2][14] = 8; map[3][14] = 8; map[4][14] = 8; // Lavamanos
  map[2][20] = 8; map[3][20] = 8; map[4][20] = 8; // Cabinas
  map[1][13] = 8; // Estante de productos de limpieza

  // --- AULA 102 (CIENCIAS) (Rows 1..8, Cols 23..34) ---
  for (let r = 1; r <= 8; r++) {
    for (let c = 23; c <= 34; c++) map[r][c] = 2;
  }
  for (let r = 1; r <= 8; r++) map[r][35] = 1; // Wall to Informática
  for (let c = 23; c <= 35; c++) {
    // Puertas de 2 casillas en fila 8 (cols 26..27 y cols 31..32)
    if ((c < 26 || c > 27) && (c < 31 || c > 32)) map[8][c] = 1;
  }
  map[1][28] = 8; map[1][29] = 8; // Estante y pizarrón de química
  map[3][25] = 8; map[3][28] = 8; map[3][31] = 8; // Mesas de laboratorio fila 1 (orientadas al pizarrón)
  // Filas 4 y 5 libres: pasillo de 2 casillas de ancho
  map[6][25] = 8; map[6][28] = 8; map[6][31] = 8; // Mesas de laboratorio fila 2 (orientadas al pizarrón)
  map[1][23] = 8; // Planta decorativa de laboratorio
  map[1][34] = 8; // Caja de reactivos y cristalería

  // --- LABORATORIO DE INFORMÁTICA (Rows 1..8, Cols 36..48) ---
  for (let r = 1; r <= 8; r++) {
    for (let c = 36; c <= 48; c++) map[r][c] = 10;
  }
  for (let c = 36; c <= 48; c++) {
    // Puertas de 2 casillas en fila 8 (cols 38..39 y cols 44..45)
    if ((c < 38 || c > 39) && (c < 44 || c > 45)) map[8][c] = 1;
  }
  // Filas de computadoras con pantallas orientadas al frente
  map[3][38] = 8; map[3][39] = 8; map[3][40] = 8;
  map[3][43] = 8; map[3][44] = 8; map[3][45] = 8;
  // Filas 4 y 5 libres: pasillo de 2 casillas de ancho
  map[6][38] = 8; map[6][39] = 8; map[6][40] = 8;
  map[6][43] = 8; map[6][44] = 8; map[6][45] = 8;
  map[1][45] = 8; // Caja de cables y componentes
  map[1][46] = 8; map[1][47] = 8; // Rack de servidores

  // --- PASILLO PRINCIPAL NORTE (Rows 9..11, Cols 1..48) ---
  for (let r = 9; r <= 11; r++) {
    for (let c = 1; c <= 48; c++) map[r][c] = 0;
  }
  map[9][1] = 8; // Planta de pasillo en esquina norte

  // --- BIBLIOTECA (Rows 12..19, Cols 1..12) ---
  for (let r = 12; r <= 19; r++) {
    for (let c = 1; c <= 12; c++) map[r][c] = 3;
  }
  for (let c = 1; c <= 12; c++) {
    if (c < 5 || c > 6) map[12][c] = 1; // Puerta Norte cols 5..6 (2 casillas)
    if (c < 5 || c > 6) map[19][c] = 1; // Puerta Sur cols 5..6 (2 casillas)
  }
  for (let r = 12; r <= 19; r++) {
    if (r < 15 || r > 16) map[r][13] = 1; // Puerta Este a Pasillo Oeste cols 13 rows 15..16
  }
  // Estanterías de libros y mesas
  map[14][3] = 8; map[14][4] = 8; map[14][5] = 8;
  map[16][3] = 8; map[16][4] = 8; map[16][5] = 8;
  map[18][3] = 8; map[18][4] = 8; map[18][5] = 8;
  map[14][8] = 8; map[14][9] = 8; map[14][10] = 8;
  map[17][8] = 8; map[17][9] = 8; map[17][10] = 8;
  // Decoraciones sobre suelo libre en esquinas interiores, a >= 2 casillas de cualquier puerta
  map[13][2] = 8; // Planta ficus de biblioteca en esquina noroeste interior
  map[18][2] = 8; // Cajas de libros archivados en esquina suroeste interior

  // --- PASILLO VERTICAL OESTE (Rows 12..19, Cols 14..15) ---
  for (let r = 12; r <= 19; r++) {
    map[r][14] = 0;
    map[r][15] = 0;
  }

  // --- AULA DE ARTE (Rows 12..19, Cols 16..21) ---
  for (let r = 12; r <= 19; r++) {
    for (let c = 16; c <= 21; c++) map[r][c] = 11;
  }
  for (let c = 16; c <= 21; c++) {
    if (c < 18 || c > 19) map[12][c] = 1; // Puerta Norte cols 18..19
    if (c < 18 || c > 19) map[19][c] = 1; // Puerta Sur cols 18..19
  }
  for (let r = 12; r <= 19; r++) {
    if (r < 15 || r > 16) map[r][22] = 1; // Puerta Este a Patio Interior rows 15..16
  }
  map[14][18] = 8; map[14][20] = 8; // Caballetes
  map[17][18] = 8; map[17][20] = 8; // Mesas con paletas
  // Decoraciones sobre suelo libre, a >= 2 casillas de puertas
  map[14][16] = 8; // Planta ornamental contra pared oeste
  map[17][16] = 8; // Caja de pinturas y lienzos contra pared oeste

  // --- PATIO INTERIOR (Rows 12..19, Cols 23..31) (HUB CIRCULAR CENTRAL) ---
  for (let r = 12; r <= 19; r++) {
    for (let c = 23; c <= 31; c++) map[r][c] = 15;
  }
  // Puertas y arcos amplios (>= 2 casillas) en los 4 puntos cardinales
  for (let c = 23; c <= 31; c++) {
    if (c < 26 || c > 28) map[12][c] = 1; // Arco Norte (3 casillas de ancho: 26, 27, 28)
    if (c < 26 || c > 28) map[19][c] = 1; // Arco Sur (3 casillas de ancho: 26, 27, 28)
  }
  for (let r = 12; r <= 19; r++) {
    if (r < 15 || r > 16) map[r][32] = 1; // Puerta Este a Dirección rows 15..16
  }
  // Bancos de plaza bajo la luz de luna, fuente y maceteros de flores
  map[14][25] = 8; map[14][29] = 8; // Bancos norte
  map[17][25] = 8; map[17][29] = 8; // Bancos sur
  map[15][27] = 8; map[16][27] = 8; // Fuente / cantero de noche
  map[13][24] = 8; map[13][30] = 8; // Maceteros con flores ornamentales
  map[18][24] = 8; map[18][30] = 8;

  // --- DIRECCIÓN Y SALA DE PROFESORES (Rows 12..19, Cols 33..38) ---
  for (let r = 12; r <= 19; r++) {
    for (let c = 33; c <= 38; c++) map[r][c] = 6;
  }
  for (let c = 33; c <= 38; c++) {
    if (c < 35 || c > 36) map[12][c] = 1; // Puerta Norte cols 35..36
    if (c < 35 || c > 36) map[19][c] = 1; // Puerta Sur cols 35..36
  }
  for (let r = 12; r <= 19; r++) {
    if (r < 15 || r > 16) map[r][39] = 1; // Puerta Este a Cafetería rows 15..16
  }
  map[14][35] = 8; map[14][36] = 8; // Escritorio ejecutivo
  map[17][34] = 8; map[17][37] = 8; // Archiveros
  // Decoraciones sobre suelo libre, a >= 2 casillas de puertas
  map[13][33] = 8; // Planta ficus de oficina en esquina noroeste interior
  map[18][33] = 8; // Caja de legajos escolares en esquina suroeste interior

  // --- CAFETERÍA / COMEDOR (Rows 12..19, Cols 40..48) ---
  for (let r = 12; r <= 19; r++) {
    for (let c = 40; c <= 48; c++) map[r][c] = 9;
  }
  for (let c = 40; c <= 48; c++) {
    if ((c < 42 || c > 43) && (c < 46 || c > 47)) map[12][c] = 1; // 2 puertas Norte
    if ((c < 42 || c > 43) && (c < 46 || c > 47)) map[19][c] = 1; // 2 puertas Sur
  }
  // Mesas largas de comedor y bancos
  map[14][42] = 8; map[14][43] = 8; map[14][44] = 8; map[14][45] = 8;
  map[17][42] = 8; map[17][43] = 8; map[17][44] = 8; map[17][45] = 8;
  map[13][48] = 8; map[14][48] = 8; map[15][48] = 8; map[16][48] = 8; map[17][48] = 8; // Mostrador de comida
  // Decoraciones sobre suelo libre, a >= 2 casillas de puertas
  map[14][40] = 8; // Estante de vajilla contra pared oeste
  map[17][40] = 8; // Cajas de provisiones contra pared oeste

  // --- PASILLO PRINCIPAL SUR (Rows 20..23, Cols 1..48) ---
  for (let r = 20; r <= 23; r++) {
    for (let c = 1; c <= 48; c++) map[r][c] = 0;
  }
  map[20][1] = 8; // Planta en maceta en pasillo sur oeste

  // --- ENFERMERÍA (Rows 24..28, Cols 1..10) ---
  for (let r = 24; r <= 28; r++) {
    for (let c = 1; c <= 10; c++) map[r][c] = 13;
  }
  for (let c = 1; c <= 10; c++) {
    if (c < 5 || c > 6) map[23][c] = 1; // Puerta Norte cols 5..6 (2 casillas)
  }
  for (let r = 24; r <= 28; r++) {
    if (r < 25 || r > 26) map[r][11] = 1; // Puerta Este a Auditorio rows 25..26 (2 casillas)
  }
  map[25][3] = 8; map[25][4] = 8; // Camilla 1 con sábana blanca
  map[27][3] = 8; map[27][4] = 8; // Camilla 2
  map[24][8] = 8; // Botiquín / vitrina de medicamentos
  map[24][1] = 8; // Planta medicinal en esquina
  map[28][10] = 8; // Caja de primeros auxilios

  // --- SALA DE MÚSICA Y AUDITORIO (Rows 24..28, Cols 12..21) ---
  for (let r = 24; r <= 28; r++) {
    for (let c = 12; c <= 21; c++) map[r][c] = 12;
  }
  for (let c = 12; c <= 21; c++) {
    if ((c < 14 || c > 15) && (c < 18 || c > 19)) map[23][c] = 1; // 2 puertas Norte
  }
  for (let r = 24; r <= 28; r++) map[r][22] = 1; // Wall to Lobby
  // Butacas de teatro y piano de cola en escenario
  map[25][14] = 8; map[25][15] = 8; map[25][18] = 8; map[25][19] = 8; // Butacas
  // Filas 26 y 27 libres: pasillo de 2 casillas
  map[28][15] = 8; map[28][16] = 8; // Piano de cola en escenario (fila 28)
  map[24][12] = 8; // Atril de partituras
  map[24][21] = 8; // Caja de altavoz de escenario

  // --- GIMNASIO ESCOLAR (Rows 24..28, Cols 29..40) ---
  for (let r = 24; r <= 28; r++) {
    for (let c = 29; c <= 40; c++) map[r][c] = 4;
  }
  for (let c = 29; c <= 40; c++) {
    if ((c < 32 || c > 33) && (c < 37 || c > 38)) map[23][c] = 1; // 2 puertas Norte
  }
  // Muro este con túnel de mantenimiento a Calderas abierto en filas 25..26
  for (let r = 24; r <= 28; r++) {
    if (r < 25 || r > 26) map[r][41] = 1;
  }
  // Graderías deportivas sin bloquear el túnel a Calderas (filas 25..26 libres)
  for (let r = 24; r <= 27; r++) {
    if (r !== 25 && r !== 26) map[r][40] = 8;
  }
  map[28][29] = 8; // Caja de pelotas de básquetbol

  // Muro separator en fila 23 entre Gimnasio y Calderas:
  // Cierra el hueco de 1 casilla (nicho sin salida) en fila 23 col 41 al lado de calderas
  map[23][41] = 1;

  // --- SÓTANO / SALA DE CALDERAS (ZONA PELIGROSA) (Rows 24..28, Cols 42..48) ---
  for (let r = 24; r <= 28; r++) {
    for (let c = 42; c <= 48; c++) map[r][c] = 14;
  }
  // Puerta Norte amplia (3 casillas de ancho: cols 44..46) conectada al Pasillo Principal Sur
  for (let c = 42; c <= 48; c++) {
    if (c < 44 || c > 46) map[23][c] = 1;
    else map[23][c] = 0; // Pasillo Sur abierto
  }
  // Suelo despejado y libre en toda la entrada (fila 24 cols 44..46)
  map[24][44] = 14; map[24][45] = 14; map[24][46] = 14;

  // Túnel de conexión oeste desde Gimnasio (rows 25..26 cols 41..42)
  map[25][41] = 0; map[26][41] = 0;
  map[25][42] = 14; map[26][42] = 14;

  // Calderas pesadas y tuberías colocadas estratégicamente sin bloquear puertas ni pasos
  map[25][44] = 8; map[26][44] = 8; // Caldera 1 central
  map[25][47] = 8; map[26][47] = 8; // Caldera 2
  map[28][43] = 8; map[28][44] = 8; // Tuberías de vapor caliente a ras de suelo en pared sur
  map[28][48] = 8; // Estante de válvulas y manómetros en esquina este

  // REQUISITO 3: Eliminar huecos o nichos de 1 casilla sin salida en pasillos y salas
  eliminateDeadEndNiches(map);

  // REQUISITO 2: Revisar y validar que ninguna decoración caiga en paredes ni a < 2 casillas de puertas
  cleanAndValidateDecorations(map);

  // Verificación de integridad: todas las salas deben ser alcanzables desde el punto de inicio
  verifyAndEnsureAllRoomsReachable(map);

  return map;
}

/**
 * REQUISITO 3: Detecta casillas de piso rodeadas por 3 o más paredes y las rellena con pared sólida.
 * Elimina cualquier hueco o nicho de 1 casilla sin salida (ej. Pasillo Principal Sur junto a Calderas).
 */
export function eliminateDeadEndNiches(map: number[][]) {
  map[23][41] = 1; // Hueco explícito fila 23 col 41

  let changed = true;
  let passes = 0;
  while (changed && passes < 12) {
    changed = false;
    passes++;
    for (let r = 1; r < MAP_ROWS - 1; r++) {
      for (let c = 1; c < MAP_COLS - 1; c++) {
        if (!isSolidTile(map[r][c])) {
          // No cerrar spawn de jugador ni salida
          if (c === 25 && r === 10) continue;
          if (r >= 22 && r <= 23 && c >= 24 && c <= 26) continue;
          // No cerrar aberturas de puertas
          if (isInsideAnyDoor(c, r)) continue;

          let wallNeighbors = 0;
          if (isSolidTile(map[r - 1][c])) wallNeighbors++;
          if (isSolidTile(map[r + 1][c])) wallNeighbors++;
          if (isSolidTile(map[r][c - 1])) wallNeighbors++;
          if (isSolidTile(map[r][c + 1])) wallNeighbors++;

          if (wallNeighbors >= 3) {
            map[r][c] = 1;
            changed = true;
          }
        }
      }
    }
  }
}

/**
 * Obtiene el tipo de suelo según la coordenada de la sala o pasillo
 */
export function getRoomFloorType(c: number, r: number): number {
  if (r >= 1 && r <= 8) {
    if (c <= 11) return 2; // Aula 101
    if (c <= 21) return 5; // Baños
    if (c <= 34) return 2; // Aula 102
    return 10; // Informática
  }
  if (r >= 9 && r <= 11) return 0; // Pasillo Norte
  if (r >= 12 && r <= 19) {
    if (c <= 12) return 3; // Biblioteca
    if (c <= 15) return 0; // Pasillo Vertical Oeste
    if (c <= 21) return 11; // Arte
    if (c <= 31) return 15; // Patio
    if (c <= 38) return 6; // Dirección
    return 9; // Cafetería
  }
  if (r >= 20 && r <= 23) return 0; // Pasillo Sur
  if (r >= 24 && r <= 28) {
    if (c <= 10) return 13; // Enfermería
    if (c <= 21) return 12; // Música
    if (c <= 40) return 4; // Gimnasio
    return 14; // Calderas
  }
  return 0;
}

/**
 * REQUISITO 2: Valida todos los objetos decorativos (tile === 8).
 * Solo pueden ir sobre casillas de piso libres, nunca sobre paredes ni dentro de una puerta,
 * y deben quedar a una distancia de al menos 2 casillas de cualquier puerta o paso.
 */
export function cleanAndValidateDecorations(map: number[][]) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (map[r][c] === 8) {
        // 1. Si cayó sobre muro perimetral o pared divisoria estructural, restaurar pared 1
        const isWallBoundary =
          r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1 ||
          (r === 8 && !isInsideAnyDoor(c, r)) ||
          (r === 12 && !isInsideAnyDoor(c, r)) ||
          (r === 19 && !isInsideAnyDoor(c, r)) ||
          (r === 23 && !isInsideAnyDoor(c, r));

        if (isWallBoundary) {
          map[r][c] = 1;
          continue;
        }

        // 2. Si está dentro de una puerta o abertura, limpiar a suelo libre
        if (isInsideAnyDoor(c, r)) {
          map[r][c] = getRoomFloorType(c, r);
          continue;
        }

        // 3. Si está a menos de 2 casillas de una puerta o paso, limpiar a suelo de la sala
        // (Salvo escritorios/pupitres debidamente posicionados que respeten pasos >= 2 casillas)
        const isDoorZone = isNearAnyDoor(c, r, 2);
        if (isDoorZone) {
          map[r][c] = getRoomFloorType(c, r);
        }
      }
    }
  }
}

/**
 * Comprueba si la casilla (c, r) está dentro de alguna abertura de puerta.
 */
export function isInsideAnyDoor(c: number, r: number): boolean {
  for (const door of SCHOOL_DOORS) {
    if (c >= door.c1 && c <= door.c2 && r >= door.r1 && r <= door.r2) {
      return true;
    }
  }
  return false;
}

/**
 * Realiza una búsqueda por anchura (BFS) para comprobar que todas las salas sean alcanzables.
 * Si alguna sala carece de acceso, abre automáticamente un paso amplio de 2 casillas.
 */
export function verifyAndEnsureAllRoomsReachable(map: number[][]): boolean[][] {
  const startCol = 25;
  const startRow = 10;
  const reachable: boolean[][] = Array(MAP_ROWS).fill(0).map(() => Array(MAP_COLS).fill(false));
  const queue: [number, number][] = [[startCol, startRow]];
  reachable[startRow][startCol] = true;

  const dCols = [0, 1, 0, -1];
  const dRows = [-1, 0, 1, 0];

  while (queue.length > 0) {
    const [c, r] = queue.shift()!;
    for (let i = 0; i < 4; i++) {
      const nc = c + dCols[i];
      const nr = r + dRows[i];
      if (nc >= 1 && nc < MAP_COLS - 1 && nr >= 1 && nr < MAP_ROWS - 1) {
        if (!reachable[nr][nc] && !isSolidTile(map[nr][nc])) {
          reachable[nr][nc] = true;
          queue.push([nc, nr]);
        }
      }
    }
  }

  // Comprobar cada sala de la escuela
  for (const room of ROOMS) {
    let reachableCount = 0;
    for (let r = room.y1; r <= room.y2; r++) {
      for (let c = room.x1; c <= room.x2; c++) {
        if (reachable[r][c] && !isSolidTile(map[r][c])) {
          reachableCount++;
        }
      }
    }

    if (reachableCount < 4) {
      // Abre una puerta de 2 casillas al pasillo más cercano
      if (room.y1 <= 8) {
        const midC = Math.floor((room.x1 + room.x2) / 2);
        map[8][midC] = 0;
        map[8][midC + 1] = 0;
      } else if (room.y1 >= 24) {
        const midC = Math.floor((room.x1 + room.x2) / 2);
        map[23][midC] = 0;
        map[23][midC + 1] = 0;
        map[24][midC] = 14;
        map[24][midC + 1] = 14;
      } else {
        const midC = Math.floor((room.x1 + room.x2) / 2);
        map[12][midC] = 0;
        map[12][midC + 1] = 0;
      }
    }
  }

  return reachable;
}

export function isSolidTile(tile: number): boolean {
  return tile === 1 || tile === 7 || tile === 8;
}

export interface CandidateHidingSpot {
  id: string;
  roomName: string;
  spotName: string;
  col: number;
  row: number;
}

// 15 candidate spots across 15 distinct rooms / wings
export const CANDIDATE_HIDING_SPOTS: CandidateHidingSpot[] = [
  {
    id: 'spot_aula101',
    roomName: 'Aula 101 (Matemáticas)',
    spotName: 'Escritorio de Matemáticas',
    col: 4,
    row: 4
  },
  {
    id: 'spot_banos',
    roomName: 'Baños Escolares',
    spotName: 'Gabinete de Limpieza',
    col: 17,
    row: 4
  },
  {
    id: 'spot_aula102',
    roomName: 'Aula 102 (Ciencias)',
    spotName: 'Mesa de Laboratorio',
    col: 28,
    row: 4
  },
  {
    id: 'spot_info',
    roomName: 'Laboratorio de Informática',
    spotName: 'Terminal de Servidores',
    col: 42,
    row: 4
  },
  {
    id: 'spot_biblioteca',
    roomName: 'Biblioteca',
    spotName: 'Estante de Enciclopedias',
    col: 7,
    row: 15
  },
  {
    id: 'spot_arte',
    roomName: 'Aula de Arte',
    spotName: 'Caballete de Pintura',
    col: 19,
    row: 15
  },
  {
    id: 'spot_patio',
    roomName: 'Patio Interior',
    spotName: 'Banco Bajo la Luna',
    col: 27,
    row: 14
  },
  {
    id: 'spot_direccion',
    roomName: 'Dirección y Sala de Profesores',
    spotName: 'Archivero del Director',
    col: 36,
    row: 15
  },
  {
    id: 'spot_cafeteria',
    roomName: 'Cafetería / Comedor',
    spotName: 'Barra del Comedor',
    col: 45,
    row: 15
  },
  {
    id: 'spot_enfermeria',
    roomName: 'Enfermería',
    spotName: 'Vitrina de Primeros Auxilios',
    col: 7,
    row: 25
  },
  {
    id: 'spot_musica',
    roomName: 'Sala de Música y Auditorio',
    spotName: 'Atril del Piano de Cola',
    col: 16,
    row: 26
  },
  {
    id: 'spot_gimnasio',
    roomName: 'Gimnasio Escolar',
    spotName: 'Banca de Baloncesto',
    col: 35,
    row: 25
  },
  {
    id: 'spot_calderas',
    roomName: 'Sótano / Sala de Calderas',
    spotName: 'Válvula de la Caldera',
    col: 45,
    row: 26
  },
  {
    id: 'spot_pasillo_norte',
    roomName: 'Pasillo Principal Norte',
    spotName: 'Casillero del Pasillo Norte',
    col: 20,
    row: 10
  },
  {
    id: 'spot_pasillo_sur',
    roomName: 'Pasillo Principal Sur',
    spotName: 'Vitrina del Pasillo Sur',
    col: 20,
    row: 21
  }
];

// Generates the 5 randomized items for each match:
// 3 keys + 2 code pieces in 5 distinct rooms
export function generateGameRunItems(code: string = DEFAULT_SECRET_CODE): SchoolItem[] {
  // Comprobación de alcanzabilidad desde el punto de inicio del jugador (25, 10)
  const mapTiles = buildSchoolTiles();
  const reachable = verifyAndEnsureAllRoomsReachable(mapTiles);

  // Filtrar spots para que SOLO aparezcan en casillas alcanzables y transitables
  const reachableCandidateSpots = CANDIDATE_HIDING_SPOTS.filter(spot => {
    return (
      spot.col >= 1 &&
      spot.col < MAP_COLS - 1 &&
      spot.row >= 1 &&
      spot.row < MAP_ROWS - 1 &&
      reachable[spot.row][spot.col] &&
      !isSolidTile(mapTiles[spot.row][spot.col])
    );
  });

  // Shuffle candidate spots alcanzables
  const shuffledSpots = [...reachableCandidateSpots].sort(() => Math.random() - 0.5);

  // Pick 5 spots that are in completely distinct rooms
  const selectedSpots: CandidateHidingSpot[] = [];
  const usedRooms = new Set<string>();

  for (const spot of shuffledSpots) {
    if (!usedRooms.has(spot.roomName)) {
      usedRooms.add(spot.roomName);
      selectedSpots.push(spot);
      if (selectedSpots.length === 5) break;
    }
  }

  const piece1Digits = code.slice(0, 2); // e.g. "74"
  const piece2Digits = code.slice(2, 4); // e.g. "29"

  const generatedItems: SchoolItem[] = [
    // 1. Llave de Bronce
    {
      id: 'key_bronze',
      type: 'key_bronze',
      name: 'Llave de Bronce',
      roomName: selectedSpots[0].roomName,
      spotName: selectedSpots[0].spotName,
      x: selectedSpots[0].col * TILE_SIZE + 14,
      y: selectedSpots[0].row * TILE_SIZE + 14,
      width: 32,
      height: 32,
      collected: false,
      description: `Una llave de bronce encontrada en ${selectedSpots[0].spotName}.`
    },
    // 2. Llave de Plata
    {
      id: 'key_silver',
      type: 'key_silver',
      name: 'Llave de Plata',
      roomName: selectedSpots[1].roomName,
      spotName: selectedSpots[1].spotName,
      x: selectedSpots[1].col * TILE_SIZE + 14,
      y: selectedSpots[1].row * TILE_SIZE + 14,
      width: 32,
      height: 32,
      collected: false,
      description: `Una llave de plata encontrada en ${selectedSpots[1].spotName}.`
    },
    // 3. Llave de Oro
    {
      id: 'key_gold',
      type: 'key_gold',
      name: 'Llave de Oro',
      roomName: selectedSpots[2].roomName,
      spotName: selectedSpots[2].spotName,
      x: selectedSpots[2].col * TILE_SIZE + 14,
      y: selectedSpots[2].row * TILE_SIZE + 14,
      width: 32,
      height: 32,
      collected: false,
      description: `Una llave de oro encontrada en ${selectedSpots[2].spotName}.`
    },
    // 4. Código Pieza 1 (Primeros 2 dígitos)
    {
      id: 'code_piece_1',
      type: 'code_piece_1',
      name: `Nota de Código (${piece1Digits} _ _)`,
      roomName: selectedSpots[3].roomName,
      spotName: selectedSpots[3].spotName,
      x: selectedSpots[3].col * TILE_SIZE + 14,
      y: selectedSpots[3].row * TILE_SIZE + 14,
      width: 32,
      height: 32,
      collected: false,
      codeDigits: piece1Digits,
      description: `Parte 1 del código de escape: [${piece1Digits} _ _]`
    },
    // 5. Código Pieza 2 (Últimos 2 dígitos)
    {
      id: 'code_piece_2',
      type: 'code_piece_2',
      name: `Nota de Código (_ _ ${piece2Digits})`,
      roomName: selectedSpots[4].roomName,
      spotName: selectedSpots[4].spotName,
      x: selectedSpots[4].col * TILE_SIZE + 14,
      y: selectedSpots[4].row * TILE_SIZE + 14,
      width: 32,
      height: 32,
      collected: false,
      codeDigits: piece2Digits,
      description: `Parte 2 del código de escape: [_ _ ${piece2Digits}]`
    },

    // PUERTA PRINCIPAL DE ESCAPE (EN EL PASILLO PRINCIPAL SUR)
    {
      id: 'exit_door',
      type: 'exit_door',
      name: 'Puerta Principal de Salida',
      roomName: 'Pasillo Principal Sur',
      spotName: 'Salida de la Escuela',
      x: 24 * TILE_SIZE,
      y: 22 * TILE_SIZE + 20,
      width: 120,
      height: 48,
      collected: false,
      description: 'La gran puerta de salida en el Pasillo Principal Sur. Requiere 3 llaves y el código de 4 dígitos.'
    }
  ];

  // 17 ARMARIOS: Colocación contra paredes respetando al menos 2 casillas libres ante puertas y anchos de pasillo >= 2
  const validatedLockers = buildValidatedLockers(mapTiles, generatedItems);
  generatedItems.push(...validatedLockers);

  return generatedItems;
}

export interface DoorOpening {
  r1: number;
  r2: number;
  c1: number;
  c2: number;
  name: string;
}

export const SCHOOL_DOORS: DoorOpening[] = [
  // Aula 101 doors to Pasillo Norte
  { r1: 8, r2: 8, c1: 4, c2: 5, name: 'Aula 101 Puerta Oeste' },
  { r1: 8, r2: 8, c1: 8, c2: 9, name: 'Aula 101 Puerta Este' },
  // Baños door to Pasillo Norte
  { r1: 8, r2: 8, c1: 16, c2: 17, name: 'Baños Puerta' },
  // Aula 102 doors to Pasillo Norte
  { r1: 8, r2: 8, c1: 26, c2: 27, name: 'Aula 102 Puerta Oeste' },
  { r1: 8, r2: 8, c1: 31, c2: 32, name: 'Aula 102 Puerta Este' },
  // Informática doors to Pasillo Norte
  { r1: 8, r2: 8, c1: 38, c2: 39, name: 'Informática Puerta Oeste' },
  { r1: 8, r2: 8, c1: 44, c2: 45, name: 'Informática Puerta Este' },

  // Biblioteca
  { r1: 12, r2: 12, c1: 5, c2: 6, name: 'Biblioteca Puerta Norte' },
  { r1: 19, r2: 19, c1: 5, c2: 6, name: 'Biblioteca Puerta Sur' },
  { r1: 15, r2: 16, c1: 13, c2: 13, name: 'Biblioteca Puerta Este' },

  // Pasillo Vertical Oeste (cols 14..15): wide open connection to North & South Hallways
  { r1: 9, r2: 12, c1: 14, c2: 15, name: 'Pasillo Vertical Conexión Norte' },
  { r1: 19, r2: 20, c1: 14, c2: 15, name: 'Pasillo Vertical Conexión Sur' },

  // Aula de Arte
  { r1: 12, r2: 12, c1: 18, c2: 19, name: 'Arte Puerta Norte' },
  { r1: 19, r2: 19, c1: 18, c2: 19, name: 'Arte Puerta Sur' },
  { r1: 15, r2: 16, c1: 22, c2: 22, name: 'Arte Puerta Este' },

  // Patio Interior (Arco Norte, Arco Sur, Puerta Este)
  { r1: 12, r2: 12, c1: 26, c2: 28, name: 'Patio Arco Norte' },
  { r1: 19, r2: 19, c1: 26, c2: 28, name: 'Patio Arco Sur' },
  { r1: 15, r2: 16, c1: 32, c2: 32, name: 'Patio Puerta Este' },

  // Dirección y Profesores
  { r1: 12, r2: 12, c1: 35, c2: 36, name: 'Dirección Puerta Norte' },
  { r1: 19, r2: 19, c1: 35, c2: 36, name: 'Dirección Puerta Sur' },
  { r1: 15, r2: 16, c1: 39, c2: 39, name: 'Dirección Puerta Este' },

  // Cafetería / Comedor
  { r1: 12, r2: 12, c1: 42, c2: 43, name: 'Cafetería Puerta Norte 1' },
  { r1: 12, r2: 12, c1: 46, c2: 47, name: 'Cafetería Puerta Norte 2' },
  { r1: 19, r2: 19, c1: 42, c2: 43, name: 'Cafetería Puerta Sur 1' },
  { r1: 19, r2: 19, c1: 46, c2: 47, name: 'Cafetería Puerta Sur 2' },

  // Enfermería
  { r1: 23, r2: 23, c1: 5, c2: 6, name: 'Enfermería Puerta Norte' },
  { r1: 25, r2: 26, c1: 11, c2: 11, name: 'Enfermería Puerta Este' },

  // Sala de Música y Auditorio
  { r1: 23, r2: 23, c1: 14, c2: 15, name: 'Música Puerta Norte 1' },
  { r1: 23, r2: 23, c1: 18, c2: 19, name: 'Música Puerta Norte 2' },

  // Gimnasio
  { r1: 23, r2: 23, c1: 32, c2: 33, name: 'Gimnasio Puerta Norte 1' },
  { r1: 23, r2: 23, c1: 37, c2: 38, name: 'Gimnasio Puerta Norte 2' },
  { r1: 25, r2: 26, c1: 41, c2: 41, name: 'Gimnasio Túnel Este' },

  // Sótano / Calderas
  { r1: 23, r2: 23, c1: 44, c2: 46, name: 'Calderas Entrada Norte' },

  // Salida Principal
  { r1: 22, r2: 23, c1: 24, c2: 26, name: 'Salida Principal' }
];

/**
 * Comprueba si una casilla está a menos de clearanceTiles casillas delante o a los lados
 * de cualquier puerta o abertura de la escuela.
 */
export function isNearAnyDoor(c: number, r: number, clearanceTiles: number = 2): boolean {
  for (const door of SCHOOL_DOORS) {
    if (
      c >= door.c1 - clearanceTiles &&
      c <= door.c2 + clearanceTiles &&
      r >= door.r1 - clearanceTiles &&
      r <= door.r2 + clearanceTiles
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Comprueba si la casilla está pegada directamente a una pared sólida (tile === 1).
 */
export function isAgainstSolidWall(c: number, r: number, map: number[][]): boolean {
  return (
    (r > 0 && map[r - 1][c] === 1) ||
    (r < MAP_ROWS - 1 && map[r + 1][c] === 1) ||
    (c > 0 && map[r][c - 1] === 1) ||
    (c < MAP_COLS - 1 && map[r][c + 1] === 1)
  );
}

/**
 * Comprueba que colocar un armario en (c, r) no reduzca ningún pasillo a menos de 2 casillas libres.
 */
export function preservesCorridorWidth(c: number, r: number): boolean {
  // En el Pasillo Vertical Oeste (cols 14..15): el ancho es de solo 2 casillas, jamás colocar armarios aquí
  if (c >= 14 && c <= 15 && r >= 9 && r <= 20) {
    return false;
  }
  // En el Pasillo Norte (filas 9..11, altura 3): solo permitido en fila 9 contra pared fila 8, dejando filas 10 y 11 libres
  if (r === 10 && c >= 1 && c <= 48) {
    return false;
  }
  return true;
}

export interface LockerPlacementDef {
  id: string;
  name: string;
  roomName: string;
  spotName: string;
  targetCol: number;
  targetRow: number;
  description: string;
}

// 17 armarios distribuidos equitativamente por todas las salas y pasillos (1 o 2 por zona)
export const RAW_LOCKER_DEFS: LockerPlacementDef[] = [
  // 1. Aula 101: esquina col 2 row 2 (pegado a pared, >6 casillas de puertas)
  {
    id: 'locker_aula101',
    name: 'Armario de Aula 101',
    roomName: 'Aula 101 (Matemáticas)',
    spotName: 'Armario de suministros',
    targetCol: 2,
    targetRow: 2,
    description: 'Un armario alto de suministros matemáticos.'
  },
  // 2. Baños Escolares: col 14 row 2 (pegado a pared, >6 casillas de puerta)
  {
    id: 'locker_banos',
    name: 'Armario de Baños',
    roomName: 'Baños Escolares',
    spotName: 'Casillero de limpieza',
    targetCol: 14,
    targetRow: 2,
    description: 'Un casillero metálico para el conserje.'
  },
  // 3. Aula 102: col 33 row 2 (pegado a pared norte, >6 casillas de puertas)
  {
    id: 'locker_aula102',
    name: 'Armario de Aula 102',
    roomName: 'Aula 102 (Ciencias)',
    spotName: 'Armario de laboratorio',
    targetCol: 33,
    targetRow: 2,
    description: 'Un armario de instrumental científico.'
  },
  // 4. Laboratorio de Informática: col 47 row 2 (esquina este, >6 casillas de puertas)
  {
    id: 'locker_info',
    name: 'Armario de Informática',
    roomName: 'Laboratorio de Informática',
    spotName: 'Gabinete técnico',
    targetCol: 47,
    targetRow: 2,
    description: 'Un casillero metálico junto a los servidores.'
  },
  // 5. Pasillo Principal Norte (Oeste): col 12 row 9 (pegado a pared norte, a >3 casillas de puertas de Aula 101 y Baños, filas 10 y 11 libres)
  {
    id: 'locker_hall_north_1',
    name: 'Armario Pasillo Norte (Oeste)',
    roomName: 'Pasillo Principal Norte',
    spotName: 'Casillero oeste',
    targetCol: 12,
    targetRow: 9,
    description: 'Un casillero metálico en el pasillo norte.'
  },
  // 6. Pasillo Principal Norte (Este): col 22 row 9 (pegado a pared norte entre Baños y Aula 102, a >4 casillas de puertas, filas 10 y 11 libres)
  {
    id: 'locker_hall_north_2',
    name: 'Armario Pasillo Norte (Este)',
    roomName: 'Pasillo Principal Norte',
    spotName: 'Casillero este',
    targetCol: 22,
    targetRow: 9,
    description: 'Un casillero metálico cerca de informática.'
  },
  // 7. Biblioteca: col 2 row 15 (pegado a pared oeste col 1, a >3 casillas de puertas norte y sur)
  {
    id: 'locker_library',
    name: 'Armario de Biblioteca',
    roomName: 'Biblioteca',
    spotName: 'Casillero de lectura',
    targetCol: 2,
    targetRow: 15,
    description: 'Un casillero junto a los estantes de lectura.'
  },
  // 8. Aula de Arte: col 16 row 16 (pegado a pared oeste col 15, >2 casillas de puertas)
  {
    id: 'locker_arte',
    name: 'Armario de Arte',
    roomName: 'Aula de Arte',
    spotName: 'Armario de lienzos',
    targetCol: 16,
    targetRow: 16,
    description: 'Un armario de materiales de pintura.'
  },
  // 9. Patio Interior: col 23 row 13 (esquina noroeste bajo pared norte row 12 y pared oeste col 22, >2 casillas de arcos y puertas)
  {
    id: 'locker_patio',
    name: 'Armario de Jardinería',
    roomName: 'Patio Interior',
    spotName: 'Caseta de jardinería',
    targetCol: 23,
    targetRow: 13,
    description: 'Una caseta de jardinería bajo los sauces.'
  },
  // 10. Dirección y Profesores: col 38 row 13 (esquina noreste contra pared norte row 12 y este col 39, >=2 casillas de puertas)
  {
    id: 'locker_direccion',
    name: 'Armario de Dirección',
    roomName: 'Dirección y Sala de Profesores',
    spotName: 'Armario de profesores',
    targetCol: 38,
    targetRow: 13,
    description: 'Un armario de madera oscura para profesores.'
  },
  // 11. Cafetería / Comedor: col 40 row 13 (esquina noroeste contra pared norte row 12 y pared oeste col 39, >=2 casillas de puertas)
  {
    id: 'locker_cafeteria',
    name: 'Armario de Cafetería',
    roomName: 'Cafetería / Comedor',
    spotName: 'Armario de despensa',
    targetCol: 40,
    targetRow: 13,
    description: 'Un armario de despensa cerca de la cocina.'
  },
  // 12. Pasillo Principal Sur (Oeste): col 2 row 20 (esquina noroeste contra pared oeste col 1 y norte row 19, a >3 casillas de puertas, filas 21..23 libres)
  {
    id: 'locker_hall_south_1',
    name: 'Armario Pasillo Sur (Oeste)',
    roomName: 'Pasillo Principal Sur',
    spotName: 'Casillero del ala oeste',
    targetCol: 2,
    targetRow: 20,
    description: 'Un casillero escolar cerca de enfermería.'
  },
  // 13. Pasillo Principal Sur (Este): col 41 row 20 (contra pared norte row 19 entre Gimnasio y Calderas, >=2 casillas de puertas, filas 21..23 libres)
  {
    id: 'locker_hall_south_2',
    name: 'Armario Pasillo Sur (Este)',
    roomName: 'Pasillo Principal Sur',
    spotName: 'Casillero del ala este',
    targetCol: 41,
    targetRow: 20,
    description: 'Un casillero escolar cerca del gimnasio.'
  },
  // 14. Enfermería: col 2 row 27 (esquina suroeste contra pared sur row 28 y oeste col 1, a >4 casillas de puertas)
  {
    id: 'locker_enfermeria',
    name: 'Armario de Enfermería',
    roomName: 'Enfermería',
    spotName: 'Armario médico',
    targetCol: 2,
    targetRow: 27,
    description: 'Un armario de suministros clínicos.'
  },
  // 15. Sala de Música y Auditorio: col 21 row 27 (esquina sureste contra pared este col 22 y sur row 28, a >4 casillas de puertas)
  {
    id: 'locker_musica',
    name: 'Armario de Música',
    roomName: 'Sala de Música y Auditorio',
    spotName: 'Armario de instrumentos',
    targetCol: 21,
    targetRow: 27,
    description: 'Un armario de instrumentos y cables de sonido.'
  },
  // 16. Gimnasio Escolar: col 35 row 28 (contra pared sur row 28, a >5 casillas de puertas)
  {
    id: 'locker_gym',
    name: 'Armario del Gimnasio',
    roomName: 'Gimnasio Escolar',
    spotName: 'Armario deportivo',
    targetCol: 35,
    targetRow: 28,
    description: 'Un casillero de utilería deportiva.'
  },
  // 17. Sótano / Sala de Calderas: col 48 row 27 (esquina sureste contra pared este col 49 y sur row 28, a >4 casillas de puertas)
  {
    id: 'locker_boiler',
    name: 'Armario del Sótano',
    roomName: 'Sótano / Sala de Calderas',
    spotName: 'Casillero de calderas',
    targetCol: 48,
    targetRow: 27,
    description: 'Un armario de hierro reforzado cerca de las calderas.'
  }
];

/**
 * Valida y posiciona cada armario. Comprueba con BFS que todas las puertas, salas y llaves
 * sigan siendo 100% alcanzables. Si algún armario no cumple o bloquea un paso, busca la casilla
 * válida más cercana contra una pared.
 */
export function buildValidatedLockers(map: number[][], currentItems: SchoolItem[]): SchoolItem[] {
  const placedTiles: { col: number; row: number }[] = [];
  const resultLockers: SchoolItem[] = [];

  const isValidLockerSpot = (c: number, r: number): boolean => {
    if (c < 1 || c >= MAP_COLS - 1 || r < 1 || r >= MAP_ROWS - 1) return false;
    if (isSolidTile(map[r][c])) return false;
    if (isNearAnyDoor(c, r, 2)) return false;
    if (!isAgainstSolidWall(c, r, map)) return false;
    if (!preservesCorridorWidth(c, r)) return false;

    // No superponerse con otro armario colocado (distancia >= 2 casillas)
    for (const p of placedTiles) {
      if (Math.abs(p.col - c) < 2 && Math.abs(p.row - r) < 2) {
        return false;
      }
    }

    // No superponerse con items clave generados
    for (const item of currentItems) {
      const iCol = Math.floor(item.x / TILE_SIZE);
      const iRow = Math.floor(item.y / TILE_SIZE);
      if (Math.abs(iCol - c) < 1 && Math.abs(iRow - r) < 1) {
        return false;
      }
    }

    return true;
  };

  for (const def of RAW_LOCKER_DEFS) {
    let chosenCol = def.targetCol;
    let chosenRow = def.targetRow;

    if (!isValidLockerSpot(chosenCol, chosenRow)) {
      // Búsqueda en espiral por la casilla válida más cercana contra pared
      let found = false;
      for (let radius = 1; radius <= 15 && !found; radius++) {
        for (let dr = -radius; dr <= radius && !found; dr++) {
          for (let dc = -radius; dc <= radius && !found; dc++) {
            if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
            const candC = def.targetCol + dc;
            const candR = def.targetRow + dr;
            if (isValidLockerSpot(candC, candR)) {
              chosenCol = candC;
              chosenRow = candR;
              found = true;
            }
          }
        }
      }
    }

    placedTiles.push({ col: chosenCol, row: chosenRow });

    resultLockers.push({
      id: def.id,
      type: 'locker',
      name: def.name,
      roomName: def.roomName,
      spotName: def.spotName,
      x: chosenCol * TILE_SIZE + 8,
      y: chosenRow * TILE_SIZE + 6,
      width: 44,
      height: 48,
      description: def.description
    });
  }

  return resultLockers;
}

export function getCurrentRoomName(px: number, py: number): string {
  const col = Math.floor(px / TILE_SIZE);
  const row = Math.floor(py / TILE_SIZE);

  for (const room of ROOMS) {
    if (col >= room.x1 && col <= room.x2 && row >= room.y1 && row <= room.y2) {
      return room.name;
    }
  }
  return 'Pasillo de la Escuela';
}

export const PLAYER_COLLISION_RADIUS = 12;

export function getTileHitbox(r: number, c: number, tileType: number) {
  const x1 = c * TILE_SIZE;
  const y1 = r * TILE_SIZE;
  const x2 = (c + 1) * TILE_SIZE;
  const y2 = (r + 1) * TILE_SIZE;

  // Desks, furniture, obstacles (tile 8)
  if (tileType === 8) {
    // Pupitres y mesas rectangulares (~proporción 2:1 orientados al pizarrón)
    // El dibujo mide 50px ancho x 25px alto (x+5 a x+55, y+12 a y+37)
    // La caja de colisión es ligeramente menor que el dibujo: 46px ancho x 21px alto (x+7 a x+53, y+14 a y+35)
    const isClassroomDesk =
      (r === 3 || r === 6) &&
      ((c >= 2 && c <= 11) || (c >= 24 && c <= 34) || (c >= 37 && c <= 46));
    const isCafeteriaTable = (r === 14 || r === 17) && (c >= 41 && c <= 46);
    const isAuditoriumSeat = r === 25 && c >= 13 && c <= 20;
    const isExecutiveDesk = r === 14 && (c === 35 || c === 36);

    if (isClassroomDesk || isCafeteriaTable || isAuditoriumSeat || isExecutiveDesk) {
      return {
        x1: x1 + 7,
        y1: y1 + 14,
        x2: x2 - 7,
        y2: y1 + 35
      };
    }

    // Estanterías de biblioteca horizontales
    if (c >= 3 && c <= 10 && (r === 14 || r === 16 || r === 18)) {
      return {
        x1: x1 + 6,
        y1: y1 + 8,
        x2: x2 - 6,
        y2: y2 - 14
      };
    }

    // Obstáculos generales (reducido en 7px para navegación suave)
    const margin = 7;
    return {
      x1: x1 + margin,
      y1: y1 + margin,
      x2: x2 - margin,
      y2: y2 - margin
    };
  }

  // Regular solid walls and grates
  return { x1, y1, x2, y2 };
}

/**
 * REQUISITO 1: Caja de colisión de los armarios algo más pequeña que su dibujo (aprox. 80 %)
 * y alineada a la cuadrícula.
 */
export function getLockerHitbox(item: { x: number; y: number; width: number; height: number }) {
  const insetX = (item.width * 0.2) / 2; // ~4.4px
  const insetY = (item.height * 0.2) / 2; // ~4.8px
  return {
    x1: item.x + insetX,
    y1: item.y + insetY,
    x2: item.x + item.width - insetX,
    y2: item.y + item.height - insetY
  };
}

/**
 * Checks if a circle at (px, py) with radius r collides with any solid tile hitbox or locker (80% hitbox)
 */
export function isPositionBlocked(
  px: number,
  py: number,
  r: number,
  tiles: number[][],
  items?: SchoolItem[],
  ignoreLockerId?: string | null
): boolean {
  // Boundary check
  if (
    px - r < TILE_SIZE ||
    px + r > (MAP_COLS - 1) * TILE_SIZE ||
    py - r < TILE_SIZE ||
    py + r > (MAP_ROWS - 1) * TILE_SIZE
  ) {
    return true;
  }

  const minC = Math.max(0, Math.floor((px - r) / TILE_SIZE));
  const maxC = Math.min(MAP_COLS - 1, Math.floor((px + r) / TILE_SIZE));
  const minR = Math.max(0, Math.floor((py - r) / TILE_SIZE));
  const maxR = Math.min(MAP_ROWS - 1, Math.floor((py + r) / TILE_SIZE));

  for (let row = minR; row <= maxR; row++) {
    for (let col = minC; col <= maxC; col++) {
      const tile = tiles[row][col];
      if (isSolidTile(tile)) {
        const bounds = getTileHitbox(row, col, tile);
        const closestX = Math.max(bounds.x1, Math.min(px, bounds.x2));
        const closestY = Math.max(bounds.y1, Math.min(py, bounds.y2));
        const distX = px - closestX;
        const distY = py - closestY;
        if (distX * distX + distY * distY < r * r) {
          return true;
        }
      }
    }
  }

  // REQUISITO 1: Colisión con armarios (caja de colisión al 80% alineada)
  if (items) {
    for (const item of items) {
      if (item.type === 'locker' && item.id !== ignoreLockerId) {
        const bounds = getLockerHitbox(item);
        const closestX = Math.max(bounds.x1, Math.min(px, bounds.x2));
        const closestY = Math.max(bounds.y1, Math.min(py, bounds.y2));
        const dx = px - closestX;
        const dy = py - closestY;
        if (dx * dx + dy * dy < r * r) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * REQUISITO 1: Resuelve el movimiento por ejes separados (X e Y independientes).
 * NUNCA mueve al jugador hacia atrás ni aplica rebote, restitución ni empuje de salida al chocar:
 * simplemente lo frena y, si el joystick apunta en diagonal, deja que se deslice a lo largo de la superficie.
 * Mantiene la ayuda de esquinas.
 */
export function resolvePlayerMovement(
  player: { x: number; y: number },
  normX: number,
  normY: number,
  speed: number,
  dt: number,
  tiles: number[][],
  items?: SchoolItem[],
  ignoreLockerId?: string | null
) {
  const totalDist = speed * dt;
  if (totalDist <= 0) return;

  const SUB_STEP_SIZE = 3;
  const numSteps = Math.max(1, Math.ceil(totalDist / SUB_STEP_SIZE));
  const dxStep = (normX * totalDist) / numSteps;
  const dyStep = (normY * totalDist) / numSteps;
  const r = PLAYER_COLLISION_RADIUS;

  for (let s = 0; s < numSteps; s++) {
    // 1. Resolve X movement independently (allows smooth sliding along Y surfaces)
    if (Math.abs(dxStep) > 0.0001) {
      const testX = player.x + dxStep;
      if (!isPositionBlocked(testX, player.y, r, tiles, items, ignoreLockerId)) {
        player.x = testX;
      } else {
        // Corner assist on X: if moving horizontally into an edge/corner, nudge vertically towards open space
        const assistDist = 6;
        if (!isPositionBlocked(testX, player.y - assistDist, r, tiles, items, ignoreLockerId)) {
          player.y -= 1.8;
          if (!isPositionBlocked(testX, player.y, r, tiles, items, ignoreLockerId)) {
            player.x = testX;
          }
        } else if (!isPositionBlocked(testX, player.y + assistDist, r, tiles, items, ignoreLockerId)) {
          player.y += 1.8;
          if (!isPositionBlocked(testX, player.y, r, tiles, items, ignoreLockerId)) {
            player.x = testX;
          }
        }
        // Sin rebote: si está bloqueado, se frena limpiamente
      }
    }

    // 2. Resolve Y movement independently (allows smooth sliding along X surfaces)
    if (Math.abs(dyStep) > 0.0001) {
      const testY = player.y + dyStep;
      if (!isPositionBlocked(player.x, testY, r, tiles, items, ignoreLockerId)) {
        player.y = testY;
      } else {
        // Corner assist on Y: if moving vertically into an edge/corner, nudge horizontally towards open space
        const assistDist = 6;
        if (!isPositionBlocked(player.x - assistDist, testY, r, tiles, items, ignoreLockerId)) {
          player.x -= 1.8;
          if (!isPositionBlocked(player.x, testY, r, tiles, items, ignoreLockerId)) {
            player.y = testY;
          }
        } else if (!isPositionBlocked(player.x + assistDist, testY, r, tiles, items, ignoreLockerId)) {
          player.x += 1.8;
          if (!isPositionBlocked(player.x, testY, r, tiles, items, ignoreLockerId)) {
            player.y = testY;
          }
        }
        // Sin rebote: si está bloqueado, se frena limpiamente
      }
    }
  }
}

/**
 * Checks if a circle at (px, py) with radius r collides with solid tiles or lockers
 */
export function isPositionBlockedWithItems(
  px: number,
  py: number,
  r: number,
  tiles: number[][],
  items?: SchoolItem[],
  ignoreLockerId?: string | null
): boolean {
  return isPositionBlocked(px, py, r, tiles, items, ignoreLockerId);
}

/**
 * Searches for the nearest free walkable position around (startX, startY),
 * prioritizing preferredPos if valid, then testing radially.
 */
export function findSafeUnstuckPosition(
  startX: number,
  startY: number,
  r: number,
  tiles: number[][],
  items?: SchoolItem[],
  preferredPos?: { x: number; y: number } | null
): { x: number; y: number } {
  // 1. Prioritize preferred position (e.g. entry position before hiding)
  if (preferredPos && !isPositionBlockedWithItems(preferredPos.x, preferredPos.y, r, tiles, items)) {
    return { x: preferredPos.x, y: preferredPos.y };
  }

  // 2. Test start position
  if (!isPositionBlockedWithItems(startX, startY, r, tiles, items)) {
    return { x: startX, y: startY };
  }

  // 3. Radial search outward in concentric circles (from 16px to 220px)
  const angles = [
    0,
    Math.PI / 2,
    Math.PI,
    (3 * Math.PI) / 2,
    Math.PI / 4,
    (3 * Math.PI) / 4,
    (5 * Math.PI) / 4,
    (7 * Math.PI) / 4,
    Math.PI / 8,
    (3 * Math.PI) / 8,
    (5 * Math.PI) / 8,
    (7 * Math.PI) / 8,
    (9 * Math.PI) / 8,
    (11 * Math.PI) / 8,
    (13 * Math.PI) / 8,
    (15 * Math.PI) / 8
  ];

  for (let dist = 16; dist <= 220; dist += 14) {
    for (const ang of angles) {
      const candX = startX + Math.cos(ang) * dist;
      const candY = startY + Math.sin(ang) * dist;
      if (!isPositionBlockedWithItems(candX, candY, r, tiles, items)) {
        return { x: candX, y: candY };
      }
    }
  }

  // Safe fallback to central North hallway
  return { x: 25 * TILE_SIZE, y: 10 * TILE_SIZE };
}

