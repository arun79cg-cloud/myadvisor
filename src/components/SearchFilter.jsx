import React from "react";

export default function SearchFilter({ search, onSearchChange, slotFilter, onSlotFilterChange, signalFilter, onSignalFilterChange, quoteFilter, onQuoteFilterChange }) {

  function btn(label, value, current, activeClass, handler) {
    return (
      <button
        key={value}
        className={"filter-btn" + (current === value ? " " + activeClass : "")}
        onClick={function() { handler(value); }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{ marginBottom: "20px" }}>

      <div style={{ marginBottom: "12px" }}>
        <input
          style={{ width: "100%", background: "#1a1a2e", border: "1px solid #333", borderRadius: "8px", padding: "10px 16px", color: "#e0e0e0", fontSize: "14px", outline: "none" }}
          type="text"
          placeholder="Search coin name or symbol..."
          value={search}
          onChange={function(e) { onSearchChange(e.target.value); }}
        />
      </div>

      <div className="filters">
        <span className="filter-label">Market:</span>
        {btn("All", "ALL", quoteFilter, "active-cyan", onQuoteFilterChange)}
        {btn("INR", "INR", quoteFilter, "active-cyan", onQuoteFilterChange)}
        {btn("USDT", "USDT", quoteFilter, "active-cyan", onQuoteFilterChange)}

        <span style={{ width: "1px", height: "28px", background: "#2a2a3e", margin: "0 4px" }} />

        <span className="filter-label">Slot:</span>
        {btn("All Slots", "ALL", slotFilter, "active-cyan", onSlotFilterChange)}
        {btn("Tonight", "B", slotFilter, "active-green", onSlotFilterChange)}
        {btn("Tomorrow", "A", slotFilter, "active-blue", onSlotFilterChange)}
        {btn("Moonshots", "C", slotFilter, "active-orange", onSlotFilterChange)}
        {btn("Watchlist", "W", slotFilter, "active-purple", onSlotFilterChange)}

        <span style={{ width: "1px", height: "28px", background: "#2a2a3e", margin: "0 4px" }} />

        <span className="filter-label">Signal:</span>
        {btn("All", "ALL", signalFilter, "active-cyan", onSignalFilterChange)}
        {btn("Strong Buy", "STRONG BUY", signalFilter, "active-cyan", onSignalFilterChange)}
        {btn("Buy", "BUY", signalFilter, "active-cyan", onSignalFilterChange)}
        {btn("Watch", "WATCH", signalFilter, "active-cyan", onSignalFilterChange)}
      </div>

    </div>
  );
}
