const strategy = {
  totalCapital: 5000,
  numberOfSlots: 2,
  coinsPerSlot: 3,
  amountPerCoinOverride: null,
  targetPercent: 15,
  stopPercent: 8,
  maxHoldHours: 24,
  showINR: true,
  showUSDT: true,
  minVolume24h: 50000,
  refreshIntervalSeconds: 30,
  bestScanHour: 20,
  morningCheckHour: 7,

  slotB: {
    label: "Tonight's Picks",
    sublabel: "Buy tonight — Sell tomorrow",
    color: "#00e676",
    minChange24h: 2,
    maxChange24h: 20,
    minVolumeRatio: 1.5,
    maxRangePosition: 0.65,
    minVolatilityPct: 1.5,
    maxRSI: 70,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  slotA: {
    label: "Tomorrow's Picks",
    sublabel: "Buy tomorrow night — Sell day after",
    color: "#00b0ff",
    minChange24h: 1,
    maxChange24h: 15,
    minVolumeRatio: 1.2,
    maxRangePosition: 0.75,
    minVolatilityPct: 1.0,
    maxRSI: 65,
    targetPercent: 15,
    stopPercent: 8,
    maxCoins: 3,
  },

  slotC: {
    label: "Moonshots",
    sublabel: "High risk — High reward",
    color: "#ff9100",
    minChange24h: 0,
    maxChange24h: 50,
    minVolumeRatio: 1.0,
    maxRangePosition: 0.90,
    minVolatilityPct: 3.0,
    maxRSI: 80,
    targetPercent: 25,
    stopPercent: 12,
    maxCoins: 5,
  },

  weights: {
    volumeRatio: 30,
    change24h: 20,
    rangePosition: 20,
    trendShort: 15,
    volatility: 10,
    patternBonus: 5,
  },

  fees: {
    inr: {
      tradingFee: 0.0042,
      gstOnFee: 0.18,
      tdsSell: 0.01,
    },
    usdt: {
      tradingFee: 0.00169,
      gstOnFee: 0.18,
      tdsBuy: 0.01,
      tdsSell: 0.01,
    },
  },

  chart: {
    optimisticHitRate: 0.80,
    conservativeHitRate: 0.50,
    tradesPerDay: 3,
  },
};

export function getAmountPerCoin(overrides) {
  var capital = (overrides && overrides.totalCapital) || strategy.totalCapital;
  var coins = (overrides && overrides.coinsPerSlot) || strategy.coinsPerSlot;
  var override = (overrides && overrides.amountPerCoinOverride) || strategy.amountPerCoinOverride;
  if (override) return override;
  return Math.floor(capital / strategy.numberOfSlots / coins);
}

export function getRoundTripCost(quote) {
  var f = strategy.fees;
  if (quote === "INR") {
    var buyFee = f.inr.tradingFee * (1 + f.inr.gstOnFee);
    var sellFee = f.inr.tradingFee * (1 + f.inr.gstOnFee);
    var tds = f.inr.tdsSell;
    return (buyFee + sellFee + tds) * 100;
  }
  if (quote === "USDT") {
    var buyFeeU = f.usdt.tradingFee * (1 + f.usdt.gstOnFee);
    var sellFeeU = f.usdt.tradingFee * (1 + f.usdt.gstOnFee);
    var tdsU = f.usdt.tdsBuy + f.usdt.tdsSell;
    return (buyFeeU + sellFeeU + tdsU) * 100;
  }
  return 2.5;
}

export function getNetTarget(quote, grossTargetPercent) {
  var cost = getRoundTripCost(quote);
  return parseFloat((grossTargetPercent - cost).toFixed(2));
}

export function getWeeklyProjection(overrides) {
  var capital = (overrides && overrides.totalCapital) || strategy.totalCapital;
  var target = strategy.targetPercent / 100;
  var stop = strategy.stopPercent / 100;
  var trades = strategy.chart.tradesPerDay;
  var optimistic = strategy.chart.optimisticHitRate;
  var conservative = strategy.chart.conservativeHitRate;
  var cost = getRoundTripCost("INR") / 100;
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var today = new Date().getDay();
  var optCap = capital;
  var conCap = capital;

  var projection = days.map(function(day, i) {
    var optWin = trades * optimistic * (target - cost) * optCap;
    var optLoss = trades * (1 - optimistic) * stop * optCap;
    optCap = optCap + optWin - optLoss;
    var conWin = trades * conservative * (target - cost) * conCap;
    var conLoss = trades * (1 - conservative) * stop * conCap;
    conCap = conCap + conWin - conLoss;
    return {
      day: day,
      index: i,
      isPast: i < today,
      isToday: i === today,
      optimistic: parseFloat(optCap.toFixed(2)),
      conservative: parseFloat(conCap.toFixed(2)),
    };
  });

  return {
    startCapital: capital,
    projection: projection,
    optimisticEndCapital: parseFloat(optCap.toFixed(2)),
    conservativeEndCapital: parseFloat(conCap.toFixed(2)),
    optimisticWeeklyReturn: parseFloat(((optCap - capital) / capital * 100).toFixed(1)),
    conservativeWeeklyReturn: parseFloat(((conCap - capital) / capital * 100).toFixed(1)),
  };
}

export default strategy;
