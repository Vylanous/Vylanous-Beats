import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export interface PlayingBeat {
  id: string;
  title: string;
  artworkUrl: string;
  audioUrl: string;
  bpm?: number;
  musicalKey?: string;
}

interface PlayerCtx {
  current: PlayingBeat | null;
  isPlaying: boolean;
  progress: number; // 0..1
  duration: number;
  playBeat: (beat: PlayingBeat) => void;
  toggle: () => void;
  seek: (frac: number) => void;
  stop: () => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayingBeat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const onError = () => {
      // A missing/expired preview url used to fail silently — the play button
      // just did nothing. Surface it in the console and reset the UI state.
      try {
        console.error("[player] preview failed to load", audio.src, audio.error?.message);
      } catch {
        /* noop */
      }
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const playBeat = useCallback(
    (beat: PlayingBeat) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!beat.audioUrl) {
        try {
          console.error("[player] beat has no playable preview url", beat.id, beat.title);
        } catch {
          /* noop */
        }
        return;
      }
      if (current?.id === beat.id) {
        if (audio.paused) {
          audio.play();
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }
        return;
      }
      setCurrent(beat);
      audio.src = beat.audioUrl;
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      // fire-and-forget play count
      fetch(`/api/beats/${beat.id}/play`, { method: "POST" }).catch(() => {});
    },
    [current],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  const seek = useCallback((frac: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = frac * audio.duration;
    setProgress(frac);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrent(null);
  }, []);

  return (
    <Ctx.Provider value={{ current, isPlaying, progress, duration, playBeat, toggle, seek, stop }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
