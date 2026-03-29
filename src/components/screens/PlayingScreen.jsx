import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Delete, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MotionDiv = motion.div;

export default function PlayingScreen({
  combo,
  currentIndex,
  currentQuestion,
  currentTimeLimit,
  earnedPoints,
  feedback,
  handleDelete,
  handleInput,
  handleSubmit,
  inputHint,
  mode,
  modeLabel,
  score,
  setIsExitConfirmOpen,
  setUserAnswer,
  timeLeft,
  timerLabel,
  userAnswer,
}) {
  return (
    <>
      <div className="w-full mb-3 sm:mb-6 px-1 sm:px-4">
        <div className="flex items-center justify-start gap-3">
          <button
            onClick={() => setIsExitConfirmOpen(true)}
            className="btn-secondary px-4 py-3 flex items-center gap-2 text-sm shrink-0"
          >
            <X size={18} /> 離開
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="glass px-4 sm:px-6 py-3 rounded-2xl text-sky-900 font-black text-xl flex items-center gap-2 shrink-0">
              <Award className="text-amber-500" /> <span className="display-font text-2xl">{score}</span>
            </div>
            {combo > 1 && (
              <MotionDiv
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-pink-500 text-white px-3 sm:px-4 py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-[0.14em] shadow-lg shadow-pink-200 whitespace-nowrap"
              >
                Combo x{combo}
              </MotionDiv>
            )}
          </div>
          <div className="glass px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-slate-500 font-bold text-sm sm:text-lg whitespace-nowrap shrink-0">
            Question <span className="text-sky-900">{currentIndex + 1}</span>{mode === 'endless' || mode === 'survival' ? '' : ' / 10'}
          </div>
        </div>
      </div>

      {mode !== 'mixed' && mode !== 'targeted' && (
        <div className="w-full h-3 sm:h-4 bg-white/70 rounded-full overflow-hidden mb-5 sm:mb-12 border border-white/60 shadow-inner">
          <MotionDiv
            className={cn(
              "h-full transition-colors duration-500",
              timeLeft < 3 ? "bg-rose-500" : "bg-[linear-gradient(90deg,#67c8ff,#8be9cd)]"
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / currentTimeLimit) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 w-full flex flex-col gap-4 sm:gap-10 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="relative flex-1 flex flex-col items-center justify-center lg:items-start lg:justify-center lg:px-6">
          <div className="mb-3 sm:mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start">
            <div className="glass px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.18em] sm:tracking-[0.25em] text-sky-600 uppercase">
              {modeLabel}
            </div>
            {mode !== 'mixed' && mode !== 'targeted' && (
              <div
                className={cn(
                  "px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase",
                  timeLeft <= 3 ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white/90 text-slate-600 border border-sky-100"
                )}
              >
                {timerLabel} {timeLeft}s
              </div>
            )}
          </div>

          <div className="display-font text-[6rem] sm:text-[8rem] md:text-[12rem] font-black text-sky-900 leading-none flex items-baseline gap-3 sm:gap-4 md:gap-8 drop-shadow-2xl lg:text-[10rem] xl:text-[12rem]">
            <span>{currentQuestion?.num1}</span>
            <span className="text-orange-400 text-5xl sm:text-6xl md:text-9xl">×</span>
            <span>{currentQuestion?.num2}</span>
          </div>

          <MotionDiv
            animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
            className={cn(
              "relative w-64 sm:w-72 h-28 sm:h-36 mt-5 sm:mt-12 glass rounded-3xl flex items-center justify-center display-font text-7xl sm:text-8xl font-black transition-colors duration-300 lg:w-[20rem]",
              feedback === 'correct' && "bg-emerald-50 border-emerald-500 text-emerald-600",
              feedback === 'wrong' && "bg-rose-50 border-rose-500 text-rose-600",
              !feedback && "text-sky-800"
            )}
          >
            {userAnswer || <span className="text-sky-200 opacity-60">?</span>}

            <AnimatePresence>
              {feedback === 'correct' && (
                <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1.2, opacity: 0 }} className="absolute -inset-4 border-4 border-emerald-400 rounded-[2rem] pointer-events-none" />
              )}
            </AnimatePresence>
          </MotionDiv>

          <div
            className={cn(
              "mt-3 sm:mt-4 text-sm sm:text-base font-bold tracking-wide text-center lg:text-left",
              feedback === 'correct' && "text-emerald-500",
              feedback === 'wrong' && "text-rose-500",
              !feedback && "text-slate-400"
            )}
          >
            {inputHint}
          </div>
          <AnimatePresence>
            {feedback === 'correct' && earnedPoints !== null && (
              <MotionDiv
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.92 }}
                className="absolute right-[calc(50%-10.5rem)] top-[calc(50%-1.75rem)] sm:right-[calc(50%-12rem)] sm:top-[calc(50%-2.2rem)] lg:right-[1.5rem] lg:top-[calc(50%-2.6rem)] px-4 py-2 rounded-full bg-emerald-500 text-white display-font text-lg sm:text-xl font-black shadow-lg shadow-emerald-200 pointer-events-none"
              >
                +{earnedPoints} 分
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        <div className="glass p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md mx-auto lg:mx-0 lg:w-[23rem] lg:min-w-[23rem] lg:self-center">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === 'C') setUserAnswer('');
                  else if (k === 'DEL') handleDelete();
                  else handleInput(k.toString());
                }}
                className="h-16 sm:h-16 bg-white hover:bg-sky-50 text-sky-900 font-black text-xl sm:text-2xl rounded-2xl shadow-sm transition-all active:scale-90 hover:-translate-y-0.5 border border-sky-50 lg:h-[4.5rem]"
              >
                {k === 'DEL' ? <Delete className="mx-auto" /> : k}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!userAnswer || feedback}
            className="w-full mt-3 sm:mt-4 btn-primary display-font py-4 sm:py-6 text-xl sm:text-2xl disabled:opacity-50 disabled:grayscale disabled:shadow-none"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </>
  );
}
