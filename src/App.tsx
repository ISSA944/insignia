import { useState } from "react";

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
  const [loaded, setLoaded]   = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      <div
        className="flex flex-col bg-[#F5F5F5]"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 700ms ease-in-out",
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
          title="Open AI Calculator"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
            style={{
              background: "linear-gradient(135deg,#0d9488 0%,#0891b2 100%)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.45),0 0 0 1px rgba(13,148,136,0.2)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="2" width="16" height="20" rx="3" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="10" y2="11" />
              <line x1="12" y1="11" x2="14" y2="11" />
              <line x1="16" y1="11" x2="16" y2="11" strokeLinecap="round" strokeWidth={2} />
              <line x1="8" y1="15" x2="10" y2="15" />
              <line x1="12" y1="15" x2="14" y2="15" />
              <line x1="16" y1="13" x2="16" y2="17" />
              <line x1="14" y1="15" x2="18" y2="15" />
            </svg>
          </div>
          <div
            className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-white bg-black/80 rounded-xl px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          >
            AI Calculator
          </div>
        </button>
      )}
    </>
  );
}
