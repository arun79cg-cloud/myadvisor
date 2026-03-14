import React, { useState, useEffect } from "react";
import { getWeeklyProjection } from "../config/strategy";
import { formatINR } from "../utils/format";

function WeeklyChart({ projection, startCapital }) {
  if (!projection || projection.length === 0) return null;

  var allValues = [];
  projection.forEach(function(p) {
    allValues.push(p.optimistic);
    allValues.push(p.conservative);
  });
  allValues.push(startCapital);

  var maxVal = Math.max.apply(null, allValues);
  var minVal = Math.min.apply(null, allValues) * 0.95;
  var range = maxVal - minVal || 1;

  function toHeight(val) {
    return ((val - minVal) / range) * 100;
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "100px", padding: "0 4px" }}>
        {projection.map(function(p, i) {
          var optH = toHeight(p.optimistic);
          var conH = toHeight(p.conservative);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: "2px", position: "relative" }}>
              {p.isToday && (
                <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: "#00e5ff", whiteSpace: "nowrap", fontWeight: "700" }}>
                  TODAY
                </div>
              )}
              <div style={{ width: "100%", height: optH + "%", background: p.isToday ? "#00e676" : "#00e67666", borderRadius: "3px 3px 0 0", minHeight: "4px", transition: "height 0.3s" }} />
              <div style={{ width: "60%", height: conH + "%", background: p.isToday ? "#00b0ff" : "#00b0ff55", borderRadius: "3px 3px 0 0", minHeight: "4px", transition: "height 0.3s" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ControlPanel({ onSettingsChange }) {
  var [totalCapital, setTotalCapital] = useState(5000);
  var [coinsPerSlot, setCoinsPerSlot] = useState(3);
  var [amountPerCoinOverride, setAmountPerCoinOverride] = useState(null);
  var [amountInput, setAmountInput] = useState("");
  var [isAmountOverridden, setIsAmountOverridden] = useState(false);

  var autoAmountPerCoin = Math.floor(totalCapital / 2 / coinsPerSlot);
  var effectiveAmountPerCoin = isAmountOverridden ? amountPerCoinOverride : autoAmountPerCoin;
  var projection = getWeeklyProjection({ totalCapital: totalCapital });

  useEffect(function() {
    if (onSettingsChange) {
      onSettingsChange({
        totalCapital: totalCapital,
        coinsPerSlot: coinsPerSlot,
        amountPerCoinOverride: isAmountOverridden ? amountPerCoinOverride : null,
      });
    }
  }, [totalCapital, coinsPerSlot, amountPerCoinOverride, isAmountOverridden]);

  function handleAmountChange(val) {
    setAmountInput(val);
    var num = parseInt(val);
    if (!val || isNaN(num)) return;
    setAmountPerCoinOverride(num);
    setIsAmountOverridden(true);
  }

  function handleReset() {
    setAmountPerCoinOverride(null);
    setAmountInput("");
    setIsAmountOverridden(false);
  }
  return (
    <div className="control-panel">
      <div className="control-title">Investment Control Panel</div>

      <div className="control-grid">

        {/* Total capital */}
        <div className="control-card">
          <div className="control-label">Total Investment</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#ffeb3b", fontSize: "14px" }}>₹</span>
            <input
              className="control-input"
              type="number"
              value={totalCapital}
              min={500}
              step={500}
              onChange={function(e) { setTotalCapital(parseInt(e.target.value) || 5000); }}
            />
          </div>
          <div className="control-sub">₹{Math.floor(totalCapital / 2).toLocaleString("en-IN")} per slot</div>
        </div>

        {/* Coins per slot */}
        <div className="control-card">
          <div className="control-label">Coins Per Slot</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              className="control-input"
              type="number"
              value={coinsPerSlot}
              min={1}
              max={10}
              step={1}
              onChange={function(e) { setCoinsPerSlot(Math.max(1, parseInt(e.target.value) || 3)); }}
            />
            <span style={{ color: "#666", fontSize: "13px" }}>coins</span>
          </div>
          <div className="control-sub">Per slot (tonight + tomorrow)</div>
        </div>

        {/* Amount per coin */}
        <div className="control-card">
          <div className="control-label">
            Amount Per Coin
            {isAmountOverridden && <span style={{ marginLeft: "6px", color: "#ff9100", fontSize: "10px" }}>(manual)</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#ffeb3b", fontSize: "14px" }}>₹</span>
            <input
              className="control-input"
              style={{ borderColor: isAmountOverridden ? "#ff9100" : "#333" }}
              type="number"
              value={isAmountOverridden ? amountInput : autoAmountPerCoin}
              min={100}
              step={100}
              onChange={function(e) { handleAmountChange(e.target.value); }}
            />
          </div>
          {isAmountOverridden ? (
            <button
              style={{ fontSize: "11px", color: "#00e5ff", background: "none", border: "none", cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}
              onClick={handleReset}
            >
              Reset to auto (₹{autoAmountPerCoin})
            </button>
          ) : (
            <div className="control-sub">Auto: ₹{totalCapital} ÷ 2 ÷ {coinsPerSlot}</div>
          )}
        </div>

        {/* Summary */}
        <div className="control-card">
          <div className="control-label">Per Slot Summary</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#00e5ff", marginTop: "4px" }}>
            {formatINR(effectiveAmountPerCoin * coinsPerSlot)}
          </div>
          <div className="control-sub">{coinsPerSlot} coins × {formatINR(effectiveAmountPerCoin)} each</div>
          <div style={{ fontSize: "11px", color: "#00e676", marginTop: "4px" }}>
            Target: +{formatINR(Math.floor(effectiveAmountPerCoin * coinsPerSlot * 0.13))} net/slot
          </div>
        </div>

      </div>

      {/* Weekly chart */}
      <div className="chart-area">
        <div className="chart-title">
          <span>Weekly Earnings Projection (Sun to Sat)</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#666" }}>
              <span style={{ width: "10px", height: "3px", background: "#00e676", borderRadius: "2px", display: "inline-block" }} />
              Optimistic 80%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#666" }}>
              <span style={{ width: "10px", height: "3px", background: "#00b0ff", borderRadius: "2px", display: "inline-block" }} />
              Conservative 50%
            </span>
          </div>
        </div>

        <WeeklyChart projection={projection.projection} startCapital={totalCapital} />

        <div className="day-labels">
          {projection.projection.map(function(p) {
            return (
              <div key={p.day} className={"day-label" + (p.isToday ? " today" : "")}>
                {p.isToday ? p.day + "*" : p.day}
              </div>
            );
          })}
        </div>

        <div className="proj-row">
          <div className="proj-card">
            <div className="proj-label">Optimistic week end</div>
            <div className="proj-value" style={{ color: "#00e676" }}>{formatINR(projection.optimisticEndCapital)}</div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>+{projection.optimisticWeeklyReturn}% on capital</div>
          </div>
          <div className="proj-card">
            <div className="proj-label">Conservative week end</div>
            <div className="proj-value" style={{ color: "#00b0ff" }}>{formatINR(projection.conservativeEndCapital)}</div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>+{projection.conservativeWeeklyReturn}% on capital</div>
          </div>
          <div className="proj-card">
            <div className="proj-label">Starting capital</div>
            <div className="proj-value" style={{ color: "#ffeb3b" }}>{formatINR(totalCapital)}</div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>Target: +15% gross per trade</div>
          </div>
        </div>

      </div>
    </div>
  );
}
