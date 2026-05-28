import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, Send, ChevronDown, RotateCcw } from "lucide-react";
import ISOLogo from "./ISOLogo";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY ?? "";

/* ── Gemini API ──────────────────────────────────────────────────────────── */
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
          parts: [{
            text: `You are an AI assistant embedded in the ISO financial app. ISO is a DeFi startup building USD ISO — a reward-earning stablecoin pegged 1:1 to the US dollar. Users earn 8.5% APY from automated DeFi yield strategies while keeping their money liquid and dollar-pegged. Compare: traditional banks offer ~0.45% APY while inflation runs ~2.4%, meaning savers lose real purchasing power. USD ISO beats inflation and grows wealth passively.

You also serve as a world-class math and finance assistant: solve equations, explain compound interest, APY calculations, portfolio math, DeFi yields, stablecoin mechanics. Answer questions about ISO's product clearly. Be concise. No markdown headers — use plain text with line breaks.`
          }]
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

/* ── Calculator engine ───────────────────────────────────────────────────── */
function calc(raw: string, ans: string): string {
  if (!raw) return "0";
  try {
    const e = raw
      .replace(/Ans/g, `(${ans})`)
      .replace(/sin\(/g,  "Math.sin(Math.PI/180*")
      .replace(/cos\(/g,  "Math.cos(Math.PI/180*")
      .replace(/tan\(/g,  "Math.tan(Math.PI/180*")
      .replace(/asin\(/g, "(180/Math.PI)*Math.asin(")
      .replace(/acos\(/g, "(180/Math.PI)*Math.acos(")
      .replace(/atan\(/g, "(180/Math.PI)*Math.atan(")
      .replace(/ln\(/g,   "Math.log(")
      .replace(/log\(/g,  "Math.log10(")
      .replace(/√\(/g,    "Math.sqrt(")
      .replace(/π/g,      "(Math.PI)")
      .replace(/\^/g,     "**")
      .replace(/×/g,      "*")
      .replace(/÷/g,      "/")
      .replace(/−/g,      "-");

    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict";return(${e})`)() as number;
    if (!isFinite(r)) return r > 0 ? "∞" : r < 0 ? "-∞" : "Error";
    if (Math.abs(r) >= 1e14 || (Math.abs(r) < 1e-8 && r !== 0))
      return r.toExponential(6).replace(/\.?0+e/, "e");
    return parseFloat(r.toPrecision(12)).toString();
  } catch {
    return "Error";
  }
}

function fmtDisp(s: string): string {
  if (["Error", "∞", "-∞"].includes(s)) return s;
  const [i, d] = s.split(".");
  return (i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")) + (d !== undefined ? "." + d : "");
}

/* ── Types ───────────────────────────────────────────────────────────────── */
type Msg = { role: "user" | "ai"; text: string };

interface Btn {
  label: string;   // action sent to handler
  show?: string;   // display text (if different)
  clr?: "num" | "op" | "fn" | "eq" | "del" | "shift";
  wide?: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Calculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr]         = useState("");
  const [display, setDisplay]   = useState("0");
  const [ans, setAns]           = useState("0");
  const [isAns, setIsAns]       = useState(false);
  const [hist, setHist]         = useState<string[]>([]);
  const [showHist, setShowHist] = useState(false);
  const [shift, setShift]       = useState(false);

  const [tab, setTab]           = useState<"calc" | "ai">("calc");
  const [chat, setChat]         = useState<Msg[]>([{
    role: "ai",
    text: "Hi! I'm your AI math & finance assistant powered by Gemini.\n\nAsk me to: solve equations, explain compound interest, calculate APY, help with DeFi math, or anything quantitative. I can also see your current expression if you ask.",
  }]);
  const [chatQ, setChatQ]       = useState("");
  const [thinking, setThinking] = useState(false);

  const [mounted, setMounted]   = useState(false);
  const chatEndRef              = useRef<HTMLDivElement>(null);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (tab !== "calc") return;
      if (e.key === "Enter") { doEqual(); return; }
      if (e.key === "Backspace") { doBtn("DEL"); return; }
      const map: Record<string, string> = { "*": "×", "/": "÷", "-": "−" };
      const ch = e.key;
      if (/^[\d.+\-*/()^]$/.test(ch) || ch === "%" || ch === " ") {
        doBtn(map[ch] ?? ch);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });  // intentionally re-registers each render so expr/tab closure is fresh

  /* ── Calc actions ── */
  const append = useCallback((val: string) => {
    setShowHist(false);
    setIsAns(false);
    setExpr(e => {
      const base = isAns && /[\d(]/.test(val[0]) ? "" : e;
      return base + val;
    });
    setDisplay(val.slice(-1) || val);
  }, [isAns]);

  const doEqual = useCallback(() => {
    const full = isAns ? expr : expr;
    if (!full) return;
    const r = calc(full, ans);
    setHist(h => [`${full} = ${r}`, ...h.slice(0, 29)]);
    setDisplay(r);
    setExpr(r === "Error" ? "" : r);
    setAns(r === "Error" ? ans : r);
    setIsAns(true);
    setShift(false);
  }, [expr, ans, isAns]);

  const doBtn = useCallback((label: string) => {
    setShowHist(false);
    switch (label) {
      case "AC":
        setExpr(""); setDisplay("0"); setIsAns(false); setShift(false);
        break;
      case "DEL":
        if (isAns) { setExpr(""); setDisplay("0"); setIsAns(false); break; }
        setExpr(e => { const n = e.slice(0, -1); setDisplay(n || "0"); return n; });
        break;
      case "=": doEqual(); break;
      case "SHIFT": setShift(s => !s); break;
      case "( )":
        append(expr.split("(").length > expr.split(")").length ? ")" : "(");
        break;
      case "%":
        if (isAns) {
          const r = parseFloat(display) / 100;
          setDisplay(r.toString()); setExpr(r.toString());
        } else append("/100");
        break;
      case "+/-":
        if (isAns) {
          const r = display.startsWith("-") ? display.slice(1) : "-" + display;
          setDisplay(r); setExpr(r);
        } else setExpr(e => e ? `-(${e})` : "");
        break;
      default: append(label);
    }
  }, [expr, display, isAns, doEqual, append]);

  /* ── Button layout (computed so shift toggles labels) ── */
  const ROWS: Btn[][] = [
    [
      { label: "SHIFT",         clr: shift ? "shift" : "fn" },
      { label: "( )",           clr: "fn" },
      { label: "%",             clr: "fn" },
      { label: "DEL", show:"⌫", clr: "del" },
      { label: "AC",            clr: "del" },
    ],
    [
      { label: shift ? "asin(" : "sin(",  show: shift ? "sin⁻¹" : "sin",  clr: "fn" },
      { label: shift ? "acos(" : "cos(",  show: shift ? "cos⁻¹" : "cos",  clr: "fn" },
      { label: shift ? "atan(" : "tan(",  show: shift ? "tan⁻¹" : "tan",  clr: "fn" },
      { label: shift ? "e^("   : "ln(",   show: shift ? "eˣ"    : "ln",   clr: "fn" },
      { label: "log(",          show: "log", clr: "fn" },
    ],
    [
      { label: "^(2)",  show: "x²",  clr: "fn" },
      { label: "√(",    show: "√",   clr: "fn" },
      { label: "1/(",   show: "1/x", clr: "fn" },
      { label: "π",               clr: "fn" },
      { label: "÷",               clr: "op" },
    ],
    [
      { label: "7",  clr: "num" }, { label: "8", clr: "num" }, { label: "9", clr: "num" },
      { label: "×",  clr: "op"  },
      { label: "^(", show: "xⁿ", clr: "fn"  },
    ],
    [
      { label: "4",  clr: "num" }, { label: "5", clr: "num" }, { label: "6", clr: "num" },
      { label: "−",  clr: "op"  },
      { label: "Ans", clr: "fn" },
    ],
    [
      { label: "1",  clr: "num" }, { label: "2", clr: "num" }, { label: "3", clr: "num" },
      { label: "+",  clr: "op"  },
      { label: "+/-", clr: "fn" },
    ],
    [
      { label: "0",  clr: "num", wide: true },
      { label: ".",  clr: "num" },
      { label: "(",  clr: "fn"  },
      { label: "=",  clr: "eq"  },
    ],
  ];

  const CLR: Record<string, string> = {
    num:   "bg-white/[0.07] hover:bg-white/[0.13] text-white active:bg-white/[0.05]",
    op:    "bg-white/[0.10] hover:bg-white/[0.18] text-[#f6c90e] font-semibold active:bg-white/[0.07]",
    fn:    "bg-white/[0.04] hover:bg-white/[0.09] text-white/65 active:bg-white/[0.02]",
    eq:    "bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold shadow-lg shadow-teal-500/20 active:bg-[#115e59]",
    del:   "bg-white/[0.06] hover:bg-white/[0.12] text-red-400/80 active:bg-white/[0.04]",
    shift: "bg-[#0d9488]/30 hover:bg-[#0d9488]/50 text-[#2dd4bf] font-semibold border border-[#0d9488]/30",
  };

  /* ── AI send ── */
  const send = async () => {
    if (!chatQ.trim() || thinking) return;
    const q = chatQ.trim();
    setChatQ("");
    const ctx = expr ? `\n[Calculator expression: ${expr}]` : "";
    setChat(c => [...c, { role: "user", text: q }]);
    setThinking(true);
    try {
      const h = chat.slice(-12).filter(m => m.role !== "ai" || !m.text.startsWith("Hi! I'm your AI"))
        .map(m => ({ role: (m.role === "user" ? "user" : "model") as "user" | "model", text: m.text }));
      const a = await gemini(h, q + ctx);
      setChat(c => [...c, { role: "ai", text: a }]);
    } catch (e: any) {
      setChat(c => [...c, { role: "ai", text: `⚠️ ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  };

  const dispSize = display.length > 14 ? 20 : display.length > 10 ? 26 : display.length > 7 ? 34 : 42;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        backgroundColor: mounted ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0)",
        backdropFilter: mounted ? "blur(20px)" : "blur(0px)",
        transition: "background-color 380ms ease, backdrop-filter 380ms ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-[840px] lg:max-w-[980px] overflow-hidden rounded-t-[28px] sm:rounded-[28px] flex flex-col"
        style={{
          maxHeight: "clamp(560px, 92vh, 860px)",
          background: "linear-gradient(160deg,rgba(10,12,18,0.99)0%,rgba(6,8,14,0.99)100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 0 1px rgba(13,148,136,0.12),0 48px 140px rgba(0,0,0,0.85),0 0 120px rgba(13,148,136,0.05)",
          transform: mounted ? "translateY(0) scale(1)" : "translateY(48px) scale(0.95)",
          opacity: mounted ? 1 : 0,
          transition: "transform 440ms cubic-bezier(0.34,1.56,0.64,1),opacity 320ms ease",
        }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <ISOLogo size={28} />
            <div className="hidden sm:block">
              <div className="text-white/90 text-sm font-medium leading-none" style={{ letterSpacing: "-0.02em" }}>Calculator</div>
              <div className="text-white/25 text-[10px] mt-0.5 tracking-wide">SCIENTIFIC · AI</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex gap-0.5 bg-white/[0.05] rounded-xl p-1">
              {(["calc", "ai"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${tab === t ? "bg-white/[0.10] text-white shadow-sm" : "text-white/35 hover:text-white/65"}`}
                >
                  {t === "ai" && <Sparkles className="w-3 h-3" />}
                  {t === "calc" ? "Calculator" : "Gemini AI"}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ══ CALCULATOR PANEL ══ */}
          <div className={`flex flex-col shrink-0 w-full lg:w-[420px] border-r border-white/[0.05]
            ${tab === "calc" ? "flex" : "hidden"} lg:flex`}
          >
            {/* Display */}
            <div className="px-5 pt-4 pb-3 relative select-none">
              {/* Top row: history btn + expression */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowHist(h => !h)}
                  className="flex items-center gap-1 text-white/20 hover:text-white/50 text-[10px] transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showHist ? "rotate-180" : ""}`} />
                  History
                </button>
                <div className="text-white/30 text-xs font-mono max-w-[220px] truncate text-right">
                  {expr || ""}
                </div>
              </div>

              {/* Main number */}
              <div
                className="text-right text-white font-light tabular-nums leading-none transition-all duration-100"
                style={{
                  fontSize: dispSize,
                  letterSpacing: "-0.025em",
                  textShadow: "0 0 40px rgba(13,148,136,0.35)",
                }}
              >
                {fmtDisp(display)}
              </div>
              {ans !== "0" && (
                <div className="text-right text-white/18 text-[10px] mt-1 font-mono">
                  Ans = {fmtDisp(ans)}
                </div>
              )}
            </div>

            {/* History dropdown */}
            {showHist && hist.length > 0 && (
              <div className="mx-4 mb-2 bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden max-h-28 overflow-y-auto">
                {hist.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const r = h.split(" = ")[1];
                      if (r) { setDisplay(r); setExpr(r); setIsAns(true); setShowHist(false); }
                    }}
                    className="px-3 py-2 text-white/40 text-[11px] font-mono hover:bg-white/[0.04] cursor-pointer border-b border-white/[0.04] last:border-0 truncate"
                  >
                    {h}
                  </div>
                ))}
                <button
                  onClick={() => setHist([])}
                  className="w-full px-3 py-1.5 text-white/20 hover:text-white/40 text-[10px] flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Clear history
                </button>
              </div>
            )}

            {/* Button grid */}
            <div className="px-3 pb-4 pt-1 flex-1 overflow-hidden">
              <div className="grid grid-cols-5 gap-1.5 h-full" style={{ gridTemplateRows: "repeat(7,1fr)" }}>
                {ROWS.map((row, ri) =>
                  row.map((btn, bi) => (
                    <button
                      key={`${ri}-${bi}`}
                      onClick={() => doBtn(btn.label)}
                      className={`
                        rounded-2xl flex items-center justify-center
                        transition-all duration-75 active:scale-[0.88] select-none touch-manipulation
                        ${btn.wide ? "col-span-2" : ""}
                        ${CLR[btn.clr ?? "num"]}
                      `}
                      style={{ fontSize: (btn.show ?? btn.label).length > 3 ? 11 : 15 }}
                    >
                      {btn.show ?? btn.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ══ AI PANEL ══ */}
          <div className={`flex flex-col flex-1 min-w-0
            ${tab === "ai" ? "flex" : "hidden"} lg:flex`}
          >
            <>
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "ai" && (
                        <div
                          className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
                          style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.2)" }}
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
                    <div className="flex gap-2 justify-start">
                      <div
                        className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.2)" }}
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

                {/* Input */}
                <div className="shrink-0 px-4 pb-4 pt-3 border-t border-white/[0.05]">
                  {expr && !isAns && (
                    <div className="mb-2.5 flex items-center gap-2 text-white/25 text-[11px] bg-white/[0.03] rounded-xl px-3 py-2">
                      <span className="text-teal-500/60 shrink-0">expr:</span>
                      <span className="font-mono truncate">{expr}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatQ}
                      onChange={e => setChatQ(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Ask about math, finance, equations..."
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
          </div>
        </div>
      </div>
    </div>
  );
}
