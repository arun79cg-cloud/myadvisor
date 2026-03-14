import React, { useState } from "react";

var slotMeta = {
  B: { label: "Tonight's Picks", sublabel: "Buy tonight — Sell tomorrow", color: "#00e676", icon: "🔥" },
  A: { label: "Tomorrow's Picks", sublabel: "Buy tomorrow night — Sell day after", color: "#00b0ff", icon: "🌅" },
  R: { label: "Multi-day Runners", sublabel: "Sustained momentum — still has legs", color: "#e040fb", icon: "🚀" },
  D: { label: "Dip Buys", sublabel: "Pullback on low volume — bounce in 1-2 days", color: "#ff9100", icon: "📉" },
  C: { label: "Moonshots", sublabel: "High risk · High reward", color: "#ff5252", icon: "⚡" },
  W: { label: "My Watchlist", sublabel: "Your tracked coins — best signal shown", color: "#7c4dff", icon: "👁" },
};

function SignalBadge({ signal }) {
  var colors = {
    "STRONG BUY": { bg: "#00e67622", color: "#00e676" },
    "BUY": { bg: "#69f0ae22", color: "#69f0ae" },
    "WATCH": { bg: "#ffeb3b22", color: "#ffeb3b" },
    "WEAK": { bg: "#ff910022", color: "#ff9100" },
    "AVOID": { bg: "#ff525222", color: "#ff5252" },
  };
  var c = colors[signal] || { bg: "#60606022", color: "#9e9e9e" };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: "4px", padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700 }}>
      {signal}
    </span>
  );
}

function PairBadge({ quote }) {
  return (
    <span style={{
      background: quote === "USDT" ? "#ff980022" : "#2196f322",
      color: quote === "USDT" ? "#ff9800" : "#2196f3",
      borderRadius: "4px", padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, marginLeft: "4px",
    }}>
      {quote}
    </span>
  );
}

function BothPairsBadge() {
  return (
    <span style={{ background: "#00e5ff22", color: "#00e5ff", borderRadius: "4px", padding: "2px 6px", fontSize: "0.62rem", fontWeight: 700, marginLeft: "4px" }}>
      INR+USDT
    </span>
  );
}

function CoinRow({ coin, index }) {
  var [expanded, setExpanded] = useState(false);
  var changeColor = coin.change24h >= 0 ? "#00e676" : "#ff5252";
  var volDisplay = coin.quote === "INR"
    ? "₹" + (coin.volumeINR >= 1000000 ? (coin.volumeINR / 1000000).toFixed(1) + "M" : (coin.volumeINR / 1000).toFixed(0) + "K")
    : (coin.volume24h >= 1000000 ? (coin.volume24h / 1000000).toFixed(1) + "M" : (coin.volume24h / 1000).toFixed(0) + "K") + " " + coin.quote;

  return (
    <>
      <tr onClick={function() { setExpanded(function(p) { return !p; }); }} style={{ cursor: "pointer" }}>
        <td style={{ color: "#607d8b", width: "32px", padding: "10px 12px" }}>{index + 1}</td>
        <td style={{ padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
            {coin.base}
            <PairBadge quote={coin.quote} />
            {coin.hasBothPairs && <BothPairsBadge />}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#607d8b", marginTop: "2px" }}>
            {coin.fullName !== coin.base ? coin.fullName : ""}
          </div>
        </td>
        <td style={{ fontSize: "0.85rem", padding: "10px 12px" }}>
          {coin.quote === "INR"
            ? "₹" + coin.lastPrice.toLocaleString("en-IN", { maximumFractionDigits: 4 })
            : coin.lastPrice.toFixed(4) + " USDT"}
        </td>
        <td style={{ color: changeColor, fontWeight: 700, fontSize: "0.85rem", padding: "10px 12px" }}>
          {(coin.change24h >= 0 ? "+" : "") + coin.change24h.toFixed(2) + "%"}
        </td>
        <td style={{ fontSize: "0.78rem", color: "#9e9e9e", padding: "10px 12px" }}>{volDisplay}</td>
        <td style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "36px", height: "6px", background: "#1e2a3a", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{
                width: Math.min(100, coin.score) + "%", height: "100%",
                background: coin.score >= 75 ? "#00e676" : coin.score >= 55 ? "#ffeb3b" : "#ff9100",
                borderRadius: "3px",
              }} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "#e0e6f0" }}>{coin.score}</span>
          </div>
        </td>
        <td style={{ padding: "10px 12px" }}><SignalBadge signal={coin.signal} /></td>
        <td style={{ fontSize: "0.78rem", color: "#00e676", padding: "10px 12px" }}>
          {coin.quote === "INR"
            ? "₹" + coin.targetPrice.toLocaleString("en-IN", { maximumFractionDigits: 4 })
            : coin.targetPrice.toFixed(4)}
        </td>
        <td style={{ fontSize: "0.78rem", color: "#ff5252", padding: "10px 12px" }}>
          {coin.quote === "INR"
            ? "₹" + coin.stopPrice.toLocaleString("en-IN", { maximumFractionDigits: 4 })
            : coin.stopPrice.toFixed(4)}
        </td>
        <td style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00e5ff", padding: "10px 12px" }}>
          {coin.amountCurrency === "USDT"
            ? coin.suggestedAmount + " USDT"
            : "₹" + coin.suggestedAmount.toLocaleString("en-IN")}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={10} style={{ background: "#ffffff05", padding: "12px 16px", borderBottom: "1px solid #1e2a3a33" }}>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#607d8b", marginBottom: "6px", textTransform: "uppercase" }}>Trade Details</div>
                <div style={{ fontSize: "0.78rem", color: "#e0e6f0", lineHeight: "1.8" }}>
                  <div>Entry: <strong>{coin.quote === "INR" ? "₹" : ""}{coin.entryPrice?.toFixed(4)} {coin.quote !== "INR" ? coin.quote : ""}</strong></div>
                  <div>Target: <strong style={{ color: "#00e676" }}>+{coin.grossTargetPercent?.toFixed(1)}% gross</strong></div>
                  <div>Stop: <strong style={{ color: "#ff5252" }}>-{coin.stopPercent?.toFixed(1)}%</strong></div>
                  <div>Hold: <strong>{coin.holdTime}</strong></div>
                  <div>Spread: <strong>{coin.spread?.toFixed(2)}%</strong></div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontSize: "0.7rem", color: "#607d8b", marginBottom: "6px", textTransform: "uppercase" }}>Why this coin</div>
                {(coin.reasons || []).map(function(r, i) {
                  return (
                    <div key={i} style={{ fontSize: "0.75rem", color: "#e0e6f0", padding: "2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#00e676" }}>✓</span> {r}
                    </div>
                  );
                })}
              </div>
              {coin.warnings && coin.warnings.length > 0 && (
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontSize: "0.7rem", color: "#ff9100", marginBottom: "6px", textTransform: "uppercase" }}>Warnings</div>
                  {coin.warnings.map(function(w, i) {
                    return (
                      <div key={i} style={{ fontSize: "0.75rem", color: "#ff9100", padding: "2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⚠</span> {w}
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ minWidth: "140px" }}>
                <div style={{ fontSize: "0.7rem", color: "#607d8b", marginBottom: "6px", textTransform: "uppercase" }}>24h Range Position</div>
                <div style={{ background: "#1e2a3a", borderRadius: "4px", height: "8px", position: "relative", marginBottom: "4px" }}>
                  <div style={{
                    position: "absolute",
                    left: Math.min(95, coin.rangePosition * 100) + "%",
                    top: "-3px", width: "2px", height: "14px",
                    background: "#00e5ff", borderRadius: "1px",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#607d8b" }}>
                  <span>Low</span>
                  <span style={{ color: "#00e5ff" }}>{(coin.rangePosition * 100).toFixed(0) + "%"}</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
export default function BucketPanel({ slotType, coins, defaultExpanded }) {
  var [expanded, setExpanded] = useState(defaultExpanded !== false);
  var meta = slotMeta[slotType] || slotMeta["B"];

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", cursor: "pointer",
          background: "#0d1220",
          borderRadius: expanded ? "12px 12px 0 0" : "12px",
          border: "1px solid " + meta.color + "33",
          borderBottom: expanded ? "none" : "1px solid " + meta.color + "33",
        }}
        onClick={function() { setExpanded(function(p) { return !p; }); }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: meta.color + "22", color: meta.color, borderRadius: "6px", padding: "4px 10px", fontSize: "0.78rem", fontWeight: 700 }}>
            {meta.icon + " " + meta.label}
          </span>
          <span style={{ color: "#607d8b", fontSize: "0.78rem" }}>{meta.sublabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: "#1e2a3a", borderRadius: "20px", padding: "2px 12px", fontSize: "0.72rem", color: "#9e9e9e" }}>
            {coins.length + " candidates"}
          </span>
          <span style={{ color: "#607d8b", fontSize: "0.8rem" }}>{expanded ? "Hide ▲" : "Show ▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ border: "1px solid " + meta.color + "33", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
          <div style={{ padding: "8px 16px", background: "#ffffff05", fontSize: "0.72rem", color: "#607d8b", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <span>Timeframe: <strong style={{ color: "#e0e6f0" }}>{meta.sublabel}</strong></span>
            <span>Target: <strong style={{ color: "#00e676" }}>+15% gross</strong></span>
            <span>Stop: <strong style={{ color: "#ff5252" }}>-8%</strong></span>
          </div>

          {coins.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#607d8b", fontSize: "0.82rem" }}>
              No candidates found for this slot right now.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111827" }}>
                    {["#", "Coin", "Price", "24H %", "Volume", "Score", "Signal", "Target", "Stop", "Invest"].map(function(h) {
                      return (
                        <th key={h} style={{
                          padding: "8px 12px", textAlign: "left",
                          fontSize: "0.7rem", color: "#607d8b",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {coins.map(function(coin, i) {
                    return <CoinRow key={coin.market} coin={coin} index={i} />;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
