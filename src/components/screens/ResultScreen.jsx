import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ResultScreen({
  resultProfile,
  score,
  totalTimeSpent,
  accuracy,
  maxCombo,
  history,
  setGameState,
  startGame,
}) {
  const statCardClass = 'min-w-0 rounded-3xl border p-5 md:p-6 xl:p-5 2xl:p-6';
  const statLabelClass = 'mb-2 text-sm font-bold uppercase tracking-[0.25em]';
  const statValueClass = 'display-font flex items-end justify-center gap-1 whitespace-nowrap text-[clamp(2.2rem,10vw,3.6rem)] font-black leading-none md:text-[clamp(3rem,5vw,4.5rem)] xl:text-[clamp(2.7rem,3.3vw,4.1rem)]';

  return (
    <div className="glass p-10 md:p-16 rounded-[3rem] text-center w-full max-w-3xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-[#67c8ff] via-[#8be9cd] to-[#ffd86b]" />

      <div className="text-[120px] mb-4">
        {resultProfile.emoji}
      </div>

      <h2 className="display-font text-5xl font-black text-sky-900 mb-2">挑戰結束</h2>
      <p className="text-2xl text-slate-500 mb-10 font-bold">
        {resultProfile.title}
      </p>
      <p className="text-base sm:text-lg text-slate-500 mb-10 font-bold">
        {resultProfile.subtitle}
      </p>

      <div className="mb-12 grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
        <div className={`${statCardClass} bg-[linear-gradient(180deg,#ebf8ff_0%,#f6fdff_100%)] border-sky-100`}>
          <div className={`${statLabelClass} text-sky-500`}>總分</div>
          <div className={`${statValueClass} text-sky-600`}>{score}</div>
        </div>
        <div className={`${statCardClass} bg-[linear-gradient(180deg,#f2fff8_0%,#fbfffd_100%)] border-emerald-100`}>
          <div className={`${statLabelClass} text-emerald-500`}>完成時間</div>
          <div className={`${statValueClass} text-emerald-600`}>
            {totalTimeSpent.toFixed(1)}
            <span className="text-[clamp(0.9rem,3vw,1.2rem)] font-normal opacity-50 md:text-[clamp(1rem,1.8vw,1.6rem)]">s</span>
          </div>
        </div>
        <div className={`${statCardClass} bg-[linear-gradient(180deg,#fff6da_0%,#fffdf4_100%)] border-amber-100`}>
          <div className={`${statLabelClass} text-amber-500`}>正確率</div>
          <div className={`${statValueClass} text-amber-600`}>
            {accuracy}
            <span className="text-[clamp(0.9rem,3vw,1.2rem)] font-normal opacity-50 md:text-[clamp(1rem,1.8vw,1.6rem)]">%</span>
          </div>
        </div>
        <div className={`${statCardClass} bg-[linear-gradient(180deg,#ffe8f2_0%,#fff9fc_100%)] border-pink-100`}>
          <div className={`${statLabelClass} text-pink-500`}>最高連擊</div>
          <div className={`${statValueClass} text-pink-500`}>{maxCombo}</div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="text-left mb-12">
          <h3 className="display-font text-xl font-bold text-sky-900 mb-4 flex items-center gap-2">
            <X className="text-rose-500" /> 錯題複習 ({history.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.map((h, i) => (
              <div key={i} className="bg-white/70 border border-sky-50 p-4 rounded-2xl flex justify-between items-center group hover:bg-white transition-colors">
                <span className="font-black text-lg text-sky-900">{h.num1} × {h.num2} = <span className="text-emerald-600">{h.answer}</span></span>
                <div className="flex flex-col items-end">
                  <span className={cn("text-xs font-bold uppercase", h.isTimeout ? "text-amber-500" : "text-rose-400")}>
                    {h.isTimeout ? '超時' : `你答: ${h.userAnswer}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center flex-wrap">
        <button onClick={() => setGameState('settings')} className="btn-secondary inline-flex items-center gap-2 shrink-0 min-w-[8.5rem] justify-center">
          <RotateCcw size={20} /> 重設模式
        </button>
        <button onClick={startGame} className="btn-primary display-font inline-flex items-center px-12 shrink-0 min-w-[8.5rem] justify-center">再刷一次</button>
      </div>
    </div>
  );
}
