import { useState, useRef, useEffect } from "react";
import { X, Sparkles, ArrowLeftRight, BarChart3, Coins, TrendingUp, ArrowUp } from "lucide-react";
import ISOLogo from "./ISOLogo";

const ISO_APY   = 0.085;
const BANK_APY  = 0.0045;
const BONDS_APY = 0.045;
const SP500_APY = 0.105;

const LS_KEY = "iso_gemini_key";

function getStoredKey(): string {
  return localStorage.getItem(LS_KEY) ?? "";
}

async function gemini(history: { role: "user" | "model"; text: string }[], msg: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: `You are an AI assistant for ISO — a DeFi startup behind USD ISO, a reward-earning stablecoin pegged 1:1 to USD. Users earn 8.5% APY from automated DeFi yield strategies while staying fully liquid. Banks offer 0.45% while inflation runs 2.4% — savers lose real value. USD ISO beats inflation passively. Help with finance math, compound interest, DeFi, portfolio questions. Be concise, plain text.` }] },
        contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: "user", parts: [{ text: msg }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 900 },
      }),
    }
  );
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message ?? `HTTP ${res.status}`); }
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

function compound(p: number, apy: number, months: number) { return p * Math.pow(1 + apy / 12, months); }

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

type Tab = "earn" | "convert" | "compare" | "ai";
type Msg = { role: "user" | "ai"; text: string };

const PERIODS = [
  { label: "1M", months: 1  },
  { label: "6M", months: 6  },
  { label: "1Y", months: 12 },
  { label: "3Y", months: 36 },
  { label: "5Y", months: 60 },
];

const ASSETS = [
  { name: "Bank savings", apy: BANK_APY,  color: "#ef4444" },
  { name: "US Bonds",     apy: BONDS_APY, color: "#f59e0b" },
  { name: "USD ISO",      apy: ISO_APY,   color: "#0d9488", isISO: true },
  { name: "S&P 500",      apy: SP500_APY, color: "#6366f1" },
];

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [tab, setTab]           = useState<Tab>("earn");
  const [amount, setAmount]     = useState(25000);
  const [periodIdx, setPeriodIdx] = useState(2);
  const [convertAmt, setConvertAmt] = useState(10000);
  const [compareYears, setCompareYears] = useState(5);
  const [barsVisible, setBarsVisible]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  const [apiKey, setApiKey]   = useState(getStoredKey);
  const [keyDraft, setKeyDraft] = useState("");
  const [chat, setChat]       = useState<Msg[]>([{ role: "ai", text: "Hi! I'm your ISO AI assistant powered by Gemini. Ask me anything about USD ISO, DeFi yields, compound interest, or portfolio math." }]);
  const [chatQ, setChatQ]     = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  useEffect(() => {
    if (tab !== "compare") return;
    setBarsVisible(false);
    const t = setTimeout(() => setBarsVisible(true), 80);
    return () => clearTimeout(t);
  }, [tab, compareYears, amount]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const period    = PERIODS[periodIdx];
  const isoTotal  = compound(amount, ISO_APY,  period.months);
  const isoEarned = isoTotal - amount;
  const bankEarned = compound(amount, BANK_APY, period.months) - amount;
  const dailyISO   = (amount * ISO_APY) / 365;
  const monthlyISO = (amount * ISO_APY) / 12;
  const maxEarned  = Math.max(...ASSETS.map(a => compound(amount, a.apy, compareYears * 12) - amount));

  const send = async () => {
    if (!chatQ.trim() || thinking) return;
    const q = chatQ.trim(); setChatQ("");
    setChat(c => [...c, { role: "user", text: q }]);
    setThinking(true);
    try {
      const h = chat.slice(-10).map(m => ({ role: (m.role === "user" ? "user" : "model") as "user" | "model", text: m.text }));
      const a = await gemini(h, q + `\n[Context: $${amount.toLocaleString()} USD ISO, ${period.label} horizon]`, apiKey);
      setChat(c => [...c, { role: "ai", text: a }]);
    } catch (e: any) {
      const msg: string = e.message ?? "";
      const retryMatch = msg.match(/retry in ([\d.]+)s/i);
      const friendly = msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")
        ? `⏱ Free tier quota exceeded. Please wait ${retryMatch ? Math.ceil(Number(retryMatch[1])) + "s" : "a moment"} and try again, or use a key with higher limits.`
        : msg.includes("API_KEY_INVALID") || msg.includes("400")
        ? `🔑 Invalid API key. Click "Change key" below and enter a valid key from aistudio.google.com`
        : `⚠️ ${msg}`;
      setChat(c => [...c, { role: "ai", text: friendly }]);
    } finally { setThinking(false); }
  };

  const TABS = [
    { key: "earn"    as Tab, icon: <Coins className="w-3.5 h-3.5" />,       label: "Earn"    },
    { key: "convert" as Tab, icon: <ArrowLeftRight className="w-3.5 h-3.5" />, label: "Convert" },
    { key: "compare" as Tab, icon: <BarChart3 className="w-3.5 h-3.5" />,   label: "Compare" },
    { key: "ai"      as Tab, icon: <Sparkles className="w-3.5 h-3.5" />,    label: "AI"      },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{
        backgroundColor: mounted ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
        backdropFilter:  mounted ? "blur(12px)" : "none",
        transition: "all 350ms ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-[800px] flex flex-col rounded-t-[28px] sm:rounded-[28px] overflow-hidden"
        style={{
          maxHeight: "clamp(600px, 92vh, 880px)",
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
          opacity:   mounted ? 1 : 0,
          transition: "transform 440ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease",
        }}
      >

        {/* ── Ticker strip ── */}
        <div className="flex items-center overflow-x-auto border-b border-black/[0.06]" style={{ background: "#F9F9F9" }}>
          {[
            { label: "USD ISO / USD", value: "$1.0000",  badge: "▲ +0.00%",     color: "#16a34a" },
            { label: "APY",           value: "8.5%",     badge: "Annual",        color: "#0d9488" },
            { label: "TVL",           value: "$124.2M",  badge: "Locked",        color: "rgba(0,0,0,0.35)" },
            { label: "Holders",       value: "12,847",   badge: "Active",        color: "rgba(0,0,0,0.35)" },
            { label: "vs Bank",       value: "18.9×",    badge: "More yield",    color: "#0d9488" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-r border-black/[0.05] last:border-0">
              <span className="text-black/30 text-[9px] uppercase tracking-widest">{t.label}</span>
              <span className="text-black font-bold text-[11px] tabular-nums">{t.value}</span>
              <span className="text-[9px] font-semibold" style={{ color: t.color }}>{t.badge}</span>
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <ISOLogo size={36} />
            <div>
              <div className="text-black font-semibold text-sm" style={{ letterSpacing: "-0.02em" }}>Finance Terminal</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 5px #4ade80" }} />
                <span className="text-black/30 text-[9px] uppercase tracking-widest">Live · USD ISO</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "rgba(0,0,0,0.05)" }}>
              {TABS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                  style={tab === key
                    ? { background: "black", color: "white" }
                    : { background: "transparent", color: "rgba(0,0,0,0.4)" }
                  }
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-black/30 hover:text-black hover:bg-black/[0.05] transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div
          className={`flex-1 min-h-0 ${tab === "ai" ? "flex flex-col" : "overflow-y-auto"}`}
          style={{ background: "#F5F5F5" }}
        >

          {/* ══ EARN ══ */}
          {tab === "earn" && (
            <div className="p-5 space-y-4">

              {/* Amount */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-black/45 text-xs uppercase tracking-wide font-medium">Your deposit</span>
                  <span className="text-black text-2xl font-bold tabular-nums" style={{ letterSpacing: "-0.03em" }}>${amount.toLocaleString()}</span>
                </div>
                <input type="range" min="1000" max="500000" step="1000" value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full cursor-pointer" style={{ accentColor: "#0d9488" }} />
                <div className="flex justify-between text-black/25 text-[10px] mt-1 font-medium">
                  <span>$1K</span><span>$500K</span>
                </div>
              </div>

              {/* Period */}
              <div>
                <span className="text-black/45 text-xs uppercase tracking-wide font-medium block mb-2">Time horizon</span>
                <div className="flex gap-1.5">
                  {PERIODS.map((p, i) => (
                    <button key={p.label} onClick={() => setPeriodIdx(i)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
                      style={periodIdx === i
                        ? { background: "black", color: "white" }
                        : { background: "white", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "Daily",          value: `+$${dailyISO.toFixed(2)}`,                     accent: false },
                  { label: "Monthly",        value: `+$${Math.round(monthlyISO).toLocaleString()}`,  accent: false },
                  { label: "Yearly",         value: `+$${Math.round(amount * ISO_APY).toLocaleString()}`, accent: false },
                  { label: `After ${period.label}`, value: `+${fmt(isoEarned)}`,                    accent: true  },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="rounded-2xl p-4 text-center"
                    style={accent
                      ? { background: "white", border: "1.5px solid #0d9488", boxShadow: "0 0 0 3px rgba(13,148,136,0.08)" }
                      : { background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
                    }
                  >
                    <div className="text-black/35 text-[10px] uppercase tracking-wide mb-1.5 font-medium">{label}</div>
                    <div className="text-lg font-bold tabular-nums" style={{ color: accent ? "#0d9488" : "rgba(0,0,0,0.9)", letterSpacing: "-0.02em" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Comparison bars */}
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-black/45 text-xs uppercase tracking-wide font-medium">Earnings after {period.label}</span>
                  <span className="text-xs font-bold" style={{ color: "#0d9488" }}>
                    {Math.round(isoEarned / Math.max(bankEarned, 0.01))}× more than bank
                  </span>
                </div>
                {[
                  { label: "USD ISO",      earned: isoEarned,  apy: "8.5%",  color: "#0d9488", glow: true  },
                  { label: "Bank savings", earned: bankEarned, apy: "0.45%", color: "#ef4444", glow: false },
                ].map(({ label, earned, apy, color, glow }) => (
                  <div key={label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-black/50 font-medium">{label} <span className="text-black/25">({apy})</span></span>
                      <span className="text-black/70 tabular-nums font-semibold">+{fmt(earned)}</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(earned / isoEarned) * 100}%`, background: color, boxShadow: glow ? `0 0 8px ${color}60` : "none" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Final balance */}
              <div className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: "black", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
              >
                <div>
                  <div className="text-white/40 text-xs mb-1 uppercase tracking-wide font-medium">Balance after {period.label}</div>
                  <div className="text-white text-3xl font-bold tabular-nums" style={{ letterSpacing: "-0.04em" }}>
                    ${Math.round(isoTotal).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-400 text-sm font-bold">+{fmt(isoEarned)}</span>
                  </div>
                  <div className="text-white/30 text-xs">USD ISO · 8.5% APY</div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CONVERT ══ */}
          {tab === "convert" && (
            <div className="p-5 space-y-3">
              <p className="text-black/35 text-xs uppercase tracking-wide font-medium">USD ISO maintains 1:1 parity with the US dollar</p>

              {/* FROM box */}
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div className="text-black/35 text-xs uppercase tracking-wide font-medium mb-3">You pay</div>
                <div className="flex items-center gap-3">
                  <input type="number" value={convertAmt} onChange={e => setConvertAmt(Math.max(0, Number(e.target.value)))}
                    className="flex-1 bg-transparent text-black text-3xl font-bold outline-none tabular-nums" style={{ letterSpacing: "-0.04em" }} />
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0" style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-black">$</span>
                    </div>
                    <span className="text-black text-sm font-bold">USD</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/[0.08]" />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}>
                  <ArrowLeftRight className="w-4 h-4" style={{ color: "#0d9488" }} />
                </div>
                <div className="flex-1 h-px bg-black/[0.08]" />
              </div>

              {/* TO box */}
              <div className="bg-white rounded-2xl p-5" style={{ border: "1.5px solid #0d9488", boxShadow: "0 0 0 3px rgba(13,148,136,0.07)" }}>
                <div className="text-xs uppercase tracking-wide font-medium mb-3" style={{ color: "#0d9488" }}>You receive</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-3xl font-bold tabular-nums" style={{ color: "#0d9488", letterSpacing: "-0.04em" }}>
                    {convertAmt.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 shrink-0" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.18)" }}>
                    <ISOLogo size={18} />
                    <span className="text-black text-sm font-bold">USD ISO</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Exchange rate", value: "1:1 peg"  },
                  { label: "Protocol fee",  value: "0.00%"    },
                  { label: "Network",       value: "Ethereum" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl p-3 text-center" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="text-black/30 text-[10px] uppercase tracking-wide mb-1 font-medium">{label}</div>
                    <div className="text-black/75 text-xs font-bold">{value}</div>
                  </div>
                ))}
              </div>

              {/* Yield preview */}
              <div className="rounded-2xl p-5 bg-black" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <div className="text-white/40 text-xs uppercase tracking-wide font-medium mb-4">
                  Holding {convertAmt.toLocaleString()} USD ISO for 1 year earns
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-teal-400 text-3xl font-bold tabular-nums" style={{ letterSpacing: "-0.04em" }}>
                      +${Math.round(convertAmt * ISO_APY).toLocaleString()}
                    </div>
                    <div className="text-white/30 text-xs mt-1">at 8.5% APY</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-lg font-bold tabular-nums">${Math.round(convertAmt * (1 + ISO_APY)).toLocaleString()}</div>
                    <div className="text-white/25 text-xs">Total value</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ COMPARE ══ */}
          {tab === "compare" && (
            <div className="p-5 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-black/45 text-xs uppercase tracking-wide font-medium">Amount</span>
                    <span className="text-black font-bold text-sm tabular-nums">${amount.toLocaleString()}</span>
                  </div>
                  <input type="range" min="1000" max="500000" step="1000" value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: "#0d9488" }} />
                </div>
                <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-black/45 text-xs uppercase tracking-wide font-medium">Horizon</span>
                    <span className="text-black font-bold text-sm">{compareYears} year{compareYears > 1 ? "s" : ""}</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={compareYears}
                    onChange={e => setCompareYears(Number(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: "#6366f1" }} />
                </div>
              </div>

              <div className="space-y-2.5">
                {ASSETS.map(({ name, apy, color, isISO }, i) => {
                  const earned = compound(amount, apy, compareYears * 12) - amount;
                  const pct    = (earned / maxEarned) * 100;
                  return (
                    <div key={name} className="rounded-2xl p-4"
                      style={isISO
                        ? { background: "white", border: "1.5px solid #0d9488", boxShadow: "0 0 0 3px rgba(13,148,136,0.06), 0 2px 8px rgba(0,0,0,0.06)" }
                        : { background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
                      }
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          {isISO && <ISOLogo size={16} />}
                          <span className={`text-sm font-bold ${isISO ? "text-black" : "text-black/55"}`}>{name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: `${color}18`, color }}>
                            {(apy * 100).toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-sm font-bold tabular-nums" style={{ color: isISO ? "#0d9488" : "rgba(0,0,0,0.4)" }}>
                          +{fmt(earned)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: barsVisible ? `${pct}%` : "0%", background: color, boxShadow: isISO ? `0 0 10px ${color}50` : "none", transitionDuration: "700ms", transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: `${i * 90}ms` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl p-4 bg-black flex items-center gap-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>🏆</div>
                <div>
                  <div className="text-white text-sm font-bold">
                    USD ISO earns {Math.round((compound(amount, ISO_APY, compareYears * 12) - amount) / Math.max(compound(amount, BANK_APY, compareYears * 12) - amount, 0.01))}× more than a bank
                  </div>
                  <div className="text-white/35 text-xs mt-0.5">Over {compareYears} year{compareYears > 1 ? "s" : ""} on ${amount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* ══ AI ══ */}
          {tab === "ai" && !apiKey && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(13,148,136,0.08)", border: "1.5px solid rgba(13,148,136,0.2)" }}>
                <Sparkles className="w-6 h-6" style={{ color: "#0d9488" }} />
              </div>
              <h3 className="text-black font-bold text-lg mb-2" style={{ letterSpacing: "-0.02em" }}>Connect Gemini AI</h3>
              <p className="text-black/45 text-sm leading-relaxed max-w-[280px] mb-1">
                Get your free key at{" "}
                <span className="font-semibold" style={{ color: "#0d9488" }}>aistudio.google.com</span>
              </p>
              <p className="text-black/30 text-xs mb-6">Click "Get API key" → Create → Copy (starts with AIza...)</p>
              <div className="w-full max-w-[320px] space-y-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={keyDraft}
                  onChange={e => setKeyDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && keyDraft.length > 10) { localStorage.setItem(LS_KEY, keyDraft); setApiKey(keyDraft); } }}
                  className="w-full rounded-xl px-4 py-3 text-sm text-black placeholder-black/25 outline-none font-mono"
                  style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.1)" }}
                  autoComplete="off"
                />
                <button
                  onClick={() => { if (keyDraft.length > 10) { localStorage.setItem(LS_KEY, keyDraft); setApiKey(keyDraft); } }}
                  disabled={keyDraft.length < 10}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "black" }}
                >
                  Connect →
                </button>
              </div>
            </div>
          )}

          {tab === "ai" && !!apiKey && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
                {chat.map((m, i) => (
                  <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "ai" && (
                      <div className="w-7 h-7 rounded-xl shrink-0 mt-0.5 flex items-center justify-center"
                        style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: "#0d9488" }} />
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-black text-white rounded-tr-sm"
                        : "bg-white text-black/80 rounded-tl-sm"
                    }`}
                      style={m.role === "user"
                        ? { boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
                        : { border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#0d9488" }} />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
                      style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      {[0, 1, 2].map(k => (
                        <span key={k} className="w-1.5 h-1.5 rounded-full bg-black/25"
                          style={{ animation: `bounce-dot 1.1s ${k * 0.18}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0 px-5 pb-5 pt-3 bg-white border-t border-black/[0.07]">
                <div className="flex gap-2">
                  <input
                    type="text" value={chatQ}
                    onChange={e => setChatQ(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about USD ISO, yields, DeFi, compound interest..."
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-black placeholder-black/30 outline-none transition-all"
                    style={{ background: "#F5F5F5", border: "1px solid rgba(0,0,0,0.09)" }}
                  />
                  <button onClick={send} disabled={!chatQ.trim() || thinking}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0 disabled:opacity-30"
                    style={{ background: "black" }}
                  >
                    <ArrowUp className="w-4 h-4 text-white" />
                  </button>
                </div>
                <button
                  onClick={() => { localStorage.removeItem(LS_KEY); setApiKey(""); setKeyDraft(""); }}
                  className="mt-2 text-black/25 hover:text-black/50 text-[10px] transition-colors"
                >
                  Change API key
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
