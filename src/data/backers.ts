export interface Backer {
  name: string;
  style: React.CSSProperties;
}

export const BACKERS: Backer[] = [
  {
    name: "Fundamental Labs",
    style: { fontFamily: "'Times New Roman', serif", fontWeight: 400, letterSpacing: "0.02em", fontSize: "14px" },
  },
  {
    name: "KUCOIN",
    style: { fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "16px" },
  },
  {
    name: "NGC",
    style: { fontFamily: "Impact, sans-serif", fontWeight: 700, letterSpacing: "0.05em", fontSize: "18px" },
  },
  {
    name: "NxGen",
    style: { fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "-0.02em", fontSize: "17px" },
  },
  {
    name: "Matter Labs",
    style: { fontFamily: "Helvetica, sans-serif", fontWeight: 700, letterSpacing: "-0.01em", fontSize: "15px" },
  },
  {
    name: "DEXTools",
    style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.06em", fontSize: "14px", textTransform: "uppercase" },
  },
  {
    name: "NGRAVE",
    style: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.18em", fontSize: "14px" },
  },
  {
    name: "Polychain",
    style: { fontFamily: "Palatino, serif", fontWeight: 500, letterSpacing: "0.03em", fontSize: "15px" },
  },
];
