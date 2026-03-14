var BASE_URL = "https://corsproxy.io/?https://api.coingecko.com/api/v3";

function delay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function geckoFetch(url, params) {
  var queryString = "";
  if (params && Object.keys(params).length > 0) {
    queryString = "?" + new URLSearchParams(params).toString();
  }
  var res = await fetch(url + queryString);
  if (!res.ok) throw new Error("CoinGecko error " + res.status);
  return res.json();
}

async function fetchCoinGeckoMarkets(page) {
  try {
    return await geckoFetch(BASE_URL + "/coins/markets", {
      vs_currency: "inr",
      order: "market_cap_desc",
      per_page: 250,
      page: page || 1,
      sparkline: false,
      price_change_percentage: "1h,24h,7d",
    });
  } catch (err) {
    console.error("CoinGecko markets failed:", err.message);
    return [];
  }
}

async function buildSymbolMap() {
  try {
    var results = await Promise.all([
      fetchCoinGeckoMarkets(1),
      fetchCoinGeckoMarkets(2),
    ]);
    var allCoins = results[0].concat(results[1]);
    var symbolMap = {};
    allCoins.forEach(function(coin) {
      var symbol = coin.symbol.toUpperCase();
      if (!symbolMap[symbol] || coin.market_cap > (symbolMap[symbol].market_cap || 0)) {
        symbolMap[symbol] = {
          id: coin.id,
          name: coin.name,
          symbol: symbol,
          currentPrice: coin.current_price,
          marketCap: coin.market_cap,
          marketCapRank: coin.market_cap_rank,
          totalVolume: coin.total_volume,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          priceChange24h: coin.price_change_percentage_24h,
          priceChange1h: coin.price_change_percentage_1h_in_currency,
          priceChange7d: coin.price_change_percentage_7d_in_currency,
          image: coin.image,
          ath: coin.ath,
          atl: coin.atl,
          athChangePercent: coin.ath_change_percentage,
        };
      }
    });
    return symbolMap;
  } catch (err) {
    console.error("Symbol map failed:", err.message);
    return {};
  }
}

async function fetchOHLC(coinId, days) {
  try {
    await delay(300);
    return await geckoFetch(BASE_URL + "/coins/" + coinId + "/ohlc", {
      vs_currency: "inr",
      days: days || 1,
    });
  } catch (err) {
    console.error("OHLC failed for " + coinId + ":", err.message);
    return [];
  }
}

async function fetchMarketChart(coinId, days) {
  try {
    await delay(300);
    var d = days || 7;
    var data = await geckoFetch(BASE_URL + "/coins/" + coinId + "/market_chart", {
      vs_currency: "inr",
      days: d,
      interval: d <= 1 ? "hourly" : "daily",
    });
    return {
      prices: data.prices || [],
      volumes: data.total_volumes || [],
    };
  } catch (err) {
    console.error("Market chart failed for " + coinId + ":", err.message);
    return { prices: [], volumes: [] };
  }
}

function computeSMA(closes, period) {
  if (!closes || closes.length < period) return null;
  var slice = closes.slice(-period);
  return slice.reduce(function(a, b) { return a + b; }, 0) / period;
}

function computeAvgVolume(volumes, period) {
  if (!volumes || volumes.length < period) return null;
  var slice = volumes.slice(-period);
  return slice.reduce(function(a, b) { return a + b; }, 0) / period;
}

function computeVolatility(closes) {
  if (!closes || closes.length < 5) return 0;
  var returns = [];
  for (var i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }
  if (returns.length === 0) return 0;
  var mean = returns.reduce(function(a, b) { return a + b; }, 0) / returns.length;
  var variance = returns.reduce(function(a, b) { return a + Math.pow(b - mean, 2); }, 0) / returns.length;
  return Math.sqrt(variance);
}

function detectSpikePattern(dailyPrices) {
  if (!dailyPrices || dailyPrices.length < 7) return { hasPattern: false };
  var closes = dailyPrices.map(function(p) { return p[1]; });
  var spikeDays = [];
  for (var i = 1; i < closes.length; i++) {
    var change = (closes[i] - closes[i - 1]) / closes[i - 1];
    if (change >= 0.1) spikeDays.push(i);
  }
  if (spikeDays.length < 2) return { hasPattern: false, spikeCount: spikeDays.length };
  var totalGap = 0;
  for (var j = 1; j < spikeDays.length; j++) {
    totalGap += spikeDays[j] - spikeDays[j - 1];
  }
  var avgGap = totalGap / (spikeDays.length - 1);
  var lastSpikeDay = spikeDays[spikeDays.length - 1];
  var daysSince = closes.length - 1 - lastSpikeDay;
  var isDue = daysSince >= avgGap * 0.8;
  return {
    hasPattern: true,
    spikeCount: spikeDays.length,
    avgDaysBetweenSpikes: parseFloat(avgGap.toFixed(1)),
    daysSinceLastSpike: daysSince,
    isDue: isDue,
    nextSpikeExpectedInDays: Math.max(0, parseFloat((avgGap - daysSince).toFixed(1))),
  };
}

function detectWeeklyPattern(dailyPrices) {
  if (!dailyPrices || dailyPrices.length < 14) return { hasWeeklyPattern: false };
  var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dailyPrices.forEach(function(point, i) {
    if (i === 0) return;
    var prev = dailyPrices[i - 1][1];
    var curr = point[1];
    var change = prev > 0 ? (curr - prev) / prev : 0;
    if (change >= 0.08) {
      var dow = new Date(point[0]).getDay();
      dayCount[dow]++;
    }
  });
  var maxCount = 0;
  var bestDay = null;
  Object.keys(dayCount).forEach(function(day) {
    if (dayCount[day] > maxCount) {
      maxCount = dayCount[day];
      bestDay = parseInt(day);
    }
  });
  var today = new Date().getDay();
  return {
    hasWeeklyPattern: maxCount >= 2,
    bestSpikeDay: bestDay !== null ? dayNames[bestDay] : null,
    spikeCount: maxCount,
    isToday: bestDay === today,
    isTomorrow: bestDay === (today + 1) % 7,
  };
}

export async function enrichWithCoinGecko(symbols) {
  var symbolMap = await buildSymbolMap();
  var enriched = {};
  var batchSize = 5;

  for (var i = 0; i < symbols.length; i += batchSize) {
    var batch = symbols.slice(i, i + batchSize);
    await Promise.all(batch.map(async function(symbol) {
      var geckoData = symbolMap[symbol.toUpperCase()];
      if (!geckoData) {
        enriched[symbol] = { found: false };
        return;
      }
      try {
        var results = await Promise.all([
          fetchOHLC(geckoData.id, 1),
          fetchMarketChart(geckoData.id, 7),
          fetchMarketChart(geckoData.id, 30),
        ]);
        var ohlc1d = results[0];
        var chart7d = results[1];
        var chart30d = results[2];
        var closes1d = ohlc1d.map(function(c) { return c[4]; });
        var closes7d = chart7d.prices.map(function(p) { return p[1]; });
        var volumes7d = chart7d.volumes.map(function(v) { return v[1]; });
        var sma10 = computeSMA(closes1d, 10);
        var sma20 = computeSMA(closes7d, 20);
        var currentClose = closes1d[closes1d.length - 1] || 0;
        var avgVolume7d = computeAvgVolume(volumes7d, 7);
        var volatility = computeVolatility(closes7d);
        var spikePattern = detectSpikePattern(chart30d.prices);
        var weeklyPattern = detectWeeklyPattern(chart30d.prices);
        var trendShort = sma10 !== null ? (currentClose > sma10 ? "UP" : "DOWN") : "UNKNOWN";
        var trendMedium = sma20 !== null ? (currentClose > sma20 ? "UP" : "DOWN") : "UNKNOWN";
        enriched[symbol] = {
          found: true,
          geckoId: geckoData.id,
          name: geckoData.name,
          image: geckoData.image,
          marketCapRank: geckoData.marketCapRank,
          marketCap: geckoData.marketCap,
          change1h: geckoData.priceChange1h,
          change24h: geckoData.priceChange24h,
          change7d: geckoData.priceChange7d,
          ath: geckoData.ath,
          athChangePercent: geckoData.athChangePercent,
          sma10_1d: sma10,
          sma20_7d: sma20,
          trendShort: trendShort,
          trendMedium: trendMedium,
          avgVolume7d: avgVolume7d,
          currentVolume: geckoData.totalVolume,
          volumeRatio: avgVolume7d > 0 ? parseFloat((geckoData.totalVolume / avgVolume7d).toFixed(2)) : null,
          volatility: parseFloat(volatility.toFixed(6)),
          volatilityPercent: parseFloat((volatility * 100).toFixed(2)),
          spikePattern: spikePattern,
          weeklyPattern: weeklyPattern,
          ohlc1d: ohlc1d,
          closes7d: closes7d,
          volumes7d: volumes7d,
          dailyPrices: chart30d.prices,
        };
      } catch (err) {
        console.error("Enrichment failed for " + symbol + ":", err.message);
        enriched[symbol] = { found: false };
      }
    }));
    if (i + batchSize < symbols.length) await delay(1000);
  }
  return enriched;
}
