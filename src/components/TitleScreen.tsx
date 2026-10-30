import React, { useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, Clock } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isMuted, onToggleMute }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        soundManager.playFootstep();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-slate-950/95 text-slate-100 backdrop-blur-md select-none overflow-hidden h-[100dvh]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900 border border-sky-900/60 rounded-[2px] shadow-[0_0_50px_rgba(14,165,233,0.3)] p-5 md:p-7 flex flex-col items-center text-center gap-4">
        
        {/* Sound toggle at top right */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          className="absolute top-4 right-4 p-2 rounded-[2px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 mt-1">
          Escape Proporcional
        </h1>

        {/* Historia de la escuela embrujada (3 o 4 líneas legibles) */}
        <div className="space-y-1.5 text-xs md:text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/70 border border-slate-800 rounded-[2px] p-3.5 w-full text-left sm:text-center">
          <p>Estás atrapado en una escuela embrujada durante la medianoche.</p>
          <p>Cinco entidades espectrales patrullan los pasillos en tu búsqueda.</p>
          <p>Encuentra las 3 llaves y las 2 piezas del código de 4 dígitos para abrir la salida.</p>
          <p className="text-amber-300 font-semibold">¡Si te descubren, escóndete en los armarios antes de que te atrapen!</p>
        </div>

        {/* Countdown / Botón Jugar */}
        <div className="w-full flex items-center justify-center min-h-[56px] pt-1">
          {countdown > 0 ? (
            <div className="flex items-center justify-center gap-2 text-sm md:text-base font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 px-5 py-3 rounded-[2px] w-full animate-pulse">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" />
              <span>Podrás jugar en {countdown}...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-[2px] bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black text-base md:text-lg shadow-[0_0_25px_rgba(14,165,233,0.5)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer animate-fadeIn"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Jugar</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
