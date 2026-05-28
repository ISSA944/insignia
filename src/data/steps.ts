export interface Step {
  number: string;
  icon: string;
  title: string;
  description: string;
}

export const STEPS: Step[] = [
  {
    number: "01",
    icon: "ArrowDownToLine",
    title: "Deposit",
    description: "Bring any dollar stablecoin — USDC, USDT, or DAI. Your funds enter the Halo vault instantly with no delay.",
  },
  {
    number: "02",
    icon: "Coins",
    title: "Mint",
    description: "Receive USD Halo 1:1. Each token represents exactly one dollar of audited collateral held in the vault.",
  },
  {
    number: "03",
    icon: "Zap",
    title: "Deploy",
    description: "Your collateral is automatically split and routed across top-performing, audited DeFi yield protocols.",
  },
  {
    number: "04",
    icon: "TrendingUp",
    title: "Earn",
    description: "Rewards compound back into your balance daily. Your USD Halo appreciates continuously — no action needed.",
  },
];
