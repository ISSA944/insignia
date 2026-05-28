import { useState, useEffect, useRef } from "react";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

const DRAIN_PER_SECOND = 5503;
const BANK_APY = 0.0045;
const HALO_APY = 0.085;
const INFLATION = 0.024;
const REAL_LOSS_RATE = INFLATION - BANK_APY;

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function SilentDrainSection() {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [savings, setSavings] = useState(25000);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setSessionSeconds((Date.now() - startRef.current) / 1000);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const globalDrained = sessionSeconds * DRAIN_PER_SECOND;
  const annualPersonalLoss = savings * REAL_LOSS_RATE;
  const annualHaloYield = savings * HALO_APY;
  const annualRealHaloGain = savings * (HALO_APY - INFLATION);
  const annualUplift = savings * (HALO_APY - BANK_APY);
  const personalLostThisSession = (sessionSeconds / 31_536_000) * annualPersonalLoss;

  return (
    <section className="bg-[#111111] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="text-center mb-14 sm:mb-16">
          <p className="text-white/30 text-xs uppercase tracking-[0.2em] mb-6">The Silent Drain</p>
          <h2
            className="text-white text-4xl sm:text-5xl md:text-6xl font-medium leading-tight mb-6"
            style={{ letterSpacing: "-0.04em" }}
          >
            American savers are losing
          </h2>

          {/* Counter with red glow */}
          <div
            className="text-5xl sm:text-7xl md:text-8xl font-medium text-red-400 my-6 tabular-nums"
            style={{
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              animation: "red-pulse 2s ease-in-out infinite",
            }}
          >
            ${Math.round(globalDrained).toLocaleString("en-US")}
          </div>

          <p className="text-white/40 text-sm sm:text-base mb-2">
            in real purchasing power since you opened this page
          </p>
          <p className="text-white/20 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Based on $8.9T in US savings accounts earning 0.45% APY while inflation runs at
            2.4% — a $173 billion/year gap. That's $5,503 every second.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* Left card — Your savings */}
          <div className="bg-white/5 rounded-2xl p-7 sm:p-8 border border-white/[0.08]">
            <h3 className="text-white text-xl font-medium mb-1" style={{ letterSpacing: "-0.02em" }}>
              Your savings
            </h3>
            <p className="text-white/30 text-sm mb-6">How much do you keep in a bank account?</p>
            <div className="text-white text-3xl font-medium mb-4 tabular-nums" style={{ letterSpacing: "-0.03em" }}>
              ${savings.toLocaleString("en-US")}
            </div>
            <input
              type="range" min="1000" max="500000" step="1000" value={savings}
              onChange={(e) => setSavings(Number(e.target.value))}
              className="w-full mb-8 accent-red-400 cursor-pointer"
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-white/50 text-sm">Lost this session</span>
                </div>
                <span className="text-red-400 font-medium tabular-nums text-sm">
                  −${personalLostThisSession.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Annual real loss</span>
                <span className="text-red-400 font-medium text-sm">
                  −${Math.round(annualPersonalLoss).toLocaleString("en-US")}/yr
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Real yield (after inflation)</span>
                <span className="text-red-400/80 text-sm">−1.95%</span>
              </div>
            </div>
          </div>

          {/* Right card — With USD ISO */}
          <div
            className="bg-white/5 rounded-2xl p-7 sm:p-8 border border-white/[0.08] relative overflow-hidden"
            style={{ animation: "green-pulse 3s ease-in-out infinite" }}
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent" />

            <h3 className="text-white text-xl font-medium mb-1" style={{ letterSpacing: "-0.02em" }}>
              With USD ISO
            </h3>
            <p className="text-white/30 text-sm mb-6">What the same money earns instead</p>
            <div
              className="text-green-400 text-3xl font-medium mb-4 tabular-nums"
              style={{ letterSpacing: "-0.03em" }}
            >
              +${Math.round(annualHaloYield).toLocaleString("en-US")}/yr
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-500"
                style={{ width: `${(HALO_APY / 0.12) * 100}%` }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white/50 text-sm">Annual yield at 8.5% APY</span>
                </div>
                <span className="text-green-400 font-medium text-sm">
                  +${Math.round(annualHaloYield).toLocaleString("en-US")}/yr
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Real purchasing power gain</span>
                <span className="text-green-400 text-sm">
                  +${Math.round(annualRealHaloGain).toLocaleString("en-US")}/yr
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white text-sm font-medium">Total annual advantage</span>
                <span className="text-green-400 font-medium">
                  +${Math.round(annualUplift).toLocaleString("en-US")}/yr
                </span>
              </div>
            </div>

            <button
              onClick={() => scrollTo("#simulator")}
              className="mt-6 w-full inline-flex items-center justify-center gap-3 bg-white text-black text-sm font-medium px-8 py-3.5 rounded-full hover:bg-gray-50 active:scale-[0.98] transition-all duration-200"
            >
              Stop the drain
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
