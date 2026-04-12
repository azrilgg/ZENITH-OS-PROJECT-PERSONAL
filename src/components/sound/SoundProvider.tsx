'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════
// ZenithSoundEngine — Web Audio API synthesizer
// ═══════════════════════════════════════════════════════

class ZenithSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    }
  }

  public stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) { }
      try { this.noiseNode.disconnect(); } catch (e) { }
      this.noiseNode = null;
    }
    if (this.filterNode) {
      try { this.filterNode.disconnect(); } catch (e) { }
      this.filterNode = null;
    }
  }

  public playNoise(type: 'whitenoise' | 'rain' | 'fire') {
    this.init();
    this.stop();
    if (!this.ctx || !this.gainNode) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'whitenoise') {
        data[i] = white * 0.15;
      } else {
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        if (type === 'rain') {
          data[i] *= 3.5;
        } else if (type === 'fire') {
          data[i] *= 3.0;
          if (Math.random() > 0.997) {
            data[i] = (Math.random() > 0.5 ? 1 : -1) * 0.8;
          }
        }
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 800;
    } else if (type === 'fire') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 600;
    } else {
      this.filterNode.type = 'allpass';
    }

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.noiseNode.start();
  }

  public playChime(volume: number) {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;

    const chimeGain = ctx.createGain();
    chimeGain.connect(ctx.destination);

    [523.25, 659.25, 783.99, 987.77].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(chimeGain);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + 0.05 + (idx * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5 + (idx * 0.2));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 3);
    });
  }
}

// ═══════════════════════════════════════════════════════
// Sound definitions
// ═══════════════════════════════════════════════════════

export const AMBIENT_SOUNDS = [
  { id: 'lofi', label: 'Lofi', emoji: '🎵', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', type: 'synth' as const },
  { id: 'whitenoise', label: 'White Noise', emoji: '🌊', type: 'synth' as const },
  { id: 'fire', label: 'Fireplace', emoji: '🔥', type: 'synth' as const },
];

// ═══════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════

interface SoundContextType {
  activeSound: string | null;
  volume: number;
  isMuted: boolean;
  toggleSound: (soundId: string) => void;
  setVolume: (v: number) => void;
  setIsMuted: (m: boolean) => void;
  stopAll: () => void;
  playChime: (vol?: number) => void;
}

const SoundContext = createContext<SoundContextType>({
  activeSound: null,
  volume: 0.5,
  isMuted: false,
  toggleSound: () => { },
  setVolume: () => { },
  setIsMuted: () => { },
  stopAll: () => { },
  playChime: () => { },
});

export function useSound() {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMutedState] = useState(false);
  const synthRef = useRef<ZenithSoundEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasRestoredRef = useRef(false);

  // Persist helpers
  const persistState = useCallback((soundId: string | null, vol: number, muted: boolean) => {
    try {
      if (soundId) {
        localStorage.setItem('zenith_sound_active', soundId);
      } else {
        localStorage.removeItem('zenith_sound_active');
      }
      localStorage.setItem('zenith_sound_volume', vol.toString());
      localStorage.setItem('zenith_sound_muted', muted ? '1' : '0');
    } catch (e) { }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem('zenith_sound_volume', v.toString());
  }, []);

  const setIsMuted = useCallback((m: boolean) => {
    setIsMutedState(m);
    localStorage.setItem('zenith_sound_muted', m ? '1' : '0');
  }, []);

  // Start a sound by id (internal helper)
  const startSound = useCallback((soundId: string, effectiveVol: number) => {
    // Stop any current playback first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    synthRef.current?.stop();

    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
    if (!sound) return;

    if (sound.url) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = effectiveVol;
      audio.play().catch(console.error);
      audioRef.current = audio;
    } else if (sound.type === 'synth') {
      synthRef.current?.setVolume(effectiveVol);
      synthRef.current?.playNoise(soundId as any);
    }
  }, []);

  // Initialize engine + restore saved state
  useEffect(() => {
    synthRef.current = new ZenithSoundEngine();

    // Restore persisted state
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      try {
        const savedSound = localStorage.getItem('zenith_sound_active');
        const savedVol = localStorage.getItem('zenith_sound_volume');
        const savedMuted = localStorage.getItem('zenith_sound_muted');

        const restoredVol = savedVol ? parseFloat(savedVol) : 0.5;
        const restoredMuted = savedMuted === '1';

        setVolumeState(restoredVol);
        setIsMutedState(restoredMuted);

        if (savedSound) {
          const effectiveVol = restoredMuted ? 0 : restoredVol;
          // Small delay to let AudioContext initialize after user gesture
          setTimeout(() => {
            startSound(savedSound, effectiveVol);
            setActiveSound(savedSound);
          }, 300);
        }
      } catch (e) { }
    }

    return () => {
      synthRef.current?.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [startSound]);

  // Update volume reactively
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    synthRef.current?.setVolume(effectiveVol);
  }, [volume, isMuted]);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    synthRef.current?.stop();
    setActiveSound(null);
    persistState(null, volume, isMuted);
  }, [volume, isMuted, persistState]);

  const toggleSound = useCallback((soundId: string) => {
    if (activeSound === soundId) {
      stopAll();
      return;
    }

    const effectiveVol = isMuted ? 0 : volume;
    startSound(soundId, effectiveVol);
    setActiveSound(soundId);
    persistState(soundId, volume, isMuted);
  }, [activeSound, volume, isMuted, stopAll, startSound, persistState]);

  const playChime = useCallback((vol?: number) => {
    const effectiveVol = vol ?? (isMuted ? 0 : 0.7);
    synthRef.current?.playChime(effectiveVol);
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{
      activeSound,
      volume,
      isMuted,
      toggleSound,
      setVolume,
      setIsMuted,
      stopAll,
      playChime,
    }}>
      {children}
    </SoundContext.Provider>
  );
}
