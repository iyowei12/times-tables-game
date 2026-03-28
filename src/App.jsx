import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, Star, X, Delete, Zap, Target, Settings, 
  ArrowRight, Award, Volume2, VolumeX 
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
const MotionDiv = motion.div;

function ScreenWrapper({ children }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]"
    >
      {children}
    </MotionDiv>
  );
}

export default function App() {
  // --- States ---
  const [gameState, setGameState] = useState('start'); // start, settings, playing, result
  const [mode, setMode] = useState('practice'); // practice, blitz (per question), marathon (total time)
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
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  // --- Audio ---
  const [playCorrect] = useSound(SOUND_CORRECT, { soundEnabled: isSoundEnabled, volume: 0.5 });
  const [playWrong] = useSound(SOUND_WRONG, { soundEnabled: isSoundEnabled, volume: 0.5 });
  const [playFinish] = useSound(SOUND_FINISH, { soundEnabled: isSoundEnabled, volume: 0.5 });

  const timerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionResolvedRef = useRef(false);

  // --- Logic ---
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

  const generateQuestions = () => {
    const pool = [];

    for (let num1 = 2; num1 <= 9; num1 += 1) {
      for (let num2 = num1; num2 <= 9; num2 += 1) {
        pool.push({ num1, num2, answer: num1 * num2 });
      }
    }

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, 10);
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length || 10;
  const accuracy = Math.round((score / (totalQuestions * 10)) * 100);
  const modeLabel = mode === 'practice' ? '練習模式' : mode === 'blitz' ? '單題限時' : '總時挑戰';
  const timerLabel = mode === 'blitz' ? '本題剩餘' : '總剩餘';
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

    if (score >= 80) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      playFinish();
    }
  }, [playFinish, score]);

  const nextQuestion = useCallback(() => {
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setFeedback(null);
    setUserAnswer('');

    if (currentIndex < 9) {
      setCurrentIndex((prev) => prev + 1);
      if (mode === 'blitz') {
        setTimeLeft(timeLimit);
      }
    } else {
      finishGame();
    }
  }, [currentIndex, finishGame, mode, timeLimit]);

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
    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      nextQuestion();
    }, 1000);
  }, [currentIndex, feedback, nextQuestion, playWrong, questions]);

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
      setFeedback('correct');
      playCorrect();
      setScore((prev) => prev + 10);
      setCombo((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      playWrong();
      setCombo(0);
      setHistory((prev) => [...prev, { ...currentQ, userAnswer }]);
    }

    clearTransitionTimeout();
    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      nextQuestion();
    }, 800);
  }, [currentIndex, feedback, nextQuestion, playCorrect, playWrong, questions, userAnswer]);

  const startGame = () => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    const q = generateQuestions();
    setQuestions(q);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setFeedback(null);
    setHistory([]);
    setCombo(0);
    setTotalTimeSpent(0);
    setGameState('playing');

    if (mode === 'blitz') {
      setTimeLeft(timeLimit);
    } else if (mode === 'marathon') {
      setTimeLeft(timeLimit * 10); // 10 questions total
    } else {
      setTimeLeft(0);
    }
    
    startTimeRef.current = Date.now();
  };

  const exitGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setFeedback(null);
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

  useEffect(() => {
    return () => {
      clearTimer();
      clearTransitionTimeout();
    };
  }, []);

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="shape w-[26rem] h-[26rem] bg-[#ffd86b] top-[-8%] left-[-8%]" />
      <div className="shape w-[24rem] h-[24rem] bg-[#8be9cd] bottom-[2%] right-[-6%]" />
      <div className="shape w-[18rem] h-[18rem] bg-[#8bd2ff] top-[38%] right-[10%]" />
      <div className="shape-dot bg-[#ffb3cf] top-[18%] left-[12%]" />
      <div className="shape-dot bg-[#7bd5ff] bottom-[14%] left-[8%]" />
      <div className="shape-dot bg-[#ffd86b] top-[24%] right-[18%]" />

      {/* Sound Toggle */}
      <button 
        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        className="fixed top-6 right-6 p-3 glass rounded-full hover:scale-110 transition-transform z-50 text-sky-600"
      >
        {isSoundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <ScreenWrapper key="start">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="mb-8 p-10 bg-[linear-gradient(135deg,#fff2a8_0%,#ffd08f_100%)] rounded-[3rem] shadow-[inset_0_3px_0_rgba(255,255,255,0.8),0_24px_45px_rgba(255,191,73,0.25)] border-4 border-white"
            >
              <Star size={100} className="text-orange-500 fill-white/35" strokeWidth={1.5} />
            </motion.div>
            <h1 className="display-font text-6xl md:text-7xl font-black text-sky-900 mb-4 tracking-tight drop-shadow-sm">
              九九乘法<span className="text-orange-500">大挑戰</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 font-bold max-w-xl text-center leading-relaxed">
              迎接挑戰，成為乘法大師！準備好在壓力下展現你的反應力了嗎？
            </p>
            <button 
              onClick={() => setGameState('settings')}
              className="btn-primary display-font flex items-center gap-3 text-2xl group"
            >
              進入設定 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </ScreenWrapper>
        )}

        {gameState === 'settings' && (
          <ScreenWrapper key="settings">
            <div className="glass p-8 md:p-12 rounded-[2.5rem] w-full max-w-2xl text-center">
              <h2 className="display-font text-4xl font-black text-sky-900 mb-10 flex items-center justify-center gap-3">
                <Settings className="text-orange-500" /> 遊戲設定
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <ModeCard 
                  active={mode === 'practice'} 
                  onClick={() => setMode('practice')}
                  icon={<Star />} 
                  title="練習模式" 
                  desc="沒有壓力，慢慢來" 
                />
                <ModeCard 
                  active={mode === 'blitz'} 
                  onClick={() => setMode('blitz')}
                  icon={<Zap />} 
                  title="單題限時" 
                  desc="每張卡片都是挑戰" 
                />
                <ModeCard 
                  active={mode === 'marathon'} 
                  onClick={() => setMode('marathon')}
                  icon={<Target />} 
                  title="總時挑戰" 
                  desc="速戰速決刷紀錄" 
                />
              </div>

              {mode !== 'practice' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-10 p-6 bg-[linear-gradient(135deg,rgba(103,200,255,0.12),rgba(155,231,196,0.2))] rounded-2xl"
                >
                  <label className="block text-sm font-black text-sky-900 mb-4 uppercase tracking-[0.3em]">
                    {mode === 'blitz' ? '單題秒數' : '總計時限 (秒)'}
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    {[3, 5, 10, 20].map(s => (
                      <button 
                        key={s}
                        onClick={() => setTimeLimit(s)}
                        className={cn(
                          "w-14 h-14 rounded-xl font-bold transition-all border-2",
                          timeLimit === s ? "bg-orange-400 border-orange-400 text-white shadow-lg shadow-orange-200" : "bg-white border-sky-100 text-sky-600 hover:border-sky-300"
                        )}
                      >
                        {mode === 'marathon' ? s * 10 : s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex gap-4 justify-center">
                <button onClick={() => setGameState('start')} className="btn-secondary">返回</button>
                <button onClick={startGame} className="btn-primary px-16">開始！</button>
              </div>
            </div>
          </ScreenWrapper>
        )}

        {gameState === 'playing' && (
          <ScreenWrapper key="playing">
            {/* Header: Progress & Score */}
            <div className="w-full flex justify-between items-center mb-8 px-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={exitGame}
                  className="btn-secondary px-5 py-3 flex items-center gap-2 text-sm"
                >
                  <X size={18} /> 離開
                </button>
                <div className="glass px-6 py-3 rounded-2xl text-sky-900 font-black text-xl flex items-center gap-2">
                  <Award className="text-amber-500" /> <span className="display-font text-2xl">{score}</span>
                </div>
                {combo > 1 && (
                <MotionDiv 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="bg-pink-500 text-white px-4 py-2 rounded-full font-black text-sm uppercase tracking-tighter shadow-lg shadow-pink-200"
                >
                  Combo x{combo}
                </MotionDiv>
                )}
              </div>
              <div className="text-slate-500 font-bold text-lg">
                Question <span className="text-sky-900">{currentIndex + 1}</span> / 10
              </div>
            </div>

            {/* Timer Bar */}
            {mode !== 'practice' && (
              <div className="w-full h-4 bg-white/70 rounded-full overflow-hidden mb-12 border border-white/60 shadow-inner">
                <MotionDiv 
                  className={cn(
                    "h-full transition-colors duration-500",
                    timeLeft < 3 ? "bg-rose-500" : "bg-[linear-gradient(90deg,#67c8ff,#8be9cd)]"
                  )}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / (mode === 'blitz' ? timeLimit : timeLimit * 10)) * 100}%` }}
                />
              </div>
            )}

            {/* Question Display */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
                <div className="glass px-4 py-2 rounded-full text-sm font-black tracking-[0.25em] text-sky-600 uppercase">
                  {modeLabel}
                </div>
                {mode !== 'practice' && (
                  <div className={cn(
                    "px-4 py-2 rounded-full text-sm font-black tracking-[0.2em] uppercase",
                    timeLeft <= 3 ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white/90 text-slate-600 border border-sky-100"
                  )}>
                    {timerLabel} {timeLeft}s
                  </div>
                )}
              </div>

              <div className="display-font text-[8rem] md:text-[12rem] font-black text-sky-900 leading-none flex items-baseline gap-4 md:gap-8 drop-shadow-2xl">
                <span>{currentQuestion?.num1}</span>
                <span className="text-orange-400 text-6xl md:text-9xl">×</span>
                <span>{currentQuestion?.num2}</span>
              </div>

              {/* Input Area */}
              <MotionDiv 
                animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
                className={cn(
                  "relative w-72 h-36 mt-12 glass rounded-3xl flex items-center justify-center text-8xl font-black transition-colors duration-300",
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
                "mt-4 text-base font-bold tracking-wide",
                feedback === 'correct' && "text-emerald-500",
                feedback === 'wrong' && "text-rose-500",
                !feedback && "text-slate-400"
              )}>
                {inputHint}
              </div>
            </div>

            {/* Virtual Keypad */}
            <div className="mt-12 glass p-4 rounded-[2.5rem] w-full max-w-md">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === 'C') setUserAnswer('');
                      else if (k === 'DEL') handleDelete();
                      else handleInput(k.toString());
                    }}
                    className="h-16 bg-white hover:bg-sky-50 text-sky-900 font-black text-2xl rounded-2xl shadow-sm transition-all active:scale-90 hover:-translate-y-0.5 border border-sky-50"
                  >
                    {k === 'DEL' ? <Delete className="mx-auto" /> : k}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSubmit}
                disabled={!userAnswer || feedback}
                className="w-full mt-4 btn-primary display-font py-6 text-2xl disabled:opacity-50 disabled:grayscale disabled:shadow-none"
              >
                CONFIRM
              </button>
            </div>
            
          </ScreenWrapper>
        )}

        {gameState === 'result' && (
          <ScreenWrapper key="result">
            <div className="glass p-10 md:p-16 rounded-[3rem] text-center w-full max-w-3xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-[#67c8ff] via-[#8be9cd] to-[#ffd86b]" />
              
              <div className="text-[120px] mb-4">
                {score === 100 ? '👑' : score >= 80 ? '🔥' : score >= 60 ? '👌' : '💪'}
              </div>
              
              <h2 className="display-font text-5xl font-black text-sky-900 mb-2">挑戰結束</h2>
              <p className="text-2xl text-slate-500 mb-10 font-bold">
                {score === 100 ? '太強了！你是乘法之神！' : score >= 80 ? '令人驚嘆的表現！' : '還有進步的空間，加油！'}
              </p>

              <div className="flex flex-col md:flex-row gap-6 justify-center mb-12">
                <div className="bg-[linear-gradient(180deg,#ebf8ff_0%,#f6fdff_100%)] p-8 rounded-3xl flex-1 border border-sky-100">
                  <div className="text-sm font-bold text-sky-500 uppercase tracking-widest mb-1">總分</div>
                  <div className="display-font text-7xl font-black text-sky-600">{score}</div>
                </div>
                <div className="bg-[linear-gradient(180deg,#f2fff8_0%,#fbfffd_100%)] p-8 rounded-3xl flex-1 border border-emerald-100">
                  <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-1">完成時間</div>
                  <div className="display-font text-7xl font-black text-emerald-600">{totalTimeSpent.toFixed(1)}<span className="text-2xl ml-1 font-normal opacity-50">s</span></div>
                </div>
                <div className="bg-[linear-gradient(180deg,#fff6da_0%,#fffdf4_100%)] p-8 rounded-3xl flex-1 border border-amber-100">
                  <div className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">正確率</div>
                  <div className="display-font text-7xl font-black text-amber-600">{accuracy}<span className="text-2xl ml-1 font-normal opacity-50">%</span></div>
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
    </div>
  );
}

// --- Subcomponents ---

function ModeCard({ active, onClick, icon, title, desc }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 text-center group",
        active 
          ? "bg-[linear-gradient(145deg,#67c8ff_0%,#35b98b_100%)] border-transparent text-white shadow-xl scale-105" 
          : "bg-white/95 border-transparent text-slate-500 hover:border-sky-100 hover:text-sky-800"
      )}
    >
      <div className={cn(
        "p-4 rounded-2xl transition-colors",
        active ? "bg-white/20" : "bg-sky-50 text-sky-500 group-hover:bg-[#fff4c7]"
      )}>
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <div>
        <div className="display-font font-black text-xl mb-1">{title}</div>
        <div className={cn("text-xs font-bold", active ? "text-white/80" : "text-slate-400")}>{desc}</div>
      </div>
    </button>
  );
}
