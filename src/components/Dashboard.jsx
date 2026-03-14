import React, { useEffect, useState, useCallback } from "react";
import { fetchCoinDCXData } from "../api/coindcx";
import { enrichWithCoinGecko } from "../api/coingecko";
import { runFullPipeline, analyzeWatchlist } from "../engine/buckets";
import StatsBar from "./StatsBar";
import BucketPanel from "./BucketPanel";
import SearchFilter from "./SearchFilter";
import WatchlistInput from "./WatchlistInput";
import ControlPanel from "./ControlPanel";

export default function Dashboard() {
  var [allCoins, setAllCoins] = useState([]);
  var [buckets, setBuckets] = useState({ B: [], A: [], C: [], summary: null, allCoins: [] });
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
  var [userSettings, setUserSettings] = useState({ totalCapital: 5000, coinsPerSlot: 3, amountPerCoinOverride: null });

  var loadData = useCallback(function() {
    setLoading(true);
    setError(null);
    setLoadingStep("Fetching live prices from CoinDCX...");

    fetchCoinDCXData()
      .then(function(coindcxData) {
        setAllCoins(coindcxData);
        setLoadingStep("Running initial analysis...");
        var quickResult = runFullPipeline(coindcxData, {}, userSettings);
        setBuckets(quickResult);
        setLastUpdated(new Date());
        setLoading(false);

        var symbols = [];
        var seen = {};
        for (var i = 0; i < coindcxData.length && symbols.length < 60; i++) {
          var base = coindcxData[i].base;
          if (!seen[base]) {
            seen[base] = true;
            symbols.push(base);
          }
        }

        setLoadingStep("Enriching with CoinGecko data...");
        return enrichWithCoinGecko(symbols).then(function(geckoData) {
          var enrichedResult = runFullPipeline(coindcxData, geckoData, userSettings);
          setBuckets(enrichedResult);
          setLastUpdated(new Date());
          setLoadingStep("");
        });
      })
      .catch(function(err) {
        setError("Error loading data: " + err.message);
        setLoading(false);
        setLoadingStep("");
      });
  }, [userSettings]);

  useEffect(function() {
    loadData();
    var interval = setInterval(loadData, 30000);
    return function() { clearInterval(interval); };
  }, [loadData]);

  useEffect(function() {
    if (watchlist.length > 0 && buckets.allCoins && buckets.allCoins.length > 0) {
      var analyzed = analyzeWatchlist(buckets.allCoins, watchlist, userSettings);
      setWatchlistCoins(analyzed);
    } else {
      setWatchlistCoins([]);
    }
  }, [watchlist, buckets.allCoins, userSettings]);

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
  var filteredW = filterCoins(watchlistCoins);
  var topGainer = allCoins.slice().sort(function(a, b) { return b.change24h - a.change24h; })[0] || null;
  var topLoser = allCoins.slice().sort(function(a, b) { return a.change24h - b.change24h; })[0] || null;
  var gainers = allCoins.filter(function(c) { return c.change24h > 0; }).length;
  var losers = allCoins.filter(function(c) { return c.change24h < 0; }).length;
  var availableSymbols = allCoins.map(function(c) { return c.base; });
  var hasResults = filteredB.length > 0 || filteredA.length > 0 || filteredC.length > 0 || filteredW.length > 0;

  function showSlot(type) {
    return slotFilter === "ALL" || slotFilter === type;
  }
  return (
    <div className="wrapper">

      <div className="header">
        <div>
          <div className="title">My Advisor</div>
          <div className="subtitle">Decision-support tool · You trade manually on CoinDCX · All risks are yours</div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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

      {error && <div className="error-box">{"⚠ " + error}</div>}

      <ControlPanel onSettingsChange={function(s) { setUserSettings(s); }} />

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
