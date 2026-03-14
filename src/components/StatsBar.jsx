import React from "react";
import { formatChange, formatPrice, getChangeColor } from "../utils/format";

export default function StatsBar({ totalCoins, gainers, losers, topGainer, topLoser, slotSummary, lastUpdated, isLoading }) {
  return (
    <div className="stats-row">

      <div className="stat-card">
        <div className="stat-label">Total Markets</div>
        <div className="stat-value">{totalCoins || "—"}</div>
        <div className="stat-sub">Active pairs on CoinDCX</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Gainers / Losers</div>
        <div style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
          <span className="stat-value" style={{ color: "#00e676" }}>{gainers || "—"}</span>
          <span style={{ color: "#333", fontSize: "16px" }}>/</span>
          <span className="stat-value" style={{ color: "#ff5252" }}>{losers || "—"}</span>
        </div>
        <div className="stat-sub">
          {gainers && losers ? (gainers > losers ? "✓ Green market day" : "⚠ Red market — trade carefully") : "Loading..."}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Top Gainer</div>
        {topGainer ? (
          <div>
            <div className="stat-value" style={{ color: "#00e676" }}>{topGainer.base}</div>
            <div className="stat-sub" style={{ color: "#00e676" }}>
              {formatChange(topGainer.change24h)} · {formatPrice(topGainer.lastPrice)} {topGainer.quote}
            </div>
          </div>
        ) : <div className="stat-value">—</div>}
      </div>

      <div className="stat-card">
        <div className="stat-label">Top Loser</div>
        {topLoser ? (
          <div>
            <div className="stat-value" style={{ color: "#ff5252" }}>{topLoser.base}</div>
            <div className="stat-sub" style={{ color: "#ff5252" }}>
              {formatChange(topLoser.change24h)} · {formatPrice(topLoser.lastPrice)} {topLoser.quote}
            </div>
          </div>
        ) : <div className="stat-value">—</div>}
      </div>

      <div className="stat-card">
        <div className="stat-label">Candidates Found</div>
        {slotSummary ? (
          <div>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#00e67615", color: "#00e676", border: "1px solid #00e67644" }}>
                Tonight: {slotSummary.slotBCount}
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#00b0ff15", color: "#00b0ff", border: "1px solid #00b0ff44" }}>
                Tomorrow: {slotSummary.slotACount}
              </span>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "#ff910015", color: "#ff9100", border: "1px solid #ff910044" }}>
                Moonshots: {slotSummary.slotCCount}
              </span>
            </div>
            <div className="stat-sub">From {slotSummary.totalAnalyzed} coins analyzed</div>
          </div>
        ) : <div className="stat-value">—</div>}
      </div>

      <div className="stat-card" style={{ minWidth: "110px", flex: "0" }}>
        <div className="stat-label">Status</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: isLoading ? "#ff9100" : "#00e676" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isLoading ? "#ff9100" : "#00e676", boxShadow: isLoading ? "0 0 6px #ff9100" : "0 0 6px #00e676", display: "inline-block" }} />
          {isLoading ? "Updating..." : "Live"}
        </div>
        {lastUpdated && <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>{lastUpdated.toLocaleTimeString("en-IN")}</div>}
        <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>Refresh: 30s</div>
      </div>

    </div>
  );
}
