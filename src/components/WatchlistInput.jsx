import React, { useState, useEffect } from "react";

var STORAGE_KEY = "myadvisor_watchlist";

export default function WatchlistInput({ watchlist, onWatchlistChange, availableSymbols }) {
  var [inputValue, setInputValue] = useState("");

  useEffect(function() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onWatchlistChange(parsed);
        }
      }
    } catch (err) {
      console.warn("Could not load watchlist");
    }
  }, []);

  useEffect(function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch (err) {
      console.warn("Could not save watchlist");
    }
  }, [watchlist]);

  function handleAdd() {
    if (!inputValue.trim()) return;
    var newSymbols = inputValue
      .split(",")
      .map(function(s) { return s.trim().toUpperCase(); })
      .filter(function(s) { return s.length > 0 && watchlist.indexOf(s) === -1; });
    if (newSymbols.length > 0) {
      onWatchlistChange(watchlist.concat(newSymbols));
    }
    setInputValue("");
  }

  function handleRemove(symbol) {
    onWatchlistChange(watchlist.filter(function(s) { return s !== symbol; }));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAdd();
  }

  function isAvailable(symbol) {
    if (!availableSymbols || availableSymbols.length === 0) return null;
    return availableSymbols.indexOf(symbol.toUpperCase()) !== -1;
  }

  return (
    <div className="watchlist-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div className="watchlist-title">My Watchlist</div>
          <div style={{ fontSize: "12px", color: "#444" }}>Type coin symbols to track — saved automatically</div>
        </div>
        {watchlist.length > 0 && (
          <button
            style={{ background: "#ff525215", border: "1px solid #ff5252", color: "#ff5252", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "12px" }}
            onClick={function() { onWatchlistChange([]); }}
          >
            Clear All
          </button>
        )}
      </div>

      <div className="watchlist-input-row">
        <input
          className="watchlist-input"
          type="text"
          placeholder="Type symbols e.g. DEGO, PIXEL, SHIB"
          value={inputValue}
          onChange={function(e) { setInputValue(e.target.value); }}
          onKeyDown={handleKeyDown}
        />
        <button
          style={{ background: "#7c4dff22", border: "1px solid #7c4dff", color: "#7c4dff", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}
          onClick={handleAdd}
        >
          + Add
        </button>
      </div>

      {watchlist.length > 0 ? (
        <div>
          <div className="watchlist-tags">
            {watchlist.map(function(symbol) {
              var available = isAvailable(symbol);
              return (
                <div key={symbol} className="watchlist-tag">
                  {symbol}
                  {available === true && (
                    <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "#00e67615", color: "#00e676", border: "1px solid #00e67644", marginLeft: "4px" }}>
                      ✓
                    </span>
                  )}
                  {available === false && (
                    <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "#ff525215", color: "#ff5252", border: "1px solid #ff525244", marginLeft: "4px" }}>
                      ?
                    </span>
                  )}
                  <span className="tag-remove" onClick={function() { handleRemove(symbol); }}>×</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "11px", color: "#333", marginTop: "8px" }}>
            {watchlist.length} coin{watchlist.length !== 1 ? "s" : ""} in watchlist · Saved in browser
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "#333", fontStyle: "italic" }}>
          No coins added yet. Type a symbol above and press Enter.
        </div>
      )}
    </div>
  );
}
