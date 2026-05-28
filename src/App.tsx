import { useState, useEffect } from "react";

import Preloader from "./components/Preloader";
import Calculator from "./components/Calculator";

import Navbar from "./features/hero/Navbar";
import HeroSection from "./features/hero/HeroSection";
import SilentDrainSection from "./features/analytics/SilentDrainSection";
import StatsSection from "./features/analytics/StatsSection";
import InfoSection from "./features/product/InfoSection";
import BackedBySection from "./features/backed/BackedBySection";
import YieldSimulatorSection from "./features/simulator/YieldSimulatorSection";
import HowItWorksSection from "./features/onboarding/HowItWorksSection";
import UseCasesSection from "./features/cases/UseCasesSection";
import FooterSection from "./features/footer/FooterSection";

export default function App() {
  const [loaded, setLoaded]     = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollPct(isNaN(pct) ? 0 : pct * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}

      {/* Scroll progress bar */}
      {loaded && (
        <div className="fixed top-0 left-0 right-0 z-[300] h-[2px]" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div
            style={{
              height: "100%",
              width: `${scrollPct}%`,
              background: "linear-gradient(90deg, #0d9488 0%, #22d3ee 100%)",
              boxShadow: "0 0 10px rgba(13,148,136,0.7)",
              transition: "width 80ms linear",
            }}
          />
        </div>
      )}

      <div
        className="flex flex-col bg-[#F5F5F5]"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 800ms ease-in-out",
        }}
      >
        <div id="home" className="h-screen flex flex-col overflow-hidden">
          <Navbar />
          <HeroSection />
        </div>
        <div id="drain"><SilentDrainSection /></div>
        <StatsSection />
        <div id="product"><InfoSection /></div>
        <div id="backed"><BackedBySection /></div>
        <div id="simulator"><YieldSimulatorSection onOpenCalc={() => setCalcOpen(true)} /></div>
        <div id="how-it-works"><HowItWorksSection /></div>
        <div id="use-cases"><UseCasesSection /></div>
        <div id="footer"><FooterSection /></div>
      </div>

      {/* Floating calculator button */}
      {loaded && (
        <button
          onClick={() => setCalcOpen(true)}
          className="fixed bottom-6 right-6 z-[150] group"
          title="ISO Finance Terminal"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
            style={{
              background: "linear-gradient(135deg,#0d9488 0%,#0891b2 100%)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.5), 0 0 0 1px rgba(13,148,136,0.22)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div
            className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-white bg-black/80 backdrop-blur rounded-xl px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          >
            ISO Finance Terminal
          </div>
        </button>
      )}
    </>
  );
}
