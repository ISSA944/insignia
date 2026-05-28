export interface Stat {
  label: string;
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  description: string;
}

export const STATS: Stat[] = [
  { label: "Current APY", target: 8.5, suffix: "%", decimals: 1, description: "Auto-compounding yield" },
  { label: "Total Value Locked", target: 2.4, prefix: "$", suffix: "B", decimals: 1, description: "Across DeFi strategies" },
  { label: "Rewards Distributed", target: 180, prefix: "$", suffix: "M", decimals: 0, description: "Paid to holders" },
  { label: "Active Wallets", target: 142, suffix: "K", decimals: 0, description: "Global holders" },
];
