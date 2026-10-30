import React from 'react';
import { Key, FileText, DoorClosed, LogOut, CheckCircle } from 'lucide-react';

interface InteractButtonProps {
  onInteract: () => void;
  targetType: 'key' | 'note' | 'locker_enter' | 'locker_exit' | 'door' | null;
  targetLabel: string | null;
  disabled?: boolean;
}

export const InteractButton: React.FC<InteractButtonProps> = ({
  onInteract,
  targetType,
  targetLabel,
  disabled
}) => {
  const isAvailable = targetType !== null;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      onInteract();
    }
  };

  const renderIcon = () => {
    switch (targetType) {
      case 'key':
        return <Key className="w-5 h-5 text-amber-300 animate-bounce" />;
      case 'note':
        return <FileText className="w-5 h-5 text-sky-300 animate-pulse" />;
      case 'locker_enter':
        return <DoorClosed className="w-5 h-5 text-emerald-300" />;
      case 'locker_exit':
        return <LogOut className="w-5 h-5 text-amber-400" />;
      case 'door':
        return <CheckCircle className="w-5 h-5 text-yellow-300 animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex items-center justify-center select-none touch-none">
      {/* Botón de acción circular (diámetro 80px: w-20 h-20 rounded-full) */}
      {/* Zona táctil circular idéntica, con onPointerDown de latencia cero */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={targetLabel || 'Interactuar'}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-20 h-20 rounded-full flex flex-col items-center justify-center select-none touch-none transition-all duration-150 active:scale-95 ${
          isAvailable
            ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 border-2 border-emerald-300 text-white shadow-[0_0_22px_rgba(16,185,129,0.55)] cursor-pointer gap-0.5'
            : 'bg-slate-900/80 border border-slate-700/60 text-slate-400 shadow-md cursor-pointer opacity-70'
        }`}
      >
        {isAvailable ? (
          <>
            <div className="p-0.5 rounded-full bg-black/20 pointer-events-none">
              {renderIcon()}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-none px-1 pointer-events-none">
              {targetType === 'locker_exit'
                ? 'Salir'
                : targetType === 'locker_enter'
                ? 'Ocultarse'
                : targetType === 'door'
                ? 'Escapar'
                : targetType === 'key'
                ? 'Recoger'
                : targetType === 'note'
                ? 'Recoger'
                : 'Interactuar'}
            </span>
          </>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight px-2 text-slate-400/90 pointer-events-none">
            Interactuar
          </span>
        )}
      </button>
    </div>
  );
};

