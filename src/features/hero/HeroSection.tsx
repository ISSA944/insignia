import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import BrandMarquee from "./BrandMarquee";
import { GlassEffect, GlassFilter } from "../../components/ui/liquid-glass";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4";

function SeamlessVideo({ src }: { src: string }) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const [opacities, setOpacities] = useState<[number, number]>([1, 0]);
  const active = useRef<"A" | "B">("A");
  const switching = useRef(false);

  useEffect(() => {
    refA.current?.play().catch(() => {});
  }, []);

  const crossfade = useCallback((from: "A" | "B") => {
    if (switching.current) return;
    switching.current = true;
    const toRef = from === "A" ? refB : refA;
    const vid = toRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
    setOpacities(from === "A" ? [0, 1] : [1, 0]);
    setTimeout(() => {
      active.current = from === "A" ? "B" : "A";
      switching.current = false;
    }, 800);
  }, []);

  const handleTimeUpdate = useCallback(
    (which: "A" | "B") => {
      const ref = which === "A" ? refA : refB;
      const vid = ref.current;
      if (!vid || isNaN(vid.duration) || active.current !== which) return;
      const timeLeft = vid.duration - vid.currentTime;
      if (timeLeft > 0 && timeLeft < 0.9) crossfade(which);
    },
    [crossfade]
  );

  return (
    <>
      <video
        ref={refA} muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: opacities[0], transition: "opacity 800ms ease-in-out" }}
        onTimeUpdate={() => handleTimeUpdate("A")}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={refB} muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: opacities[1], transition: "opacity 800ms ease-in-out" }}
        onTimeUpdate={() => handleTimeUpdate("B")}
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  );
}

export default function HeroSection() {
  const scrollToSimulator = () => {
    document.querySelector("#simulator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex-1 px-4 sm:px-6 pt-20 pb-4 sm:pb-6 flex items-end">
      <GlassFilter />

      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ height: "calc(100vh - 96px)" }}
      >
        <SeamlessVideo src={VIDEO_SRC} />

        {/* Bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-start justify-start h-full p-7 sm:p-12 pt-28 sm:pt-36">
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <h1
              className="text-black text-5xl sm:text-6xl md:text-7xl font-medium leading-none max-w-xl mb-4"
              style={{ letterSpacing: "-0.04em" }}
            >
              Your Wealth
              <br />
              Works
            </h1>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <p
              className="text-black/65 text-sm sm:text-base max-w-xs sm:max-w-md mb-8 leading-relaxed"
            >
              An automated, reward-powered digital dollar built for native passive
              earnings and effortless connection into DeFi.
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
            <GlassEffect className="rounded-full">
              <button
                onClick={scrollToSimulator}
                className="inline-flex items-center gap-3 text-black text-sm sm:text-base font-medium pl-7 pr-2 py-2 active:scale-95 transition-transform"
              >
                Join us
                <span className="bg-black/10 backdrop-blur rounded-full p-2 border border-black/10">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </span>
              </button>
            </GlassEffect>
          </div>

          <BrandMarquee />
        </div>
      </div>
    </div>
  );
}
