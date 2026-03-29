import React, { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star,
  X, Delete,
  ArrowRight, Award, Volume2, VolumeX
} from 'lucide-react';
import useSound from 'use-sound';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  BGM_VOLUME,
  MULTIPLIER_OPTIONS,
  SOUND_CORRECT,
  SOUND_FINISH,
  SOUND_WRONG,
} from './constants/game';
import SettingsScreen from './components/screens/SettingsScreen';
import ResultScreen from './components/screens/ResultScreen';
import { useGameSession } from './hooks/useGameSession';

// Utility for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SOUND_BGM = `${import.meta.env.BASE_URL}audio/game-bgm.mp3`;
const MotionDiv = motion.div;

function ScreenWrapper({ children, className }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "w-full max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col items-center justify-center min-h-[100dvh] md:min-h-[80dvh]",
        className
      )}
    >
      {children}
    </MotionDiv>
  );
}

export default function App() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // --- Audio ---
  const [playCorrect] = useSound(SOUND_CORRECT, { soundEnabled: isSoundEnabled, volume: 0.55 });
  const [playWrong] = useSound(SOUND_WRONG, { soundEnabled: isSoundEnabled, volume: 0.62 });
  const [playFinish] = useSound(SOUND_FINISH, { soundEnabled: isSoundEnabled, volume: 0.58 });
  const bgmStartedRef = useRef(false);
  const bgmAudioRef = useRef(null);
  const {
    accuracy,
    combo,
    currentIndex,
    currentQuestion,
    currentTimeLimit,
    earnedPoints,
    exitGame,
    feedback,
    gameState,
    handleDelete,
    handleInput,
    handleModeChange,
    handleSubmit,
    history,
    inputHint,
    isExitConfirmOpen,
    maxCombo,
    mode,
    modeLabel,
    resultProfile,
    score,
    selectedMultiplier,
    setGameState,
    setIsExitConfirmOpen,
    setSelectedMultiplier,
    setTimeLimit,
    setUserAnswer,
    startGame,
    timeLeft,
    timeLimit,
    timerLabel,
    totalTimeSpent,
    userAnswer,
  } = useGameSession({ playCorrect, playWrong, playFinish });

  // --- Audio ---
  const stopBgmPlayback = useCallback(() => {
    bgmStartedRef.current = false;
    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.pause();
    bgmAudioRef.current.currentTime = 0;
  }, []);

  const setBgmVolume = useCallback((volume) => {
    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.volume = volume;
  }, []);

  const startBgmPlayback = useCallback(() => {
    if (!isSoundEnabled || !bgmAudioRef.current || bgmStartedRef.current) return;

    setBgmVolume(BGM_VOLUME);
    bgmAudioRef.current.play()
      .then(() => {
        bgmStartedRef.current = true;
      })
      .catch(() => {
        bgmStartedRef.current = false;
      });
  }, [isSoundEnabled, setBgmVolume]);

  // 防範 iOS Safari/PWA 的下拉刷新 (Pull-to-refresh)
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length > 0) startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      // 只處理單指滑動
      if (e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const isPullingDown = currentY > startY;

      // 當我們在畫面最頂端且手勢是往下拉時，禁止預設事件
      if (window.scrollY <= 0 && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    // passive: false 才能讓 preventDefault 生效
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    return () => {
      stopBgmPlayback();
    };
  }, [stopBgmPlayback]);

  useEffect(() => {
    const audio = new Audio(SOUND_BGM);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = BGM_VOLUME;
    bgmAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      bgmAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isSoundEnabled) {
      stopBgmPlayback();
      return;
    }
    startBgmPlayback();
  }, [gameState, isSoundEnabled, startBgmPlayback, stopBgmPlayback]);

  useEffect(() => {
    if (!isSoundEnabled) return;

    const resumeAudio = () => {
      startBgmPlayback();
    };

    window.addEventListener('pointerdown', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    return () => {
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
  }, [isSoundEnabled, startBgmPlayback]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDelete, handleInput, handleSubmit]);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="shape w-[26rem] h-[26rem] bg-[#ffd86b] top-[-8%] left-[-8%]" />
      <div className="shape w-[24rem] h-[24rem] bg-[#8be9cd] bottom-[2%] right-[-6%]" />
      <div className="shape w-[18rem] h-[18rem] bg-[#8bd2ff] top-[38%] right-[10%]" />
      <div className="shape-dot bg-[#ffb3cf] top-[18%] left-[12%]" />
      <div className="shape-dot bg-[#7bd5ff] bottom-[14%] left-[8%]" />
      <div className="shape-dot bg-[#ffd86b] top-[24%] right-[18%]" />
      <button
        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        className="fixed top-4 right-4 z-30 p-3 glass rounded-full hover:scale-110 transition-transform text-sky-600"
        aria-label={isSoundEnabled ? '關閉聲音' : '開啟聲音'}
      >
        {isSoundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <ScreenWrapper key="start">
            <div className="hero-badge-swing mb-8 inline-block p-10 bg-[linear-gradient(135deg,#fff2a8_0%,#ffd08f_100%)] rounded-[3rem] shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_24px_45px_rgba(255,191,73,0.25)] border-4 border-white">
              <Star size={100} className="text-orange-500 fill-white/35" strokeWidth={1.5} />
            </div>
            <h1 className="display-font text-6xl md:text-7xl font-black text-sky-900 mb-4 tracking-tight leading-none drop-shadow-sm text-center">
              <span className="flex flex-col items-center gap-3 md:gap-4">
                <span>九九乘法</span>
                <span className="text-orange-500">大挑戰</span>
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 font-bold max-w-xl text-center leading-relaxed">
              迎接挑戰，成為乘法大師！準備好在壓力下展現你的反應力了嗎？
            </p>
            <button 
              onClick={() => setGameState('settings')}
              className="btn-primary display-font flex items-center gap-3 text-2xl group"
            >
              START <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </ScreenWrapper>
        )}

        {gameState === 'settings' && (
          <ScreenWrapper key="settings">
            <SettingsScreen
              mode={mode}
              handleModeChange={handleModeChange}
              selectedMultiplier={selectedMultiplier}
              setSelectedMultiplier={setSelectedMultiplier}
              multiplierOptions={MULTIPLIER_OPTIONS}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              setGameState={setGameState}
              startGame={startGame}
            />
          </ScreenWrapper>
        )}

        {gameState === 'playing' && (
          <ScreenWrapper key="playing" className="justify-start py-4 md:py-8">
            {/* Header: Progress & Score */}
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

            {/* Timer Bar */}
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
              {/* Question Display */}
              <div className="relative flex-1 flex flex-col items-center justify-center lg:items-start lg:justify-center lg:px-6">
                <div className="mb-3 sm:mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start">
                  <div className="glass px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.18em] sm:tracking-[0.25em] text-sky-600 uppercase">
                    {modeLabel}
                  </div>
                  {mode !== 'mixed' && mode !== 'targeted' && (
                    <div className={cn(
                      "px-4 py-2 rounded-full text-xs sm:text-sm font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase",
                      timeLeft <= 3 ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white/90 text-slate-600 border border-sky-100"
                    )}>
                      {timerLabel} {timeLeft}s
                    </div>
                  )}
                </div>

                <div className="display-font text-[6rem] sm:text-[8rem] md:text-[12rem] font-black text-sky-900 leading-none flex items-baseline gap-3 sm:gap-4 md:gap-8 drop-shadow-2xl lg:text-[10rem] xl:text-[12rem]">
                  <span>{currentQuestion?.num1}</span>
                  <span className="text-orange-400 text-5xl sm:text-6xl md:text-9xl">×</span>
                  <span>{currentQuestion?.num2}</span>
                </div>

                {/* Input Area */}
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

                <div className={cn(
                  "mt-3 sm:mt-4 text-sm sm:text-base font-bold tracking-wide text-center lg:text-left",
                  feedback === 'correct' && "text-emerald-500",
                  feedback === 'wrong' && "text-rose-500",
                  !feedback && "text-slate-400"
                )}>
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

              {/* Virtual Keypad */}
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
            
          </ScreenWrapper>
        )}

        {gameState === 'result' && (
          <ScreenWrapper key="result">
            <ResultScreen
              resultProfile={resultProfile}
              score={score}
              totalTimeSpent={totalTimeSpent}
              accuracy={accuracy}
              maxCombo={maxCombo}
              history={history}
              setGameState={setGameState}
              startGame={startGame}
            />
          </ScreenWrapper>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExitConfirmOpen && gameState === 'playing' && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-950/25 px-4 backdrop-blur-sm"
          >
            <MotionDiv
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="glass w-full max-w-md rounded-[2rem] p-8 text-center"
            >
              <div className="display-font text-3xl font-black text-sky-900">要先離開嗎？</div>
              <p className="mt-3 text-slate-600 font-bold leading-relaxed">
                這一局還在進行中，離開後會回到設定頁，這次作答不會保留。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setIsExitConfirmOpen(false)}
                  className="btn-secondary"
                >
                  繼續作答
                </button>
                <button
                  onClick={exitGame}
                  className="btn-primary"
                >
                  確認離開
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

