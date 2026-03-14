const strategy = {
  // Capital settings — now split by currency
  totalCapital: 5000,
  capitalINR: 2500,
  capitalUSDT: 30,
  numberOfSlots: 2,
  coinsPerSlot: 3,
  amountPerCoinOverride: null,
  targetPercent: 15,
  stopPercent: 8,
  maxHoldHours: 24,
  showINR: true,
  showUSDT: true,
  minVolume24hINR: 500000,   // ₹5 lakh minimum for INR pairs
  minVolume24hUSDT: 5000,    // 5000 USDT notional minimum for USDT pairs
  refreshIntervalSeconds: 30,
  bestScanHour: 20,
  morningCheckHour: 7,

  // Market mode thresholds
  marketMode: {
    panicThreshold: -7,       // BTC down >7% = PANIC, no buys
    rotationThreshold: -3,    // BTC down 3-7% = ROTATION, alt signals boosted
    altSeasonThreshold: 3,    // BTC up >3% + ETH up = ALT SEASON
  },

  // Slot B — Tonight's Picks
  slotB: {
    label: "Tonight's Picks",
    sublabel: "Buy tonight — Sell tomorrow",
    color: "#00e676",
    minChange24h: 0,
    maxChange24h: 20,
    minVolumeRatio: 1.2,
    maxRangePosition: 0.70,
    minVolatilityPct: 1.5,
    maxRSI: 70,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  // Slot A — Tomorrow's Picks
  slotA: {
    label: "Tomorrow's Picks",
    sublabel: "Buy tomorrow night — Sell day after",
    color: "#00b0ff",
    minChange24h: 0,
    maxChange24h: 15,
    minVolumeRatio: 1.0,
    maxRangePosition: 0.75,
    minVolatilityPct: 1.0,
    maxRSI: 65,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  // Slot D — Dip Buys (pullback on low volume)
  slotD: {
    label: "Dip Buys",
    sublabel: "Pullback on low volume — bounce in 1-2 days",
    color: "#ff9100",
    minChange24h: -15,
    maxChange24h: -1,
    minVolumeRatio: 0,
    maxRangePosition: 0.45,
    minVolatilityPct: 1.0,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  // Slot R — Multi-day Runners
  slotR: {
    label: "Multi-day Runners",
    sublabel: "Sustained momentum — still has legs",
    color: "#e040fb",
    minChange24h: 3,
    maxChange24h: 50,
    minVolumeRatio: 1.0,
    maxRangePosition: 0.85,
    minVolatilityPct: 1.5,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  // Slot C — Moonshots
  slotC: {
    label: "Moonshots",
    sublabel: "High risk · High reward",
    color: "#ff5252",
    minChange24h: 0,
    maxChange24h: 100,
    minVolumeRatio: 0.8,
    maxRangePosition: 0.90,
    minVolatilityPct: 3.0,
    targetPercent: 30,
    stopPercent: 12,
    maxCoins: 3,
  },

  // Scoring weights
  weights: {
    change24h: 25,
    rangePosition: 20,
    volumeRatio: 20,
    trendShort: 15,
    volatility: 10,
    crossPairBonus: 8,
    patternBonus: 10,
    btcDecoupledBonus: 8,
    volumeRisingBonus: 8,
  },
};

export default strategy;
