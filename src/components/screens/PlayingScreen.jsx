import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Delete } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MotionDiv = motion.div;

const ComboBadge = memo(function ComboBadge({ combo, className }) {
  if (combo <= 1) return null;

  return (
    <MotionDiv
      key={combo}
      initial={{ scale: 0.78, y: 10, opacity: 0 }}
      animate={{ scale: [1, 1.18, 0.94, 1.08, 1], y: [10, -6, 0], opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={className}
    >
      Combo x{combo}
    </MotionDiv>
  );
});

const TopHeader = memo(function TopHeader({
  combo,
  currentIndex,
  mode,
  modeLabel,
  score,
  timeLeft,
  timerLabel,
}) {
  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="glass glass-stable px-4 sm:px-6 py-3 rounded-2xl text-sky-900 font-black text-xl flex items-center gap-2 shrink-0">
            <Award className="text-amber-500" /> <span className="display-font text-2xl">{score}</span>
          </div>
          <ComboBadge
            combo={combo}
            className="bg-pink-500 text-white px-3 sm:px-4 py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-[0.14em] shadow-lg shadow-pink-200 whitespace-nowrap"
          />
        </div>
        <div className="glass glass-stable px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-slate-500 font-bold text-sm sm:text-lg whitespace-nowrap shrink-0">
          Question <span className="text-sky-900">{currentIndex + 1}</span>{mode === 'endless' || mode === 'survival' ? '' : ' / 10'}
        </div>
      </div>

      <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="glass glass-stable px-5 py-3 rounded-2xl text-sky-900 font-black text-lg flex items-center gap-2 shrink-0">
            <Award className="text-amber-500" />
            <span className="display-font text-2xl">{score}</span>
          </div>
          <div className="glass glass-stable px-4 py-2.5 rounded-full text-sm font-black tracking-[0.2em] text-sky-600 uppercase whitespace-nowrap">
            {modeLabel}
          </div>
          <ComboBadge
            combo={combo}
            className="bg-pink-500 text-white px-4 py-2 rounded-full font-black text-sm uppercase tracking-[0.14em] shadow-lg shadow-pink-200 whitespace-nowrap"
          />
          {mode !== 'mixed' && mode !== 'targeted' && (
            <div
              className={cn(
                "glass-stable px-4 py-2.5 rounded-full text-sm font-black tracking-[0.15em] uppercase whitespace-nowrap",
                timeLeft <= 3 ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white/90 text-slate-600 border border-sky-100"
              )}
            >
              {timerLabel} {timeLeft}s
            </div>
          )}
        </div>

        <div className="glass glass-stable px-4 py-3 rounded-2xl text-slate-500 font-bold text-lg whitespace-nowrap shrink-0">
          Question <span className="text-sky-900">{currentIndex + 1}</span>{mode === 'endless' || mode === 'survival' ? '' : ' / 10'}
        </div>
      </div>
    </>
  );
});

const TimerBar = memo(function TimerBar({ currentTimeLimit, mode, timeLeft }) {
  if (mode === 'mixed' || mode === 'targeted') return null;

  const widthPercent = currentTimeLimit > 0 ? `${(timeLeft / currentTimeLimit) * 100}%` : '0%';

  return (
    <div className="playing-timer glass-stable w-full h-3 sm:h-4 bg-white/70 rounded-full overflow-hidden mb-5 sm:mb-12 border border-white/60 shadow-inner">
      <MotionDiv
        className={cn(
          "h-full transition-colors duration-500",
          timeLeft < 3 ? "bg-rose-500" : "bg-[linear-gradient(90deg,#67c8ff,#8be9cd)]"
        )}
        initial={false}
        animate={{ width: widthPercent }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
    </div>
  );
});

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
  setUserAnswer,
  timeLeft,
  timerLabel,
  userAnswer,
}) {
  return (
    <div className="playing-screen w-full flex flex-1 min-h-0 flex-col overflow-y-auto px-1 sm:px-4">
      <div className="playing-header w-full mb-3 sm:mb-6">
        <TopHeader
          combo={combo}
          currentIndex={currentIndex}
          mode={mode}
          modeLabel={modeLabel}
          score={score}
          timeLeft={timeLeft}
          timerLabel={timerLabel}
        />
      </div>

      <TimerBar
        currentTimeLimit={currentTimeLimit}
        mode={mode}
        timeLeft={timeLeft}
      />

      <div className="playing-main flex-1 w-full flex flex-col gap-4 sm:gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center lg:gap-10">
        <div className="playing-stage relative flex-1 flex flex-col items-center justify-center lg:items-center lg:justify-center lg:px-6">
          <div className="playing-badges mb-3 sm:mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:hidden">
            <div className="glass glass-stable px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.18em] sm:tracking-[0.25em] text-sky-600 uppercase">
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

          <div className="playing-equation display-font text-[6rem] sm:text-[8rem] md:text-[12rem] font-black text-sky-900 leading-none flex items-baseline gap-3 sm:gap-4 md:gap-8 drop-shadow-2xl lg:text-[clamp(10rem,14.5vh,12rem)] lg:gap-3 xl:text-[clamp(11rem,15.5vh,13rem)]">
            <span>{currentQuestion?.num1}</span>
            <span className="text-orange-400 text-[0.85em]">×</span>
            <span>{currentQuestion?.num2}</span>
          </div>

          <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-5 lg:mt-10">
            <div className="relative">
              <AnimatePresence>
                {feedback === 'correct' && earnedPoints !== null && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    className="absolute -right-5 -top-4 z-10 px-4 py-2 rounded-full bg-emerald-500 text-white display-font text-xl font-black shadow-lg shadow-emerald-200 pointer-events-none"
                  >
                    +{earnedPoints} 分
                  </MotionDiv>
                )}
              </AnimatePresence>

            <MotionDiv
              animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
              className={cn(
                "playing-answer playing-answer-desktop relative h-28 w-[14rem] glass rounded-[1.6rem] flex items-center justify-center display-font text-[4.75rem] font-black transition-colors duration-300 xl:h-32 xl:w-[15rem] xl:text-[5.25rem]",
                feedback === 'correct' && "bg-emerald-50 border-emerald-500 text-emerald-600",
                feedback === 'wrong' && "bg-rose-50 border-rose-500 text-rose-600",
                !feedback && "text-sky-800"
              )}
            >
              {userAnswer || <span className="text-sky-200 opacity-60">?</span>}

              <AnimatePresence>
                {feedback === 'correct' && (
                  <MotionDiv initial={{ scale: 0 }} animate={{ scale: 1.2, opacity: 0 }} className="absolute -inset-4 border-4 border-emerald-400 rounded-[2.6rem] pointer-events-none" />
                )}
              </AnimatePresence>
            </MotionDiv>
            </div>

            <div
              className={cn(
                "playing-hint min-h-[1.75rem] text-center text-lg font-bold tracking-wide",
                feedback === 'correct' && "text-emerald-500",
                feedback === 'wrong' && "text-rose-500",
                !feedback && "text-slate-400"
              )}
            >
              {inputHint}
            </div>
          </div>

          <div className="relative lg:hidden">
            <AnimatePresence>
              {feedback === 'correct' && earnedPoints !== null && (
                <MotionDiv
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.92 }}
                  className="absolute -right-8 -top-3 z-10 px-4 py-2 rounded-full bg-emerald-500 text-white display-font text-lg sm:text-xl font-black shadow-lg shadow-emerald-200 pointer-events-none"
                >
                  +{earnedPoints} 分
                </MotionDiv>
              )}
            </AnimatePresence>

            <MotionDiv
              animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
              className={cn(
                "playing-answer relative w-64 sm:w-72 h-28 sm:h-36 mt-5 sm:mt-12 glass rounded-3xl flex items-center justify-center display-font text-7xl sm:text-8xl font-black transition-colors duration-300",
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
          </div>

          <div
            className={cn(
              "playing-hint mt-3 sm:mt-4 text-sm sm:text-base font-bold tracking-wide text-center lg:hidden",
              feedback === 'correct' && "text-emerald-500",
              feedback === 'wrong' && "text-rose-500",
              !feedback && "text-slate-400"
            )}
          >
            {inputHint}
          </div>
        </div>

        <div className="playing-keypad glass p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md mx-auto lg:mx-0 lg:w-[23rem] lg:min-w-[23rem] lg:self-center">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === 'C') setUserAnswer('');
                  else if (k === 'DEL') handleDelete();
                  else handleInput(k.toString());
                }}
                className="playing-key h-16 sm:h-16 bg-white hover:bg-sky-50 text-sky-900 font-black text-xl sm:text-2xl rounded-2xl shadow-sm transition-all active:scale-90 hover:-translate-y-0.5 border border-sky-50 lg:h-[4.5rem]"
              >
                {k === 'DEL' ? <Delete className="mx-auto" /> : k}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!userAnswer || feedback}
            className="playing-confirm w-full mt-3 sm:mt-4 btn-primary display-font py-4 sm:py-6 text-xl sm:text-2xl disabled:opacity-50 disabled:grayscale disabled:shadow-none"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
}
