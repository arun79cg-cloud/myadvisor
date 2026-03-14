import strategy from "../config/strategy";

function scoreChange24h(change, slotConfig) {
  if (change === null || change === undefined) return 0;
  var min = slotConfig.minChange24h;
  var max = slotConfig.maxChange24h;
  if (change < 0) return 5;
  if (change < min) return 20;
  if (change <= max * 0.5) return 100;
  if (change <= max) return 80;
  if (change <= max * 1.5) return 40;
  return 10;
}

function scoreRangePosition(position, slotConfig) {
  if (position === null || position === undefined) return 50;
  var max = slotConfig.maxRangePosition;
  if (position <= 0.15) return 100;
  if (position <= 0.30) return 90;
  if (position <= max) return 70;
  if (position <= max + 0.10) return 40;
  return 10;
}

function scoreVolumeRatio(ratio, slotConfig) {
  if (ratio === null || ratio === undefined) return 25;
  var min = slotConfig.minVolumeRatio;
  if (ratio < 0.5) return 5;
  if (ratio < min) return 30;
  if (ratio < min * 1.3) return 60;
  if (ratio < min * 2.0) return 85;
  if (ratio < min * 3.0) return 100;
  return 80;
}

function scoreTrend(trend) {
  if (trend === "UP") return 100;
  if (trend === "UNKNOWN") return 45;
  return 0;
}

function scoreVolatility(volatilityPct, slotConfig) {
  if (volatilityPct === null || volatilityPct === undefined) return 30;
  var min = slotConfig.minVolatilityPct;
  if (volatilityPct < min * 0.5) return 10;
  if (volatilityPct < min) return 40;
  if (volatilityPct < min * 2) return 80;
  if (volatilityPct < min * 4) return 100;
  if (volatilityPct < min * 8) return 70;
  return 40;
}

export function scoreCoin(coin, slotType) {
  var type = slotType || "B";
  var slotConfig = strategy["slot" + type] || strategy.slotB;
  var gecko = coin.geckoData || {};
  var w = strategy.weights;

  var s_change = scoreChange24h(coin.change24h, slotConfig);
  var s_range = scoreRangePosition(coin.rangePosition, slotConfig);
  var s_volume = scoreVolumeRatio(gecko.volumeRatio, slotConfig);
  var s_trendShort = scoreTrend(gecko.trendShort);
  var s_volatility = scoreVolatility(gecko.volatilityPercent, slotConfig);

  var totalWeight = w.volumeRatio + w.change24h + w.rangePosition + w.trendShort + w.volatility;
  var rawScore = (
    s_volume * w.volumeRatio +
    s_change * w.change24h +
    s_range * w.rangePosition +
    s_trendShort * w.trendShort +
    s_volatility * w.volatility
  ) / totalWeight;

  var patternBonus = 0;
  if (gecko.spikePattern && gecko.spikePattern.hasPattern && gecko.spikePattern.isDue) {
    patternBonus += w.patternBonus;
  }
  if (gecko.weeklyPattern && gecko.weeklyPattern.hasWeeklyPattern && gecko.weeklyPattern.isToday) {
    patternBonus += w.patternBonus;
  }
  if (gecko.weeklyPattern && gecko.weeklyPattern.hasWeeklyPattern && gecko.weeklyPattern.isTomorrow) {
    patternBonus += w.patternBonus * 0.5;
  }

  var trendMediumBonus = gecko.trendMedium === "UP" ? 5 : 0;
  var finalScore = Math.min(100, parseFloat((rawScore + patternBonus + trendMediumBonus).toFixed(1)));

  var signal;
  if (finalScore >= 78) signal = "STRONG BUY";
  else if (finalScore >= 62) signal = "BUY";
  else if (finalScore >= 45) signal = "WATCH";
  else if (finalScore >= 30) signal = "WEAK";
  else signal = "AVOID";

  return {
    score: finalScore,
    signal: signal,
    breakdown: {
      change24h: parseFloat(s_change.toFixed(1)),
      rangePosition: parseFloat(s_range.toFixed(1)),
      volumeRatio: parseFloat(s_volume.toFixed(1)),
      trendShort: parseFloat(s_trendShort.toFixed(1)),
      volatility: parseFloat(s_volatility.toFixed(1)),
      patternBonus: parseFloat(patternBonus.toFixed(1)),
      trendMediumBonus: parseFloat(trendMediumBonus.toFixed(1)),
    },
  };
}

export function scoreAllCoins(coins, slotType) {
  return coins
    .map(function(coin) {
      return Object.assign({}, coin, { scoring: scoreCoin(coin, slotType) });
    })
    .sort(function(a, b) { return b.scoring.score - a.scoring.score; });
}

export function getSignalColor(signal) {
  switch (signal) {
    case "STRONG BUY": return "#00e676";
    case "BUY": return "#69f0ae";
    case "WATCH": return "#ffeb3b";
    case "WEAK": return "#ff9100";
    case "AVOID": return "#ff5252";
    default: return "#888";
  }
}

export function getScoreColor(score) {
  if (score >= 75) return "#00e676";
  if (score >= 60) return "#69f0ae";
  if (score >= 45) return "#ffeb3b";
  if (score >= 30) return "#ff9100";
  return "#ff5252";
}
