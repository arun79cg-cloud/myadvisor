import React from "react";

function ModeBar({ marketContext }) {
  var ctx = marketContext || { marketMode: "NEUTRAL", btcChange: 0, btcPrice: 0, usdtRate: 86 };

  var modeConfig = {
    "PANIC": {
      color: "#ff5252",
      bg: "#ff525211",
      icon: "🚨",
      desc: "BTC down hard. Avoid new buys. Watch for dip opportunities only.",
    },
    "CAUTION": {
      color: "#ff9100",
      bg: "#ff910011",
      icon: "⚠",
      desc: "BTC weak. Trade carefully. Reduce position sizes.",
    },
    "NEUTRAL": {
      color: "#607d8b",
      bg: "#607d8b11",
      icon: "➔",
      desc: "Market stable. Normal signals apply.",
    },
    "ROTATION": {
      color: "#00e5ff",
      bg: "#00e5ff11",
      icon: "🔄",
      desc: "BTC falling, money rotating into alts. Good time for alt picks.",
    },
    "ALT SEASON": {
      color: "#00e676",
      bg: "#00e67611",
      icon: "🚀",
      desc: "Alt season active. Strong buy signals across alts.",
    },
  };

  var config = modeConfig[ctx.marketMode] || modeConfig["NEUTRAL"];

  return (
    <div style={{
      background: config.bg,
      border: "1px solid " + config.color + "33",
      borderRadius: "10px",
      padding: "12px 16px",
      marginBottom: "14px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.2rem" }}>{config.icon}</span>
        <span style={{ color: config.color, fontWeight: 700, fontSize: "0.95rem" }}>
          {ctx.marketMode}
        </span>
      </div>
      <div style={{ color: "#9e9e9e", fontSize: "0.78rem", flex: 1 }}>
        {config.desc}
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {ctx.btcPrice > 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", color: "#607d8b" }}>BTC</div>
            <div style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: ctx.btcChange >= 0 ? "#00e676" : "#ff5252",
            }}>
              {(ctx.btcChange >= 0 ? "+" : "") + ctx.btcChange.toFixed(1) + "%"}
            </div>
          </div>
        )}
        {ctx.ethChange !== undefined && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", color: "#607d8b" }}>ETH</div>
            <div style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: ctx.ethChange >= 0 ? "#00e676" : "#ff5252",
            }}>
              {(ctx.ethChange >= 0 ? "+" : "") + ctx.ethChange.toFixed(1) + "%"}
            </div>
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.68rem", color: "#607d8b" }}>USDT</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e0e6f0" }}>
            {"₹" + ctx.usdtRate.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsBar({
  totalCoins, gainers, losers, topGainer, topLoser,
  slotSummary, lastUpdated, isLoading, marketContext,
}) {
  return (
    <div style={{ marginBottom: "8px" }}>

      <ModeBar marketContext={marketContext} />

      <div className="stats-bar">

        <div className="stat-card">
          <div className="stat-label">Total Markets</div>
          <div className="stat-value">{isLoading ? "—" : totalCoins}</div>
          <div className="stat-sub">Active on CoinDCX</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Gainers / Losers</div>
          <div className="stat-value" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ color: "#00e676" }}>{isLoading ? "—" : gainers}</span>
            <span style={{ color: "#607d8b", fontSize: "0.9rem" }}>/</span>
            <span style={{ color: "#ff5252" }}>{isLoading ? "—" : losers}</span>
          </div>
          <div className="stat-sub">loading</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Gainer</div>
          {isLoading || !topGainer ? (
            <div className="stat-value">—</div>
          ) : (
            <>
              <div className="stat-value" style={{ color: "#00e676", fontSize: "1rem" }}>
                {topGainer.base}
              </div>
              <div className="stat-sub" style={{ color: "#00e676" }}>
                {"+" + topGainer.change24h.toFixed(1) + "%"}
              </div>
            </>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Loser</div>
          {isLoading || !topLoser ? (
            <div className="stat-value">—</div>
          ) : (
            <>
              <div className="stat-value" style={{ color: "#ff5252", fontSize: "1rem" }}>
                {topLoser.base}
              </div>
              <div className="stat-sub" style={{ color: "#ff5252" }}>
                {topLoser.change24h.toFixed(1) + "%"}
              </div>
            </>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Candidates Found</div>
          {isLoading || !slotSummary ? (
            <div className="stat-value">—</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                <span className="mini-badge" style={{ background: "#00e67622", color: "#00e676" }}>
                  {"Tonight: " + slotSummary.slotBCount}
                </span>
                <span className="mini-badge" style={{ background: "#00b0ff22", color: "#00b0ff" }}>
                  {"Tomorrow: " + slotSummary.slotACount}
                </span>
                <span className="mini-badge" style={{ background: "#e040fb22", color: "#e040fb" }}>
                  {"Runners: " + slotSummary.slotRCount}
                </span>
                <span className="mini-badge" style={{ background: "#ff910022", color: "#ff9100" }}>
                  {"Dips: " + slotSummary.slotDCount}
                </span>
                <span className="mini-badge" style={{ background: "#ff525222", color: "#ff5252" }}>
                  {"Moonshots: " + slotSummary.slotCCount}
                </span>
              </div>
              <div className="stat-sub" style={{ marginTop: "4px" }}>
                {totalCoins + " coins analyzed"}
              </div>
            </>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: isLoading ? "#ff9100" : "#00e676",
              display: "inline-block",
              boxShadow: isLoading ? "0 0 6px #ff9100" : "0 0 6px #00e676",
            }} />
            <span style={{ color: isLoading ? "#ff9100" : "#00e676", fontWeight: 700, fontSize: "0.85rem" }}>
              {isLoading ? "Refreshing" : "Live"}
            </span>
          </div>
          {lastUpdated && (
            <div className="stat-sub">
              {lastUpdated.toLocaleTimeString("en-IN")}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
