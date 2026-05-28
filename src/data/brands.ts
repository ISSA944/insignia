export interface Brand {
  name: string;
  style: React.CSSProperties;
}

export const BRANDS: Brand[] = [
  {
    name: "Stripe",
    style: { fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: "-0.02em", fontSize: "15px" },
  },
  {
    name: "Coinbase",
    style: { fontFamily: "Arial, sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: "13px", textTransform: "uppercase" },
  },
  {
    name: "Uniswap",
    style: { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: "0.01em", fontSize: "15px", fontStyle: "italic" },
  },
  {
    name: "Aave",
    style: { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.12em", fontSize: "13px", textTransform: "uppercase" },
  },
  {
    name: "Compound",
    style: { fontFamily: "Palatino, 'Book Antiqua', serif", fontWeight: 400, letterSpacing: "-0.01em", fontSize: "16px" },
  },
  {
    name: "MakerDAO",
    style: { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, letterSpacing: "0.04em", fontSize: "14px" },
  },
  {
    name: "Chainlink",
    style: { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", fontSize: "13px" },
  },
];
