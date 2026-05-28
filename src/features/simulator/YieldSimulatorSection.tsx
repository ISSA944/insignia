import { useState, useMemo, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";

const BANK_APY = 0.0045;
const ISO_APY  = 0.085;

const YEAR_OPTIONS = [
  { label: "1 yr",  years: 1  },
  { label: "3 yrs", years: 3  },
  { label: "5 yrs", years: 5  },
  { label: "10 yrs",years: 10 },
];

function compound(principal: number, apy: number, months: number): number[] {
  const r = apy / 12;
  return Array.from({ length: months + 1 }, (_, m) => principal * Math.pow(1 + r, m));
}

const W = 560, H = 260;
const PL = 68, PT = 16, PR = 16, PB = 44;
const CW = W - PL - PR, CH = H - PT - PB;

function toY(v: number, minY: number, maxY: number): number {
  const range = maxY - minY || 1;
  return PT + CH - ((v - minY) / range) * CH;
}

function toX(idx: number, months: number): number {
  return PL + (idx / months) * CW;
}

function linePath(data: number[], minY: number, maxY: number, months: number): string {
  return data
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, months).toFixed(1)},${toY(v, minY, maxY).toFixed(1)}`)
    .join(" ");
}

function areaPath(top: number[], bot: number[], minY: number, maxY: number, months: number): string {
  const fwd = top.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, months).toFixed(1)},${toY(v, minY, maxY).toFixed(1)}`).join(" ");
  const rev = [...bot].reverse().map((v, i, a) => `L${toX(a.length - 1 - i, months).toFixed(1)},${toY(v, minY, maxY).toFixed(1)}`).join(" ");
  return fwd + " " + rev + " Z";
}

function fmt(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function YieldSimulatorSection({ onOpenCalc }: { onOpenCalc?: () => void }) {
  const [amount, setAmount] = useState(25000);
  const [years, setYears]   = useState(5);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const months   = years * 12;
  const bankData = useMemo(() => compound(amount, BANK_APY, months), [amount, months]);
  const isoData  = useMemo(() => compound(amount, ISO_APY,  months), [amount, months]);

  const minY    = amount * 0.98;
  const maxY    = isoData[isoData.length - 1] * 1.02;
  const bankFinal = bankData[bankData.length - 1];
  const isoFinal  = isoData[isoData.length - 1];
  const diff = isoFinal - bankFinal;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minY + t * (maxY - minY));
  const xTicks = Array.from({ length: years + 1 }, (_, i) => i).filter(
    (i) => years <= 3 || i % Math.ceil(years / 4) === 0 || i === years
  );

  /* ── Interaction helpers ── */
  const clientXToIdx = useCallback((clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    if (svgX < PL - 4 || svgX > W - PR + 4) return null;
    const pct = Math.max(0, Math.min(1, (svgX - PL) / CW));
    return Math.round(pct * months);
  }, [months]);

  const handlePointerMove = useCallback((clientX: number) => {
    const idx = clientXToIdx(clientX);
    setHoverIdx(idx);
  }, [clientXToIdx]);

  const onMouseMove  = (e: React.MouseEvent<SVGSVGElement>)  => handlePointerMove(e.clientX);
  const onTouchMove  = (e: React.TouchEvent<SVGSVGElement>)  => { e.preventDefault(); handlePointerMove(e.touches[0].clientX); };
  const onMouseLeave = () => { if (!isDragging) setHoverIdx(null); };
  const onMouseDown  = (e: React.MouseEvent<SVGSVGElement>) => { setIsDragging(true); handlePointerMove(e.clientX); };
  const onMouseUp    = () => setIsDragging(false);

  /* ── Tooltip data ── */
  const tooltipData = useMemo(() => {
    if (hoverIdx === null || hoverIdx < 0 || hoverIdx > months) return null;
    const idx = Math.min(hoverIdx, months);
    const bv  = bankData[idx];
    const hv  = isoData[idx];
    const x   = toX(idx, months);
    const by  = toY(bv, minY, maxY);
    const hy  = toY(hv, minY, maxY);
    const yr  = idx / 12;
    const tip_x = Math.min(x + 10, W - 128);
    const tip_y = Math.min(hy - 64, PT + CH - 64);
    return { x, by, hy, bv, hv, yr, tip_x, tip_y };
  }, [hoverIdx, months, bankData, isoData, minY, maxY]);

  return (
    <section className="bg-[#F5F5F5] px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-[88rem] mx-auto">
        <div className="mb-10 sm:mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-black/50 text-sm mb-2">Yield Simulator</p>
            <h2
              className="text-black text-4xl sm:text-5xl font-medium leading-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              See your money grow.
            </h2>
          </div>
          {onOpenCalc && (
            <button
              onClick={onOpenCalc}
              className="group flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#0d9488 0%,#0891b2 100%)",
                boxShadow: "0 4px 20px rgba(13,148,136,0.35)",
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">AI Calculator</span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white/70"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                Gemini
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Controls ── */}
          <div className="space-y-6 sm:space-y-7">
            <div>
              <label className="text-black/50 text-sm block mb-2">Initial deposit</label>
              <div
                className="text-black text-2xl sm:text-3xl font-medium mb-3 tabular-nums"
                style={{ letterSpacing: "-0.03em" }}
              >
                ${amount.toLocaleString("en-US")}
              </div>
              <input
                type="range" min="1000" max="500000" step="1000" value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-black/25 text-xs mt-1">
                <span>$1K</span><span>$500K</span>
              </div>
            </div>

            <div>
              <label className="text-black/50 text-sm block mb-2">Time period</label>
              <div className="grid grid-cols-4 gap-1.5">
                {YEAR_OPTIONS.map(({ label, years: y }) => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                      years === y ? "bg-black text-white" : "bg-white text-black/50 hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                <div>
                  <div className="text-black/40 text-xs mb-0.5">Bank savings (0.45%)</div>
                  <div className="text-black text-lg sm:text-xl font-medium tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {fmt(bankFinal)}
                  </div>
                </div>
                <div className="text-black/20 text-xs text-right">
                  +{fmt(bankFinal - amount)}<br />earned
                </div>
              </div>

              <div className="flex items-center justify-between bg-black rounded-xl px-4 py-3">
                <div>
                  <div className="text-white/40 text-xs mb-0.5">USD ISO (8.5%)</div>
                  <div className="text-white text-lg sm:text-xl font-medium tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {fmt(isoFinal)}
                  </div>
                </div>
                <div className="text-white/40 text-xs text-right">
                  +{fmt(isoFinal - amount)}<br />earned
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-green-200">
                <div>
                  <div className="text-black/40 text-xs mb-0.5">Extra you earn</div>
                  <div className="text-green-600 text-lg sm:text-xl font-medium tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    +{fmt(diff)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Chart ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 overflow-hidden select-none">
            <p className="text-black/30 text-xs mb-3 ml-1">
              {isDragging || hoverIdx !== null ? "Drag to explore · " : ""}
              Drag or tap to see values
            </p>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto cursor-crosshair touch-none"
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onTouchMove={onTouchMove}
              onTouchStart={(e) => { e.preventDefault(); handlePointerMove(e.touches[0].clientX); }}
              onTouchEnd={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="gapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="isoLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#555" />
                  <stop offset="100%" stopColor="#000" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {yTicks.map((_v, i) => (
                <line key={i}
                  x1={PL} y1={PT + CH - (i / 4) * CH}
                  x2={W - PR} y2={PT + CH - (i / 4) * CH}
                  stroke="rgba(0,0,0,0.05)" strokeWidth={1}
                />
              ))}

              {/* Y-axis labels */}
              {yTicks.map((v, i) => (
                <text key={i} x={PL - 8} y={PT + CH - (i / 4) * CH + 4}
                  textAnchor="end" style={{ fontSize: 10, fill: "rgba(0,0,0,0.28)" }}>
                  {fmt(v)}
                </text>
              ))}

              {/* X-axis labels */}
              {xTicks.map((yr) => (
                <text key={yr} x={PL + (yr / years) * CW} y={H - 8}
                  textAnchor="middle" style={{ fontSize: 10, fill: "rgba(0,0,0,0.28)" }}>
                  {yr === 0 ? "Now" : `${yr}yr`}
                </text>
              ))}

              {/* Gap area fill */}
              <path d={areaPath(isoData, bankData, minY, maxY, months)} fill="url(#gapGrad)" />

              {/* Bank line */}
              <path
                d={linePath(bankData, minY, maxY, months)}
                fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={2} strokeDasharray="5 3"
              />

              {/* ISO line */}
              <path
                d={linePath(isoData, minY, maxY, months)}
                fill="none" stroke="url(#isoLineGrad)" strokeWidth={2.5}
              />

              {/* End dots */}
              <circle cx={toX(months, months)} cy={toY(isoFinal, minY, maxY)} r={4} fill="#000" />
              <circle cx={toX(months, months)} cy={toY(bankFinal, minY, maxY)} r={3} fill="rgba(0,0,0,0.22)" />

              {/* Legend */}
              <line x1={PL} y1={H - 26} x2={PL + 18} y2={H - 26} stroke="#000" strokeWidth={2.5} />
              <text x={PL + 24} y={H - 22} style={{ fontSize: 10, fill: "rgba(0,0,0,0.6)" }}>USD ISO 8.5% APY</text>
              <line x1={PL + 140} y1={H - 26} x2={PL + 158} y2={H - 26} stroke="rgba(0,0,0,0.2)" strokeWidth={2} strokeDasharray="5 3" />
              <text x={PL + 164} y={H - 22} style={{ fontSize: 10, fill: "rgba(0,0,0,0.32)" }}>Bank 0.45% APY</text>

              {/* ── Interactive hover ── */}
              {tooltipData && (
                <>
                  {/* Vertical cursor line */}
                  <line
                    x1={tooltipData.x} y1={PT}
                    x2={tooltipData.x} y2={PT + CH}
                    stroke="rgba(0,0,0,0.12)" strokeWidth={1} strokeDasharray="3 2"
                  />

                  {/* ISO dot */}
                  <circle cx={tooltipData.x} cy={tooltipData.hy} r={5} fill="#000" />
                  <circle cx={tooltipData.x} cy={tooltipData.hy} r={8} fill="rgba(0,0,0,0.08)" />

                  {/* Bank dot */}
                  <circle cx={tooltipData.x} cy={tooltipData.by} r={3.5} fill="rgba(0,0,0,0.35)" />

                  {/* Tooltip box */}
                  <g transform={`translate(${tooltipData.tip_x},${tooltipData.tip_y})`}>
                    <rect
                      width={120} height={64} rx={8}
                      fill="rgba(0,0,0,0.88)"
                      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                    />
                    <text x={10} y={18} style={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}>
                      {tooltipData.yr < 1
                        ? `Month ${Math.round(tooltipData.yr * 12)}`
                        : `Year ${tooltipData.yr % 1 === 0 ? tooltipData.yr : tooltipData.yr.toFixed(1)}`}
                    </text>
                    <text x={10} y={36} style={{ fontSize: 11, fill: "#fff", fontWeight: 600 }}>
                      ISO: {fmt(tooltipData.hv)}
                    </text>
                    <text x={10} y={53} style={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}>
                      Bank: {fmt(tooltipData.bv)}
                    </text>
                    {/* Green diff tag */}
                    <rect x={70} y={28} width={42} height={16} rx={4} fill="rgba(74,222,128,0.15)" />
                    <text x={91} y={40} textAnchor="middle" style={{ fontSize: 9, fill: "#4ade80" }}>
                      +{fmt(tooltipData.hv - tooltipData.bv)}
                    </text>
                  </g>
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
