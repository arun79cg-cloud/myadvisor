import React, { useState } from "react";
import CoinRow from "./CoinRow";
import { getSlotStyle } from "../utils/format";

var SLOT_INFO = {
  B: { timeframe: "Buy tonight — Sell tomorrow", target: "+15% gross", stop: "-8%", strategy: "Strong momentum + volume surge" },
  A: { timeframe: "Buy tomorrow night — Sell day after", target: "+15% gross", stop: "-8%", strategy: "Steady build + trend confirmation" },
  C: { timeframe: "Hold days to weeks", target: "+25% gross", stop: "-12%", strategy: "High volatility + repeat spike patterns" },
  W: { timeframe: "Your manual picks", target: "Varies", stop: "Varies", strategy: "Coins you want to track personally" },
};

var COLUMNS = [
  { key: "index", label: "#", align: "left" },
  { key: "base", label: "Coin", align: "left" },
  { key: "slot", label: "Slot", align: "left" },
  { key: "lastPrice", label: "Price", align: "right" },
  { key: "change24h", label: "24h %", align: "right" },
  { key: "score", label: "Score", align: "right" },
  { key: "signal", label: "Signal", align: "center" },
  { key: "grossTargetPercent", label: "Target", align: "right" },
  { key: "stopPercent", label: "Stop", align: "right" },
  { key: "suggestedAmountINR", label: "Invest", align: "right" },
  { key: "expand", label: "", align: "center" },
];

export default function BucketPanel({ slotType, coins, defaultExpanded }) {
  var [collapsed, setCollapsed] = useState(!defaultExpanded);
  var [sortKey, setSortKey] = useState("score");
  var [sortDir, setSortDir] = useState("desc");

  var slotStyle = getSlotStyle(slotType);
  var info = SLOT_INFO[slotType] || SLOT_INFO.B;
  var coinList = coins || [];

  var sorted = coinList.slice().sort(function(a, b) {
    if (sortKey === "index" || sortKey === "expand") return 0;
    var aVal = a[sortKey];
    var bVal = b[sortKey];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  function handleSort(key) {
    if (key === "index" || key === "expand") return;
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="slot-panel">

      <div className="slot-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="slot-badge" style={{ background: slotStyle.bg, color: slotStyle.color, border: "1px solid " + slotStyle.border }}>
            {slotStyle.label}
          </span>
          <div>
            <div className="slot-title">{slotStyle.sublabel}</div>
            <div className="slot-sub">{info.strategy}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#555", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: "20px", padding: "3px 12px" }}>
            {coinList.length + " candidates"}
          </span>
          <button className="toggle-btn" onClick={function() { setCollapsed(!collapsed); }}>
            {collapsed ? "Show ▼" : "Hide ▲"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="info-bar">
            <span>Timeframe: <strong style={{ color: "#aaa" }}>{info.timeframe}</strong></span>
            <span>Target: <strong style={{ color: "#00e676" }}>{info.target}</strong></span>
            <span>Stop: <strong style={{ color: "#ff5252" }}>{info.stop}</strong></span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {COLUMNS.map(function(col) {
                    return (
                      <th
                        key={col.key}
                        className={col.align === "right" ? "right" : col.align === "center" ? "center" : ""}
                        onClick={function() { handleSort(col.key); }}
                      >
                        {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: "center", padding: "40px", color: "#333", fontSize: "14px" }}>
                      No candidates found for this slot right now.
                    </td>
                  </tr>
                ) : (
                  sorted.map(function(coin, i) {
                    return <CoinRow key={coin.market + "-" + i} coin={coin} index={i} />;
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
