import React, { useState } from "react";
import { formatPrice, formatChange, formatINR, getChangeColor, getSlotStyle, getSignalColor, getScoreColor } from "../utils/format";

export default function CoinRow({ coin, index }) {
  var [expanded, setExpanded] = useState(false);
  var [hovered, setHovered] = useState(false);

  var slotStyle = getSlotStyle(coin.slot);
  var signalColor = getSignalColor(coin.signal);
  var scoreColor = getScoreColor(coin.score);
  var rangePercent = Math.round((coin.rangePosition || 0) * 100);

  return (
    <React.Fragment>
      <tr
        className="coin-row"
        style={{ background: hovered ? "#1a1a2e" : "transparent" }}
        onClick={function() { setExpanded(!expanded); }}
        onMouseEnter={function() { setHovered(true); }}
        onMouseLeave={function() { setHovered(false); }}
      >
        <td style={{ color: "#333", width: "36px" }}>{index + 1}</td>

        <td>
          <div className="coin-cell">
            {coin.geckoImage ? (
              <img src={coin.geckoImage} alt={coin.base} className="coin-img" onError={function(e) { e.target.style.display = "none"; }} />
            ) : (
              <div className="coin-placeholder">{(coin.base || "").substring(0, 2)}</div>
            )}
            <div>
              <div className="coin-name">{coin.base}</div>
              <div className="coin-sub">{coin.fullName || coin.base} · {coin.quote}{coin.marketCapRank ? " · #" + coin.marketCapRank : ""}</div>
            </div>
          </div>
        </td>

        <td>
          <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: slotStyle.bg, color: slotStyle.color, border: "1px solid " + slotStyle.border }}>
            {slotStyle.label}
          </span>
          <div className="coin-sub">{slotStyle.sublabel}</div>
        </td>

        <td className="right">
          <div style={{ color: "#fff", fontWeight: "600" }}>{formatPrice(coin.lastPrice)}</div>
          <div className="coin-sub">{coin.quote}</div>
        </td>

        <td className="right">
          <div style={{ color: getChangeColor(coin.change24h), fontWeight: "600" }}>{formatChange(coin.change24h)}</div>
          {coin.change1h != null && (
            <div className="coin-sub" style={{ color: getChangeColor(coin.change1h) }}>{"1h: " + formatChange(coin.change1h)}</div>
          )}
        </td>

        <td className="right" style={{ minWidth: "75px" }}>
          <div style={{ fontSize: "15px", fontWeight: "700", color: scoreColor }}>{coin.score}</div>
          <div className="score-bar-wrap">
            <div style={{ width: coin.score + "%", height: "100%", background: scoreColor, borderRadius: "2px" }} />
          </div>
        </td>

        <td className="center">
          <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", background: signalColor + "15", color: signalColor, border: "1px solid " + signalColor + "44" }}>
            {coin.signal}
          </span>
        </td>

        <td className="right">
          <div style={{ color: "#00e676", fontWeight: "600" }}>{"+" + coin.grossTargetPercent + "%"}</div>
          <div className="coin-sub">{formatPrice(coin.targetPrice)}</div>
        </td>

        <td className="right">
          <div style={{ color: "#ff5252", fontWeight: "600" }}>{"-" + coin.stopPercent + "%"}</div>
          <div className="coin-sub">{formatPrice(coin.stopPrice)}</div>
        </td>

        <td className="right">
          <div style={{ color: "#ffeb3b", fontWeight: "600" }}>{formatINR(coin.suggestedAmountINR)}</div>
          <div className="coin-sub">suggested</div>
        </td>

        <td className="center" style={{ color: "#333" }}>{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="expanded-row">
          <td colSpan={11} style={{ padding: "16px 20px" }}>

            <div className="expanded-grid">

              <div className="info-card">
                <div className="info-label">24h Range Position</div>
                <div className="info-value">{rangePercent + "%"}</div>
                <div className="range-bar">
                  <div style={{ width: rangePercent + "%", height: "100%", background: rangePercent < 35 ? "#00e676" : rangePercent > 75 ? "#ff5252" : "#ffeb3b", borderRadius: "3px" }} />
                </div>
                <div className="info-sub">{rangePercent < 35 ? "Near 24h low - good entry" : rangePercent > 75 ? "Near 24h high - risky" : "Mid range"}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Volume vs 7d Avg</div>
                <div className="info-value" style={{ color: coin.volumeRatio > 1.5 ? "#00e676" : coin.volumeRatio < 0.8 ? "#ff5252" : "#ffeb3b" }}>
                  {coin.volumeRatio != null ? coin.volumeRatio + "x" : "—"}
                </div>
                <div className="info-sub">{coin.volumeRatio > 1.5 ? "Strong volume" : coin.volumeRatio < 0.8 ? "Weak volume - caution" : "Average volume"}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Volatility</div>
                <div className="info-value">{coin.volatilityPercent != null ? coin.volatilityPercent + "%" : "—"}</div>
                <div className="info-sub">{coin.volatilityPercent > 8 ? "Very high - big moves possible" : coin.volatilityPercent > 3 ? "Good for targets" : "Low volatility"}</div>
              </div>

              <div className="info-card">
                <div className="info-label">7 Day Change</div>
                <div className="info-value" style={{ color: coin.change7d > 0 ? "#00e676" : coin.change7d < 0 ? "#ff5252" : "#888" }}>
                  {coin.change7d != null ? formatChange(coin.change7d) : "—"}
                </div>
                <div className="info-sub">Weekly trend</div>
              </div>

              <div className="info-card">
                <div className="info-label">From All Time High</div>
                <div className="info-value" style={{ color: coin.athChangePercent < -70 ? "#00e676" : coin.athChangePercent > -20 ? "#ff5252" : "#ffeb3b" }}>
                  {coin.athChangePercent != null ? coin.athChangePercent.toFixed(1) + "%" : "—"}
                </div>
                <div className="info-sub">{coin.athChangePercent < -70 ? "Far from ATH - high upside" : coin.athChangePercent > -20 ? "Near ATH - limited upside" : "Moderate ATH distance"}</div>
              </div>

              <div className="info-card">
                <div className="info-label">Repeat Spike Pattern</div>
                {coin.spikePattern && coin.spikePattern.hasPattern ? (
                  <div>
                    <div className="info-value" style={{ color: "#ff9100" }}>{"Every ~" + coin.spikePattern.avgDaysBetweenSpikes + "d"}</div>
                    <div className="info-sub">{coin.spikePattern.isDue ? "Due for spike now!" : "Next in ~" + coin.spikePattern.nextSpikeExpectedInDays + "d"}</div>
                  </div>
                ) : (
                  <div>
                    <div className="info-value">—</div>
                    <div className="info-sub">No repeat pattern found</div>
                  </div>
                )}
              </div>

              <div className="info-card">
                <div className="info-label">Weekly Spike Day</div>
                {coin.weeklyPattern && coin.weeklyPattern.hasWeeklyPattern ? (
                  <div>
                    <div className="info-value" style={{ color: "#7c4dff" }}>{coin.weeklyPattern.bestSpikeDay}</div>
                    <div className="info-sub">{coin.weeklyPattern.isToday ? "That is TODAY!" : coin.weeklyPattern.isTomorrow ? "That is tomorrow" : coin.weeklyPattern.spikeCount + " spikes recorded"}</div>
                  </div>
                ) : (
                  <div>
                    <div className="info-value">—</div>
                    <div className="info-sub">No weekly pattern</div>
                  </div>
                )}
              </div>

              <div className="info-card">
                <div className="info-label">Recommended Hold</div>
                <div className="info-value" style={{ color: "#00e5ff", fontSize: "14px" }}>{coin.holdTime || "Max 24 hours"}</div>
                <div className="info-sub">Exit at target or stop</div>
              </div>

            </div>

            {coin.activeSignals && coin.activeSignals.length > 0 && (
              <div>
                <div className="section-title">Active Signals</div>
                <div className="tag-row">
                  {coin.activeSignals.map(function(s, i) { return <span key={i} className="signal-tag">{s}</span>; })}
                </div>
              </div>
            )}

            {coin.warnings && coin.warnings.length > 0 && (
              <div>
                <div className="section-title" style={{ color: "#ff5252", marginTop: "12px" }}>Warnings</div>
                <div className="tag-row">
                  {coin.warnings.map(function(w, i) { return <span key={i} className="warning-tag">{w}</span>; })}
                </div>
              </div>
            )}

            <div className="trade-box">
              <div className="trade-title">
                {"Trade Suggestion — " + (coin.slot === "B" ? "Buy Tonight, Sell Tomorrow" : coin.slot === "A" ? "Buy Tomorrow Night, Sell Day After" : "Moonshot — Hold Days to Weeks")}
              </div>
              <div className="trade-grid">

                <div className="trade-item">
                  <div className="trade-label">Entry Price</div>
                  <div className="trade-value" style={{ color: "#fff" }}>{formatPrice(coin.entryPrice)}</div>
                  <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>{coin.quote}</div>
                </div>

                <div className="trade-item">
                  <div className="trade-label">Set Limit Sell At</div>
                  <div className="trade-value" style={{ color: "#00e676" }}>{formatPrice(coin.targetPrice)}</div>
                  <div style={{ fontSize: "11px", color: "#00e676", marginTop: "3px" }}>{"+" + coin.grossTargetPercent + "% gross"}</div>
                </div>

                <div className="trade-item">
                  <div className="trade-label">Exit If Falls To</div>
                  <div className="trade-value" style={{ color: "#ff5252" }}>{formatPrice(coin.stopPrice)}</div>
                  <div style={{ fontSize: "11px", color: "#ff5252", marginTop: "3px" }}>{"-" + coin.stopPercent + "% stop loss"}</div>
                </div>

                <div className="trade-item">
                  <div className="trade-label">Net After All Costs</div>
                  <div className="trade-value" style={{ color: "#ffeb3b" }}>{"+" + coin.netTargetPercent + "%"}</div>
                  <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>{"fees+GST+TDS=" + coin.roundTripCostPercent + "%"}</div>
                </div>

                <div className="trade-item">
                  <div className="trade-label">Invest This Much</div>
                  <div className="trade-value" style={{ color: "#ffeb3b" }}>{formatINR(coin.suggestedAmountINR)}</div>
                  <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>from your capital</div>
                </div>

                <div className="trade-item">
                  <div className="trade-label">Why This Coin</div>
                  <div style={{ marginTop: "4px" }}>
                    {coin.reasons && coin.reasons.slice(0, 3).map(function(r, i) {
                      return <div key={i} style={{ fontSize: "10px", color: "#00e676", marginTop: "2px" }}>{"✓ " + r}</div>;
                    })}
                  </div>
                </div>

              </div>
            </div>

          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
