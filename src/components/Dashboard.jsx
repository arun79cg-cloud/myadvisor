import React, { useEffect, useState, useCallback } from "react";
import { fetchCoinDCXData, fetchMarketContext } from "../api/coindcx";
import { enrichWithCoinGecko } from "../api/coingecko";
import { runFullPipeline, analyzeWatchlist } from "../engine/buckets";
import StatsBar from "./StatsBar";
import BucketPanel from "./BucketPanel";
import SearchFilter from "./SearchFilter";
import WatchlistInput from "./WatchlistInput";
import ControlPanel from "./ControlPanel";

export default function Dashboard() {
  var [allCoins, setAllCoins] = useState([]);
  var [buckets, setBuckets] = useState({ B: [], A: [], C: [], D: [], R: [], summary: null, allCoins: [] });
  var [loading, setLoading] = useState(true);
  var [loadingStep, setLoadingStep] = useState("");
  var [error, setError] = useState(null);
  var [lastUpdated, setLastUpdated] = useState(null);
  var [search, setSearch] = useState("");
  var [slotFilter, setSlotFilter] = useState("ALL");
  var [signalFilter, setSignalFilter] = useState("ALL");
  var [quoteFilter, setQuoteFilter] = useState("ALL");
  var [watchlist, setWatchlist] = useState([]);
  var [watchlistCoins, setWatchlistCoins] = useState([]);
  var [marketContext, setMarketContext] = useState({ marketMode: "NEUTRAL", btcChange: 0, btcPrice: 0, usdtRate: 86 });
  var [userSettings, setUserSettings] = useState({
    capitalINR: 2500,
    capitalUSDT: 30,
    coinsPerSlot: 3,
    amountPerCoinOverride: null,
  });

  var loadData = useCallback(function() {
    // Only show full loading spinner on very first load
    setLoading(function(prev) { return allCoins.length === 0 ? true : prev; });
    setError(null);
    setLoadingStep("Fetching live prices...");

    Promise.all([fetchCoinDCXData(), fetchMarketContext()])
      .then(function(results) {
        var coindcxData = results[0];
        var ctx = results[1];

        setAllCoins(coindcxData);
        setMarketContext(ctx);
        setLoadingStep("Analyzing signals...");

        var quickResult = runFullPipeline(coindcxData, {}, userSettings, ctx);
        setBuckets(quickResult);
        setLastUpdated(new Date());
        setLoading(false);
        setLoadingStep("");
      })
      .catch(function(err) {
        setError("Error loading data: " + err.message);
        setLoading(false);
        setLoadingStep("");
      });
  }, [userSettings, allCoins.length]);

  useEffect(function() {
    loadData();
    var interval = setInterval(loadData, 30000);
    return function() { clearInterval(interval); };
  }, [loadData]);

  useEffect(function() {
    if (watchlist.length > 0 && buckets.allCoins && buckets.allCoins.length > 0) {
      var analyzed = analyzeWatchlist(buckets.allCoins, watchlist, userSettings, marketContext);
      setWatchlistCoins(analyzed);
    } else {
      setWatchlistCoins([]);
    }
  }, [watchlist, buckets.allCoins, userSettings, marketContext]);

  function filterCoins(coins) {
    return (coins || []).filter(function(coin) {
      var matchSearch = search === "" ||
        (coin.base || "").toLowerCase().indexOf(search.toLowerCase()) !== -1 ||
        (coin.fullName || "").toLowerCase().indexOf(search.toLowerCase()) !== -1;
      var matchSignal = signalFilter === "ALL" || coin.signal === signalFilter;
      var matchQuote = quoteFilter === "ALL" || coin.quote === quoteFilter;
      return matchSearch && matchSignal && matchQuote;
    });
  }

  var filteredB = filterCoins(buckets.B);
  var filteredA = filterCoins(buckets.A);
  var filteredC = filterCoins(buckets.C);
  var filteredD = filterCoins(buckets.D);
  var filteredR = filterCoins(buckets.R);
  var filteredW = filterCoins(watchlistCoins);

  var topGainer = allCoins.slice().sort(function(a, b) { return b.change24h - a.change24h; })[0] || null;
  var topLoser = allCoins.slice().sort(function(a, b) { return a.change24h - b.change24h; })[0] || null;
  var gainers = allCoins.filter(function(c) { return c.change24h > 0; }).length;
  var losers = allCoins.filter(function(c) { return c.change24h < 0; }).length;
  var availableSymbols = allCoins.map(function(c) { return c.base; });

  var hasResults = filteredB.length > 0 || filteredA.length > 0 || filteredC.length > 0 ||
    filteredD.length > 0 || filteredR.length > 0 || filteredW.length > 0;

  function showSlot(type) {
    return slotFilter === "ALL" || slotFilter === type;
  }

  var modeColors = {
    "PANIC": "#ff5252",
    "CAUTION": "#ff9100",
    "NEUTRAL": "#607d8b",
    "ROTATION": "#00e5ff",
    "ALT SEASON": "#00e676",
  };

  var modeColor = modeColors[marketContext.marketMode] || "#607d8b";

  return (
    <div className="wrapper">

      <div className="header">
        <div>
          <div className="title">My Advisor</div>
          <div className="subtitle">Decision-support tool · You trade manually on CoinDCX · All risks are yours</div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Market Mode Badge */}
          <span className="badge" style={{ color: modeColor, borderColor: modeColor + "44", fontWeight: 700 }}>
            {marketContext.marketMode}
          </span>
          {/* BTC Price */}
          {marketContext.btcPrice > 0 && (
            <span className="badge">
              {"BTC " + (marketContext.btcChange >= 0 ? "+" : "") + marketContext.btcChange.toFixed(1) + "%"}
            </span>
          )}
          {/* USDT Rate */}
          <span className="badge">
            {"1 USDT = ₹" + marketContext.usdtRate.toFixed(1)}
          </span>
          {lastUpdated && (
            <span className="badge">{"Updated: " + lastUpdated.toLocaleTimeString("en-IN")}</span>
          )}
          {loadingStep !== "" && (
            <span className="badge" style={{ color: "#ff9100", borderColor: "#ff910044" }}>{loadingStep}</span>
          )}
          <button className="btn" onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "⟳ Refresh Now"}
          </button>
        </div>
      </div>

      {/* PANIC mode warning */}
      {marketContext.marketMode === "PANIC" && (
        <div className="error-box">
          ⚠ PANIC MODE — BTC is down {Math.abs(marketContext.btcChange).toFixed(1)}% in 24h.
          Buy signals are suppressed. Only Dip Buy opportunities are shown.
        </div>
      )}

      {error && <div className="error-box">{"⚠ " + error}</div>}

      <ControlPanel
        onSettingsChange={function(s) { setUserSettings(s); }}
        usdtRate={marketContext.usdtRate}
      />

      {loading ? (
        <div className="loading-box">
          <div className="spinner" />
          <div className="loading-title">Analyzing markets...</div>
          <div className="loading-step">{loadingStep}</div>
        </div>
      ) : (
        <div>
          <StatsBar
            totalCoins={allCoins.length}
            gainers={gainers}
            losers={losers}
            topGainer={topGainer}
            topLoser={topLoser}
            slotSummary={buckets.summary}
            lastUpdated={lastUpdated}
            isLoading={loading}
            marketContext={marketContext}
          />

          <SearchFilter
            search={search}
            onSearchChange={function(v) { setSearch(v); }}
            slotFilter={slotFilter}
            onSlotFilterChange={function(v) { setSlotFilter(v); }}
            signalFilter={signalFilter}
            onSignalFilterChange={function(v) { setSignalFilter(v); }}
            quoteFilter={quoteFilter}
            onQuoteFilterChange={function(v) { setQuoteFilter(v); }}
          />

          <WatchlistInput
            watchlist={watchlist}
            onWatchlistChange={function(w) { setWatchlist(w); }}
            availableSymbols={availableSymbols}
          />

          {!hasResults && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#333", fontSize: "14px" }}>
              No candidates match your filters right now.
            </div>
          )}

          {showSlot("W") && filteredW.length > 0 && (
            <BucketPanel slotType="W" coins={filteredW} defaultExpanded={true} />
          )}

          <div className="divider" />

          {showSlot("B") && (
            <BucketPanel slotType="B" coins={filteredB} defaultExpanded={true} />
          )}

          {showSlot("A") && (
            <BucketPanel slotType="A" coins={filteredA} defaultExpanded={true} />
          )}

          {showSlot("R") && (
            <BucketPanel slotType="R" coins={filteredR} defaultExpanded={true} />
          )}

          {showSlot("D") && (
            <BucketPanel slotType="D" coins={filteredD} defaultExpanded={true} />
          )}

          {showSlot("C") && (
            <BucketPanel slotType="C" coins={filteredC} defaultExpanded={false} />
          )}

          <div className="disclaimer">
            DISCLAIMER: My Advisor is a decision-support tool only. All suggestions are based on technical indicators and historical patterns. This is NOT financial advice. Crypto markets are extremely volatile. You make all trading decisions yourself on CoinDCX. All profits and losses are entirely your responsibility.
          </div>
        </div>
      )}

    </div>
  );
}
