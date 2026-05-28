import { useRef, useState, useEffect } from "react";
import { ArrowDownToLine, Coins, Zap, TrendingUp, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { ArrowDownToLine, Coins, Zap, TrendingUp };

import { STEPS } from "../../data/steps";

const GLOW_COLORS = [
  "rgba(99, 102, 241, 0.6)",   // indigo
  "rgba(168, 85, 247, 0.6)",   // purple
  "rgba(236, 72, 153, 0.6)",   // pink
  "rgba(16, 185, 129, 0.6)",   // emerald
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="mb-12 sm:mb-16">
          <p className="text-black/50 text-sm mb-2">How it works</p>
          <h2
            className="text-black text-4xl sm:text-5xl font-medium"
            style={{ letterSpacing: "-0.03em" }}
          >
            Four steps to yield.
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => {
            const Icon = ICONS[step.icon];
            const isHovered = hovered === i;
            return (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-7 transition-all duration-500 cursor-default"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(28px)",
                  transitionDelay: `${i * 100}ms`,
                  boxShadow: isHovered
                    ? `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)`
                    : "none",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-black/20 text-sm font-medium">{step.number}</span>

                  {/* Icon with fire glow on hover */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-400"
                    style={{
                      backgroundColor: "#000",
                      boxShadow: isHovered
                        ? `0 0 0 3px rgba(0,0,0,0.08), 0 0 20px ${GLOW_COLORS[i]}, 0 0 40px ${GLOW_COLORS[i].replace("0.6", "0.25")}`
                        : "none",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      animation: isHovered ? "fire-flicker 2.8s ease-in-out infinite" : "none",
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                <h3
                  className="text-black text-xl font-medium mb-2 transition-colors duration-200"
                  style={{
                    letterSpacing: "-0.02em",
                    color: isHovered ? "#000" : undefined,
                  }}
                >
                  {step.title}
                </h3>
                <p className="text-black/50 text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
