import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hash, Infinity as InfinityIcon, Settings, Star, Target, Timer, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ModeCard from '../ModeCard';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MotionDiv = motion.div;

export default function SettingsScreen({
  mode,
  handleModeChange,
  selectedMultiplier,
  setSelectedMultiplier,
  multiplierOptions,
  timeLimit,
  setTimeLimit,
  setGameState,
  startGame,
}) {
  return (
    <div className="glass w-full max-w-3xl xl:max-w-4xl text-center p-5 sm:p-6 md:px-12 md:py-10 xl:px-14 xl:py-12 rounded-[2.25rem] md:rounded-[2.5rem] xl:min-h-[52rem] flex flex-col">
      <h2 className="display-font text-3xl sm:text-4xl font-black text-sky-900 mb-6 sm:mb-8 md:mb-10 xl:mb-12 flex items-center justify-center gap-3">
        <Settings className="text-orange-500" /> 遊戲設定
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 xl:gap-5 mb-6 sm:mb-8 md:mb-10">
        <ModeCard active={mode === 'targeted'} onClick={() => handleModeChange('targeted')} icon={<Hash />} title="指定乘數" desc="專心練一個乘數" />
        <ModeCard active={mode === 'mixed'} onClick={() => handleModeChange('mixed')} icon={<Star />} title="混合模式" desc="全部題目混合出題" />
        <ModeCard active={mode === 'blitz'} onClick={() => handleModeChange('blitz')} icon={<Zap />} title="單題限時" desc="每張卡片都是挑戰" />
        <ModeCard active={mode === 'marathon'} onClick={() => handleModeChange('marathon')} icon={<Timer />} title="總時挑戰" desc="速戰速決刷紀錄" />
        <ModeCard active={mode === 'endless'} onClick={() => handleModeChange('endless')} icon={<InfinityIcon />} title="無限模式" desc="限時衝高分，連擊越高分數越高" />
        <ModeCard active={mode === 'survival'} onClick={() => handleModeChange('survival')} icon={<Target />} title="生存模式" desc="節奏加快，答錯一題就結束" />
      </div>

      <AnimatePresence initial={false}>
        {mode === 'targeted' && (
          <MotionDiv
            key="multiplier-panel"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="mb-6 sm:mb-8 md:mb-10 overflow-hidden"
          >
            <div className="mx-auto max-w-2xl p-4 sm:p-5 md:p-6 xl:p-7 bg-[linear-gradient(135deg,rgba(103,200,255,0.12),rgba(155,231,196,0.2))] rounded-2xl xl:rounded-[2rem]">
              <label className="block text-xs sm:text-sm font-black text-sky-900 mb-3 sm:mb-4 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                指定乘數
              </label>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {multiplierOptions.map((value) => (
                  <button
                    key={value}
                    onClick={() => setSelectedMultiplier(value)}
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-sm sm:text-base transition-all border-2",
                      selectedMultiplier === value
                        ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200"
                        : "bg-white border-sky-100 text-sky-600 hover:border-sky-300"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {mode !== 'mixed' && mode !== 'targeted' && (
          <MotionDiv
            key="time-limit-panel"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="mb-6 sm:mb-8 md:mb-10 overflow-hidden"
          >
            <div className="mx-auto max-w-2xl p-4 sm:p-5 md:p-6 xl:p-7 bg-[linear-gradient(135deg,rgba(103,200,255,0.12),rgba(155,231,196,0.2))] rounded-2xl xl:rounded-[2rem]">
              <label className="block text-xs sm:text-sm font-black text-sky-900 mb-3 sm:mb-4 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {mode === 'blitz' || mode === 'survival' ? '單題秒數' : '總時長 (秒)'}
              </label>
              {mode === 'survival' && (
                <p className="mb-3 text-xs sm:text-sm font-bold text-slate-500">
                  會隨作答進度逐步加快，最快 2 秒
                </p>
              )}
              <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                {(mode === 'blitz' || mode === 'survival' ? [3, 5, 10, 20] : [30, 60, 90, 120]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTimeLimit(s)}
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-sm sm:text-base transition-all border-2",
                      timeLimit === s ? "bg-orange-400 border-orange-400 text-white shadow-lg shadow-orange-200" : "bg-white border-sky-100 text-sky-600 hover:border-sky-300"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-2 md:pt-4 flex gap-3 sm:gap-4 justify-center">
        <button onClick={() => setGameState('start')} className="btn-secondary px-5 sm:px-8">返回</button>
        <button onClick={startGame} className="btn-primary px-8 sm:px-16">開始！</button>
      </div>
    </div>
  );
}
