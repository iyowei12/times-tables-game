import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { MULTIPLIER_OPTIONS } from '../constants/game';
import { generateQuestions, getQuestionPool } from '../utils/questions';
import { getPointsForCombo, getResultProfile, getSurvivalTimeLimit } from '../utils/scoring';

export function useGameSession({ playCorrect, playWrong, playFinish }) {
  const [gameState, setGameState] = useState('start');
  const [mode, setMode] = useState('mixed');
  const [timeLimit, setTimeLimit] = useState(5);
  const [selectedMultiplier, setSelectedMultiplier] = useState(MULTIPLIER_OPTIONS[0]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(null);

  const timerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionResolvedRef = useRef(false);
  const questionPool = getQuestionPool(mode, selectedMultiplier);
  const currentQuestion = questions[currentIndex];
  const answeredCount = correctCount + history.length;
  const accuracy = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
  const currentTimeLimit = mode === 'survival'
    ? getSurvivalTimeLimit(timeLimit, currentIndex)
    : timeLimit;
  const modeLabel = mode === 'targeted'
    ? `${selectedMultiplier} 的乘法`
    : mode === 'mixed'
      ? '混合模式'
      : mode === 'blitz'
        ? '單題限時'
        : mode === 'marathon'
          ? '總時挑戰'
          : mode === 'endless'
            ? '無限模式'
            : '生存模式';
  const timerLabel = mode === 'marathon' || mode === 'endless' ? '總剩餘' : '本題剩餘';
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

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'blitz' || newMode === 'survival') {
      setTimeLimit(5);
    } else if (newMode === 'marathon' || newMode === 'endless') {
      setTimeLimit(60);
    }
  }, []);

  const finishGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setGameState('result');
    setTotalTimeSpent((Date.now() - startTimeRef.current) / 1000);

    if (accuracy >= 85 || maxCombo >= 8 || score >= 180) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      playFinish();
    }
  }, [accuracy, clearTimer, clearTransitionTimeout, maxCombo, playFinish, score]);

  const nextQuestion = useCallback(() => {
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setFeedback(null);
    setUserAnswer('');
    setEarnedPoints(null);

    if (mode === 'endless' || mode === 'survival') {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length - 5) {
        setQuestions((prev) => [...prev, ...generateQuestions(questionPool, 12, prev[prev.length - 1])]);
      }

      if (mode === 'survival') {
        setTimeLeft(getSurvivalTimeLimit(timeLimit, nextIndex));
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
  }, [clearTransitionTimeout, currentIndex, finishGame, mode, questionPool, questions.length, timeLimit]);

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
    if (mode === 'marathon' || mode === 'endless' || mode === 'survival') {
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
  }, [clearTimer, clearTransitionTimeout, currentIndex, feedback, finishGame, mode, nextQuestion, playWrong, questions]);

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

    const activeQuestion = questions[currentIndex];
    if (!activeQuestion) return;

    questionResolvedRef.current = true;
    const isCorrect = parseInt(userAnswer, 10) === activeQuestion.answer;

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
      setHistory((prev) => [...prev, { ...activeQuestion, userAnswer }]);
    }

    clearTransitionTimeout();
    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null;
      if (!isCorrect && mode === 'survival') {
        finishGame();
        return;
      }
      nextQuestion();
    }, 800);
  }, [clearTimer, clearTransitionTimeout, combo, currentIndex, feedback, finishGame, mode, nextQuestion, playCorrect, playWrong, questions, userAnswer]);

  const startGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setIsExitConfirmOpen(false);

    setQuestions(generateQuestions(questionPool, mode === 'endless' || mode === 'survival' ? 24 : 10));
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
    } else if (mode === 'survival') {
      setTimeLeft(getSurvivalTimeLimit(timeLimit, 0));
    } else if (mode === 'marathon' || mode === 'endless') {
      setTimeLeft(timeLimit);
    } else {
      setTimeLeft(0);
    }

    startTimeRef.current = Date.now();
  }, [clearTimer, clearTransitionTimeout, mode, questionPool, timeLimit]);

  const exitGame = useCallback(() => {
    clearTimer();
    clearTransitionTimeout();
    questionResolvedRef.current = false;
    setIsExitConfirmOpen(false);
    setFeedback(null);
    setEarnedPoints(null);
    setUserAnswer('');
    setGameState('settings');
  }, [clearTimer, clearTransitionTimeout]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (mode === 'mixed' || mode === 'targeted') return;

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
  }, [clearTimer, currentIndex, gameState, handleTimeout, mode, timeLimit]);

  useEffect(() => {
    return () => {
      clearTimer();
      clearTransitionTimeout();
    };
  }, [clearTimer, clearTransitionTimeout]);

  return {
    accuracy,
    combo,
    correctCount,
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
  };
}
