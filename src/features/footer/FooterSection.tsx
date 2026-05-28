import { useRef, useState, useEffect } from "react";
import ISOLogo from "../../components/ISOLogo";

const LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Overview",  href: "#product" },
    { label: "USD ISO",   href: "#product" },
    { label: "Rewards",   href: "#simulator" },
    { label: "Security",  href: "#product" },
    { label: "Roadmap",   href: "#footer" },
  ],
  Developers: [
    { label: "Documentation", href: "#footer" },
    { label: "API Reference", href: "#footer" },
    { label: "SDK",           href: "#footer" },
    { label: "GitHub",        href: "#footer" },
    { label: "Status",        href: "#footer" },
  ],
  Company: [
    { label: "About",   href: "#footer" },
    { label: "Blog",    href: "#footer" },
    { label: "Careers", href: "#footer" },
    { label: "Press",   href: "#footer" },
    { label: "Contact", href: "#footer" },
  ],
  Legal: [
    { label: "Terms",    href: "#footer" },
    { label: "Privacy",  href: "#footer" },
    { label: "Cookies",  href: "#footer" },
    { label: "Licenses", href: "#footer" },
  ],
};

const SOCIALS = [
  { label: "Twitter",  href: "#" },
  { label: "Discord",  href: "#" },
  { label: "Telegram", href: "#" },
  { label: "GitHub",   href: "#" },
];

function scrollTo(href: string) {
  if (href.startsWith("#")) {
    const el = document.querySelector(href);
    if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

export default function FooterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer className="bg-[#F5F5F5] px-4 sm:px-6 pt-14 sm:pt-16 pb-8 border-t border-black/[0.07]">
      <div
        ref={ref}
        className="max-w-[88rem] mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14 sm:mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={() => scrollTo("#home")}
              className="mb-4 hover:opacity-75 transition-opacity active:scale-95 inline-block"
            >
              <ISOLogo size={36} />
            </button>
            <p className="text-black/40 text-sm leading-relaxed">
              The reward-powered digital dollar for the next era of finance.
            </p>
          </div>

          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-black text-sm font-medium mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => { e.preventDefault(); scrollTo(item.href); }}
                      className="text-black/40 text-sm hover:text-black active:opacity-60 transition-colors duration-200 cursor-pointer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/[0.07]">
          <p className="text-black/20 text-xs text-center sm:text-left">
            © 2026 ISO Labs, Inc. USD ISO is not a security. Not financial advice.
          </p>
          <div className="flex items-center gap-5 sm:gap-6">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                onClick={(e) => { e.preventDefault(); scrollTo(s.href); }}
                className="text-black/25 text-sm hover:text-black active:opacity-50 transition-colors duration-200"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
