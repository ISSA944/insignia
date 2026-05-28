import { useEffect, useRef, useState } from "react";
import { ShaderAnimation } from "./ui/shader-lines";

interface PreloaderProps {
  onDone: () => void;
}

const PARTICLES = [
  { x: 8,  size: 3, delay: 0,    dur: 3.8 },
  { x: 19, size: 2, delay: 0.9,  dur: 4.4 },
  { x: 33, size: 4, delay: 1.5,  dur: 3.2 },
  { x: 48, size: 2, delay: 0.3,  dur: 4.9 },
  { x: 61, size: 3, delay: 2.1,  dur: 3.5 },
  { x: 72, size: 2, delay: 0.7,  dur: 4.1 },
  { x: 83, size: 4, delay: 1.2,  dur: 3.7 },
  { x: 93, size: 2, delay: 0.5,  dur: 4.6 },
  { x: 27, size: 3, delay: 1.8,  dur: 3.9 },
  { x: 56, size: 2, delay: 1.0,  dur: 4.3 },
];

/* Words that appear staggered */
const WORDS = ["Earn", "while", "you", "hold."];

export default function Preloader({ onDone }: PreloaderProps) {
  const [progress, setProgress]   = useState(0);
  const [fading, setFading]       = useState(false);
  const [gone, setGone]           = useState(false);
  const [wordIdx, setWordIdx]     = useState(-1);
  const rafRef                    = useRef(0);

  /* Stagger words reveal */
  useEffect(() => {
    const timers = WORDS.map((_, i) =>
      setTimeout(() => setWordIdx(i), 400 + i * 320)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const DURATION = 5200;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(Math.round(ease * 100));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setFading(true);
          setTimeout(() => { setGone(true); onDone(); }, 950);
        }, 400);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onDone]);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 950ms cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Shader background */}
      <div className="absolute inset-0">
        <ShaderAnimation />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60" />

      {/* Ambient rings */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700, height: 700,
          border: "1px solid rgba(255,255,255,0.04)",
          animation: "spin-slow 28s linear infinite",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 460, height: 460,
          border: "1px solid rgba(13,148,136,0.09)",
          animation: "spin-slow 18s linear infinite reverse",
        }}
      />

      {/* Teal glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 500, height: 220,
          background: "radial-gradient(ellipse, rgba(13,148,136,0.10) 0%, transparent 70%)",
          animation: "glow-pulse 5s ease-in-out infinite",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: `${10 + (i % 5) * 8}%`,
            background: i % 3 === 0
              ? "rgba(13,148,136,0.45)"
              : "rgba(255,255,255,0.20)",
            animation: `float ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* ── Main text — no logo ── */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">

        {/* Big staggered headline */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-0">
          {WORDS.map((word, i) => (
            <span
              key={word}
              className="font-light text-white leading-none"
              style={{
                fontSize: "clamp(52px, 8vw, 96px)",
                letterSpacing: "-0.04em",
                opacity: wordIdx >= i ? 1 : 0,
                transform: wordIdx >= i ? "translateY(0)" : "translateY(18px)",
                transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1), transform 600ms cubic-bezier(0.22,1,0.36,1)",
                textShadow: "0 0 60px rgba(255,255,255,0.12)",
                color: word === "hold." ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)",
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Subline */}
        <div
          className="flex flex-col items-center gap-2"
          style={{
            opacity: wordIdx >= 3 ? 1 : 0,
            transform: wordIdx >= 3 ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 700ms 200ms ease, transform 700ms 200ms ease",
          }}
        >
          <div
            className="w-6 h-px"
            style={{ background: "rgba(13,148,136,0.7)" }}
          />
          <p
            className="text-white/35 uppercase tracking-[0.24em] text-xs"
          >
            The digital dollar
          </p>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-[2px] w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0d9488 0%, #22d3ee 50%, #0d9488 100%)",
              boxShadow: "0 0 14px rgba(13,148,136,0.9), 0 0 30px rgba(34,211,238,0.3)",
              transition: "width 80ms linear",
              backgroundSize: "200% 100%",
              animation: "shimmer-bar 2s linear infinite",
            }}
          />
        </div>
        <div className="flex justify-between items-center px-6 py-3">
          <span className="text-white/18 text-[10px] tracking-[0.18em] uppercase">
            ISO · Launching
          </span>
          <span className="text-white/28 text-[11px] tabular-nums font-light" style={{ letterSpacing: "0.06em" }}>
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
