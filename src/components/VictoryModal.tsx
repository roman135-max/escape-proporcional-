import React, { useState, useEffect } from 'react';
import { Trophy, Award, Key, CheckCircle, RotateCcw, Clock, Save, Medal } from 'lucide-react';

export interface RecordEntry {
  id: string;
  name: string;
  timeSeconds: number;
}

const STORAGE_KEY = 'escape_proporcional_records_v3';

interface VictoryModalProps {
  elapsedSeconds: number;
  code: string;
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ elapsedSeconds, code, onPlayAgain }) => {
  const [studentName, setStudentName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [records, setRecords] = useState<RecordEntry[]>([]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
  };

  // Load records from localStorage (starting completely empty without mock names)
  useEffect(() => {
    try {
      // Clear old legacy mock keys if present
      localStorage.removeItem('escape_proporcional_records');
      localStorage.removeItem('escape_proporcional_records_v2');

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setRecords([]);
  }, []);

  // Save current player record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaved) return;

    const trimmedName = studentName.trim() || 'Jugador';
    const newEntry: RecordEntry = {
      id: Date.now().toString(),
      name: trimmedName,
      timeSeconds: elapsedSeconds
    };

    const updated = [...records, newEntry].sort((a, b) => a.timeSeconds - b.timeSeconds);
    setRecords(updated);
    setIsSaved(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage fallback
    }
  };

  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/90 backdrop-blur-sm overflow-hidden h-[100dvh] w-screen select-none">
      {isPortrait ? (
        /* PANTALLA "¡ESCAPASTE!" EN VERTICAL (UNA SOLA COLUMNA) */
        <div className="relative w-full max-w-md max-h-[96dvh] bg-slate-900 border-2 border-amber-500/80 rounded-[2px] p-3.5 sm:p-4 text-slate-100 flex flex-col gap-2.5 overflow-hidden shadow-2xl justify-between">
          
          {/* 1. Título "¡ESCAPASTE!" con trofeo y debajo texto de premio con medalla alineada */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-[2px] bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight leading-none">
                ¡ESCAPASTE!
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-yellow-300 mt-1 uppercase tracking-wide flex items-center gap-1 leading-tight">
                <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>MUESTRA ESTA PANTALLA PARA RECLAMAR TU PREMIO</span>
              </p>
            </div>
          </div>

          {/* 2. Estadísticas (Llaves, Código, Tiempo) en una fila de 3 columnas iguales, cada valor en una sola línea */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 border border-slate-800 rounded-[2px] p-2 text-center text-xs shrink-0">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-400 shrink-0" /> Llaves
              </span>
              <span className="font-bold text-amber-300 font-mono text-xs sm:text-sm whitespace-nowrap mt-0.5">
                3/3 ✓
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" /> Código
              </span>
              <span className="font-bold text-emerald-300 font-mono text-xs sm:text-sm whitespace-nowrap mt-0.5">
                {code} ✓
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400 shrink-0" /> Tiempo
              </span>
              <span className="font-bold text-sky-300 font-mono text-xs sm:text-sm whitespace-nowrap mt-0.5">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* 3. Campo "Escribe tu nombre..." y botón "Guardar" juntos en una fila, botón completo y visible */}
          <form onSubmit={handleSaveRecord} className="bg-slate-950/90 border border-amber-500/40 rounded-[2px] p-2 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Escribe tu nombre..."
              value={studentName}
              disabled={isSaved}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-[2px] px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-yellow-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSaved}
              className={`h-9 px-3.5 rounded-[2px] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                isSaved
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 active:scale-95 shadow-md'
              }`}
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>{isSaved ? 'Guardado ✓' : 'Guardar'}</span>
            </button>
          </form>

          {/* 4. Lista de "Mejores récords" con altura razonable y scroll interno */}
          <div className="flex-1 min-h-[90px] max-h-[170px] bg-slate-950/90 border border-slate-800 rounded-[2px] p-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5 shrink-0">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Mejores Récords
              </span>
              <span className="text-[10px] text-slate-400">Menor tiempo</span>
            </div>

            {records.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic font-medium p-2 text-center">
                Aún no hay récords
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                {records.map((rec, index) => {
                  const isFirst = index === 0;
                  return (
                    <div
                      key={rec.id}
                      className={`flex items-center justify-between px-2 py-1 rounded-[2px] border transition-all ${
                        isFirst
                          ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`font-mono text-xs ${isFirst ? 'text-amber-400' : 'text-slate-400'}`}>
                          {index + 1}.
                        </span>
                        <span className="truncate">{rec.name}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs shrink-0 ml-2 ${isFirst ? 'text-amber-300' : 'text-slate-300'}`}>
                        {formatTime(rec.timeSeconds)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Botón "Jugar de nuevo" a todo el ancho */}
          <button
            type="button"
            onClick={onPlayAgain}
            className="h-10 sm:h-11 w-full rounded-[2px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar de nuevo</span>
          </button>

        </div>
      ) : (
        /* PANTALLA "¡ESCAPASTE!" EN HORIZONTAL (EXACTAMENTE COMO ESTABA, SIN CAMBIOS) */
        <div className="relative w-full max-w-4xl h-[90dvh] max-h-[480px] bg-slate-900 border-2 border-amber-500/80 rounded-[2px] p-4 md:p-5 text-slate-100 flex flex-row gap-4 md:gap-6 overflow-hidden shadow-2xl">
          
          {/* Left Column: ¡ESCAPASTE! + Premio + Guardar Nombre */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden gap-2">
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[2px] bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight leading-none">
                  ¡ESCAPASTE!
                </h2>
                {/* Texto exacto requerido */}
                <p className="text-xs md:text-sm font-bold text-yellow-300 mt-1 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span>Muestra esta pantalla para reclamar tu premio</span>
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800 rounded-[2px] p-2.5 text-center text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" /> Llaves
                </span>
                <span className="font-bold text-amber-300 font-mono text-sm">3 / 3 ✓</span>
              </div>
              <div className="flex flex-col items-center border-x border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Código
                </span>
                <span className="font-bold text-emerald-300 font-mono text-sm">{code} ✓</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" /> Tiempo
                </span>
                <span className="font-bold text-sky-300 font-mono text-sm">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Formulario para registrar el nombre y tiempo */}
            <form onSubmit={handleSaveRecord} className="bg-slate-950/90 border border-amber-500/40 rounded-[2px] p-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribe tu nombre..."
                value={studentName}
                disabled={isSaved}
                onChange={(e) => setStudentName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-[2px] px-3 py-2 text-xs md:text-sm font-semibold text-yellow-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSaved}
                className={`h-10 px-4 rounded-[2px] font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 cursor-default'
                    : 'bg-amber-600 hover:bg-amber-500 text-slate-950 active:scale-95 shadow-md'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? 'Guardado ✓' : 'Guardar'}</span>
              </button>
            </form>

          </div>

          {/* Right Column: Tabla de Récords (con scroll interno) y Botón compacto */}
          <div className="w-56 md:w-64 flex flex-col justify-between overflow-hidden gap-2.5 shrink-0 h-full">
            
            {/* Ranking Box */}
            <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-[2px] p-2.5 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-amber-400" />
                  Mejores Récords
                </span>
                <span className="text-[10px] text-slate-400">Menor tiempo</span>
              </div>

              {/* Lista de records o mensaje de vacío */}
              {records.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic font-medium p-3 text-center">
                  Aún no hay récords
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {records.map((rec, index) => {
                    const isFirst = index === 0;
                    return (
                      <div
                        key={rec.id}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[2px] border transition-all ${
                          isFirst
                            ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-mono text-xs ${isFirst ? 'text-amber-400' : 'text-slate-400'}`}>
                            {index + 1}.
                          </span>
                          <span className="truncate">{rec.name}</span>
                        </div>
                        <span className={`font-mono font-bold text-xs shrink-0 ${isFirst ? 'text-amber-300' : 'text-slate-300'}`}>
                          {formatTime(rec.timeSeconds)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botón compacto Jugar de nuevo */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onPlayAgain}
                className="h-11 w-full rounded-[2px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar de nuevo</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
