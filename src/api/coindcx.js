const CORS = "https://corsproxy.io/?";

export async function fetchMarketContext() {
  try {
    var btcRes = await fetch("/api/tickers");
    var tickers = await btcRes.json();
    var btc = tickers.find(function(t) { return t.market === "BTCINR"; });
    var eth = tickers.find(function(t) { return t.market === "ETHINR"; });
    var btcChange = btc ? parseFloat(btc.change_24_hour) || 0 : 0;
    var ethChange = eth ? parseFloat(eth.change_24_hour) || 0 : 0;

    var mode = "NEUTRAL";
    if (btcChange <= -7) mode = "PANIC";
    else if (btcChange <= -3) mode = "ROTATION";
    else if (btcChange >= 3 && ethChange >= 2) mode = "ALT SEASON";
    else if (btcChange < 0) mode = "CAUTION";
    else mode = "NEUTRAL";

    var usdtTicker = tickers.find(function(t) { return t.market === "USDTINR"; });
    var usdtRate = usdtTicker ? parseFloat(usdtTicker.last_price) || 86 : 86;

    return {
      btcPrice: btc ? parseFloat(btc.last_price) || 0 : 0,
      btcChange: btcChange,
      ethChange: ethChange,
      marketMode: mode,
      usdtRate: usdtRate,
    };
  } catch (e) {
    return { btcPrice: 0, btcChange: 0, ethChange: 0, marketMode: "NEUTRAL", usdtRate: 86 };
  }
}

export async function fetchCoinDCXData() {
  var res = await fetch("/api/tickers");
  var tickers = await res.json();

  var pairMap = {};

  var merged = tickers
    .map(function(t) {
      var market = t.market || "";
      var quote = "";
      var base = "";

      if (market.endsWith("USDT")) {
        quote = "USDT";
        base = market.slice(0, -4);
      } else if (market.endsWith("INR")) {
        quote = "INR";
        base = market.slice(0, -3);
      } else {
        return null;
      }

      if (quote !== "INR" && quote !== "USDT") return null;

      var lastPrice = parseFloat(t.last_price) || 0;
      if (lastPrice <= 0) return null;

      var high24h = parseFloat(t.high) || 0;
      var low24h = parseFloat(t.low) || 0;
      var volume24h = parseFloat(t.volume) || 0;
      var change24h = parseFloat(t.change_24_hour) || 0;
      var bid = parseFloat(t.bid) || 0;
      var ask = parseFloat(t.ask) || 0;
      var rangeSize = high24h - low24h;
      var rangePosition = rangeSize > 0 ? (lastPrice - low24h) / rangeSize : 0.5;
      var spread = ask > 0 && bid > 0 ? ((ask - bid) / ask) * 100 : 0;

      var volumeINR = quote === "INR" ? volume24h * lastPrice : 0;

      var coin = {
        market: market,
        base: base,
        quote: quote,
        fullName: base,
        lastPrice: lastPrice,
        high24h: high24h,
        low24h: low24h,
        bid: bid,
        ask: ask,
        spread: parseFloat(spread.toFixed(4)),
        volume24h: volume24h,
        volumeINR: volumeINR,
        change24h: change24h,
        rangePosition: parseFloat(rangePosition.toFixed(4)),
        status: "active",
        minQuantity: 0,
        maxQuantity: 0,
        basePrecision: 8,
        quotePrecision: 2,
        hasBothPairs: false,
      };

      if (!pairMap[base]) pairMap[base] = {};
      pairMap[base][quote] = true;

      return coin;
    })
    .filter(Boolean);

  // Mark coins that trade on both INR and USDT pairs
  merged = merged.map(function(coin) {
    if (pairMap[coin.base] && pairMap[coin.base]["INR"] && pairMap[coin.base]["USDT"]) {
      coin.hasBothPairs = true;
    }
    return coin;
  });

  // Volume filter — minimum ₹5 lakh for INR, minimum 5000 USDT notional for USDT pairs
  merged = merged.filter(function(coin) {
    if (coin.quote === "INR") return coin.volumeINR >= 500000;
    if (coin.quote === "USDT") return coin.volume24h * coin.lastPrice >= 5000;
    return false;
  });

  return merged;
}

export function filterINR(data) {
  return data.filter(function(d) { return d.quote === "INR"; });
}

export function filterUSDT(data) {
  return data.filter(function(d) { return d.quote === "USDT"; });
}

export function getTopGainers(data, limit) {
  return data
    .filter(function(d) { return d.change24h > 0; })
    .sort(function(a, b) { return b.change24h - a.change24h; })
    .slice(0, limit || 10);
}

export function getTopLosers(data, limit) {
  return data
    .filter(function(d) { return d.change24h < 0; })
    .sort(function(a, b) { return a.change24h - b.change24h; })
    .slice(0, limit || 10);
}

export function getCoinsNearLow(data, threshold) {
  var t = threshold || 0.3;
  return data.filter(function(d) { return d.rangePosition <= t; })
    .sort(function(a, b) { return a.rangePosition - b.rangePosition; });
}

export function getCoinsNearHigh(data, threshold) {
  var t = threshold || 0.7;
  return data.filter(function(d) { return d.rangePosition >= t; })
    .sort(function(a, b) { return b.rangePosition - a.rangePosition; });
}
