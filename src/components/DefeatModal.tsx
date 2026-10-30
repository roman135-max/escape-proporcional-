import React, { useState } from 'react';
import { ProportionalityProblem } from '../data/problems';
import { RotateCcw, Check, AlertCircle, Shield } from 'lucide-react';

interface DefeatModalProps {
  problem: ProportionalityProblem;
  attemptsRemaining: number;
  maxAttempts: number;
  onContinue: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  problem,
  attemptsRemaining,
  maxAttempts,
  onContinue
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = userAnswer.trim().replace(',', '.');
    const parsed = parseFloat(clean);

    if (isNaN(parsed)) return;

    if (parsed === problem.numericAnswer) {
      setIsCorrect(true);
      setFeedbackMessage(null);
    } else {
      setIsCorrect(false);
      setFeedbackMessage('Respuesta incorrecta, inténtalo de nuevo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/90 backdrop-blur-sm overflow-hidden h-[100dvh] w-screen select-none">
      <div className="relative w-full max-w-3xl h-[88dvh] max-h-[460px] bg-slate-900 border-2 border-red-900/80 rounded-[2px] p-4 md:p-5 text-slate-100 flex flex-row gap-4 md:gap-6 overflow-hidden shadow-2xl">
        
        {/* Left Column: ¡TE ATRAPARON! + Problem */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden gap-2">
          
          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl md:text-3xl font-black text-red-400 tracking-tight leading-none">
                ¡TE ATRAPARON!
              </h2>
              {/* Badge de intentos consistente */}
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] font-bold border bg-amber-950/70 border-amber-600/50 text-amber-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Intentos restantes: {attemptsRemaining} / {maxAttempts}</span>
              </span>
            </div>
            <p className="text-xs md:text-sm font-bold text-amber-300 underline decoration-amber-400/50 mt-1">
              Resuélvelo en una hoja para poder continuar
            </p>
          </div>

          {/* Problem Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-[2px] p-3 md:p-3.5 flex flex-col gap-1.5 justify-center flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                {problem.title}
              </span>
              <span
                className={`text-[10px] md:text-xs px-2 py-0.5 rounded-[2px] font-bold uppercase tracking-wider shrink-0 ${
                  problem.type === 'directa'
                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                Proporcionalidad {problem.type === 'directa' ? 'Directa' : 'Inversa'}
              </span>
            </div>

            <p className="text-xs md:text-sm text-slate-200 leading-snug line-clamp-3 font-medium">
              {problem.statement}
            </p>

            <div className="p-2 md:p-2.5 bg-slate-900 border border-slate-700/80 rounded-[2px] text-xs md:text-sm font-semibold text-white">
              {problem.question}
            </div>
          </div>

        </div>

        {/* Right Column: Campo de respuesta numérico + Comprobar / Resultado + Continuar */}
        <div className="w-52 md:w-60 flex flex-col justify-between items-center py-1 shrink-0 h-full">
          
          {/* Upper Slot: Formulario numérico / Resultado */}
          <div className="w-full flex flex-col items-center justify-center flex-1 gap-2">
            {!isCorrect ? (
              <form onSubmit={handleCheckAnswer} className="w-full flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Escribe tu respuesta numérica:
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="any"
                  placeholder="Ej: 105"
                  value={userAnswer}
                  onChange={(e) => {
                    setUserAnswer(e.target.value);
                    if (feedbackMessage) setFeedbackMessage(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-[2px] px-3 py-2 text-sm md:text-base font-mono font-bold text-yellow-300 placeholder:text-slate-600 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!userAnswer.trim()}
                  className="h-10 w-full rounded-[2px] border border-amber-600/70 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-slate-950 font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  <span>Comprobar</span>
                </button>

                {feedbackMessage && (
                  <div className="text-[11px] font-semibold text-red-400 flex items-center gap-1 bg-red-950/70 border border-red-800/60 p-1.5 rounded-[2px] leading-tight">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{feedbackMessage}</span>
                  </div>
                )}
              </form>
            ) : (
              <div className="w-full bg-slate-950 border border-emerald-500/60 rounded-[2px] p-3 flex flex-col items-center justify-center text-center shadow-[inset_0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  ¡Correcto!
                </span>
                <span className="text-base md:text-lg font-black text-emerald-300 font-mono tracking-tight leading-tight mt-1 px-1 break-words">
                  {problem.finalAnswer}
                </span>
              </div>
            )}
          </div>

          {/* Lower Slot: Botón "Continuar" - ONLY visible when isCorrect is true */}
          <div className="w-full flex items-center justify-center pt-2 min-h-[48px]">
            {isCorrect && (
              <button
                type="button"
                onClick={onContinue}
                className="h-11 md:h-12 w-full px-5 rounded-[2px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer whitespace-nowrap animate-fadeIn"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Continuar partida</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
