import React from 'react';
import { Skull, Key, FileText, Clock, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  keysCount: number;
  codePiecesCount: number;
  elapsedSeconds: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  keysCount,
  codePiecesCount,
  elapsedSeconds,
  onRestart
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/95 backdrop-blur-md overflow-hidden h-[100dvh] w-screen select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-700/80 rounded-[2px] p-5 md:p-6 text-slate-100 flex flex-col items-center text-center gap-4 shadow-[0_0_50px_rgba(239,68,68,0.35)]">
        
        {/* Skull Icon */}
        <div className="w-14 h-14 rounded-[2px] bg-red-950/80 border border-red-500/60 flex items-center justify-center shrink-0">
          <Skull className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        {/* Big PERDISTE Title */}
        <h1 className="text-4xl md:text-5xl font-black text-red-500 tracking-wider leading-none">
          PERDISTE
        </h1>

        {/* Ambient Thematic Phrase */}
        <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
          Los espíritus de la escuela te han rodeado en la oscuridad. Tu escape ha fallado y las puertas permanecerán selladas.
        </p>

        {/* Game Stats Summary */}
        <div className="w-full grid grid-cols-3 gap-2 bg-slate-950/90 border border-slate-800 rounded-[2px] p-3 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Llaves
            </span>
            <span className="font-mono font-bold text-sm text-amber-300 mt-0.5">
              {keysCount} / 3
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-sky-400" /> Código
            </span>
            <span className="font-mono font-bold text-sm text-sky-300 mt-0.5">
              {codePiecesCount} / 2
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Tiempo
            </span>
            <span className="font-mono font-bold text-sm text-slate-200 mt-0.5">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Reiniciar Button - Only resets when clicked, no countdown */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={onRestart}
            className="w-full h-12 rounded-[2px] bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm md:text-base shadow-lg shadow-red-950 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
