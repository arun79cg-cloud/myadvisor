import strategy from "../config/strategy";
import { calculateLevels } from "../utils/fees";
import { scoreCoin } from "./scoring";
import { analyzePatterns } from "./patterns";

function qualifiesForSlot(coin, slotType) {
  var gecko = coin.geckoData || {};
  var slotConfig = strategy["slot" + slotType];
  if (!slotConfig) return false;

  var scoring = coin["scoring" + slotType] || {};
  var score = scoring.score || 0;
  var minScore = slotType === "C" ? 20 : slotType === "A" ? 30 : 35;
  if (score < minScore) return false;

  if (coin.change24h < slotConfig.minChange24h) return false;
  if (coin.change24h > slotConfig.maxChange24h) return false;
  if (coin.rangePosition > slotConfig.maxRangePosition) return false;

  if (gecko.volumeRatio !== null && gecko.volumeRatio !== undefined && gecko.volumeRatio < slotConfig.minVolumeRatio * 0.7) return false;

  if (slotType === "B") {
    if (coin.change24h < 2) return false;
    if (coin.rangePosition > 0.70) return false;
  }

  if (slotType === "A") {
    if (coin.change24h > 15) return false;
    if (coin.rangePosition > 0.75) return false;
  }

  if (slotType === "C") {
    var isVolatile = gecko.volatilityPercent > 3;
    var hasPattern = gecko.spikePattern && gecko.spikePattern.hasPattern;
    var isSmallCap = !gecko.marketCapRank || gecko.marketCapRank > 200;
    if (!isVolatile && !hasPattern && !isSmallCap) return false;
  }

  return true;
}

function buildSuggestion(coin, slotType, userSettings) {
  var gecko = coin.geckoData || {};
  var patterns = coin.patterns || {};
  var slotConfig = strategy["slot" + slotType];
  var scoring = coin["scoring" + slotType] || {};

  var levels = calculateLevels(coin.lastPrice, coin.quote, slotConfig);

  var totalCapital = (userSettings && userSettings.totalCapital) || strategy.totalCapital;
  var coinsPerSlot = (userSettings && userSettings.coinsPerSlot) || strategy.coinsPerSlot;
  var amountOverride = (userSettings && userSettings.amountPerCoinOverride) || null;
  var amountPerCoin = amountOverride || Math.floor(totalCapital / strategy.numberOfSlots / coinsPerSlot);

  var reasons = [];
  if (coin.change24h >= slotConfig.minChange24h) reasons.push("Up " + coin.change24h.toFixed(1) + "% today");
  if (gecko.trendShort === "UP") reasons.push("Short trend up");
  if (gecko.trendMedium === "UP") reasons.push("Medium trend up");
  if (gecko.volumeRatio > slotConfig.minVolumeRatio) reasons.push("Volume " + gecko.volumeRatio + "x average");
  if (patterns.nearSupport) reasons.push("Near support");
  if (patterns.breakingResistance) reasons.push("Breaking resistance");
  if (patterns.candleSignals && patterns.candleSignals.hammer) reasons.push("Hammer candle");
  if (patterns.candleSignals && patterns.candleSignals.bullishEngulfing) reasons.push("Bullish engulfing");
  if (patterns.candleSignals && patterns.candleSignals.morningStar) reasons.push("Morning star");
  if (gecko.spikePattern && gecko.spikePattern.isDue) reasons.push("Spike due every " + gecko.spikePattern.avgDaysBetweenSpikes + "d");
  if (gecko.weeklyPattern && gecko.weeklyPattern.isToday) reasons.push("Weekly spike day: " + gecko.weeklyPattern.bestSpikeDay);
  if (coin.rangePosition < 0.30) reasons.push("Near 24h low - good entry");
  if (reasons.length === 0) reasons.push("Momentum candidate");

  return {
    slot: slotType,
    market: coin.market,
    base: coin.base,
    quote: coin.quote,
    fullName: gecko.name || coin.base,
    geckoImage: gecko.image || null,
    marketCapRank: gecko.marketCapRank || null,
    lastPrice: coin.lastPrice,
    entryPrice: levels.entryPrice,
    targetPrice: levels.targetPrice,
    stopPrice: levels.stopPrice,
    breakEvenPrice: levels.breakEvenPrice,
    grossTargetPercent: levels.grossTargetPercent,
    netTargetPercent: levels.netTargetPercent,
    stopPercent: levels.stopPercent,
    roundTripCostPercent: levels.roundTripCostPercent,
    suggestedAmountINR: amountPerCoin,
    score: scoring.score || 0,
    signal: scoring.signal || "WATCH",
    breakdown: scoring.breakdown || {},
    change24h: coin.change24h,
    change1h: gecko.change1h || null,
    change7d: gecko.change7d || null,
    rangePosition: coin.rangePosition,
    high24h: coin.high24h,
    low24h: coin.low24h,
    volume24h: coin.volume24h,
    volumeRatio: gecko.volumeRatio || null,
    volatilityPercent: gecko.volatilityPercent || null,
    spread: coin.spread,
    activeSignals: patterns.activeSignals || [],
    warningSignals: patterns.warningSignals || [],
    overallSentiment: patterns.overallSentiment || "NEUTRAL",
    spikePattern: gecko.spikePattern || null,
    weeklyPattern: gecko.weeklyPattern || null,
    athChangePercent: gecko.athChangePercent || null,
    reasons: reasons,
    warnings: patterns.warningSignals || [],
    holdTime: slotType === "C" ? "Days to weeks" : "Max 24 hours",
  };
}

export function runFullPipeline(coindcxCoins, geckoEnriched, userSettings) {
  var merged = coindcxCoins.map(function(coin) {
    return Object.assign({}, coin, {
      geckoData: (geckoEnriched && geckoEnriched[coin.base]) || { found: false },
    });
  });

  var withScores = merged.map(function(coin) {
    return Object.assign({}, coin, {
      scoringB: scoreCoin(coin, "B"),
      scoringA: scoreCoin(coin, "A"),
      scoringC: scoreCoin(coin, "C"),
    });
  });

  var withPatterns = withScores.map(function(coin) {
    return Object.assign({}, coin, {
      patterns: analyzePatterns(coin),
    });
  });

  var slotB = [];
  var slotA = [];
  var slotC = [];

  withPatterns.forEach(function(coin) {
    if (qualifiesForSlot(coin, "B")) slotB.push(buildSuggestion(coin, "B", userSettings));
    if (qualifiesForSlot(coin, "A")) slotA.push(buildSuggestion(coin, "A", userSettings));
    if (qualifiesForSlot(coin, "C")) slotC.push(buildSuggestion(coin, "C", userSettings));
  });

  slotB.sort(function(a, b) { return b.score - a.score; });
  slotA.sort(function(a, b) { return b.score - a.score; });
  slotC.sort(function(a, b) { return b.score - a.score; });

  return {
    B: slotB.slice(0, strategy.slotB.maxCoins),
    A: slotA.slice(0, strategy.slotA.maxCoins),
    C: slotC.slice(0, strategy.slotC.maxCoins),
    summary: {
      totalAnalyzed: coindcxCoins.length,
      slotBCount: slotB.length,
      slotACount: slotA.length,
      slotCCount: slotC.length,
      lastUpdated: new Date(),
    },
    allCoins: withPatterns,
  };
}

export function analyzeWatchlist(allCoins, watchlistSymbols, userSettings) {
  if (!watchlistSymbols || watchlistSymbols.length === 0) return [];
  var upperSymbols = watchlistSymbols.map(function(s) { return s.toUpperCase().trim(); });
  var matches = allCoins.filter(function(coin) {
    return upperSymbols.indexOf((coin.base || "").toUpperCase()) !== -1;
  });

  return matches.map(function(coin) {
    var scored = Object.assign({}, coin, {
      scoringB: scoreCoin(coin, "B"),
      scoringA: scoreCoin(coin, "A"),
      scoringC: scoreCoin(coin, "C"),
      patterns: analyzePatterns(coin),
    });
    var scores = [
      { slot: "B", score: scored.scoringB.score },
      { slot: "A", score: scored.scoringA.score },
      { slot: "C", score: scored.scoringC.score },
    ];
    scores.sort(function(a, b) { return b.score - a.score; });
    var bestSlot = scores[0].slot;
    return buildSuggestion(scored, bestSlot, userSettings);
  }).sort(function(a, b) { return b.score - a.score; });
}
