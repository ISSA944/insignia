import { useRef, useState, useEffect } from "react";
import { BACKERS } from "../../data/backers";

export default function BackedBySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-14 sm:py-16">
      <div
        ref={ref}
        className="max-w-[88rem] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 items-center transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)" }}
      >
        <div>
          <p className="text-black text-xs uppercase tracking-[0.14em] mb-2 text-black/40">Backed by</p>
          <p className="text-black/70 text-base leading-relaxed">
            Funded by premier partners<br />and forward-thinking leaders.
          </p>
        </div>

        <div className="md:col-span-3 overflow-hidden">
          <div className="backers-track">
            {[...BACKERS, ...BACKERS].map((backer, i) => (
              <span
                key={i}
                className="mx-8 sm:mx-10 shrink-0 text-black/40 whitespace-nowrap hover:text-black/70 transition-colors duration-300 cursor-default"
                style={backer.style}
              >
                {backer.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
