import strategy, { getRoundTripCost, getNetTarget } from "../config/strategy";

export function calculateTradeCost(quote, tradeAmount) {
  var f = strategy.fees;
  var buyCost, sellCost;

  if (quote === "INR") {
    var buyFee = tradeAmount * f.inr.tradingFee;
    var buyGST = buyFee * f.inr.gstOnFee;
    buyCost = buyFee + buyGST;
    var sellFee = tradeAmount * f.inr.tradingFee;
    var sellGST = sellFee * f.inr.gstOnFee;
    var sellTDS = tradeAmount * f.inr.tdsSell;
    sellCost = sellFee + sellGST + sellTDS;
  } else {
    var buyFeeU = tradeAmount * f.usdt.tradingFee;
    var buyGSTU = buyFeeU * f.usdt.gstOnFee;
    var buyTDS = tradeAmount * f.usdt.tdsBuy;
    buyCost = buyFeeU + buyGSTU + buyTDS;
    var sellFeeU = tradeAmount * f.usdt.tradingFee;
    var sellGSTU = sellFeeU * f.usdt.gstOnFee;
    var sellTDSU = tradeAmount * f.usdt.tdsSell;
    sellCost = sellFeeU + sellGSTU + sellTDSU;
  }

  var totalCost = buyCost + sellCost;
  var totalCostPercent = (totalCost / tradeAmount) * 100;

  return {
    buyCost: parseFloat(buyCost.toFixed(2)),
    sellCost: parseFloat(sellCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    totalCostPercent: parseFloat(totalCostPercent.toFixed(2)),
  };
}

export function calculateLevels(entryPrice, quote, slotConfig) {
  var grossTarget = (slotConfig && slotConfig.targetPercent) || strategy.targetPercent;
  var stopLoss = (slotConfig && slotConfig.stopPercent) || strategy.stopPercent;
  var costPct = getRoundTripCost(quote) / 100;
  var netTarget = getNetTarget(quote, grossTarget);
  var targetPrice = entryPrice * (1 + grossTarget / 100);
  var stopPrice = entryPrice * (1 - stopLoss / 100);
  var breakEvenPrice = entryPrice * (1 + costPct);

  return {
    entryPrice: parseFloat(entryPrice.toFixed(8)),
    targetPrice: parseFloat(targetPrice.toFixed(8)),
    stopPrice: parseFloat(stopPrice.toFixed(8)),
    breakEvenPrice: parseFloat(breakEvenPrice.toFixed(8)),
    grossTargetPercent: grossTarget,
    netTargetPercent: netTarget,
    stopPercent: stopLoss,
    roundTripCostPercent: parseFloat((costPct * 100).toFixed(2)),
  };
}

export function calculatePnL(entryPrice, exitPrice, quantity, quote) {
  var invested = entryPrice * quantity;
  var received = exitPrice * quantity;
  var costs = calculateTradeCost(quote, invested);
  var grossPnL = received - invested;
  var netPnL = grossPnL - costs.totalCost;
  var netPnLPercent = (netPnL / invested) * 100;

  return {
    invested: parseFloat(invested.toFixed(2)),
    received: parseFloat(received.toFixed(2)),
    grossPnL: parseFloat(grossPnL.toFixed(2)),
    netPnL: parseFloat(netPnL.toFixed(2)),
    netPnLPercent: parseFloat(netPnLPercent.toFixed(2)),
    totalCosts: costs.totalCost,
  };
}

export function calculateQuantity(amountINR, price, minQuantity) {
  if (!price || price <= 0) return 0;
  var raw = amountINR / price;
  var quantity = Math.max(raw, minQuantity || 0);
  return parseFloat(quantity.toFixed(6));
}
