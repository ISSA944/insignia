import { useRef, useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4";

const USE_CASES = [
  {
    tag: "Commerce",
    title: "Commerce",
    body: "Lift customer retention by offering USD ISO — a trusted dollar-backed stablecoin with strong yields, letting your patrons earn with zero effort on your platform.",
    href: "#footer",
  },
  {
    tag: "Treasury",
    title: "Treasury",
    body: "Put idle corporate cash to work. ISO integrates into treasury management workflows, earning 8.5% APY on dollar-denominated reserves.",
    href: "#footer",
  },
  {
    tag: "DeFi",
    title: "DeFi",
    body: "Use USD ISO as base collateral across lending protocols, AMMs, and structured products — a yield-bearing stable with deep liquidity.",
    href: "#footer",
  },
];

export default function UseCasesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const current = USE_CASES[active];

  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-20 sm:py-24">
      <div ref={ref} className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* Left */}
        <div
          className="md:pr-12 md:pt-2 transition-all duration-700"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)" }}
        >
          <p className="text-black/50 text-sm mb-2">USD ISO in Practice</p>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-medium leading-none mb-6"
            style={{ letterSpacing: "-0.04em" }}
          >
            Use modes
          </h2>
          <p className="text-black/55 text-sm sm:text-base leading-relaxed max-w-sm mb-8">
            ISO powers a wide range of modes for builders, companies and treasuries wanting safe and
            rewarding stablecoin integrations.
          </p>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            {USE_CASES.map((uc, i) => (
              <button
                key={uc.tag}
                onClick={() => setActive(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 ${
                  active === i
                    ? "bg-black text-white"
                    : "bg-white text-black/50 hover:text-black border border-black/[0.08]"
                }`}
              >
                {uc.tag}
              </button>
            ))}
          </div>

          {/* Description */}
          <p
            key={active}
            className="text-black/60 text-sm sm:text-base leading-relaxed max-w-sm mb-6 animate-fade-up"
          >
            {current.body}
          </p>

          <a
            href={current.href}
            onClick={(e) => {
              e.preventDefault();
              document.querySelector(current.href)?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-3 text-sm font-medium text-black hover:gap-4 transition-all duration-200"
          >
            <span className="w-9 h-9 rounded-full bg-black flex items-center justify-center group-hover:bg-gray-800 active:scale-95 transition-all">
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
            Know more
          </a>
        </div>

        {/* Right — video card */}
        <div
          className="relative rounded-3xl overflow-hidden min-h-[480px] sm:min-h-[600px] md:min-h-[680px] transition-all duration-700"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
            transitionDelay: "150ms",
          }}
        >
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-12">
            <span className="inline-block bg-black/20 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {current.tag}
            </span>
            <h3
              className="text-3xl sm:text-4xl md:text-5xl font-medium leading-tight"
              style={{ letterSpacing: "-0.03em" }}
              key={`title-${active}`}
            >
              {current.title}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
