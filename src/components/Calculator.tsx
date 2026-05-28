import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, ArrowLeftRight, BarChart3, Coins, TrendingUp } from "lucide-react";
import ISOLogo from "./ISOLogo";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY ?? "";
const ISO_APY    = 0.085;
const BANK_APY   = 0.0045;
const BONDS_APY  = 0.045;
const SP500_APY  = 0.105;

async function gemini(
  history: { role: "user" | "model"; text: string }[],
  msg: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `You are an AI assistant inside the ISO Finance Terminal. ISO is a DeFi startup behind USD ISO — a reward-earning stablecoin pegged 1:1 to USD. Users earn 8.5% APY from automated DeFi yield strategies while staying liquid and dollar-pegged. Banks offer 0.45% APY while inflation runs 2.4%, so savers lose real value. USD ISO beats inflation and grows wealth passively. Also help with any math, finance, compound interest, DeFi, portfolio questions. Be concise. Plain text, no markdown headers.` }]
        },
        contents: [
          ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: "user", parts: [{ text: msg }] }
        ],
        generationConfig: { temperature: 0.65, maxOutputTokens: 900 }
      })
    }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message ?? `HTTP ${res.status}`);
  }
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

function compound(principal: number, apy: number, months: number): number {
  return principal * Math.pow(1 + apy / 12, months);
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

type Tab = "earn" | "convert" | "compare" | "ai";
type Msg = { role: "user" | "ai"; text: string };

const PERIODS = [
  { label: "1M",  months: 1  },
  { label: "6M",  months: 6  },
  { label: "1Y",  months: 12 },
  { label: "3Y",  months: 36 },
  { label: "5Y",  months: 60 },
];

const TICKER_ITEMS = [
  { label: "USD ISO / USD", value: "$1.0000", badge: "▲ +0.00%", badgeColor: "#4ade80" },
  { label: "APY",           value: "8.5%",    badge: "Annual",   badgeColor: "#0d9488" },
  { label: "TVL",           value: "$124.2M", badge: "Locked",   badgeColor: "rgba(255,255,255,0.3)" },
  { label: "Holders",       value: "12,847",  badge: "Active",   badgeColor: "rgba(255,255,255,0.3)" },
  { label: "vs Bank",       value: "18.9×",   badge: "More yield", badgeColor: "#0d9488" },
];

const ASSETS = [
  { name: "Bank Savings", apy: BANK_APY,  color: "#ef4444", pct: (BANK_APY / SP500_APY) },
  { name: "US Bonds",     apy: BONDS_APY, color: "#f59e0b", pct: (BONDS_APY / SP500_APY) },
  { name: "USD ISO",      apy: ISO_APY,   color: "#0d9488", pct: (ISO_APY / SP500_APY) },
  { name: "S&P 500",      apy: SP500_APY, color: "#6366f1", pct: 1 },
];

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [tab, setTab]             = useState<Tab>("earn");
  const [amount, setAmount]       = useState(25000);
  const [periodIdx, setPeriodIdx] = useState(2);
  const [convertAmt, setConvertAmt] = useState(10000);
  const [compareYears, setCompareYears] = useState(5);
  const [barsVisible, setBarsVisible]   = useState(false);
  const [mounted, setMounted]           = useState(false);

  const [chat, setChat]     = useState<Msg[]>([{
    role: "ai",
    text: "Hi! I'm your ISO AI assistant. Ask me about USD ISO yields, DeFi strategies, compound interest, portfolio math — or anything finance.",
  }]);
  const [chatQ, setChatQ]       = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  useEffect(() => {
    if (tab === "compare") {
      setBarsVisible(false);
      const t = setTimeout(() => setBarsVisible(true), 120);
      return () => clearTimeout(t);
    }
  }, [tab, compareYears, amount]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const period     = PERIODS[periodIdx];
  const isoTotal   = compound(amount, ISO_APY, period.months);
  const isoEarned  = isoTotal - amount;
  const bankEarned = compound(amount, BANK_APY, period.months) - amount;
  const dailyISO   = (amount * ISO_APY) / 365;
  const monthlyISO = (amount * ISO_APY) / 12;

  const maxEarned = Math.max(...ASSETS.map(a =>
    compound(amount, a.apy, compareYears * 12) - amount
  ));

  const send = async () => {
    if (!chatQ.trim() || thinking) return;
    const q = chatQ.trim();
    setChatQ("");
    setChat(c => [...c, { role: "user", text: q }]);
    setThinking(true);
    try {
      const h = chat.slice(-10).map(m => ({
        role: (m.role === "user" ? "user" : "model") as "user" | "model",
        text: m.text,
      }));
      const ctx = `\n[User context: $${amount.toLocaleString()} in USD ISO, ${period.label} horizon]`;
      const a = await gemini(h, q + ctx);
      setChat(c => [...c, { role: "ai", text: a }]);
    } catch (e: any) {
      setChat(c => [...c, { role: "ai", text: `⚠️ ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "earn",    icon: <Coins className="w-3 h-3" />,          label: "Earn"    },
    { key: "convert", icon: <ArrowLeftRight className="w-3 h-3" />, label: "Convert" },
    { key: "compare", icon: <BarChart3 className="w-3 h-3" />,      label: "Compare" },
    { key: "ai",      icon: <Sparkles className="w-3 h-3" />,       label: "AI"      },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        backgroundColor: mounted ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0)",
        backdropFilter:  mounted ? "blur(24px)"         : "none",
        transition: "background-color 380ms ease, backdrop-filter 380ms ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-[780px] overflow-hidden rounded-t-[28px] sm:rounded-[28px] flex flex-col"
        style={{
          maxHeight: "clamp(600px, 94vh, 900px)",
          background: "linear-gradient(160deg, rgba(7,9,15,0.99) 0%, rgba(5,7,11,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 0 1px rgba(13,148,136,0.18), 0 48px 120px rgba(0,0,0,0.92), 0 0 80px rgba(13,148,136,0.07)",
          transform: mounted ? "translateY(0) scale(1)"    : "translateY(56px) scale(0.93)",
          opacity:   mounted ? 1                           : 0,
          transition: "transform 460ms cubic-bezier(0.34,1.56,0.64,1), opacity 320ms ease",
        }}
      >

        {/* ── Live ticker strip ── */}
        <div
          className="flex items-center gap-0 border-b border-white/[0.05] shrink-0 overflow-x-auto"
          style={{ background: "rgba(13,148,136,0.04)" }}
        >
          {TICKER_ITEMS.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 shrink-0 border-r border-white/[0.05] last:border-0"
            >
              <span className="text-white/25 text-[9px] uppercase tracking-widest">{t.label}</span>
              <span className="text-white text-[11px] font-semibold tabular-nums">{t.value}</span>
              <span className="text-[9px] font-medium" style={{ color: t.badgeColor }}>{t.badge}</span>
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <ISOLogo size={28} />
            <div>
              <div className="text-white/90 text-sm font-semibold leading-none" style={{ letterSpacing: "-0.02em" }}>
                Finance Terminal
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
                />
                <span className="text-white/25 text-[9px] tracking-widest uppercase">Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-white/[0.04] rounded-xl p-1">
              {TABS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                    tab === key
                      ? "bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/30"
                      : "text-white/30 hover:text-white/65"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.07] transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={`flex-1 min-h-0 ${tab === "ai" ? "flex flex-col" : "overflow-y-auto"}`}>

          {/* ══ EARN ══ */}
          {tab === "earn" && (
            <div className="p-5 space-y-4">

              {/* Amount slider */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-white/40 text-xs uppercase tracking-wide">Your deposit</span>
                  <span className="text-white text-xl font-semibold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                    ${amount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range" min="1000" max="500000" step="1000" value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: "#0d9488" }}
                />
                <div className="flex justify-between text-white/20 text-[10px] mt-1">
                  <span>$1K</span><span>$500K</span>
                </div>
              </div>

              {/* Period selector */}
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wide block mb-2">Time horizon</span>
                <div className="flex gap-1.5">
                  {PERIODS.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => setPeriodIdx(i)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                      style={periodIdx === i
                        ? { background: "#0d9488", color: "#fff", boxShadow: "0 0 16px rgba(13,148,136,0.4)" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Daily",    value: `+$${dailyISO.toFixed(2)}`,                    dim: false },
                  { label: "Monthly",  value: `+$${Math.round(monthlyISO).toLocaleString()}`, dim: false },
                  { label: "Yearly",   value: `+$${Math.round(amount * ISO_APY).toLocaleString()}`, dim: false },
                  { label: `After ${period.label}`, value: `+${fmt(isoEarned)}`,             dim: true  },
                ].map(({ label, value, dim }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4 text-center"
                    style={dim
                      ? { background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.28)", boxShadow: "0 0 20px rgba(13,148,136,0.08)" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                    }
                  >
                    <div className="text-white/30 text-[10px] uppercase tracking-wide mb-1.5">{label}</div>
                    <div
                      className="text-lg font-semibold tabular-nums"
                      style={{ color: dim ? "#2dd4bf" : "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* vs Bank bars */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between mb-4">
                  <span className="text-white/40 text-xs uppercase tracking-wide">Earnings after {period.label}</span>
                  <span className="text-[#2dd4bf] text-xs font-semibold">
                    {Math.round(isoEarned / Math.max(bankEarned, 0.01))}× more than bank
                  </span>
                </div>
                {[
                  { label: "USD ISO",      earned: isoEarned,  apy: "8.5%",  color: "#0d9488", glow: true  },
                  { label: "Bank savings", earned: bankEarned, apy: "0.45%", color: "#ef4444", glow: false },
                ].map(({ label, earned, apy, color, glow }) => (
                  <div key={label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/45">{label} <span className="text-white/20">({apy})</span></span>
                      <span className="text-white/70 tabular-nums font-medium">+{fmt(earned)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(earned / isoEarned) * 100}%`,
                          background: color,
                          boxShadow: glow ? `0 0 10px ${color}80` : "none",
                          transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Final balance card */}
              <div
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.14) 0%, rgba(8,145,178,0.08) 100%)", border: "1px solid rgba(13,148,136,0.22)" }}
              >
                <div>
                  <div className="text-white/35 text-xs mb-1 uppercase tracking-wide">Balance after {period.label}</div>
                  <div className="text-white text-2xl font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                    ${Math.round(isoTotal).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-teal-400 text-sm font-semibold">8.5% APY</span>
                  </div>
                  <div className="text-white/25 text-xs">USD ISO · compounded</div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CONVERT ══ */}
          {tab === "convert" && (
            <div className="p-5 space-y-4">
              <p className="text-white/30 text-xs uppercase tracking-wide">USD ISO is always pegged 1:1 to the US dollar</p>

              {/* FROM */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-white/30 text-xs uppercase tracking-wide mb-3">You pay</div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" value={convertAmt}
                    onChange={e => setConvertAmt(Math.max(0, Number(e.target.value)))}
                    className="flex-1 bg-transparent text-white text-3xl font-bold outline-none tabular-nums"
                    style={{ letterSpacing: "-0.03em" }}
                  />
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-xs font-black">$</span>
                    </div>
                    <span className="text-white text-sm font-semibold">USD</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(13,148,136,0.2)" }} />
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.22)" }}
                >
                  <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 h-px" style={{ background: "rgba(13,148,136,0.2)" }} />
              </div>

              {/* TO */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(13,148,136,0.09)", border: "1px solid rgba(13,148,136,0.22)" }}>
                <div className="text-teal-400/60 text-xs uppercase tracking-wide mb-3">You receive</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-[#2dd4bf] text-3xl font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                    {convertAmt.toLocaleString()}
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0"
                    style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.25)" }}
                  >
                    <ISOLogo size={18} />
                    <span className="text-white text-sm font-semibold">USD ISO</span>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Exchange rate", value: "1:1 peg"   },
                  { label: "Protocol fee",  value: "0.00%"     },
                  { label: "Network",       value: "Ethereum"  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="text-white/25 text-[10px] mb-1 uppercase tracking-wide">{label}</div>
                    <div className="text-white/70 text-xs font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              {/* Yield preview */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(8,145,178,0.07) 100%)", border: "1px solid rgba(13,148,136,0.2)" }}
              >
                <div className="text-white/40 text-xs uppercase tracking-wide mb-4">
                  If you hold {convertAmt.toLocaleString()} USD ISO for 1 year
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[#2dd4bf] text-2xl font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                      +${Math.round(convertAmt * ISO_APY).toLocaleString()}
                    </div>
                    <div className="text-white/30 text-xs mt-1">Earned at 8.5% APY</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-lg font-semibold tabular-nums">
                      ${Math.round(convertAmt * (1 + ISO_APY)).toLocaleString()}
                    </div>
                    <div className="text-white/25 text-xs">Total value</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ COMPARE ══ */}
          {tab === "compare" && (
            <div className="p-5 space-y-4">

              {/* Amount + Years sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/40 text-xs uppercase tracking-wide">Amount</span>
                    <span className="text-white text-sm font-semibold tabular-nums">${amount.toLocaleString()}</span>
                  </div>
                  <input type="range" min="1000" max="500000" step="1000" value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: "#0d9488" }} />
                </div>
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/40 text-xs uppercase tracking-wide">Horizon</span>
                    <span className="text-white text-sm font-semibold">{compareYears} year{compareYears > 1 ? "s" : ""}</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={compareYears}
                    onChange={e => setCompareYears(Number(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: "#6366f1" }} />
                </div>
              </div>

              {/* Asset bars */}
              <div className="space-y-3">
                {ASSETS.map(({ name, apy, color }, i) => {
                  const earned  = compound(amount, apy, compareYears * 12) - amount;
                  const barPct  = (earned / maxEarned) * 100;
                  const isISO   = name === "USD ISO";
                  return (
                    <div
                      key={name}
                      className="rounded-2xl p-4 transition-all duration-300"
                      style={isISO
                        ? { background: "rgba(13,148,136,0.10)", border: "1px solid rgba(13,148,136,0.25)", boxShadow: "0 0 20px rgba(13,148,136,0.06)" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }
                      }
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          {isISO && <ISOLogo size={16} />}
                          <span className={`text-sm font-semibold ${isISO ? "text-white" : "text-white/55"}`}>{name}</span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${color}20`, color }}
                          >
                            {(apy * 100).toFixed(2)}%
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: isISO ? "#2dd4bf" : "rgba(255,255,255,0.45)" }}
                        >
                          +{fmt(earned)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: barsVisible ? `${barPct}%` : "0%",
                            background: color,
                            boxShadow: isISO ? `0 0 14px ${color}70` : "none",
                            transitionDuration: "800ms",
                            transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
                            transitionDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Winner callout */}
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.15)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.2)" }}
                >
                  🏆
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">
                    USD ISO earns {Math.round((compound(amount, ISO_APY, compareYears * 12) - amount) / Math.max(compound(amount, BANK_APY, compareYears * 12) - amount, 0.01))}× more than a bank
                  </div>
                  <div className="text-white/30 text-xs mt-0.5">
                    Over {compareYears} year{compareYears > 1 ? "s" : ""} on ${amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ AI ══ */}
          {tab === "ai" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {chat.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "ai" && (
                      <div
                        className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
                        style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.22)" }}
                      >
                        <Sparkles className="w-3 h-3 text-teal-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[#0d9488]/20 text-white border border-[#0d9488]/25 rounded-tr-sm"
                          : "bg-white/[0.05] text-white/80 border border-white/[0.07] rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.22)" }}
                    >
                      <Sparkles className="w-3 h-3 text-teal-400" />
                    </div>
                    <div className="bg-white/[0.05] rounded-2xl rounded-tl-sm px-4 py-3 border border-white/[0.07] flex items-center gap-1.5">
                      {[0, 1, 2].map(k => (
                        <span
                          key={k}
                          className="w-1.5 h-1.5 rounded-full bg-teal-400/50"
                          style={{ animation: `bounce-dot 1.1s ${k * 0.18}s ease-in-out infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0 px-4 pb-4 pt-3 border-t border-white/[0.05]">
                <div className="flex gap-2">
                  <input
                    type="text" value={chatQ}
                    onChange={e => setChatQ(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about USD ISO, yields, DeFi, portfolio math..."
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-teal-500/30 transition-colors"
                  />
                  <button
                    onClick={send}
                    disabled={!chatQ.trim() || thinking}
                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-30 transition-all active:scale-90 shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
