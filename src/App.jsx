import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star,
  ArrowRight, Volume2, VolumeX, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MULTIPLIER_OPTIONS } from './constants/game';
import PlayingScreen from './components/screens/PlayingScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import ResultScreen from './components/screens/ResultScreen';
import { useGameAudio } from './hooks/useGameAudio';
import { useGameSession } from './hooks/useGameSession';

// Utility for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MotionDiv = motion.div;

function ScreenWrapper({ children, className }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "w-full max-w-5xl mx-auto px-4 py-6 md:py-8 xl:py-10 flex flex-col items-center justify-center min-h-full",
        className
      )}
    >
      {children}
    </MotionDiv>
  );
}

export default function App() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [pwaDebugInfo, setPwaDebugInfo] = useState({
    manifestHref: 'loading',
    pageUrl: 'loading',
    userAgent: 'loading',
    isSecureContext: false,
    displayModeStandalone: false,
    navigatorStandalone: false,
    serviceWorkerSupported: false,
    serviceWorkerController: false,
    serviceWorkerRegistered: false,
    beforeInstallPromptFired: false,
  });
  const {
    isSoundEnabled,
    playCorrect,
    playFinish,
    playWrong,
    requestAudioStart,
    setIsSoundEnabled,
  } = useGameAudio();
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
    const updateAppHeight = () => {
      const nextHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${nextHeight}px`);
    };

    updateAppHeight();
    window.visualViewport?.addEventListener('resize', updateAppHeight);
    window.addEventListener('resize', updateAppHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('resize', updateAppHeight);
    };
  }, []);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setShowDebugTools(new URLSearchParams(window.location.search).get('debugPwa') === '1');

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const updateDebugInfo = async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      let serviceWorkerRegistered = false;

      if (serviceWorkerSupported) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          serviceWorkerRegistered = Boolean(registration);
        } catch {
          serviceWorkerRegistered = false;
        }
      }

      setPwaDebugInfo({
        manifestHref: manifestLink?.href ?? 'missing',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
        navigatorStandalone: window.navigator.standalone === true,
        serviceWorkerSupported,
        serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
        serviceWorkerRegistered,
        beforeInstallPromptFired: Boolean(installPromptEvent),
      });
    };

    updateDebugInfo();
  }, [installPromptEvent]);

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
    <div
      className="app-shell relative flex items-center justify-center overflow-hidden"
      onPointerDownCapture={requestAudioStart}
    >
      {/* Decorative Background Shapes */}
      <div className="shape w-[26rem] h-[26rem] bg-[#ffd86b] top-[-8%] left-[-8%]" />
      <div className="shape w-[24rem] h-[24rem] bg-[#8be9cd] bottom-[2%] right-[-6%]" />
      <div className="shape w-[18rem] h-[18rem] bg-[#8bd2ff] top-[38%] right-[10%]" />
      <div className="shape-dot bg-[#ffb3cf] top-[18%] left-[12%]" />
      <div className="shape-dot bg-[#7bd5ff] bottom-[14%] left-[8%]" />
      <div className="shape-dot bg-[#ffd86b] top-[24%] right-[18%]" />
      <button
        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        className="safe-top safe-right-content absolute z-30 glass inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border-2 border-[rgba(103,200,255,0.24)] hover:scale-110 transition-transform text-sky-600 shadow-[0_10px_24px_rgba(112,159,199,0.15)]"
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
            <h1 className="title-font text-6xl md:text-[4.25rem] font-black text-sky-900 mb-4 tracking-tight leading-none drop-shadow-sm text-center">
              <span className="flex flex-col items-center gap-3 md:flex-row md:gap-0 md:whitespace-nowrap">
                <span>九九乘法</span>
                <span className="text-orange-500">大挑戰</span>
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 font-bold max-w-xl md:max-w-none text-center leading-relaxed md:whitespace-nowrap">
              迎接挑戰，成為乘法大師！準備好在壓力下展現你的反應力了嗎？
            </p>
            {showDebugTools && (
              <div className="mb-6 flex justify-center">
                <button
                  onClick={() => setIsDebugOpen((open) => !open)}
                  className="btn-secondary text-sm sm:text-base"
                >
                  {isDebugOpen ? '關閉 PWA 偵錯' : '開啟 PWA 偵錯'}
                </button>
              </div>
            )}
            {showDebugTools && isDebugOpen && (
              <div className="glass mb-8 w-full max-w-3xl rounded-[2rem] px-5 py-5 text-left shadow-[0_18px_45px_rgba(72,127,168,0.16)]">
                <div className="text-lg font-black text-sky-900">PWA 偵錯資訊</div>
                <div className="mt-3 space-y-2 break-all text-sm font-bold leading-relaxed text-slate-700">
                  <div>目前頁面: {pwaDebugInfo.pageUrl}</div>
                  <div>Manifest: {pwaDebugInfo.manifestHref}</div>
                  <div>安全環境: {pwaDebugInfo.isSecureContext ? '是' : '否'}</div>
                  <div>Android 瀏覽器: {isAndroidBrowser ? '是' : '否'}</div>
                  <div>手機瀏覽器: {isMobileBrowser ? '是' : '否'}</div>
                  <div>display-mode standalone: {pwaDebugInfo.displayModeStandalone ? '是' : '否'}</div>
                  <div>navigator.standalone: {pwaDebugInfo.navigatorStandalone ? '是' : '否'}</div>
                  <div>支援 Service Worker: {pwaDebugInfo.serviceWorkerSupported ? '是' : '否'}</div>
                  <div>已註冊 Service Worker: {pwaDebugInfo.serviceWorkerRegistered ? '是' : '否'}</div>
                  <div>目前受 Service Worker 控制: {pwaDebugInfo.serviceWorkerController ? '是' : '否'}</div>
                  <div>`beforeinstallprompt` 已觸發: {pwaDebugInfo.beforeInstallPromptFired ? '是' : '否'}</div>
                  <div>UA: {pwaDebugInfo.userAgent}</div>
                </div>
              </div>
            )}
            <button 
              onClick={() => setGameState('settings')}
              className="btn-primary display-font flex items-center gap-3 text-2xl group mb-4"
            >
              START <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            {installPromptEvent && (
              <button
                onClick={async () => {
                  try {
                    installPromptEvent.prompt();
                    const { outcome } = await installPromptEvent.userChoice;
                    if (outcome === 'accepted') {
                      setInstallPromptEvent(null);
                    }
                  } catch (e) {
                    console.error('PWA prompt error:', e);
                  }
                }}
                className="btn-secondary display-font flex items-center gap-2 text-lg mt-2"
              >
                安裝到手機桌面
              </button>
            )}
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
            <div className="w-full">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <button
                  onClick={() => setIsExitConfirmOpen(true)}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-3 text-sm will-change-transform [transform:translateZ(0)] [backface-visibility:hidden]"
                  aria-label="離開遊戲"
                >
                  <X size={18} /> 離開
                </button>
                <div className="h-[3.25rem] w-[3.25rem] shrink-0" aria-hidden="true" />
              </div>

              <PlayingScreen
                combo={combo}
                currentIndex={currentIndex}
                currentQuestion={currentQuestion}
                currentTimeLimit={currentTimeLimit}
                earnedPoints={earnedPoints}
                feedback={feedback}
                handleDelete={handleDelete}
                handleInput={handleInput}
                handleSubmit={handleSubmit}
                inputHint={inputHint}
                mode={mode}
                modeLabel={modeLabel}
                score={score}
                setUserAnswer={setUserAnswer}
                timeLeft={timeLeft}
                timerLabel={timerLabel}
                userAnswer={userAnswer}
              />
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

