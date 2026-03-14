import strategy from "../config/strategy";
import { calculateLevels } from "../utils/fees";
import { scoreCoin } from "./scoring";
import { analyzePatterns } from "./patterns";

function qualifiesForSlot(coin, slotType, marketContext) {
  var ctx = marketContext || { marketMode: "NEUTRAL", btcChange: 0 };
  var slotConfig = strategy["slot" + slotType];
  if (!slotConfig) return false;

  // PANIC mode — no buys at all except Dip Buys
  if (ctx.marketMode === "PANIC" && slotType !== "D") return false;

  var scoring = coin["scoring" + slotType] || {};
  var score = scoring.score || 0;

  var minScore = slotType === "C" ? 20
    : slotType === "D" ? 25
    : slotType === "R" ? 30
    : slotType === "A" ? 30
    : 35;

  if (score < minScore) return false;

  if (coin.change24h < slotConfig.minChange24h) return false;
  if (coin.change24h > slotConfig.maxChange24h) return false;
  if (coin.rangePosition > slotConfig.maxRangePosition) return false;

  // Volume filter — absolute minimum
  if (coin.quote === "INR" && coin.volumeINR < strategy.minVolume24hINR) return false;
  if (coin.quote === "USDT" && (coin.volume24h * coin.lastPrice) < strategy.minVolume24hUSDT) return false;

  // Slot-specific filters
  if (slotType === "B") {
    if (coin.change24h < 2) return false;
    if (coin.rangePosition > 0.70) return false;
  }

  if (slotType === "A") {
    if (coin.change24h > 15) return false;
    if (coin.rangePosition > 0.75) return false;
  }

  if (slotType === "D") {
    // Dip buy — must be pulling back
    if (coin.change24h >= 0) return false;
    if (coin.rangePosition > 0.45) return false;
  }

  if (slotType === "R") {
    // Runner — must have strong positive momentum
    if (coin.change24h < 3) return false;
    if (coin.volumeINR < 1000000 && coin.quote === "INR") return false;
  }

  if (slotType === "C") {
    var gecko = coin.geckoData || {};
    var isVolatile = gecko.volatilityPercent > 3;
    var hasPattern = gecko.spikePattern && gecko.spikePattern.hasPattern;
    var isSmallCap = !gecko.marketCapRank || gecko.marketCapRank > 200;
    if (!isVolatile && !hasPattern && !isSmallCap) return false;
  }

  return true;
}

function buildSuggestion(coin, slotType, userSettings, marketContext) {
  var gecko = coin.geckoData || {};
  var patterns = coin.patterns || {};
  var slotConfig = strategy["slot" + slotType];
  var scoring = coin["scoring" + slotType] || {};
  var ctx = marketContext || { marketMode: "NEUTRAL", usdtRate: 86 };
  var levels = calculateLevels(coin.lastPrice, coin.quote, slotConfig);

  var totalINR = (userSettings && userSettings.capitalINR) || strategy.capitalINR;
  var totalUSDT = (userSettings && userSettings.capitalUSDT) || strategy.capitalUSDT;
  var coinsPerSlot = (userSettings && userSettings.coinsPerSlot) || strategy.coinsPerSlot;

  var amountPerCoin;
  var amountCurrency;
  if (coin.quote === "USDT") {
    amountPerCoin = parseFloat((totalUSDT / coinsPerSlot).toFixed(2));
    amountCurrency = "USDT";
  } else {
    amountPerCoin = Math.floor(totalINR / coinsPerSlot);
    amountCurrency = "INR";
  }

  var reasons = [];
  if (coin.change24h > 0) reasons.push("Up " + coin.change24h.toFixed(1) + "% today");
  if (coin.change24h < 0) reasons.push("Down " + Math.abs(coin.change24h).toFixed(1) + "% — dip opportunity");
  if (coin.hasBothPairs) reasons.push("Trades on both INR & USDT pairs");
  if (ctx.btcChange < -2 && coin.change24h > 2) reasons.push("Rising while BTC falling — strong alt signal");
  if (ctx.marketMode === "ROTATION") reasons.push("BTC rotation mode — alts favoured");
  if (ctx.marketMode === "ALT SEASON") reasons.push("Alt season active");
  if (coin.rangePosition < 0.30) reasons.push("Near 24h low — good entry point");
  if (coin.volumeINR >= 5000000) reasons.push("Very high volume — strong interest");
  if (gecko.trendShort === "UP") reasons.push("Short term trend up");
  if (gecko.spikePattern && gecko.spikePattern.isDue) reasons.push("Spike pattern due");
  if (gecko.weeklyPattern && gecko.weeklyPattern.isToday) reasons.push("Weekly spike day today");
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
    suggestedAmount: amountPerCoin,
    suggestedAmountINR: amountPerCoin,
    amountCurrency: amountCurrency,
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
    volumeINR: coin.volumeINR,
    hasBothPairs: coin.hasBothPairs,
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
    marketMode: ctx.marketMode,
  };
}

export function runFullPipeline(coindcxCoins, geckoEnriched, userSettings, marketContext) {
  var ctx = marketContext || { marketMode: "NEUTRAL", btcChange: 0, usdtRate: 86 };

  var merged = coindcxCoins.map(function(coin) {
    return Object.assign({}, coin, {
      geckoData: (geckoEnriched && geckoEnriched[coin.base]) || { found: false },
    });
  });

  var withScores = merged.map(function(coin) {
    return Object.assign({}, coin, {
      scoringB: scoreCoin(coin, "B", ctx),
      scoringA: scoreCoin(coin, "A", ctx),
      scoringC: scoreCoin(coin, "C", ctx),
      scoringD: scoreCoin(coin, "D", ctx),
      scoringR: scoreCoin(coin, "R", ctx),
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
  var slotD = [];
  var slotR = [];

  withPatterns.forEach(function(coin) {
    if (qualifiesForSlot(coin, "B", ctx)) slotB.push(buildSuggestion(coin, "B", userSettings, ctx));
    if (qualifiesForSlot(coin, "A", ctx)) slotA.push(buildSuggestion(coin, "A", userSettings, ctx));
    if (qualifiesForSlot(coin, "C", ctx)) slotC.push(buildSuggestion(coin, "C", userSettings, ctx));
    if (qualifiesForSlot(coin, "D", ctx)) slotD.push(buildSuggestion(coin, "D", userSettings, ctx));
    if (qualifiesForSlot(coin, "R", ctx)) slotR.push(buildSuggestion(coin, "R", userSettings, ctx));
  });

  slotB.sort(function(a, b) { return b.score - a.score; });
  slotA.sort(function(a, b) { return b.score - a.score; });
  slotC.sort(function(a, b) { return b.score - a.score; });
  slotD.sort(function(a, b) { return b.score - a.score; });
  slotR.sort(function(a, b) { return b.score - a.score; });

  return {
    B: slotB.slice(0, strategy.slotB.maxCoins),
    A: slotA.slice(0, strategy.slotA.maxCoins),
    C: slotC.slice(0, strategy.slotC.maxCoins),
    D: slotD.slice(0, strategy.slotD.maxCoins),
    R: slotR.slice(0, strategy.slotR.maxCoins),
    summary: {
      totalAnalyzed: coindcxCoins.length,
      slotBCount: slotB.length,
      slotACount: slotA.length,
      slotCCount: slotC.length,
      slotDCount: slotD.length,
      slotRCount: slotR.length,
      lastUpdated: new Date(),
      marketMode: ctx.marketMode,
    },
    allCoins: withPatterns,
  };
}

export function analyzeWatchlist(allCoins, watchlistSymbols, userSettings, marketContext) {
  if (!watchlistSymbols || watchlistSymbols.length === 0) return [];
  var ctx = marketContext || { marketMode: "NEUTRAL", btcChange: 0 };
  var upperSymbols = watchlistSymbols.map(function(s) { return s.toUpperCase().trim(); });

  var matches = allCoins.filter(function(coin) {
    return upperSymbols.indexOf((coin.base || "").toUpperCase()) !== -1;
  });

  return matches.map(function(coin) {
    var scored = Object.assign({}, coin, {
      scoringB: scoreCoin(coin, "B", ctx),
      scoringA: scoreCoin(coin, "A", ctx),
      scoringC: scoreCoin(coin, "C", ctx),
      scoringD: scoreCoin(coin, "D", ctx),
      scoringR: scoreCoin(coin, "R", ctx),
      patterns: analyzePatterns(coin),
    });

    var scores = [
      { slot: "B", score: scored.scoringB.score },
      { slot: "A", score: scored.scoringA.score },
      { slot: "R", score: scored.scoringR.score },
      { slot: "D", score: scored.scoringD.score },
      { slot: "C", score: scored.scoringC.score },
    ];
    scores.sort(function(a, b) { return b.score - a.score; });
    var bestSlot = scores[0].slot;
    return buildSuggestion(scored, bestSlot, userSettings, ctx);
  }).sort(function(a, b) { return b.score - a.score; });
}
