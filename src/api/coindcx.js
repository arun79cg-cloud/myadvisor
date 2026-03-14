const TICKER_URL = "/api/tickers";
const MARKETS_URL = "/api/markets";

export async function fetchCoinDCXData() {
  var tickerRes = await fetch(TICKER_URL);
  var marketRes = await fetch(MARKETS_URL);
  var tickers = await tickerRes.json();
  var markets = await marketRes.json();

  var marketMap = {};
  if (Array.isArray(markets)) {
    markets.forEach(function(m) {
      if (m.coindcx_name) marketMap[m.coindcx_name] = m;
    });
  }

  var merged = tickers
    .map(function(t) {
      var quote = "";
      var base = "";
      var market = marketMap[t.market];

      if (market) {
        quote = market.quote_currency_short_name;
        base = market.base_currency_short_name;
      } else if (t.market.endsWith("USDT")) {
        quote = "USDT";
        base = t.market.slice(0, -4);
      } else if (t.market.endsWith("INR")) {
        quote = "INR";
        base = t.market.slice(0, -3);
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

      return {
        market: t.market,
        base: base,
        quote: quote,
        fullName: (market && market.base_currency_name) || base,
        lastPrice: lastPrice,
        high24h: high24h,
        low24h: low24h,
        bid: bid,
        ask: ask,
        spread: parseFloat(spread.toFixed(4)),
        volume24h: volume24h,
        change24h: change24h,
        rangePosition: parseFloat(rangePosition.toFixed(4)),
        status: (market && market.status) || "active",
        minQuantity: parseFloat((market && market.min_quantity)) || 0,
        maxQuantity: parseFloat((market && market.max_quantity)) || 0,
        basePrecision: (market && market.base_currency_precision) || 8,
        quotePrecision: (market && market.quote_currency_precision) || 2,
      };
    })
    .filter(Boolean);

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
  return data
    .filter(function(d) { return d.rangePosition <= t; })
    .sort(function(a, b) { return a.rangePosition - b.rangePosition; });
}

export function getCoinsNearHigh(data, threshold) {
  var t = threshold || 0.7;
  return data
    .filter(function(d) { return d.rangePosition >= t; })
    .sort(function(a, b) { return b.rangePosition - a.rangePosition; });
}
