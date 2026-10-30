import React, { useEffect, useState } from 'react';
import { JoystickDebugData } from './VirtualJoystick';

interface InputDiagnosticsProps {
  debugDataRef: React.RefObject<JoystickDebugData>;
  gameState: string;
  isProblemOpen: boolean;
  isPlayerHidden: boolean;
  isCaptureLocked: boolean;
  isPlayerMoving: boolean;
  isPortrait: boolean;
}

export const InputDiagnostics: React.FC<InputDiagnosticsProps> = ({
  debugDataRef,
  gameState,
  isProblemOpen,
  isPlayerHidden,
  isCaptureLocked,
  isPlayerMoving,
  isPortrait
}) => {
  const [data, setData] = useState<JoystickDebugData | null>(null);

  // High-frequency RAF ticker for live 60fps debug numbers without re-rendering parent
  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;

    const tick = (now: number) => {
      // Throttle display updates to ~30fps for readability while keeping real-time responsiveness
      if (now - lastRenderTime > 32 && debugDataRef.current) {
        lastRenderTime = now;
        setData({ ...debugDataRef.current });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [debugDataRef]);

  if (!data) return null;

  // Determine movement status / blocker reason
  let statusText: string;
  let statusColor: string;

  if (data.magnitude > 0.08) {
    if (gameState !== 'PLAYING') {
      statusText = `BLOQUEADO: Partida en ${gameState}`;
      statusColor = 'text-red-400';
    } else if (isProblemOpen) {
      statusText = 'BLOQUEADO: Problema abierto';
      statusColor = 'text-amber-400';
    } else if (isPlayerHidden) {
      statusText = 'BLOQUEADO: Escondido en armario';
      statusColor = 'text-sky-400';
    } else if (isCaptureLocked) {
      statusText = 'BLOQUEADO: Captura en curso';
      statusColor = 'text-red-400';
    } else if (isPlayerMoving) {
      statusText = 'OK: Personaje en movimiento';
      statusColor = 'text-emerald-400';
    } else {
      statusText = 'BLOQUEADO: Colisión con obstáculo';
      statusColor = 'text-orange-400';
    }
  } else {
    statusText = 'Joystick en reposo (magnitud < 0.08)';
    statusColor = 'text-slate-400';
  }

  // Visual magnitude bar
  const barBlocks = Math.round(data.magnitude * 10);
  const barVisual = '█'.repeat(barBlocks) + '░'.repeat(10 - barBlocks);

  return (
    <div
      className="fixed z-40 pointer-events-none select-none font-mono text-[10px] bg-slate-950/90 border border-fuchsia-500/80 rounded-[2px] p-2.5 shadow-[0_0_20px_rgba(217,70,239,0.3)] backdrop-blur-sm max-w-[270px] w-full"
      style={{
        top: isPortrait
          ? 'max(158px, calc(env(safe-area-inset-top, 0px) + 154px))'
          : 'max(56px, calc(env(safe-area-inset-top, 0px) + 52px))',
        left: 'max(12px, calc(env(safe-area-inset-left, 0px) + 12px))'
      }}
    >
      <div className="flex items-center justify-between border-b border-fuchsia-500/40 pb-1 mb-1 text-fuchsia-300 font-bold">
        <span>DEBUG_INPUT: ACTIVO</span>
        <span className="text-[9px] text-fuchsia-400">BASE + 30px</span>
      </div>

      <div className="space-y-0.5 text-slate-300 leading-tight">
        <div>
          <span className="text-slate-400">PointerId:</span>{' '}
          <span className={data.activePointerId !== null ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {data.activePointerId !== null ? `#${data.activePointerId}` : 'Ninguno (inactivo)'}
          </span>
        </div>

        <div>
          <span className="text-slate-400">Último toque:</span>{' '}
          <span className="text-sky-300 font-bold">
            X:{data.lastClientX.toFixed(0)} Y:{data.lastClientY.toFixed(0)}
          </span>
        </div>

        <div>
          <span className="text-slate-400">Centro base:</span>{' '}
          <span className="text-slate-300">
            CX:{data.centerX.toFixed(0)} CY:{data.centerY.toFixed(0)}
          </span>
        </div>

        <div>
          <span className="text-slate-400">Dirección:</span>{' '}
          <span className="text-slate-200">
            dx:{data.dx.toFixed(1)} dy:{data.dy.toFixed(1)} ({data.angleDeg.toFixed(0)}°)
          </span>
        </div>

        <div>
          <span className="text-slate-400">Magnitud:</span>{' '}
          <span className="text-amber-300 font-bold font-mono">
            {data.magnitude.toFixed(2)} [{barVisual}]
          </span>
        </div>

        <div>
          <span className="text-slate-400">Último evento:</span>{' '}
          <span className="text-slate-300 truncate block max-w-[245px]">
            {data.lastEventType} en &lt;{data.lastEventTarget}&gt;
          </span>
        </div>

        <div className="pt-1 mt-1 border-t border-slate-800">
          <span className="text-slate-400 block text-[9px] uppercase">Estado Movimiento:</span>
          <span className={`font-bold block ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
