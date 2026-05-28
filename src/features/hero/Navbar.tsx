import { useState } from "react";
import { Menu, X } from "lucide-react";
import ISOLogo from "../../components/ISOLogo";

const LINKS = [
  { label: "Product",      href: "#product" },
  { label: "Ecosystem",    href: "#backed" },
  { label: "Simulator",    href: "#simulator" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases",    href: "#use-cases" },
];

function scrollTo(href: string) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const handleLink = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <div className="flex items-center justify-between">

        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => handleLink(e, "#home")}
          className="group transition-opacity hover:opacity-75 active:scale-95 transition-transform"
        >
          <ISOLogo size={44} />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLink(e, link.href)}
              className="text-sm text-black/60 hover:text-black font-medium transition-colors duration-200 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* CTA button */}
          <button
            onClick={() => scrollTo("#simulator")}
            className="bg-black text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-gray-800 active:scale-95 transition-all duration-200"
          >
            Open Wallet
          </button>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-black/8 hover:bg-black/12 active:scale-95 transition-all"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden absolute left-4 right-4 top-[calc(100%+4px)] bg-white/95 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-xl overflow-hidden transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {LINKS.map((link, i) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleLink(e, link.href)}
            className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-black/70 hover:text-black hover:bg-black/[0.03] active:bg-black/[0.06] transition-colors border-b border-black/[0.05] last:border-0"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {link.label}
            <span className="text-black/20 text-xs">→</span>
          </a>
        ))}
        <div className="px-5 py-4">
          <button
            onClick={() => { setOpen(false); scrollTo("#simulator"); }}
            className="w-full bg-black text-white text-sm font-medium py-3 rounded-xl active:scale-95 transition-all"
          >
            Open Wallet
          </button>
        </div>
      </div>
    </nav>
  );
}
