import { useRef, useState, useEffect } from "react";
import { STATS, type Stat } from "../../data/stats";

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function AnimatedStat({ stat, active, index }: { stat: Stat; active: boolean; index: number }) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active || started) return;
    const delay = index * 130;
    const timer = setTimeout(() => {
      setStarted(true);
      const duration = 1900;
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(stat.target * ease);
        if (t < 1) rafRef.current = requestAnimationFrame(animate);
        else setVal(stat.target);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(rafRef.current); };
  }, [active, started, stat.target, index]);

  const d = stat.decimals ?? 0;
  const display = d > 0 ? val.toFixed(d) : Math.round(val).toLocaleString();

  return (
    <div
      className="bg-white rounded-2xl p-5 sm:p-6 transition-all duration-700 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div
        className="text-3xl sm:text-4xl font-medium text-black mb-1 tabular-nums"
        style={{
          letterSpacing: "-0.03em",
          background: started ? "linear-gradient(135deg, #000 0%, #333 100%)" : undefined,
          WebkitBackgroundClip: started ? "text" : undefined,
          WebkitTextFillColor: started ? "transparent" : undefined,
        }}
      >
        {stat.prefix}{display}{stat.suffix}
      </div>
      <div className="text-black text-sm font-medium mb-1">{stat.label}</div>
      <div className="text-black/40 text-xs">{stat.description}</div>
    </div>
  );
}

export default function StatsSection() {
  const [ref, inView] = useInView();
  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-10 sm:py-12">
      <div ref={ref} className="max-w-[88rem] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat, i) => (
          <AnimatedStat key={stat.label} stat={stat} active={inView} index={i} />
        ))}
      </div>
    </section>
  );
}
