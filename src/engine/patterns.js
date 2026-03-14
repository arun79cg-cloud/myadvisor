function detectUptrend(closes, period) {
  var p = period || 5;
  if (!closes || closes.length < p * 2) return { isUptrend: false, confidence: 0 };
  var recent = closes.slice(-p);
  var previous = closes.slice(-p * 2, -p);
  var recentAvg = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
  var previousAvg = previous.reduce(function(a, b) { return a + b; }, 0) / previous.length;
  var isUptrend = recentAvg > previousAvg;
  var strength = previousAvg > 0 ? Math.abs((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  var higherHighs = Math.max.apply(null, recent) > Math.max.apply(null, previous);
  var higherLows = Math.min.apply(null, recent) > Math.min.apply(null, previous);
  var confidence = (isUptrend ? 40 : 0) + (higherHighs ? 30 : 0) + (higherLows ? 30 : 0);
  return { isUptrend: isUptrend, higherHighs: higherHighs, higherLows: higherLows, strength: parseFloat(strength.toFixed(2)), confidence: confidence };
}

function detectDowntrend(closes, period) {
  var p = period || 5;
  if (!closes || closes.length < p * 2) return { isDowntrend: false, confidence: 0 };
  var recent = closes.slice(-p);
  var previous = closes.slice(-p * 2, -p);
  var recentAvg = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
  var previousAvg = previous.reduce(function(a, b) { return a + b; }, 0) / previous.length;
  var isDowntrend = recentAvg < previousAvg;
  var lowerHighs = Math.max.apply(null, recent) < Math.max.apply(null, previous);
  var lowerLows = Math.min.apply(null, recent) < Math.min.apply(null, previous);
  var confidence = (isDowntrend ? 40 : 0) + (lowerHighs ? 30 : 0) + (lowerLows ? 30 : 0);
  return { isDowntrend: isDowntrend, lowerHighs: lowerHighs, lowerLows: lowerLows, confidence: confidence };
}

function detectHammer(ohlc) {
  if (!ohlc || ohlc.length < 1) return false;
  var last = ohlc[ohlc.length - 1];
  var open = last[1]; var high = last[2]; var low = last[3]; var close = last[4];
  var body = Math.abs(close - open);
  var totalRange = high - low;
  var lowerWick = Math.min(open, close) - low;
  var upperWick = high - Math.max(open, close);
  if (totalRange === 0) return false;
  return lowerWick >= body * 2 && upperWick <= body * 0.5 && body / totalRange <= 0.35;
}

function detectBullishEngulfing(ohlc) {
  if (!ohlc || ohlc.length < 2) return false;
  var prev = ohlc[ohlc.length - 2];
  var curr = ohlc[ohlc.length - 1];
  var prevOpen = prev[1]; var prevClose = prev[4];
  var currOpen = curr[1]; var currClose = curr[4];
  return prevClose < prevOpen && currClose > currOpen && currOpen < prevClose && currClose > prevOpen;
}

function detectDoji(ohlc) {
  if (!ohlc || ohlc.length < 1) return false;
  var last = ohlc[ohlc.length - 1];
  var open = last[1]; var high = last[2]; var low = last[3]; var close = last[4];
  var body = Math.abs(close - open);
  var totalRange = high - low;
  if (totalRange === 0) return false;
  return body / totalRange <= 0.1;
}

function detectMorningStar(ohlc) {
  if (!ohlc || ohlc.length < 3) return false;
  var c1 = ohlc[ohlc.length - 3];
  var c2 = ohlc[ohlc.length - 2];
  var c3 = ohlc[ohlc.length - 1];
  return c1[4] < c1[1] && Math.abs(c2[4] - c2[1]) < Math.abs(c1[4] - c1[1]) * 0.3 && c3[4] > c3[1] && c3[4] > (c1[1] + c1[4]) / 2;
}

function detectShootingStar(ohlc) {
  if (!ohlc || ohlc.length < 1) return false;
  var last = ohlc[ohlc.length - 1];
  var open = last[1]; var high = last[2]; var low = last[3]; var close = last[4];
  var body = Math.abs(close - open);
  var totalRange = high - low;
  var upperWick = high - Math.max(open, close);
  var lowerWick = Math.min(open, close) - low;
  if (totalRange === 0) return false;
  return upperWick >= body * 2 && lowerWick <= body * 0.5 && body / totalRange <= 0.35;
}

function findSupport(closes, lookback) {
  var lb = lookback || 14;
  if (!closes || closes.length < lb) return null;
  return Math.min.apply(null, closes.slice(-lb));
}

function findResistance(closes, lookback) {
  var lb = lookback || 14;
  if (!closes || closes.length < lb) return null;
  return Math.max.apply(null, closes.slice(-lb));
}

function isNearSupport(currentPrice, closes, lookback) {
  var support = findSupport(closes, lookback);
  if (!support) return false;
  var distance = (currentPrice - support) / support;
  return distance >= 0 && distance <= 0.05;
}

function isBreakingResistance(currentPrice, closes, lookback) {
  if (!closes || closes.length < 2) return false;
  var resistance = findResistance(closes.slice(0, -1), lookback);
  if (!resistance) return false;
  return currentPrice > resistance * 1.01;
}

function detectVolumeSurge(currentVolume, avgVolume, threshold) {
  var t = threshold || 1.5;
  if (!currentVolume || !avgVolume || avgVolume === 0) return false;
  return currentVolume / avgVolume >= t;
}

function detectVolumeDryup(volumes, period) {
  var p = period || 5;
  if (!volumes || volumes.length < p * 2) return false;
  var recent = volumes.slice(-p);
  var older = volumes.slice(-p * 2, -p);
  var recentAvg = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
  var olderAvg = older.reduce(function(a, b) { return a + b; }, 0) / older.length;
  return recentAvg < olderAvg * 0.6;
}

export function analyzePatterns(coin) {
  var gecko = coin.geckoData || {};
  var ohlc = gecko.ohlc1d || [];
  var closes7d = gecko.closes7d || [];
  var volumes7d = gecko.volumes7d || [];
  var spikePattern = gecko.spikePattern || {};
  var weeklyPattern = gecko.weeklyPattern || {};

  var uptrend = detectUptrend(closes7d);
  var downtrend = detectDowntrend(closes7d);
  var hammer = detectHammer(ohlc);
  var bullishEngulfing = detectBullishEngulfing(ohlc);
  var doji = detectDoji(ohlc);
  var morningStar = detectMorningStar(ohlc);
  var shootingStar = detectShootingStar(ohlc);
  var nearSupport = isNearSupport(coin.lastPrice, closes7d);
  var breakingResistance = isBreakingResistance(coin.lastPrice, closes7d);
  var volumeSurge = detectVolumeSurge(gecko.currentVolume, gecko.avgVolume7d);
  var volumeDryup = detectVolumeDryup(volumes7d);

  var activeSignals = [];
  if (uptrend.isUptrend && uptrend.confidence >= 70) activeSignals.push("Strong uptrend");
  if (uptrend.higherHighs && uptrend.higherLows) activeSignals.push("Higher highs & lows");
  if (hammer) activeSignals.push("Hammer candle");
  if (bullishEngulfing) activeSignals.push("Bullish engulfing");
  if (morningStar) activeSignals.push("Morning star");
  if (doji) activeSignals.push("Doji - watch for reversal");
  if (nearSupport) activeSignals.push("Near support level");
  if (breakingResistance) activeSignals.push("Breaking resistance!");
  if (volumeSurge) activeSignals.push("Volume surge");
  if (spikePattern.hasPattern && spikePattern.isDue) activeSignals.push("Repeat spike due (every " + spikePattern.avgDaysBetweenSpikes + "d)");
  if (weeklyPattern.hasWeeklyPattern && weeklyPattern.isToday) activeSignals.push("Weekly spike day: today (" + weeklyPattern.bestSpikeDay + ")");
  if (weeklyPattern.hasWeeklyPattern && weeklyPattern.isTomorrow) activeSignals.push("Weekly spike tomorrow (" + weeklyPattern.bestSpikeDay + ")");
  if (coin.rangePosition < 0.25) activeSignals.push("Near 24h low - great entry");

  var warningSignals = [];
  if (downtrend.isDowntrend && downtrend.confidence >= 70) warningSignals.push("Downtrend in progress");
  if (downtrend.lowerHighs && downtrend.lowerLows) warningSignals.push("Lower highs & lows");
  if (coin.change24h > 35) warningSignals.push("Already up 35%+ today - risky entry");
  if (coin.rangePosition > 0.85) warningSignals.push("Near 24h high - limited upside");
  if (volumeDryup) warningSignals.push("Volume drying up");
  if (shootingStar) warningSignals.push("Shooting star - possible reversal");
  if (coin.spread > 2) warningSignals.push("Wide spread - low liquidity");

  var bullishCount = activeSignals.length;
  var bearishCount = warningSignals.length;
  var overallSentiment = bullishCount > bearishCount ? "BULLISH" : bearishCount > bullishCount ? "BEARISH" : "NEUTRAL";

  return {
    uptrend: uptrend,
    downtrend: downtrend,
    candleSignals: { hammer: hammer, bullishEngulfing: bullishEngulfing, doji: doji, morningStar: morningStar, shootingStar: shootingStar },
    nearSupport: nearSupport,
    breakingResistance: breakingResistance,
    volumeSurge: volumeSurge,
    volumeDryup: volumeDryup,
    spikePattern: spikePattern,
    weeklyPattern: weeklyPattern,
    activeSignals: activeSignals,
    warningSignals: warningSignals,
    overallSentiment: overallSentiment,
  };
}
