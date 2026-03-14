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
  if (ratio === null || ratio === undefined) return 50;
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
  if (trend === "UNKNOWN") return 50;
  return 50;
}

function scoreVolatility(volatilityPct, slotConfig) {
  if (volatilityPct === null || volatilityPct === undefined) return 50;
  var min = slotConfig.minVolatilityPct;
  if (volatilityPct < min * 0.5) return 10;
  if (volatilityPct < min) return 40;
  if (volatilityPct < min * 2) return 80;
  if (volatilityPct < min * 4) return 100;
  if (volatilityPct < min * 8) return 70;
  return 40;
}

function scoreDipBuy(coin) {
  // Price down but on low volume = accumulation = good dip buy
  var change = coin.change24h || 0;
  var rangePos = coin.rangePosition || 0.5;
  var spread = coin.spread || 0;

  var score = 0;
  // Price pulling back
  if (change < -1 && change > -15) score += 30;
  // Near low of range = good entry
  if (rangePos <= 0.30) score += 40;
  else if (rangePos <= 0.45) score += 25;
  // Tight spread = liquidity is there
  if (spread < 0.5) score += 20;
  else if (spread < 1.0) score += 10;
  // Volume low on dip = weak selling
  var volINR = coin.volumeINR || 0;
  if (volINR > 500000 && volINR < 3000000) score += 10;

  return Math.min(100, score);
}

function scoreRunner(coin) {
  // Coins sustaining momentum over multiple days
  var change = coin.change24h || 0;
  var rangePos = coin.rangePosition || 0.5;
  var volINR = coin.volumeINR || 0;
  var hasBoth = coin.hasBothPairs || false;

  var score = 0;
  // Strong positive change
  if (change >= 10) score += 40;
  else if (change >= 5) score += 30;
  else if (change >= 3) score += 20;
  // High in range = momentum still going
  if (rangePos >= 0.65) score += 25;
  else if (rangePos >= 0.50) score += 15;
  // High volume = real buying
  if (volINR >= 5000000) score += 25;
  else if (volINR >= 2000000) score += 15;
  else if (volINR >= 1000000) score += 8;
  // Trades on both pairs = more interest
  if (hasBoth) score += 10;

  return Math.min(100, score);
}

export function scoreCoin(coin, slotType, marketContext) {
  var type = slotType || "B";
  var slotConfig = strategy["slot" + type] || strategy.slotB;
  var gecko = coin.geckoData || {};
  var w = strategy.weights;
  var ctx = marketContext || { marketMode: "NEUTRAL", btcChange: 0 };

  // Use dip scoring for slot D
  if (type === "D") {
    var dipScore = scoreDipBuy(coin);
    var signal;
    if (dipScore >= 75) signal = "STRONG BUY";
    else if (dipScore >= 55) signal = "BUY";
    else if (dipScore >= 35) signal = "WATCH";
    else signal = "WEAK";
    return {
      score: dipScore,
      signal: signal,
      breakdown: { dipScore: dipScore },
    };
  }

  // Use runner scoring for slot R
  if (type === "R") {
    var runScore = scoreRunner(coin);
    var signal;
    if (runScore >= 75) signal = "STRONG BUY";
    else if (runScore >= 55) signal = "BUY";
    else if (runScore >= 35) signal = "WATCH";
    else signal = "WEAK";
    return {
      score: runScore,
      signal: signal,
      breakdown: { runScore: runScore },
    };
  }

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

  // Bonuses
  var bonuses = 0;

  // Cross-pair bonus — coin trades on both INR and USDT
  if (coin.hasBothPairs) bonuses += w.crossPairBonus;

  // BTC decoupled bonus — coin rising while BTC falling = strong alt signal
  if (ctx.btcChange < -2 && coin.change24h > 2) bonuses += w.btcDecoupledBonus;

  // Volume rising bonus — high absolute volume
  if (coin.volumeINR >= 5000000) bonuses += w.volumeRisingBonus;
  else if (coin.volumeINR >= 2000000) bonuses += w.volumeRisingBonus * 0.5;

  // Market mode boosts
  if (ctx.marketMode === "ROTATION" && coin.change24h > 0) bonuses += 5;
  if (ctx.marketMode === "ALT SEASON" && coin.change24h > 3) bonuses += 8;

  // Pattern bonuses from gecko
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
  var finalScore = Math.min(100, parseFloat((rawScore + bonuses + patternBonus + trendMediumBonus).toFixed(1)));

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
      crossPairBonus: coin.hasBothPairs ? w.crossPairBonus : 0,
      btcDecoupledBonus: (ctx.btcChange < -2 && coin.change24h > 2) ? w.btcDecoupledBonus : 0,
      patternBonus: parseFloat(patternBonus.toFixed(1)),
      trendMediumBonus: parseFloat(trendMediumBonus.toFixed(1)),
    },
  };
}

export function scoreAllCoins(coins, slotType, marketContext) {
  return coins
    .map(function(coin) {
      return Object.assign({}, coin, { scoring: scoreCoin(coin, slotType, marketContext) });
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
