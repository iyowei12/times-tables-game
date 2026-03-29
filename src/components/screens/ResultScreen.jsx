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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 justify-center mb-12">
        <div className="bg-[linear-gradient(180deg,#ebf8ff_0%,#f6fdff_100%)] p-6 md:p-8 rounded-3xl border border-sky-100">
          <div className="text-sm font-bold text-sky-500 uppercase tracking-widest mb-1">總分</div>
          <div className="display-font text-5xl md:text-7xl font-black text-sky-600">{score}</div>
        </div>
        <div className="bg-[linear-gradient(180deg,#f2fff8_0%,#fbfffd_100%)] p-6 md:p-8 rounded-3xl border border-emerald-100">
          <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-1">完成時間</div>
          <div className="display-font text-5xl md:text-7xl font-black text-emerald-600">{totalTimeSpent.toFixed(1)}<span className="text-xl md:text-2xl ml-1 font-normal opacity-50">s</span></div>
        </div>
        <div className="bg-[linear-gradient(180deg,#fff6da_0%,#fffdf4_100%)] p-6 md:p-8 rounded-3xl border border-amber-100">
          <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">正確率</div>
          <div className="display-font text-5xl md:text-7xl font-black text-amber-600">{accuracy}<span className="text-xl md:text-2xl ml-1 font-normal opacity-50">%</span></div>
        </div>
        <div className="bg-[linear-gradient(180deg,#ffe8f2_0%,#fff9fc_100%)] p-6 md:p-8 rounded-3xl border border-pink-100">
          <div className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-1">最高連擊</div>
          <div className="display-font text-5xl md:text-7xl font-black text-pink-500">{maxCombo}</div>
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

      <div className="flex gap-4 justify-center">
        <button onClick={() => setGameState('settings')} className="btn-secondary flex items-center gap-2">
          <RotateCcw size={20} /> 重設模式
        </button>
        <button onClick={startGame} className="btn-primary display-font px-12">再刷一次</button>
      </div>
    </div>
  );
}
