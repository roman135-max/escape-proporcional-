export interface ProportionalityProblem {
  id: number;
  type: 'directa' | 'inversa';
  title: string;
  statement: string;
  question: string;
  givenData: string[];
  formula: string;
  steps: string[];
  finalAnswer: string;
  numericAnswer: number;
}

export const PROPORTIONALITY_PROBLEMS: ProportionalityProblem[] = [
  // --- DIRECT PROPORTIONALITY (10 PROBLEMS) ---
  {
    id: 1,
    type: 'directa',
    title: 'Los Cuadernos de Matemáticas',
    statement: 'En la librería escolar, 3 cuadernos iguales cuestan $45 pesos.',
    question: '¿Cuánto costarán 7 cuadernos del mismo tipo?',
    givenData: ['3 cuadernos → $45', '7 cuadernos → ¿$X?'],
    formula: 'Proporcionalidad Directa: Si aumenta la cantidad de cuadernos, aumenta el costo en la misma razón.',
    steps: [
      '1. Calculamos el precio de 1 solo cuaderno: 45 ÷ 3 = $15 pesos por cuaderno.',
      '2. Multiplicamos el valor unitario por la nueva cantidad solicitada: 7 × 15 = $105 pesos.',
      '3. O por regla de tres directa: X = (7 × 45) ÷ 3 = 315 ÷ 3 = 105.'
    ],
    finalAnswer: '$105 pesos',
    numericAnswer: 105
  },
  {
    id: 2,
    type: 'directa',
    title: 'Viaje en el Autobús Escolar',
    statement: 'El autobús escolar recorre 180 kilómetros en 2 horas manteniendo una velocidad constante.',
    question: '¿Cuántos kilómetros recorrerá en 5 horas si mantiene la misma velocidad?',
    givenData: ['2 horas → 180 km', '5 horas → ¿X km?'],
    formula: 'Proporcionalidad Directa: A mayor tiempo de viaje, mayor distancia recorrida.',
    steps: [
      '1. Hallamos la velocidad (km recorridos en 1 hora): 180 ÷ 2 = 90 km/h.',
      '2. Calculamos la distancia para 5 horas: 90 × 5 = 450 km.',
      '3. Mediante regla de tres: X = (5 × 180) ÷ 2 = 900 ÷ 2 = 450.'
    ],
    finalAnswer: '450 km',
    numericAnswer: 450
  },
  {
    id: 3,
    type: 'directa',
    title: 'Galletas para el Desayuno',
    statement: 'Para hornear 12 galletas se necesitan exactamente 150 gramos de harina.',
    question: '¿Cuántos gramos de harina se necesitan para preparar 36 galletas?',
    givenData: ['12 galletas → 150 g de harina', '36 galletas → ¿X g?'],
    formula: 'Proporcionalidad Directa: Para hacer el triple de galletas se necesita el triple de ingredientes.',
    steps: [
      '1. Observamos que 36 galletas es exactamente el triple de 12 (36 ÷ 12 = 3).',
      '2. Multiplicamos la cantidad original de harina por 3: 150 × 3 = 450 gramos.',
      '3. Por regla de tres: X = (36 × 150) ÷ 12 = 5400 ÷ 12 = 450.'
    ],
    finalAnswer: '450 gramos de harina',
    numericAnswer: 450
  },
  {
    id: 4,
    type: 'directa',
    title: 'La Impresora de la Escuela',
    statement: 'La fotocopiadora de la dirección imprime 40 exámenes en 2 minutos.',
    question: '¿Cuántos exámenes imprimirá en 6 minutos manteniendo el mismo ritmo?',
    givenData: ['2 minutos → 40 exámenes', '6 minutos → ¿X exámenes?'],
    formula: 'Proporcionalidad Directa: A más tiempo imprimiendo, mayor cantidad de exámenes listos.',
    steps: [
      '1. Hallamos la producción por minuto: 40 ÷ 2 = 20 exámenes por minuto.',
      '2. Multiplicamos por 6 minutos: 20 × 6 = 120 exámenes.',
      '3. O regla de tres directa: X = (6 × 40) ÷ 2 = 240 ÷ 2 = 120.'
    ],
    finalAnswer: '120 exámenes',
    numericAnswer: 120
  },
  {
    id: 5,
    type: 'directa',
    title: 'Entradas para el Museo de Ciencias',
    statement: 'Un grupo de 5 estudiantes pagó un total de $250 por sus entradas al museo.',
    question: '¿Cuánto pagarán en total 8 estudiantes con la misma tarifa?',
    givenData: ['5 estudiantes → $250', '8 estudiantes → ¿$X?'],
    formula: 'Proporcionalidad Directa: El costo total aumenta proporcionalmente al número de entradas.',
    steps: [
      '1. Calculamos el valor de 1 entrada: 250 ÷ 5 = $50 por persona.',
      '2. Multiplicamos por 8 personas: 50 × 8 = $400.',
      '3. Por regla de tres: X = (8 × 250) ÷ 5 = 2000 ÷ 5 = 400.'
    ],
    finalAnswer: '$400 pesos',
    numericAnswer: 400
  },
  {
    id: 6,
    type: 'directa',
    title: 'Envasadora de Agua Mineral',
    statement: 'Una máquina de la cafetería envasa 300 botellas de agua en 15 minutos.',
    question: '¿Cuántas botellas logrará envasar en 45 minutos trabajando continuamente?',
    givenData: ['15 minutos → 300 botellas', '45 minutos → ¿X botellas?'],
    formula: 'Proporcionalidad Directa: 45 minutos es 3 veces 15 minutos (45 ÷ 15 = 3).',
    steps: [
      '1. Calculamos botellas por minuto: 300 ÷ 15 = 20 botellas/min.',
      '2. En 45 minutos: 20 × 45 = 900 botellas.',
      '3. O bien: 300 × 3 = 900 botellas.'
    ],
    finalAnswer: '900 botellas',
    numericAnswer: 900
  },
  {
    id: 7,
    type: 'directa',
    title: 'Tela para Cortinas del Gimnasio',
    statement: 'Comprar 4 metros de tela para las cortinas de la escuela cuesta $120 pesos.',
    question: '¿Cuánto costará comprar 9 metros de la misma tela?',
    givenData: ['4 metros → $120', '9 metros → ¿$X?'],
    formula: 'Proporcionalidad Directa: A más metros de tela, más dinero se debe pagar.',
    steps: [
      '1. Precio por cada metro de tela: 120 ÷ 4 = $30 el metro.',
      '2. Precio por 9 metros: 30 × 9 = $270 pesos.',
      '3. Regla de tres directa: X = (9 × 120) ÷ 4 = 1080 ÷ 4 = 270.'
    ],
    finalAnswer: '$270 pesos',
    numericAnswer: 270
  },
  {
    id: 8,
    type: 'directa',
    title: 'Entrenamiento de Ciclismo',
    statement: 'El profesor de educación física recorre en bicicleta 24 km en 1 hora con velocidad constante.',
    question: '¿Qué distancia total alcanzará a recorrer en 3.5 horas?',
    givenData: ['1 hora → 24 km', '3.5 horas → ¿X km?'],
    formula: 'Proporcionalidad Directa: Distancia = Velocidad × Tiempo.',
    steps: [
      '1. Multiplicamos la velocidad por las 3.5 horas: 24 × 3.5 = 84 km.',
      '2. (24 × 3 = 72 km; 24 × 0.5 = 12 km; 72 + 12 = 84 km).'
    ],
    finalAnswer: '84 km',
    numericAnswer: 84
  },
  {
    id: 9,
    type: 'directa',
    title: 'Pintando las Aulas',
    statement: 'Para pintar 2 aulas completas del colegio se utilizaron 6 litros de pintura especial.',
    question: '¿Cuántos litros se requerirán para pintar 5 aulas idénticas?',
    givenData: ['2 aulas → 6 litros', '5 aulas → ¿X litros?'],
    formula: 'Proporcionalidad Directa: El consumo de pintura aumenta proporcionalmente a las aulas.',
    steps: [
      '1. Litros consumidos por aula: 6 ÷ 2 = 3 litros por aula.',
      '2. Para 5 aulas: 3 × 5 = 15 litros de pintura.',
      '3. Por regla de tres: X = (5 × 6) ÷ 2 = 30 ÷ 2 = 15.'
    ],
    finalAnswer: '15 litros',
    numericAnswer: 15
  },
  {
    id: 10,
    type: 'directa',
    title: 'Fotocopias de la Tarea',
    statement: 'Sacar 8 fotocopias de la guía de estudio cuesta $16 pesos en el centro de copiado.',
    question: '¿Cuánto costará sacar 25 fotocopias de esa misma guía?',
    givenData: ['8 fotocopias → $16', '25 fotocopias → ¿$X?'],
    formula: 'Proporcionalidad Directa: Precio unitario constante.',
    steps: [
      '1. Costo por fotocopia: 16 ÷ 8 = $2 pesos cada fotocopia.',
      '2. Para 25 copias: 25 × 2 = $50 pesos.',
      '3. Regla de tres: X = (25 × 16) ÷ 8 = 400 ÷ 8 = 50.'
    ],
    finalAnswer: '$50 pesos',
    numericAnswer: 50
  },

  // --- INVERSE PROPORTIONALITY (10 PROBLEMS) ---
  {
    id: 11,
    type: 'inversa',
    title: 'Construcción del Muro Escolar',
    statement: '3 obreros tardan 12 días en levantar un muro de protección en el patio de la escuela.',
    question: '¿Cuántos días tardarán 6 obreros trabajando al mismo ritmo?',
    givenData: ['3 obreros → 12 días', '6 obreros → ¿X días?'],
    formula: 'Proporcionalidad Inversa: A más obreros, MENOS días se tardan. La constante es Obreros × Días.',
    steps: [
      '1. Calculamos la carga total de trabajo (obrero-días): 3 × 12 = 36 unidades de trabajo.',
      '2. Dividimos el trabajo total entre el nuevo número de obreros: 36 ÷ 6 = 6 días.',
      '3. Regla de tres inversa: X = (3 × 12) ÷ 6 = 36 ÷ 6 = 6 días.'
    ],
    finalAnswer: '6 días',
    numericAnswer: 6
  },
  {
    id: 12,
    type: 'inversa',
    title: 'Llenado del Depósito de Agua',
    statement: 'Un grifo con caudal de 20 litros por minuto llena el depósito del colegio en 6 horas.',
    question: '¿Cuánto tiempo tardará si se cambia por un grifo más potente de 40 litros por minuto?',
    givenData: ['20 L/min → 6 horas', '40 L/min → ¿X horas?'],
    formula: 'Proporcionalidad Inversa: A mayor caudal de agua, MENOS tiempo se tarda en llenar.',
    steps: [
      '1. Capacidad proporcional constante: 20 × 6 = 120.',
      '2. Calculamos las nuevas horas dividiendo por 40 L/min: 120 ÷ 40 = 3 horas.',
      '3. Observa que como el caudal se duplicó (de 20 a 40), el tiempo se reduce a la mitad (de 6 a 3).'
    ],
    finalAnswer: '3 horas',
    numericAnswer: 3
  },
  {
    id: 13,
    type: 'inversa',
    title: 'Velocidad y Tiempo de Llegada',
    statement: 'Un vehículo viaja a 60 km/h y tarda 4 horas en llegar de una ciudad a otra.',
    question: '¿Cuánto tiempo tardará si aumenta su velocidad media a 80 km/h?',
    givenData: ['60 km/h → 4 horas', '80 km/h → ¿X horas?'],
    formula: 'Proporcionalidad Inversa: A mayor velocidad, menor tiempo de viaje. Distancia = Velocidad × Tiempo.',
    steps: [
      '1. Distancia total recorrida: 60 × 4 = 240 km.',
      '2. Tiempo a 80 km/h: 240 ÷ 80 = 3 horas.',
      '3. Regla de tres inversa: X = (60 × 4) ÷ 80 = 240 ÷ 80 = 3.'
    ],
    finalAnswer: '3 horas',
    numericAnswer: 3
  },
  {
    id: 14,
    type: 'inversa',
    title: 'Vaciando la Alberca de la Escuela',
    statement: '4 bombas de desagüe vacían la alberca olímpica de la escuela en 9 horas de trabajo continuo.',
    question: '¿Cuántas horas tardarían 6 bombas idénticas trabajando juntas?',
    givenData: ['4 bombas → 9 horas', '6 bombas → ¿X horas?'],
    formula: 'Proporcionalidad Inversa: Más bombas trabajando = Menos horas necesarias.',
    steps: [
      '1. Trabajo total necesario: 4 × 9 = 36 bomba-horas.',
      '2. Si trabajan 6 bombas: 36 ÷ 6 = 6 horas.',
      '3. Regla de tres inversa: X = (4 × 9) ÷ 6 = 36 ÷ 6 = 6.'
    ],
    finalAnswer: '6 horas',
    numericAnswer: 6
  },
  {
    id: 15,
    type: 'inversa',
    title: 'Provisiones para el Campamento',
    statement: 'Una reserva de alimentos en el campamento escolar dura 20 días para un grupo de 6 estudiantes.',
    question: 'Si solo asisten 4 estudiantes, ¿para cuántos días alcanzará la misma comida?',
    givenData: ['6 estudiantes → 20 días', '4 estudiantes → ¿X días?'],
    formula: 'Proporcionalidad Inversa: Menos personas comiendo = La provisión dura MÁS días.',
    steps: [
      '1. Total de raciones disponibles: 6 × 20 = 120 raciones diarias.',
      '2. Si ahora son 4 personas: 120 ÷ 4 = 30 días.',
      '3. Regla de tres inversa: X = (6 × 20) ÷ 4 = 120 ÷ 4 = 30.'
    ],
    finalAnswer: '30 días',
    numericAnswer: 30
  },
  {
    id: 16,
    type: 'inversa',
    title: 'Viaje del Autobús Intercolegial',
    statement: 'Un autobús realiza el recorrido intercolegial en 5 horas viajando a una velocidad media de 90 km/h.',
    question: '¿A qué velocidad promedio debe viajar si necesita completar el trayecto en 6 horas?',
    givenData: ['5 horas → 90 km/h', '6 horas → ¿X km/h?'],
    formula: 'Proporcionalidad Inversa: Si se dispone de más tiempo, se puede ir a MENOR velocidad.',
    steps: [
      '1. Calculamos la distancia total: 5 × 90 = 450 km.',
      '2. Velocidad necesaria para hacerlo en 6 horas: 450 ÷ 6 = 75 km/h.',
      '3. Regla de tres inversa: X = (5 × 90) ÷ 6 = 450 ÷ 6 = 75.'
    ],
    finalAnswer: '75 km/h',
    numericAnswer: 75
  },
  {
    id: 17,
    type: 'inversa',
    title: 'Fotocopiadoras en Paralelo',
    statement: '2 fotocopiadoras imprimen todo el material de estudio en 30 minutos.',
    question: '¿Cuántos minutos tardarán en hacer el mismo trabajo si se ponen a funcionar 5 fotocopiadoras iguales?',
    givenData: ['2 máquinas → 30 minutos', '5 máquinas → ¿X minutos?'],
    formula: 'Proporcionalidad Inversa: Con más máquinas imprimiendo al mismo tiempo, el trabajo toma menos minutos.',
    steps: [
      '1. Capacidad de trabajo total: 2 × 30 = 60 máquina-minutos.',
      '2. Con 5 fotocopiadoras: 60 ÷ 5 = 12 minutos.',
      '3. Regla de tres inversa: X = (2 × 30) ÷ 5 = 60 ÷ 5 = 12.'
    ],
    finalAnswer: '12 minutos',
    numericAnswer: 12
  },
  {
    id: 18,
    type: 'inversa',
    title: 'Pintores en la Biblioteca',
    statement: '4 pintores tardan 6 horas en pintar las paredes de la biblioteca escolar.',
    question: '¿Cuánto tiempo tardarán 8 pintores con el mismo rendimiento laboral?',
    givenData: ['4 pintores → 6 horas', '8 pintores → ¿X horas?'],
    formula: 'Proporcionalidad Inversa: Al duplicar el número de pintores (de 4 a 8), el tiempo se reduce a la mitad.',
    steps: [
      '1. Trabajo total: 4 × 6 = 24 pintor-horas.',
      '2. Tiempo para 8 trabajadores: 24 ÷ 8 = 3 horas.',
      '3. O directamente: 6 horas ÷ 2 = 3 horas.'
    ],
    finalAnswer: '3 horas',
    numericAnswer: 3
  },
  {
    id: 19,
    type: 'inversa',
    title: 'Alimento en la Granja Escolar',
    statement: 'La granja del colegio tiene alimento almacenado para alimentar a 15 animales durante 8 días.',
    question: 'Si se trasladan 5 animales a otro corral (quedando 10 animales), ¿para cuántos días durará el alimento?',
    givenData: ['15 animales → 8 días', '10 animales → ¿X días?'],
    formula: 'Proporcionalidad Inversa: Menos animales consumiendo alimento = Dura MÁS días.',
    steps: [
      '1. Total de raciones: 15 × 8 = 120 raciones.',
      '2. Para los 10 animales restantes: 120 ÷ 10 = 12 días.',
      '3. Regla de tres inversa: X = (15 × 8) ÷ 10 = 120 ÷ 10 = 12.'
    ],
    finalAnswer: '12 días',
    numericAnswer: 12
  },
  {
    id: 20,
    type: 'inversa',
    title: 'Repartición Equitativa de Dulces',
    statement: 'Para una fiesta escolar, se planeó repartir una bolsa de dulces dando 4 dulces a cada uno de los 15 estudiantes presentes.',
    question: 'Si al final asisten 20 estudiantes, ¿cuántos dulces le corresponderán a cada uno para repartirlos todos en partes iguales?',
    givenData: ['15 estudiantes → 4 dulces/persona', '20 estudiantes → ¿X dulces?'],
    formula: 'Proporcionalidad Inversa: Mayor cantidad de personas = Menor cantidad de dulces por persona.',
    steps: [
      '1. Número total de dulces en la bolsa: 15 × 4 = 60 dulces.',
      '2. Si se reparten entre 20 personas: 60 ÷ 20 = 3 dulces por persona.',
      '3. Regla de tres inversa: X = (15 × 4) ÷ 20 = 60 ÷ 20 = 3.'
    ],
    finalAnswer: '3 dulces por persona',
    numericAnswer: 3
  }
];

export function getRandomProblem(): ProportionalityProblem {
  const index = Math.floor(Math.random() * PROPORTIONALITY_PROBLEMS.length);
  return PROPORTIONALITY_PROBLEMS[index];
}

/**
 * Returns a random problem excluding already solved/seen problem IDs in the current game run.
 */
export function getRandomUnusedProblem(usedIds: number[]): ProportionalityProblem {
  const available = PROPORTIONALITY_PROBLEMS.filter((p) => !usedIds.includes(p.id));
  if (available.length === 0) {
    return getRandomProblem();
  }
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}
