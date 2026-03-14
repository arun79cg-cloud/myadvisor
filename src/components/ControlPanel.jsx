import React, { useState } from "react";

export default function ControlPanel({ onSettingsChange, usdtRate }) {
  var rate = usdtRate || 86;

  var [capitalINR, setCapitalINR] = useState(2500);
  var [capitalUSDT, setCapitalUSDT] = useState(30);
  var [coinsPerSlot, setCoinsPerSlot] = useState(3);

  var totalINR = capitalINR + (capitalUSDT * rate);
  var amountPerCoinINR = capitalINR > 0 ? Math.floor(capitalINR / coinsPerSlot) : 0;
  var amountPerCoinUSDT = capitalUSDT > 0 ? parseFloat((capitalUSDT / coinsPerSlot).toFixed(2)) : 0;

  function handleChange(field, value) {
    var val = parseFloat(value) || 0;
    var newINR = capitalINR;
    var newUSDT = capitalUSDT;
    var newCoins = coinsPerSlot;

    if (field === "INR") { setCapitalINR(val); newINR = val; }
    if (field === "USDT") { setCapitalUSDT(val); newUSDT = val; }
    if (field === "coins") { setCoinsPerSlot(val || 1); newCoins = val || 1; }

    onSettingsChange({
      capitalINR: newINR,
      capitalUSDT: newUSDT,
      coinsPerSlot: newCoins,
      amountPerCoinOverride: null,
    });
  }

  return (
    <div className="control-panel">
      <div className="control-panel-title">Investment Control Panel</div>
      <div className="control-grid">

        {/* INR Capital */}
        <div className="control-item">
          <div className="control-label">INR Balance</div>
          <div className="control-input-row">
            <span className="control-prefix">₹</span>
            <input
              type="number"
              className="control-input"
              value={capitalINR}
              min="0"
              onChange={function(e) { handleChange("INR", e.target.value); }}
            />
          </div>
          <div className="control-hint">
            {"₹" + Math.floor(capitalINR / 2).toLocaleString("en-IN") + " per slot"}
          </div>
        </div>

        {/* USDT Capital */}
        <div className="control-item">
          <div className="control-label">USDT Balance</div>
          <div className="control-input-row">
            <span className="control-prefix">$</span>
            <input
              type="number"
              className="control-input"
              value={capitalUSDT}
              min="0"
              step="1"
              onChange={function(e) { handleChange("USDT", e.target.value); }}
            />
          </div>
          <div className="control-hint">
            {"≈ ₹" + Math.floor(capitalUSDT * rate).toLocaleString("en-IN") + " at ₹" + rate.toFixed(1) + "/USDT"}
          </div>
        </div>

        {/* Coins per slot */}
        <div className="control-item">
          <div className="control-label">Coins per Slot</div>
          <div className="control-input-row">
            <input
              type="number"
              className="control-input"
              value={coinsPerSlot}
              min="1"
              max="10"
              onChange={function(e) { handleChange("coins", e.target.value); }}
            />
            <span className="control-suffix">coins</span>
          </div>
          <div className="control-hint">
            {"Per slot (tonight + tomorrow)"}
          </div>
        </div>

        {/* Amount per coin */}
        <div className="control-item">
          <div className="control-label">Amount per Coin</div>
          <div className="control-summary-box">
            {capitalINR > 0 && (
              <div className="control-summary-row">
                <span className="control-summary-label">INR pairs</span>
                <span className="control-summary-value">{"₹" + amountPerCoinINR.toLocaleString("en-IN")}</span>
              </div>
            )}
            {capitalUSDT > 0 && (
              <div className="control-summary-row">
                <span className="control-summary-label">USDT pairs</span>
                <span className="control-summary-value">{amountPerCoinUSDT + " USDT"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total combined */}
        <div className="control-item">
          <div className="control-label">Per Slot Summary</div>
          <div className="control-total">
            {"₹" + Math.floor(totalINR).toLocaleString("en-IN")}
          </div>
          <div className="control-hint">
            {"Total combined value"}
          </div>
          <div className="control-target">
            {"Target: +₹" + Math.floor(totalINR * 0.15).toLocaleString("en-IN") + " / slot"}
          </div>
        </div>

      </div>
    </div>
  );
}
