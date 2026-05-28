import { useRef, useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

const CARD_IMG =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85";

const CARDS = [
  { title: "Savings that bloom", body: "Gain steady returns as your dollar tokens are routed into top-performing DeFi strategies.", img: CARD_IMG },
  { title: "Always fluid,\nalways pegged.", body: "Keep fully dollar-anchored with on-demand access to funds — no lockups or waits.", dark: true },
  { title: "Fully\nautomated", body: "Skip the task of tuning positions yourself. USD ISO runs in the background for you.", dark: true },
];

export default function InfoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-[88rem] mx-auto">

        {/* Header row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-14 items-start">
          <div>
            <h2
              className="text-black text-4xl sm:text-5xl font-medium leading-tight mb-8"
              style={{ letterSpacing: "-0.03em" }}
            >
              Meet USD ISO.
            </h2>
            <button
              onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-3 bg-black text-white text-sm sm:text-base font-medium pl-7 pr-2 py-2 rounded-full hover:bg-gray-800 active:scale-[0.97] transition-all duration-200"
            >
              Discover it
              <span className="bg-white rounded-full p-2">
                <ArrowRight className="w-4 h-4 text-black" />
              </span>
            </button>
          </div>

          <p className="text-black/65 text-xl sm:text-2xl md:text-3xl leading-relaxed">
            USD ISO is a reward-earning dollar coin that lets your savings grow while
            remaining tied to the U.S. dollar.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Image card — spans 2 cols */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden transition-all duration-700"
            style={{
              backgroundImage: `url(${CARD_IMG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
              transitionDelay: "0ms",
            }}
          >
            <div className="p-7 min-h-72 sm:min-h-80 flex flex-col justify-between">
              <h3 className="text-black text-xl sm:text-2xl font-medium leading-snug" style={{ letterSpacing: "-0.02em" }}>
                {CARDS[0].title}
              </h3>
              <p className="text-black/70 text-sm sm:text-base max-w-xs">{CARDS[0].body}</p>
            </div>
          </div>

          {/* Dark card 1 */}
          <div
            className="rounded-2xl p-7 min-h-72 sm:min-h-80 flex flex-col justify-between transition-all duration-700"
            style={{
              backgroundColor: "#2B2644",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
              transitionDelay: "120ms",
            }}
          >
            <h3 className="text-white text-xl sm:text-2xl font-medium leading-snug">
              Always fluid,<br />always pegged.
            </h3>
            <p className="text-white/55 text-sm sm:text-base">
              Keep fully dollar-anchored with on-demand access to funds — no lockups or waits.
            </p>
          </div>

          {/* Dark card 2 */}
          <div
            className="rounded-2xl p-7 min-h-72 sm:min-h-80 flex flex-col justify-between transition-all duration-700"
            style={{
              backgroundColor: "#2B2644",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
              transitionDelay: "240ms",
            }}
          >
            <h3 className="text-white text-xl sm:text-2xl font-medium leading-snug">
              Fully<br />automated
            </h3>
            <p className="text-white/55 text-sm sm:text-base">
              Skip the task of tuning positions yourself. USD ISO runs in the background for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
