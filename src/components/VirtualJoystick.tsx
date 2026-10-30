import React, { useRef, useEffect, useCallback } from 'react';

// Diagnóstico temporal (DEBUG_INPUT = false por defecto)
export const DEBUG_INPUT = false;

export interface JoystickDebugData {
  activePointerId: number | null;
  lastClientX: number;
  lastClientY: number;
  centerX: number;
  centerY: number;
  dx: number;
  dy: number;
  angleDeg: number;
  magnitude: number;
  lastEventType: string;
  lastEventTarget: string;
}

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  disabled?: boolean;
  debugDataRef?: React.RefObject<JoystickDebugData>;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  disabled,
  debugDataRef
}) => {
  // touchZoneRef es el elemento que abarca la base + margen de 30px (diámetro 182px)
  const touchZoneRef = useRef<HTMLDivElement>(null);
  // baseRef es el círculo visible de la base del joystick (diámetro 122px)
  const baseRef = useRef<HTMLDivElement>(null);
  // thumbRef es la perilla móvil
  const thumbRef = useRef<HTMLDivElement>(null);

  const pointerIdRef = useRef<number | null>(null);
  const vectorRef = useRef({ x: 0, y: 0 });
  const lastClientPosRef = useRef<{ x: number; y: number } | null>(null);

  // Radio máximo de recorrido de la perilla dentro de la base (46px)
  const maxTravelRadius = 46;

  // Actualiza los datos de diagnóstico en tiempo real
  const updateDebug = useCallback(
    (
      eventType: string,
      targetName: string,
      clientX: number,
      clientY: number,
      cx: number,
      cy: number,
      dx: number,
      dy: number,
      magnitude: number
    ) => {
      if (!debugDataRef) return;
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      debugDataRef.current = {
        activePointerId: pointerIdRef.current,
        lastClientX: clientX,
        lastClientY: clientY,
        centerX: cx,
        centerY: cy,
        dx,
        dy,
        angleDeg: angleDeg < 0 ? angleDeg + 360 : angleDeg,
        magnitude,
        lastEventType: eventType,
        lastEventTarget: targetName
      };
    },
    [debugDataRef]
  );

  // Reseteo limpio del joystick al centro
  const resetJoystick = useCallback(() => {
    pointerIdRef.current = null;
    vectorRef.current = { x: 0, y: 0 };
    lastClientPosRef.current = null;
    onMove({ x: 0, y: 0 });

    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      thumbRef.current.style.background = 'radial-gradient(circle, #475569 0%, #1e293b 100%)';
      thumbRef.current.style.borderColor = '#64748b';
      thumbRef.current.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5)';
    }

    if (baseRef.current) {
      baseRef.current.style.boxShadow =
        '0 4px 14px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.05)';
      baseRef.current.style.borderColor = DEBUG_INPUT
        ? 'rgba(56, 189, 248, 0.8)'
        : 'rgba(56, 189, 248, 0.35)';
    }

    if (debugDataRef && baseRef.current) {
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      debugDataRef.current = {
        activePointerId: null,
        lastClientX: cx,
        lastClientY: cy,
        centerX: cx,
        centerY: cy,
        dx: 0,
        dy: 0,
        angleDeg: 0,
        magnitude: 0,
        lastEventType: 'reset (reposo)',
        lastEventTarget: 'touchZone'
      };
    }
  }, [debugDataRef, onMove]);

  // Actualiza posición de la perilla y vector según coordenadas clientX, clientY en tiempo real
  const updatePosition = useCallback(
    (clientX: number, clientY: number, customCx?: number, customCy?: number) => {
      if (!baseRef.current) return;

      // REQUISITO 2: En cada pointerdown y pointermove, calcula el centro con getBoundingClientRect()
      // del elemento de la base, y la dirección como (clientX - centroX, clientY - centroY).
      let centerX = customCx;
      let centerY = customCy;
      if (centerX === undefined || centerY === undefined) {
        const rect = baseRef.current.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone mínima de 6px
      if (dist < 6) {
        vectorRef.current = { x: 0, y: 0 };
        onMove({ x: 0, y: 0 });
        if (thumbRef.current) {
          thumbRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        updateDebug('move (deadzone)', 'touchZone', clientX, clientY, centerX, centerY, dx, dy, 0);
        return;
      }

      // La perilla debe dibujarse donde corresponde al dedo, limitada al radio de la base
      const clampedDist = Math.min(dist, maxTravelRadius);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;

      const normX = clampedX / maxTravelRadius;
      const normY = clampedY / maxTravelRadius;
      const magnitude = Math.min(1.0, dist / maxTravelRadius);

      vectorRef.current = { x: normX, y: normY };
      onMove(vectorRef.current);

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
      }

      updateDebug('move (activo)', 'touchZone', clientX, clientY, centerX, centerY, dx, dy, magnitude);
    },
    [maxTravelRadius, onMove, updateDebug]
  );

  // REQUISITO 1: Escucha pointerdown únicamente sobre el elemento de la base del joystick (más un margen de unos 30 px)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Si ya hay un puntero activo en el joystick, ignorar toques secundarios
      if (pointerIdRef.current !== null) return;

      const target = touchZoneRef.current;
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      // Guarda ese pointerId y haz setPointerCapture
      pointerIdRef.current = e.pointerId;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      lastClientPosRef.current = { x: e.clientX, y: e.clientY };

      // Destacar la perilla y la base al ser activadas
      if (thumbRef.current) {
        thumbRef.current.style.background = 'radial-gradient(circle, #38bdf8 0%, #0284c7 100%)';
        thumbRef.current.style.borderColor = '#bae6fd';
        thumbRef.current.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.6)';
      }
      if (baseRef.current) {
        baseRef.current.style.boxShadow =
          '0 0 20px rgba(56, 189, 248, 0.35), inset 0 0 14px rgba(56, 189, 248, 0.2)';
        baseRef.current.style.borderColor = 'rgba(56, 189, 248, 0.9)';
      }

      // Medición inmediata y posición
      if (baseRef.current) {
        const rect = baseRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        updatePosition(e.clientX, e.clientY, cx, cy);
        const targetElement = (e.target as HTMLElement)?.tagName?.toLowerCase() || 'touchZone';
        updateDebug(
          'pointerdown',
          targetElement,
          e.clientX,
          e.clientY,
          cx,
          cy,
          e.clientX - cx,
          e.clientY - cy,
          Math.min(1.0, Math.hypot(e.clientX - cx, e.clientY - cy) / maxTravelRadius)
        );
      }
    },
    [disabled, maxTravelRadius, updateDebug, updatePosition]
  );

  // Escucha pointermove solo del pointerId capturado
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignorar cualquier otro puntero (ej. otro dedo tocando otra zona de la pantalla)
      if (pointerIdRef.current !== e.pointerId || disabled) return;

      e.preventDefault();
      e.stopPropagation();

      lastClientPosRef.current = { x: e.clientX, y: e.clientY };
      updatePosition(e.clientX, e.clientY);
    },
    [disabled, updatePosition]
  );

  // Liberar el joystick al soltar o cancelar el toque
  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Solo atender al puntero activo
      if (pointerIdRef.current !== e.pointerId && pointerIdRef.current !== null) return;

      e.preventDefault();
      e.stopPropagation();

      try {
        if (touchZoneRef.current?.hasPointerCapture(e.pointerId)) {
          touchZoneRef.current.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }

      resetJoystick();
    },
    [resetJoystick]
  );

  // REQUISITO 2: Vuelve a medir cuando cambien resize, orientationchange, visualViewport resize, fullscreenchange y online
  useEffect(() => {
    const handleViewportChange = () => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Si hay un puntero activo en este instante, recalcular de inmediato con las nuevas coordenadas del centro
      if (pointerIdRef.current !== null && lastClientPosRef.current) {
        updatePosition(lastClientPosRef.current.x, lastClientPosRef.current.y, cx, cy);
      } else {
        // Si no hay puntero, asegurar centrado de la perilla
        if (thumbRef.current) {
          thumbRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        if (debugDataRef && debugDataRef.current) {
          debugDataRef.current.centerX = cx;
          debugDataRef.current.centerY = cy;
          debugDataRef.current.lastEventType = 'viewport re-measure';
        }
      }
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    document.addEventListener('fullscreenchange', handleViewportChange);
    window.addEventListener('online', handleViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      document.removeEventListener('fullscreenchange', handleViewportChange);
      window.removeEventListener('online', handleViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [debugDataRef, updatePosition]);

  // Manejador global ante pérdida de foco o si el puntero activo se levanta en la ventana
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      // SOLO resetear si el puntero que se levantó es exactamente el del joystick
      if (pointerIdRef.current !== null && e.pointerId === pointerIdRef.current) {
        resetJoystick();
      }
    };

    const handleGlobalCancel = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId === pointerIdRef.current) {
        resetJoystick();
      }
    };

    const handleWindowBlur = () => {
      resetJoystick();
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalCancel);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleWindowBlur);
    window.addEventListener('pagehide', handleWindowBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalCancel);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleWindowBlur);
      window.removeEventListener('pagehide', handleWindowBlur);
    };
  }, [resetJoystick]);

  // Si se deshabilita (por ejemplo al entrar a un armario), resetear inmediatamente
  useEffect(() => {
    if (disabled) {
      resetJoystick();
    }
  }, [disabled, resetJoystick]);

  return (
    /* ZONA TÁCTIL (BASE + MARGEN DE 30px)
       Base: 122px x 122px. Margen de 30px por lado: 122 + 60 = 182px de diámetro.
       pointerdown se escucha ÚNICAMENTE sobre este elemento circular. */
    <div
      ref={touchZoneRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={resetJoystick}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-[182px] h-[182px] rounded-full flex items-center justify-center select-none touch-none ${
        disabled ? 'opacity-30 pointer-events-none' : 'pointer-events-auto'
      } ${
        DEBUG_INPUT
          ? 'border-2 border-dashed border-fuchsia-400 bg-fuchsia-500/15'
          : 'border-none bg-transparent'
      }`}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Contorno y etiqueta de diagnóstico para la zona táctil */}
      {DEBUG_INPUT && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-fuchsia-950/95 border border-fuchsia-500/80 text-fuchsia-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] pointer-events-none whitespace-nowrap shadow-md">
          ZONA TÁCTIL (BASE + 30px)
        </div>
      )}

      {/* ELEMENTO BASE DEL JOYSTICK (122px x 122px) */}
      <div
        ref={baseRef}
        className="relative w-[122px] h-[122px] rounded-full flex items-center justify-center select-none pointer-events-none transition-all"
        style={{
          background:
            'radial-gradient(circle, rgba(15, 23, 42, 0.75) 0%, rgba(2, 6, 23, 0.9) 100%)',
          boxShadow:
            '0 4px 14px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.05)',
          border: DEBUG_INPUT
            ? '2px solid rgba(56, 189, 248, 0.9)'
            : '2px solid rgba(56, 189, 248, 0.35)',
          touchAction: 'none'
        }}
      >
        {/* Punto rojo central en modo DEBUG */}
        {DEBUG_INPUT && (
          <div className="absolute w-1.5 h-1.5 rounded-full bg-red-400 pointer-events-none z-10" />
        )}

        {/* Indicadores direccionales */}
        <div className="absolute top-1.5 text-[9px] text-sky-400/50 font-bold tracking-widest pointer-events-none">
          ▲
        </div>
        <div className="absolute bottom-1.5 text-[9px] text-sky-400/50 font-bold tracking-widest pointer-events-none">
          ▼
        </div>
        <div className="absolute left-1.5 text-[9px] text-sky-400/50 font-bold tracking-widest pointer-events-none">
          ◀
        </div>
        <div className="absolute right-1.5 text-[9px] text-sky-400/50 font-bold tracking-widest pointer-events-none">
          ▶
        </div>

        {/* Líneas guía */}
        <div className="absolute w-full h-[1px] bg-sky-400/10 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-sky-400/10 pointer-events-none" />

        {/* PERILLA MÓVIL (THUMB HANDLE) */}
        <div
          ref={thumbRef}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg pointer-events-none z-20"
          style={{
            transform: 'translate3d(0px, 0px, 0px)',
            background: 'radial-gradient(circle, #475569 0%, #1e293b 100%)',
            border: '2px solid #64748b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            willChange: 'transform'
          }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
};
