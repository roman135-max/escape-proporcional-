import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Key, CheckCircle, MapPin, Shield, Maximize, Minimize } from 'lucide-react';
import { soundManager } from './audio/soundManager';
import {
  buildSchoolTiles,
  DEFAULT_SECRET_CODE,
  findSafeUnstuckPosition,
  generateGameRunItems,
  getCurrentRoomName,
  isPositionBlockedWithItems,
  MAP_COLS,
  MAP_ROWS,
  PLAYER_COLLISION_RADIUS,
  resolvePlayerMovement,
  SchoolItem,
  TILE_SIZE
} from './game/schoolMap';
import { createGhosts, Ghost, updateGhosts } from './game/ghostAI';
import { PLAYER_VISION_RADIUS, renderGame } from './game/renderer';
import { getRandomUnusedProblem, ProportionalityProblem } from './data/problems';
import { DEBUG_INPUT, JoystickDebugData, VirtualJoystick } from './components/VirtualJoystick';
import { InteractButton } from './components/InteractButton';
import { InputDiagnostics } from './components/InputDiagnostics';
import { DefeatModal } from './components/DefeatModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { TitleScreen } from './components/TitleScreen';
import { LandscapeNotice } from './components/LandscapeNotice';

// Límite de intentos por partida
export const MAX_INTENTOS = 3;

type GameState = 'TITLE' | 'PLAYING' | 'DEFEAT' | 'GAMEOVER' | 'VICTORY';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-level Game State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentProblem, setCurrentProblem] = useState<ProportionalityProblem | null>(null);

  // UNICA VARIABLE DE ESTADO para saber si el jugador está escondido en un armario
  // La interfaz (botón, joystick, efecto visual, mensajes) depende exclusivamente de esta variable
  const [estaEscondido, setEstaEscondido] = useState<boolean>(false);
  const estaEscondidoRef = useRef<boolean>(false);
  const preLockerPosRef = useRef<{ x: number; y: number } | null>(null);
  const lockerCooldownUntilRef = useRef<number>(0);

  // Clave de sesión que se incrementa en cada reinicio para forzar un remount limpio de controles
  const [sessionKey, setSessionKey] = useState<number>(0);

  // Diagnóstico temporal de entrada táctil (DEBUG_INPUT)
  const debugDataRef = useRef<JoystickDebugData>({
    activePointerId: null,
    lastClientX: 0,
    lastClientY: 0,
    centerX: 0,
    centerY: 0,
    dx: 0,
    dy: 0,
    angleDeg: 0,
    magnitude: 0,
    lastEventType: 'inicio',
    lastEventTarget: 'ninguno'
  });

  // Sistema de intentos con bloqueo atómico contra ejecuciones concurrentes en frame
  const isCaptureLockedRef = useRef<boolean>(false);
  const invulnerableTimerRef = useRef<number>(0);
  const catchCountRef = useRef<number>(0);
  const [catchCount, setCatchCount] = useState<number>(0);
  const usedProblemIdsRef = useRef<number[]>([]);
  const attemptsRemaining = Math.max(0, MAX_INTENTOS - catchCount);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Screen orientation tracking for mobile controls and HUD adaptation
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Secret code configuration
  const secretCode = DEFAULT_SECRET_CODE; // '7429'
  const piece1Digits = secretCode.slice(0, 2); // '74'
  const piece2Digits = secretCode.slice(2, 4); // '29'

  // Player & World Mutable References
  const playerRef = useRef({
    x: 25 * TILE_SIZE,
    y: 10 * TILE_SIZE,
    angle: Math.PI / 2,
    radius: PLAYER_COLLISION_RADIUS,
    speed: 180,
    isMoving: false,
    isHidden: false,
    activeLockerId: null as string | null
  });

  // 3 Separated Keys: Bronze, Silver, Gold
  const keysCollectedRef = useRef({
    bronze: false,
    silver: false,
    gold: false
  });
  const [keysCollectedState, setKeysCollectedState] = useState({
    bronze: false,
    silver: false,
    gold: false
  });

  const hasCodePiece1Ref = useRef(false);
  const hasCodePiece2Ref = useRef(false);
  const [codePiecesState, setCodePiecesState] = useState({
    piece1: false,
    piece2: false
  });

  const currentRoomNameRef = useRef('Pasillo Principal');
  const [currentRoomNameState, setCurrentRoomNameState] = useState('Pasillo Principal');

  // Input state - Joystick is purely in a Ref so React re-renders never interrupt movement
  const joystickVector = useRef({ x: 0, y: 0 });
  const keyboardKeys = useRef<{ [key: string]: boolean }>({});
  const lastFootstepTime = useRef(0);

  // Input buffer for pickup / interaction while running (300ms tolerance, ONLY for keys/notes)
  const interactBufferTimeRef = useRef(0);

  // Limpieza total e instantánea de controles al reiniciar o cambiar de partida
  const resetAllInput = useCallback(() => {
    joystickVector.current = { x: 0, y: 0 };
    keyboardKeys.current = {};
    interactBufferTimeRef.current = 0;
    if (playerRef.current) {
      playerRef.current.isMoving = false;
    }
    setSessionKey((k) => k + 1);
  }, []);

  // Map & Entities references
  const tilesRef = useRef<number[][]>(buildSchoolTiles());
  const visitedTilesRef = useRef<boolean[][]>(
    Array(MAP_ROWS).fill(0).map(() => Array(MAP_COLS).fill(false))
  );
  const itemsRef = useRef<SchoolItem[]>(generateGameRunItems(secretCode));
  const ghostsRef = useRef<Ghost[]>(createGhosts());
  const isAnyGhostChasingRef = useRef(false);
  const ghostProximityRef = useRef(0);

  // Interactive Target with change-detection Ref to prevent React re-render spam
  const interactiveTargetRef = useRef<{
    type: 'key' | 'note' | 'locker_enter' | 'locker_exit' | 'door' | null;
    label: string | null;
    item: SchoolItem | null;
  }>({ type: null, label: null, item: null });

  const [interactiveTarget, setInteractiveTarget] = useState<{
    type: 'key' | 'note' | 'locker_enter' | 'locker_exit' | 'door' | null;
    label: string | null;
    item: SchoolItem | null;
  }>({ type: null, label: null, item: null });

  // Camera coordinates
  const cameraRef = useRef({ x: 0, y: 0 });

  // No floating message banners over gameplay view (Requirement 3)
  const showToast = useCallback((_msg: string) => {}, []);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Toggle audio
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMute(next);
      return next;
    });
  }, []);

  // Start the game (Called when user clicks "Jugar" after the 5s countdown)
  const handleStartGame = useCallback(() => {
    resetAllInput();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
    setGameState('PLAYING');
    soundManager.startAmbience();
    showToast('¡Encuentra las 3 llaves y las 2 piezas del código!');
  }, [resetAllInput, showToast]);

  // UN SOLO MANEJADOR para esconderse y salir del armario
  // - Ignora nuevas pulsaciones durante 500 ms tras la acción
  // - Guarda la posición previa antes de entrar
  // - Al salir, coloca al personaje en la casilla libre más cercana sin superponerse a ningún mueble ni obstáculo
  const toggleLocker = useCallback((lockerItem?: SchoolItem | null) => {
    const now = performance.now();
    if (now < lockerCooldownUntilRef.current) return;
    lockerCooldownUntilRef.current = now + 500; // 500ms cooldown

    // Borrar de inmediato cualquier buffer de pulsación
    interactBufferTimeRef.current = 0;

    if (estaEscondidoRef.current) {
      // SALIR DEL ARMARIO
      estaEscondidoRef.current = false;
      setEstaEscondido(false);
      playerRef.current.isHidden = false;

      const lockerId = playerRef.current.activeLockerId;
      const locker = itemsRef.current.find((i) => i.id === lockerId);
      playerRef.current.activeLockerId = null;

      // Calcular posición libre más cercana al armario, priorizando la posición desde donde entró
      const baseX = locker ? locker.x + locker.width / 2 : playerRef.current.x;
      const baseY = locker ? locker.y + locker.height + 26 : playerRef.current.y + 40;

      const safePos = findSafeUnstuckPosition(
        baseX,
        baseY,
        playerRef.current.radius,
        tilesRef.current,
        itemsRef.current,
        preLockerPosRef.current
      );

      playerRef.current.x = safePos.x;
      playerRef.current.y = safePos.y;
      playerRef.current.isMoving = false;
      preLockerPosRef.current = null;

      soundManager.playLockerSqueak(false);
      showToast('Saliste del armario.');
    } else {
      // ENTRAR AL ARMARIO
      // Guardar la posición exacta desde donde entró
      preLockerPosRef.current = { x: playerRef.current.x, y: playerRef.current.y };

      estaEscondidoRef.current = true;
      setEstaEscondido(true);
      playerRef.current.isHidden = true;

      if (lockerItem) {
        playerRef.current.activeLockerId = lockerItem.id;
        playerRef.current.x = lockerItem.x + lockerItem.width / 2;
        playerRef.current.y = lockerItem.y + lockerItem.height / 2;
      }

      playerRef.current.isMoving = false;
      joystickVector.current = { x: 0, y: 0 };

      soundManager.playLockerSqueak(true);
      showToast('Te escondiste dentro del armario.');
    }
  }, [showToast]);

  // Execute actual interaction / pickup
  const executeInteraction = useCallback((): boolean => {
    // Si ya está escondido, la única acción es SALIR
    if (estaEscondidoRef.current) {
      toggleLocker();
      return true;
    }

    const target = interactiveTargetRef.current;
    if (!target.item) return false;

    const item = target.item;

    // Entrar al armario mediante el manejador único toggleLocker
    if (item.type === 'locker') {
      toggleLocker(item);
      return true;
    }

    // Para cualquier otra acción (llave, nota, puerta), consumir el buffer de inmediato
    interactBufferTimeRef.current = 0;

    if (item.type === 'key_bronze') {
      soundManager.playKeyPickup();
      item.collected = true;
      keysCollectedRef.current.bronze = true;
      setKeysCollectedState((prev) => ({ ...prev, bronze: true }));
      showToast(`¡Conseguiste la Llave de Bronce en ${item.roomName}!`);
      return true;
    } else if (item.type === 'key_silver') {
      soundManager.playKeyPickup();
      item.collected = true;
      keysCollectedRef.current.silver = true;
      setKeysCollectedState((prev) => ({ ...prev, silver: true }));
      showToast(`¡Conseguiste la Llave de Plata en ${item.roomName}!`);
      return true;
    } else if (item.type === 'key_gold') {
      soundManager.playKeyPickup();
      item.collected = true;
      keysCollectedRef.current.gold = true;
      setKeysCollectedState((prev) => ({ ...prev, gold: true }));
      showToast(`¡Conseguiste la Llave de Oro en ${item.roomName}!`);
      return true;
    } else if (item.type === 'code_piece_1') {
      soundManager.playNotePickup();
      item.collected = true;
      hasCodePiece1Ref.current = true;
      setCodePiecesState((prev) => ({ ...prev, piece1: true }));
      showToast(`¡Encontraste la Pieza 1 del Código: [${piece1Digits} _ _]!`);
      return true;
    } else if (item.type === 'code_piece_2') {
      soundManager.playNotePickup();
      item.collected = true;
      hasCodePiece2Ref.current = true;
      setCodePiecesState((prev) => ({ ...prev, piece2: true }));
      showToast(`¡Encontraste la Pieza 2 del Código: [_ _ ${piece2Digits}]!`);
      return true;
    } else if (item.type === 'exit_door') {
      const keys = keysCollectedRef.current;
      const piece1 = hasCodePiece1Ref.current;
      const piece2 = hasCodePiece2Ref.current;

      if (keys.bronze && keys.silver && keys.gold && piece1 && piece2) {
        soundManager.playVictory();
        resetAllInput();
        setGameState('VICTORY');
      } else {
        const missing: string[] = [];
        if (!keys.gold) missing.push('Llave de Oro');
        if (!keys.silver) missing.push('Llave de Plata');
        if (!keys.bronze) missing.push('Llave de Bronce');
        if (!piece1) missing.push('Pieza 1 de código');
        if (!piece2) missing.push('Pieza 2 de código');
        showToast(`Puerta sellada. Te falta: ${missing.join(', ')}`);
      }
      return true;
    }

    return false;
  }, [piece1Digits, piece2Digits, resetAllInput, showToast, toggleLocker]);

  // Player presses interact button
  const handleInteractPress = useCallback(() => {
    // Si está escondido, pulsar el botón de Salir lo saca de inmediato
    if (estaEscondidoRef.current) {
      toggleLocker();
      return;
    }

    // La pulsación guardada SOLO se aplica a recoger objetos, NUNCA a armarios
    interactBufferTimeRef.current = performance.now();
    executeInteraction();
  }, [executeInteraction, toggleLocker]);

  // Continue game after solving a proportionality problem in DefeatModal
  const handleContinueAfterProblem = useCallback(() => {
    resetAllInput();

    const safeSpawn = findSafeUnstuckPosition(25 * TILE_SIZE, 10 * TILE_SIZE, playerRef.current.radius, tilesRef.current, itemsRef.current);
    playerRef.current.x = safeSpawn.x;
    playerRef.current.y = safeSpawn.y;
    playerRef.current.isHidden = false;
    playerRef.current.activeLockerId = null;
    playerRef.current.isMoving = false;
    preLockerPosRef.current = null;

    estaEscondidoRef.current = false;
    setEstaEscondido(false);
    lockerCooldownUntilRef.current = 0;
    interactBufferTimeRef.current = 0;

    // Reposition ghosts back to patrol waypoints far away from spawn
    ghostsRef.current = createGhosts();
    isAnyGhostChasingRef.current = false;
    ghostProximityRef.current = 0;

    // Grant 3 seconds of invulnerability with gentle visual flicker
    invulnerableTimerRef.current = 3.0;

    // Release the capture lock
    isCaptureLockedRef.current = false;

    setGameState('PLAYING');
    soundManager.startAmbience();
    showToast('¡Respuesta correcta! Tienes 3s de protección.');
  }, [resetAllInput, showToast]);

  // Reset entire game on victory or GameOver "Reiniciar": Return to TITLE screen
  const handlePlayAgain = useCallback(() => {
    resetAllInput();
    preLockerPosRef.current = null;

    const safeSpawn = findSafeUnstuckPosition(25 * TILE_SIZE, 10 * TILE_SIZE, PLAYER_COLLISION_RADIUS, tilesRef.current, itemsRef.current);
    playerRef.current = {
      x: safeSpawn.x,
      y: safeSpawn.y,
      angle: Math.PI / 2,
      radius: PLAYER_COLLISION_RADIUS,
      speed: 180,
      isMoving: false,
      isHidden: false,
      activeLockerId: null
    };

    estaEscondidoRef.current = false;
    setEstaEscondido(false);
    lockerCooldownUntilRef.current = 0;
    interactBufferTimeRef.current = 0;

    keysCollectedRef.current = { bronze: false, silver: false, gold: false };
    setKeysCollectedState({ bronze: false, silver: false, gold: false });
    hasCodePiece1Ref.current = false;
    hasCodePiece2Ref.current = false;
    setCodePiecesState({ piece1: false, piece2: false });
    visitedTilesRef.current = Array(MAP_ROWS).fill(0).map(() => Array(MAP_COLS).fill(false));
    itemsRef.current = generateGameRunItems(secretCode);
    ghostsRef.current = createGhosts();
    isAnyGhostChasingRef.current = false;
    ghostProximityRef.current = 0;
    setElapsedSeconds(0);

    // Reset attempts and unlock capture
    isCaptureLockedRef.current = false;
    invulnerableTimerRef.current = 0;
    catchCountRef.current = 0;
    setCatchCount(0);
    usedProblemIdsRef.current = [];
    setCurrentProblem(null);

    soundManager.stopHeartbeat();
    soundManager.stopAmbience();

    setGameState('TITLE');
  }, [resetAllInput, secretCode]);

  // Trigger Ghost Catch with Atomic Lock Guard
  // Un fantasma no puede alterar el estado si el jugador está escondido
  const handlePlayerCaught = useCallback(() => {
    if (estaEscondidoRef.current || isCaptureLockedRef.current || invulnerableTimerRef.current > 0) {
      return;
    }

    // Atomic lock against frame spam & zero out movement
    isCaptureLockedRef.current = true;
    resetAllInput();
    soundManager.playDefeatJumpscare();

    const nextCatch = catchCountRef.current + 1;
    catchCountRef.current = nextCatch;
    setCatchCount(nextCatch);

    if (nextCatch >= MAX_INTENTOS) {
      setGameState('GAMEOVER');
    } else {
      const problem = getRandomUnusedProblem(usedProblemIdsRef.current);
      usedProblemIdsRef.current.push(problem.id);
      setCurrentProblem(problem);
      setGameState('DEFEAT');
    }
  }, []);

  // Joystick Input Handler - Writes directly to Ref without React re-render
  const handleJoystickMove = useCallback((vector: { x: number; y: number }) => {
    joystickVector.current = vector;
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardKeys.current[e.key.toLowerCase()] = true;

      if (e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleInteractPress();
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardKeys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInteractPress, handleToggleMute]);

  // Elapsed Time Clock
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Main 60fps Game Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Simulation only runs when PLAYING and not locked by capture
      if (gameState === 'PLAYING') {
        // Decrement invulnerability timer
        if (invulnerableTimerRef.current > 0) {
          invulnerableTimerRef.current = Math.max(0, invulnerableTimerRef.current - dt);
        }

        const player = playerRef.current;

        // 1. Process Movement with sub-stepping and sliding (only if not hidden and not locked)
        if (!estaEscondidoRef.current && !isCaptureLockedRef.current) {
          let moveX = joystickVector.current.x;
          let moveY = joystickVector.current.y;

          const k = keyboardKeys.current;
          if (k['w'] || k['arrowup']) moveY -= 1;
          if (k['s'] || k['arrowdown']) moveY += 1;
          if (k['a'] || k['arrowleft']) moveX -= 1;
          if (k['d'] || k['arrowright']) moveX += 1;

          const inputLength = Math.hypot(moveX, moveY);
          if (inputLength > 0.08) {
            player.isMoving = true;
            const normX = moveX / (inputLength > 1 ? inputLength : 1);
            const normY = moveY / (inputLength > 1 ? inputLength : 1);

            player.angle = Math.atan2(normY, normX);

            resolvePlayerMovement(
              player,
              normX,
              normY,
              player.speed,
              dt,
              tilesRef.current,
              itemsRef.current,
              player.activeLockerId
            );

            if (currentTime - lastFootstepTime.current > 310) {
              soundManager.playFootstep();
              lastFootstepTime.current = currentTime;
            }
          } else {
            player.isMoving = false;
          }
        }

        // Seguro general: si en cualquier momento el jugador queda superpuesto con un obstáculo o mueble,
        // muévelo automáticamente a la casilla libre más cercana
        if (
          !estaEscondidoRef.current &&
          isPositionBlockedWithItems(player.x, player.y, player.radius, tilesRef.current, itemsRef.current)
        ) {
          const unstuck = findSafeUnstuckPosition(
            player.x,
            player.y,
            player.radius,
            tilesRef.current,
            itemsRef.current
          );
          player.x = unstuck.x;
          player.y = unstuck.y;
        }

        // 3. Room detection
        const roomName = getCurrentRoomName(player.x, player.y);
        if (roomName !== currentRoomNameRef.current) {
          currentRoomNameRef.current = roomName;
          setCurrentRoomNameState(roomName);
        }

        // 4. Evaluate nearby interactables
        let newTarget: {
          type: 'key' | 'note' | 'locker_enter' | 'locker_exit' | 'door' | null;
          label: string | null;
          item: SchoolItem | null;
        } = { type: null, label: null, item: null };

        if (estaEscondidoRef.current) {
          newTarget = {
            type: 'locker_exit',
            label: 'Salir del Armario',
            item: null
          };
        } else {
          let closestItem: SchoolItem | null = null;
          let minDistance = 88; // Amplified range for easy pickup in motion

          for (const item of itemsRef.current) {
            if (item.collected) continue;
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2;
            const dist = Math.hypot(player.x - centerX, player.y - centerY);

            const pickupMax = (item.type.startsWith('key') || item.type.startsWith('code')) ? 92 : 75;

            if (dist < pickupMax && dist < minDistance) {
              minDistance = dist;
              closestItem = item;
            }
          }

          if (closestItem) {
            if (closestItem.type === 'key_bronze') {
              newTarget = {
                type: 'key',
                label: 'Recoger Llave de Bronce',
                item: closestItem
              };
            } else if (closestItem.type === 'key_silver') {
              newTarget = {
                type: 'key',
                label: 'Recoger Llave de Plata',
                item: closestItem
              };
            } else if (closestItem.type === 'key_gold') {
              newTarget = {
                type: 'key',
                label: 'Recoger Llave de Oro',
                item: closestItem
              };
            } else if (closestItem.type === 'code_piece_1' || closestItem.type === 'code_piece_2') {
              newTarget = {
                type: 'note',
                label: `Recoger ${closestItem.name}`,
                item: closestItem
              };
            } else if (closestItem.type === 'locker') {
              newTarget = {
                type: 'locker_enter',
                label: 'Esconderse en Armario',
                item: closestItem
              };
            } else if (closestItem.type === 'exit_door') {
              newTarget = {
                type: 'door',
                label: 'Abrir Puerta Principal',
                item: closestItem
              };
            }
          }
        }

        // Only dispatch state update if target actually changed
        if (
          newTarget.type !== interactiveTargetRef.current.type ||
          newTarget.item?.id !== interactiveTargetRef.current.item?.id
        ) {
          interactiveTargetRef.current = newTarget;
          setInteractiveTarget(newTarget);
        }

        // Input buffering tolerance (300 ms window):
        // STRICT REQUIREMENT C: La pulsación guardada de interactuar NO se aplica a armarios (entrar ni salir).
        // Solo para llaves y notas, y se borra de inmediato tras cualquier acción.
        if (
          !estaEscondidoRef.current &&
          interactBufferTimeRef.current > 0 &&
          currentTime - interactBufferTimeRef.current < 300
        ) {
          if (
            newTarget.item &&
            (newTarget.item.type.startsWith('key') || newTarget.item.type.startsWith('code'))
          ) {
            executeInteraction();
            interactBufferTimeRef.current = 0;
          }
        }

        // 5. Update Ghost AI & Proximity Heartbeat Alert
        if (!isCaptureLockedRef.current) {
          const chasing = updateGhosts(
            ghostsRef.current,
            player.x,
            player.y,
            player.angle,
            player.isMoving,
            estaEscondidoRef.current,
            tilesRef.current,
            dt,
            handlePlayerCaught,
            invulnerableTimerRef.current > 0
          );
          isAnyGhostChasingRef.current = chasing;

          // Check distance to closest ghost for heartbeat and red vignette
          let minGhostDist = Infinity;
          for (const ghost of ghostsRef.current) {
            const d = Math.hypot(ghost.x - player.x, ghost.y - player.y);
            if (d < minGhostDist) minGhostDist = d;
          }

          const proximityThreshold = 5 * TILE_SIZE; // 300px
          if (!estaEscondidoRef.current && minGhostDist < proximityThreshold) {
            ghostProximityRef.current = Math.max(0, Math.min(1, 1 - minGhostDist / proximityThreshold));
            soundManager.updateProximityHeartbeat(ghostProximityRef.current);
          } else {
            ghostProximityRef.current = 0;
            soundManager.updateProximityHeartbeat(0);
          }
        }
      }

      // Camera follows player smoothly
      const mapWidth = MAP_COLS * TILE_SIZE;
      const mapHeight = MAP_ROWS * TILE_SIZE;

      let targetCamX = playerRef.current.x - displayWidth / 2;
      let targetCamY = playerRef.current.y - displayHeight / 2;

      if (mapWidth > displayWidth) {
        targetCamX = Math.max(0, Math.min(mapWidth - displayWidth, targetCamX));
      } else {
        targetCamX = (mapWidth - displayWidth) / 2;
      }

      if (mapHeight > displayHeight) {
        targetCamY = Math.max(0, Math.min(mapHeight - displayHeight, targetCamY));
      } else {
        targetCamY = (mapHeight - displayHeight) / 2;
      }

      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.18;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.18;

      // 6. Render Scene to Canvas with continuous radial darkness and alert pulse
      renderGame(ctx, {
        playerX: playerRef.current.x,
        playerY: playerRef.current.y,
        playerAngle: playerRef.current.angle,
        isPlayerHidden: estaEscondido,
        activeLockerId: playerRef.current.activeLockerId,
        keysCollected: keysCollectedRef.current,
        hasCodePiece1: hasCodePiece1Ref.current,
        hasCodePiece2: hasCodePiece2Ref.current,
        codePiece1Digits: piece1Digits,
        codePiece2Digits: piece2Digits,
        items: itemsRef.current,
        ghosts: ghostsRef.current,
        tiles: tilesRef.current,
        visitedTiles: visitedTilesRef.current,
        isAnyGhostChasing: isAnyGhostChasingRef.current,
        ghostProximity: ghostProximityRef.current,
        isInvulnerable: invulnerableTimerRef.current > 0,
        cameraX: cameraRef.current.x,
        cameraY: cameraRef.current.y,
        viewportWidth: displayWidth,
        viewportHeight: displayHeight,
        time: currentTime * 0.001
      });

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, estaEscondido, handlePlayerCaught, executeInteraction, piece1Digits, piece2Digits]);

  // Keys collected count for victory and game over stats
  const totalKeysCollected =
    (keysCollectedState.bronze ? 1 : 0) +
    (keysCollectedState.silver ? 1 : 0) +
    (keysCollectedState.gold ? 1 : 0);

  // Shared symmetrical margins for both joystick and action button (Requirement 2)
  const controlBottomMargin = isPortrait
    ? 'max(52px, calc(env(safe-area-inset-bottom, 0px) + 52px))'
    : 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))';
  const controlSideMargin = isPortrait
    ? 'max(24px, calc(env(safe-area-inset-left, 0px) + 24px))'
    : 'max(36px, calc(env(safe-area-inset-left, 0px) + 36px))';

  const touchControlsStyle = {
    paddingBottom: controlBottomMargin,
    paddingLeft: controlSideMargin,
    paddingRight: controlSideMargin
  };

  // Safe HUD positioning to prevent notch / camera obstruction in portrait
  const topHudStyle = isPortrait
    ? {
        top: 'max(46px, calc(env(safe-area-inset-top, 0px) + 42px))',
        left: 'max(12px, calc(env(safe-area-inset-left, 0px) + 12px))',
        right: 'max(12px, calc(env(safe-area-inset-right, 0px) + 12px))'
      }
    : {
        top: 'max(10px, calc(env(safe-area-inset-top, 0px) + 8px))',
        left: 'max(12px, calc(env(safe-area-inset-left, 0px) + 12px))',
        right: 'max(12px, calc(env(safe-area-inset-right, 0px) + 12px))'
      };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none bg-slate-950 font-sans">
      {/* Landscape Orientation Notice for mobile */}
      <LandscapeNotice />

      {/* Main Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full touch-none pointer-events-none" />

      {/* TOP PERIMETER HUD - Positioned with safe margin for punch-hole cameras */}
      {isPortrait ? (
        /* HUD EN PANTALLA VERTICAL (2 FILAS SEPARADAS) */
        <div
          className="absolute flex flex-col pointer-events-none z-20 gap-1.5"
          style={topHudStyle}
        >
          {/* Fila 1: Nombre de la sala completo (a la izquierda, sin cortarlo con "...") y, a la derecha, intentos, pantalla completa y sonido */}
          <div className="flex items-center justify-between w-full gap-2">
            {/* Nombre de la sala completo a la izquierda */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-sky-500/35 backdrop-blur-sm px-2.5 py-1 rounded-[2px] shadow-lg pointer-events-auto shrink min-w-0">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-semibold text-sky-200 whitespace-nowrap">
                {currentRoomNameState}
              </span>
            </div>

            {/* A la derecha: intentos, pantalla completa y sonido */}
            <div className="flex items-center gap-1 pointer-events-auto shrink-0">
              {/* Intentos */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-red-500/35 backdrop-blur-sm px-2 py-1 rounded-[2px] shadow-lg pointer-events-auto">
                <Shield className={`w-3 h-3 ${attemptsRemaining <= 1 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-0.5">
                  <span className="text-slate-400 uppercase font-bold text-[9px]">Int:</span>
                  <span className={`font-mono font-bold ${attemptsRemaining <= 1 ? 'text-red-400' : 'text-amber-300'}`}>
                    {attemptsRemaining}/{MAX_INTENTOS}
                  </span>
                </span>
              </div>

              {/* Pantalla completa */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="p-1.5 rounded-[2px] bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 backdrop-blur-sm transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-amber-300" /> : <Maximize className="w-3.5 h-3.5 text-sky-300" />}
              </button>

              {/* Sonido */}
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
                className="p-1.5 rounded-[2px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 backdrop-blur-sm transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Fila 2: Las 3 llaves (oro, plata, bronce) y el código en UNA sola línea, centrado, por ejemplo "_ _ _ _" sin saltos de línea */}
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm px-2.5 py-1 rounded-[2px] shadow-lg pointer-events-auto flex-nowrap whitespace-nowrap">
              {/* 3 Llaves: Oro, Plata, Bronce */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Llave de Oro */}
                <div
                  title="Llave de Oro"
                  className={`p-1 rounded-[2px] border transition-all ${
                    keysCollectedState.gold
                      ? 'bg-yellow-950/70 border-yellow-500 text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                  }`}
                >
                  <Key className="w-3 h-3" />
                </div>

                {/* Llave de Plata */}
                <div
                  title="Llave de Plata"
                  className={`p-1 rounded-[2px] border transition-all ${
                    keysCollectedState.silver
                      ? 'bg-slate-800 border-slate-300 text-slate-100 shadow-[0_0_8px_rgba(241,245,249,0.5)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                  }`}
                >
                  <Key className="w-3 h-3" />
                </div>

                {/* Llave de Bronce */}
                <div
                  title="Llave de Bronce"
                  className={`p-1 rounded-[2px] border transition-all ${
                    keysCollectedState.bronze
                      ? 'bg-amber-950/70 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                  }`}
                >
                  <Key className="w-3 h-3" />
                </div>
              </div>

              <div className="w-[1px] h-3.5 bg-slate-700 shrink-0" />

              {/* Código 4 dígitos en una sola línea */}
              <div className="flex items-center gap-1 text-[11px] font-mono whitespace-nowrap shrink-0">
                <span className="text-slate-400 text-[9px] uppercase font-bold">CÓDIGO:</span>
                {codePiecesState.piece1 && codePiecesState.piece2 ? (
                  <span className="text-emerald-400 font-bold tracking-wider flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded-[2px] border border-emerald-500/40 whitespace-nowrap">
                    <span>{piece1Digits} {piece2Digits}</span>
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  </span>
                ) : codePiecesState.piece1 ? (
                  <span className="text-amber-300 tracking-wider font-bold bg-slate-950 px-1.5 py-0.5 rounded-[2px] border border-amber-500/40 whitespace-nowrap">
                    {piece1Digits} _ _
                  </span>
                ) : codePiecesState.piece2 ? (
                  <span className="text-amber-300 tracking-wider font-bold bg-slate-950 px-1.5 py-0.5 rounded-[2px] border border-amber-500/40 whitespace-nowrap">
                    _ _ {piece2Digits}
                  </span>
                ) : (
                  <span className="text-slate-500 tracking-widest bg-slate-950 px-1.5 py-0.5 rounded-[2px] border border-slate-800 whitespace-nowrap">
                    _ _ _ _
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HUD EN PANTALLA HORIZONTAL (EXACTAMENTE COMO ESTABA, SIN CAMBIOS) */
        <div
          className="absolute flex items-center justify-between pointer-events-none z-20 gap-2"
          style={topHudStyle}
        >
          {/* Left cluster: Room Location */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-sky-500/35 backdrop-blur-sm px-2.5 py-1.5 rounded-[2px] shadow-lg pointer-events-auto">
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-xs font-semibold text-sky-200 truncate max-w-[110px] sm:max-w-none">
              {currentRoomNameState}
            </span>
          </div>

          {/* Center cluster: 3 SEPARATE KEYS (ORO, PLATA, BRONCE) + 4-DIGIT CODE */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-sm px-2.5 py-1.5 rounded-[2px] shadow-lg pointer-events-auto">
            {/* 3 Llaves separadas: Oro, Plata, Bronce */}
            <div className="flex items-center gap-1.5">
              {/* Llave de Oro */}
              <div
                title="Llave de Oro"
                className={`p-1 rounded-[2px] border transition-all ${
                  keysCollectedState.gold
                    ? 'bg-yellow-950/70 border-yellow-500 text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
              </div>

              {/* Llave de Plata */}
              <div
                title="Llave de Plata"
                className={`p-1 rounded-[2px] border transition-all ${
                  keysCollectedState.silver
                    ? 'bg-slate-800 border-slate-300 text-slate-100 shadow-[0_0_8px_rgba(241,245,249,0.5)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
              </div>

              {/* Llave de Bronce */}
              <div
                title="Llave de Bronce"
                className={`p-1 rounded-[2px] border transition-all ${
                  keysCollectedState.bronze
                    ? 'bg-amber-950/70 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-50'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="w-[1px] h-4 bg-slate-700" />

            {/* 4-Digit Code (in 2 pieces) */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] hidden sm:inline">CÓDIGO:</span>
              {codePiecesState.piece1 && codePiecesState.piece2 ? (
                <span className="text-emerald-400 font-bold tracking-wider flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-[2px] border border-emerald-500/40">
                  <span>{piece1Digits} {piece2Digits}</span>
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </span>
              ) : codePiecesState.piece1 ? (
                <span className="text-amber-300 tracking-wider font-bold bg-slate-950 px-2 py-0.5 rounded-[2px] border border-amber-500/40">
                  {piece1Digits} _ _
                </span>
              ) : codePiecesState.piece2 ? (
                <span className="text-amber-300 tracking-wider font-bold bg-slate-950 px-2 py-0.5 rounded-[2px] border border-amber-500/40">
                  _ _ {piece2Digits}
                </span>
              ) : (
                <span className="text-slate-500 tracking-widest bg-slate-950 px-2 py-0.5 rounded-[2px] border border-slate-800">
                  _ _ _ _
                </span>
              )}
            </div>
          </div>

          {/* Right cluster: Attempts Badge & Audio / Fullscreen */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Intentos restantes */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-red-500/35 backdrop-blur-sm px-2.5 py-1.5 rounded-[2px] shadow-lg pointer-events-auto">
              <Shield className={`w-3.5 h-3.5 ${attemptsRemaining <= 1 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <span className="hidden sm:inline text-slate-400 text-[10px] uppercase font-bold">Intentos:</span>
                <span className={`font-mono font-bold ${attemptsRemaining <= 1 ? 'text-red-400' : 'text-amber-300'}`}>
                  {attemptsRemaining}/{MAX_INTENTOS}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-2 rounded-[2px] bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-slate-700/80 backdrop-blur-sm transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 text-amber-300" /> : <Maximize className="w-4 h-4 text-sky-300" />}
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="p-2 rounded-[2px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 backdrop-blur-sm transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM PERIMETER TOUCH CONTROLS (Centros alineados verticalmente, mismos márgenes simétricos) */}
      {gameState === 'PLAYING' && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-30 flex items-center justify-between overflow-visible"
          style={touchControlsStyle}
        >
          {/* Virtual Joystick (Centrado en contenedor simétrico de 182x182) */}
          <div className="w-[182px] h-[182px] flex items-center justify-center pointer-events-auto touch-none select-none">
            <VirtualJoystick
              key={sessionKey}
              onMove={handleJoystickMove}
              disabled={estaEscondido}
              debugDataRef={debugDataRef}
            />
          </div>

          {/* Interact Button (Centrado en contenedor simétrico de 182x182 con centros perfectamente alineados) */}
          <div className="w-[182px] h-[182px] flex items-center justify-center pointer-events-auto touch-none select-none">
            <InteractButton
              key={`btn-${sessionKey}`}
              onInteract={handleInteractPress}
              targetType={estaEscondido ? 'locker_exit' : interactiveTarget.type}
              targetLabel={estaEscondido ? 'Salir' : interactiveTarget.label}
            />
          </div>
        </div>
      )}

      {/* DIAGNOSTICO TEMPORAL DE ENTRADA (DEBUG_INPUT = true) */}
      {DEBUG_INPUT && gameState === 'PLAYING' && (
        <InputDiagnostics
          debugDataRef={debugDataRef}
          gameState={gameState}
          isProblemOpen={!!currentProblem}
          isPlayerHidden={estaEscondido}
          isCaptureLocked={isCaptureLockedRef.current}
          isPlayerMoving={playerRef.current.isMoving}
          isPortrait={isPortrait}
        />
      )}

      {/* TITLE SCREEN (Single screen with story & 5s countdown before "Jugar") */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* DEFEAT SCREEN MODAL (First & Second Catch: Proportionality Math Problem with Numeric Verification) */}
      {gameState === 'DEFEAT' && currentProblem && (
        <DefeatModal
          problem={currentProblem}
          attemptsRemaining={attemptsRemaining}
          maxAttempts={MAX_INTENTOS}
          onContinue={handleContinueAfterProblem}
        />
      )}

      {/* GAMEOVER SCREEN (Third Catch: Big PERDISTE Title, Thematic Stats, and Manual Reiniciar Button) */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          keysCount={totalKeysCollected}
          codePiecesCount={(codePiecesState.piece1 ? 1 : 0) + (codePiecesState.piece2 ? 1 : 0)}
          elapsedSeconds={elapsedSeconds}
          onRestart={handlePlayAgain}
        />
      )}

      {/* VICTORY SCREEN MODAL (Ranking from scratch, exact claim text, play again to TITLE) */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          elapsedSeconds={elapsedSeconds}
          code={secretCode}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
