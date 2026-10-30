import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X } from 'lucide-react';

export const LandscapeNotice: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If height > width and width is mobile-sized (< 768px), it's portrait mobile
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="relative w-full max-w-sm bg-slate-900 border border-sky-500/50 rounded-[2px] p-6 shadow-2xl flex flex-col items-center gap-4">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
          aria-label="Cerrar aviso"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative w-16 h-16 flex items-center justify-center">
          <Smartphone className="w-12 h-12 text-sky-400 animate-[spin_4s_ease-in-out_infinite]" />
          <RotateCw className="w-6 h-6 text-amber-300 absolute -bottom-1 -right-1" />
        </div>

        <h3 className="text-xl font-bold text-sky-300">
          Modo Horizontal Recomendado
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          "Escape Proporcional" fue diseñado para jugarse con ambas manos en posición horizontal (Landscape) en tu celular.
        </p>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-[2px] text-sm transition-colors cursor-pointer"
        >
          Continuar jugando
        </button>
      </div>
    </div>
  );
};
