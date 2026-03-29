import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ModeCard({ active, onClick, icon, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border-2 md:border-4 transition-all flex flex-col items-center gap-2 md:gap-3 text-center group min-h-[136px] sm:min-h-[132px] md:min-h-0",
        active
          ? "bg-[linear-gradient(145deg,#67c8ff_0%,#35b98b_100%)] border-transparent text-white shadow-xl scale-105"
          : "bg-white/95 border-transparent text-slate-500 hover:border-sky-100 hover:text-sky-800"
      )}
    >
      <div
        className={cn(
          "p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors",
          active ? "bg-white/20" : "bg-sky-50 text-sky-500 group-hover:bg-[#fff4c7]"
        )}
      >
        {React.cloneElement(icon, { size: 24, className: 'sm:w-7 sm:h-7 md:w-8 md:h-8' })}
      </div>
      <div>
        <div className="display-font font-black text-sm sm:text-base md:text-xl mb-1 leading-tight">{title}</div>
        <div className={cn("block text-[10px] sm:text-[11px] md:text-xs font-bold leading-snug px-1", active ? "text-white/85" : "text-slate-400")}>
          {desc}
        </div>
      </div>
    </button>
  );
}
