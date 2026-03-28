import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, Star, X, Delete, Zap, Target, Settings, 
  ArrowRight, Award, Volume2, VolumeX, Infinity as InfinityIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Sound Effects (Using public assets)
const SOUND_CORRECT = 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3';
const SOUND_WRONG = 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3';
const SOUND_FINISH = 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3';
const SOUND_BGM = `${import.meta.env.BASE_URL}audio/game-bgm.mp3`;
const BGM_VOLUME = 0.14;
const MotionDiv = motion.div;
const QUESTION_POOL = Array.from({ length: 8 }, (_, i) => i + 2).flatMap((num1) =>
  Array.from({ length: 10 - num1 }, (_, offset) => {
    const num2 = num1 + offset;
    return { num1, num2, answer: num1 * num2 };
  })
);

function generateQuestions(count = 10) {
  const batch = [];

  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(Math.random() * QUESTION_POOL.length);
    batch.push(QUESTION_POOL[index]);
  }

  return batch;
}

function getPointsForCombo(combo) {
  return 10 + Math.min(combo, 10) * 3;
}

function getResultProfile({ accuracy, maxCombo, score, correctCount, mode }) {
  if (accuracy >= 95 && maxCombo >= 8) {
    return {
      emoji: '👑',
      title: '乘法傳說',
      subtitle: '節奏、速度和準度都超強，幾乎沒有破綻。',
    };
  }

  if (score >= 180 || maxCombo >= 10 || (mode === 'endless' && correctCount >= 18)) {
    return {
      emoji: '🔥',
      title: '連擊風暴',
      subtitle: '你越打越順，分數一路往上衝。',
    };
  }

  if (accuracy >= 85) {
    return {
      emoji: '🌟',
      title: '心算高手',
      subtitle: '整體表現很穩，已經有高手的感覺了。',
    };
  }

  if (accuracy >= 70 || correctCount >= 8) {
    return {
      emoji: '💪',
      title: '節奏冒險家',
      subtitle: '你抓到節奏了，再多練一下就會更厲害。',
    };
  }

  return {
    emoji: '🌱',
    title: '勇敢練習王',
    subtitle: '每一題都在進步，下一次一定會更強。',
  };
}

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
  // --- States ---
  const [gameState, setGameState] = useState('start'); // start, settings, playing, result
  const [mode, setMode] = useState('practice'); // practice, blitz (per question), marathon (total time), endless (survival)
  const [timeLimit, setTimeLimit] = useState(5); // seconds
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // correct, wrong, null
  const [history, setHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(null);

  // --- Audio ---
  const [playCorrect] = useSound(SOUND_CORRECT, { soundEnabled: isSoundEnabled, volume: 0.55 });
  const [playWrong] = useSound(SOUND_WRONG, { soundEnabled: isSoundEnabled, volume: 0.62 });
  const [playFinish] = useSound(SOUND_FINISH, { soundEnabled: isSoundEnabled, volume: 0.58 });
  const timerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionResolvedRef = useRef(false);
  const bgmStartedRef = useRef(false);
  const bgmAudioRef = useRef(null);

  // --- Logic ---
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'blitz') {
      setTimeLimit(5);
    } else if (newMode === 'marathon' || newMode === 'endless') {
      setTimeLimit(60);
    }
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearTransitionTimeout = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };

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

  const currentQuestion = questions[currentIndex];
  const answeredCount = correctCount + history.length;
  const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
  const modeLabel = mode === 'practice'
    ? '練習模式'
    : mode === 'blitz'
      ? '單題限時'
      : mode === 'marathon'
        ? '總時挑戰'
        : '無限模式';
  const timerLabel = mode === 'blitz' ? '本題剩餘' : '總剩餘';
  const resultProfile = getResultProfile({ accuracy, maxCombo, score, correctCount, mode });
  const inputHint = feedback === 'correct'
    ? '答對了'
    : feedback === 'wrong'
      ? currentQuestion
        ? `正確答案 ${currentQuestion.answer}`
        : '答錯了'
      : userAnswer
        ? '按 Enter 或下方按鈕送出'
        : '輸入答案';

  const finishGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setGameState('result');
    const timeSpent = (Date.now() - startTimeRef.current) / 1000;
    setTotalTimeSpent(timeSpent);

    if (accuracy >= 85 || maxCombo >= 8 || score >= 180) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      playFinish();
    }
  }, [accuracy, maxCombo, playFinish, score]);

  const nextQuestion = useCallback(() => {
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setFeedback(null);
    setUserAnswer('');
    setEarnedPoints(null);

    if (mode === 'endless') {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length - 5) {
        setQuestions((prev) => [...prev, ...generateQuestions(12)]);
      }

      setCurrentIndex(nextIndex);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);

      if (mode === 'blitz') {
        setTimeLeft(timeLimit);
      }

      return;
    }

    finishGame();
  }, [currentIndex, finishGame, mode, questions.length, timeLimit]);

  const handleTimeout = useCallback(() => {
    if (questionResolvedRef.current || feedback) return;

    questionResolvedRef.current = true;
    clearTimer();
    setFeedback('wrong');
    playWrong();
    setCombo(0);
    setHistory((prev) => [
      ...prev,
      { ...questions[currentIndex], userAnswer: 'TIMEOUT', isTimeout: true },
    ]);

    clearTransitionTimeout();
    if (mode === 'marathon' || mode === 'endless') {
      transitionTimeoutRef.current = window.setTimeout(() => {
        transitionTimeoutRef.current = null;
        finishGame();
      }, 1000);
      return;
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      nextQuestion();
    }, 1000);
  }, [currentIndex, feedback, finishGame, mode, nextQuestion, playWrong, questions]);

  const handleInput = useCallback((val) => {
    if (feedback) return;
    if (userAnswer.length < 3) {
      setUserAnswer((prev) => prev + val);
    }
  }, [feedback, userAnswer.length]);

  const handleDelete = useCallback(() => {
    if (feedback) return;
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleSubmit = useCallback(() => {
    if (!userAnswer || feedback || questionResolvedRef.current) return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    questionResolvedRef.current = true;
    const isCorrect = parseInt(userAnswer, 10) === currentQ.answer;

    clearTimer();

    if (isCorrect) {
      const nextCombo = combo + 1;
      const earnedScore = getPointsForCombo(combo);
      setFeedback('correct');
      setEarnedPoints(earnedScore);
      playCorrect();
      setScore((prev) => prev + earnedScore);
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      setEarnedPoints(null);
      playWrong();
      setCombo(0);
      setHistory((prev) => [...prev, { ...currentQ, userAnswer }]);
    }

    clearTransitionTimeout();
    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      nextQuestion();
    }, 800);
  }, [combo, currentIndex, feedback, nextQuestion, playCorrect, playWrong, questions, userAnswer]);

  const startGame = () => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setIsExitConfirmOpen(false);
    const q = generateQuestions(mode === 'endless' ? 24 : 10);
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setFeedback(null);
    setEarnedPoints(null);
    setHistory([]);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTotalTimeSpent(0);
    setGameState('playing');

    if (mode === 'blitz') {
      setTimeLeft(timeLimit);
    } else if (mode === 'marathon' || mode === 'endless') {
      setTimeLeft(timeLimit);
    } else {
      setTimeLeft(0);
    }
    
    startTimeRef.current = Date.now();
  };

  const exitGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setIsExitConfirmOpen(false);
    setFeedback(null);
    setEarnedPoints(null);
    setUserAnswer('');
    setGameState('settings');
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (mode === 'practice') return;

    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [gameState, mode, currentIndex, timeLimit, handleTimeout]);

  // Deprecated redundant effect to avoid cascading renders
  // useEffect removed as logic moved to handleModeChange


  useEffect(() => {
    return () => {
      clearTimer();
      clearTransitionTimeout();
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
            <div className="glass p-5 sm:p-6 md:p-12 rounded-[2.25rem] md:rounded-[2.5rem] w-full max-w-2xl text-center">
              <h2 className="display-font text-3xl sm:text-4xl font-black text-sky-900 mb-6 sm:mb-8 md:mb-10 flex items-center justify-center gap-3">
                <Settings className="text-orange-500" /> 遊戲設定
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-10">
                <ModeCard 
                  active={mode === 'practice'} 
                  onClick={() => handleModeChange('practice')}
                  icon={<Star />} 
                  title="練習模式" 
                  desc="沒有壓力，慢慢來" 
                />
                <ModeCard 
                  active={mode === 'blitz'} 
                  onClick={() => handleModeChange('blitz')}
                  icon={<Zap />} 
                  title="單題限時" 
                  desc="每張卡片都是挑戰" 
                />
                <ModeCard 
                  active={mode === 'marathon'} 
                  onClick={() => handleModeChange('marathon')}
                  icon={<Target />} 
                  title="總時挑戰" 
                  desc="速戰速決刷紀錄" 
                />
                <ModeCard 
                  active={mode === 'endless'} 
                  onClick={() => handleModeChange('endless')}
                  icon={<InfinityIcon />} 
                  title="無限模式" 
                  desc="撐到時間結束為止" 
                />
              </div>

              <AnimatePresence initial={false}>
                {mode !== 'practice' && (
                  <motion.div 
                    key="time-limit-panel"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="mb-6 sm:mb-8 md:mb-10 overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 md:p-6 bg-[linear-gradient(135deg,rgba(103,200,255,0.12),rgba(155,231,196,0.2))] rounded-2xl">
                      <label className="block text-xs sm:text-sm font-black text-sky-900 mb-3 sm:mb-4 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                        {mode === 'blitz' ? '單題秒數' : '總時長 (秒)'}
                      </label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                        {(mode === 'blitz' ? [3, 5, 10, 20] : [30, 60, 90, 120]).map(s => (
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 sm:gap-4 justify-center">
                <button onClick={() => setGameState('start')} className="btn-secondary px-5 sm:px-8">返回</button>
                <button onClick={startGame} className="btn-primary px-8 sm:px-16">開始！</button>
              </div>
            </div>
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
                  Question <span className="text-sky-900">{currentIndex + 1}</span>{mode === 'endless' ? '' : ' / 10'}
                </div>
              </div>
            </div>

            {/* Timer Bar */}
            {mode !== 'practice' && (
              <div className="w-full h-3 sm:h-4 bg-white/70 rounded-full overflow-hidden mb-5 sm:mb-12 border border-white/60 shadow-inner">
                <MotionDiv 
                  className={cn(
                    "h-full transition-colors duration-500",
                    timeLeft < 3 ? "bg-rose-500" : "bg-[linear-gradient(90deg,#67c8ff,#8be9cd)]"
                  )}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
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
                  {mode !== 'practice' && (
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

// --- Subcomponents ---

function ModeCard({ active, onClick, icon, title, desc }) {
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
      <div className={cn(
        "p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors",
        active ? "bg-white/20" : "bg-sky-50 text-sky-500 group-hover:bg-[#fff4c7]"
      )}>
        {React.cloneElement(icon, { size: 24, className: "sm:w-7 sm:h-7 md:w-8 md:h-8" })}
      </div>
      <div>
        <div className="display-font font-black text-sm sm:text-base md:text-xl mb-1 leading-tight">{title}</div>
        <div className={cn("block text-[10px] sm:text-[11px] md:text-xs font-bold leading-snug px-1", active ? "text-white/85" : "text-slate-400")}>{desc}</div>
      </div>
    </button>
  );
}
