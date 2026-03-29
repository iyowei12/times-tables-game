import { useCallback, useEffect, useRef, useState } from 'react';
import useSound from 'use-sound';
import { BGM_VOLUME, SOUND_CORRECT, SOUND_FINISH, SOUND_WRONG } from '../constants/game';

export function useGameAudio() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [playCorrect] = useSound(SOUND_CORRECT, { soundEnabled: isSoundEnabled, volume: 0.55 });
  const [playWrong] = useSound(SOUND_WRONG, { soundEnabled: isSoundEnabled, volume: 0.62 });
  const [playFinish] = useSound(SOUND_FINISH, { soundEnabled: isSoundEnabled, volume: 0.58 });
  const bgmStartedRef = useRef(false);
  const bgmAudioRef = useRef(null);
  const soundBgm = `${import.meta.env.BASE_URL}audio/game-bgm.mp3`;

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

  const requestAudioStart = useCallback(() => {
    startBgmPlayback();
  }, [startBgmPlayback]);

  useEffect(() => {
    return () => {
      stopBgmPlayback();
    };
  }, [stopBgmPlayback]);

  useEffect(() => {
    const audio = new Audio(soundBgm);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = BGM_VOLUME;
    bgmAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      bgmAudioRef.current = null;
    };
  }, [soundBgm]);

  useEffect(() => {
    if (!isSoundEnabled) {
      stopBgmPlayback();
      return;
    }
    startBgmPlayback();
  }, [isSoundEnabled, startBgmPlayback, stopBgmPlayback]);

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

  return {
    isSoundEnabled,
    playCorrect,
    playFinish,
    playWrong,
    requestAudioStart,
    setIsSoundEnabled,
  };
}
