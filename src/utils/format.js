export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return "—";
  var num = parseFloat(price);
  if (num === 0) return "0";
  if (num >= 100000) return num.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (num >= 1000) return num.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (num >= 1) return num.toFixed(4);
  if (num >= 0.01) return num.toFixed(5);
  if (num >= 0.0001) return num.toFixed(6);
  return num.toFixed(8);
}

export function formatVolume(volume) {
  if (volume === null || volume === undefined || isNaN(volume)) return "—";
  var num = parseFloat(volume);
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "K";
  return num.toFixed(2);
}

export function formatChange(change) {
  if (change === null || change === undefined || isNaN(change)) return "—";
  var num = parseFloat(change);
  var sign = num >= 0 ? "+" : "";
  return sign + num.toFixed(2) + "%";
}

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  var num = parseFloat(amount);
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function formatUSDT(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return "$" + parseFloat(amount).toFixed(4);
}

export function formatTimeAgo(date) {
  if (!date) return "—";
  var diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return diff + "s ago";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export function getChangeColor(value) {
  var num = parseFloat(value);
  if (isNaN(num) || num === 0) return "#888888";
  return num > 0 ? "#00e676" : "#ff5252";
}

export function getSlotStyle(slot) {
  switch (slot) {
    case "B":
      return { label: "Tonight's Picks", sublabel: "Buy tonight · Sell tomorrow", color: "#00e676", bg: "#00e67615", border: "#00e67644" };
    case "A":
      return { label: "Tomorrow's Picks", sublabel: "Buy tomorrow night · Sell day after", color: "#00b0ff", bg: "#00b0ff15", border: "#00b0ff44" };
    case "C":
      return { label: "Moonshots", sublabel: "High risk · High reward", color: "#ff9100", bg: "#ff910015", border: "#ff910044" };
    case "W":
      return { label: "My Watchlist", sublabel: "Your manual picks", color: "#7c4dff", bg: "#7c4dff15", border: "#7c4dff44" };
    default:
      return { label: "Unknown", sublabel: "", color: "#888", bg: "#88888815", border: "#88888844" };
  }
}

export function getSignalColor(signal) {
  switch (signal) {
    case "STRONG BUY": return "#00e676";
    case "BUY": return "#69f0ae";
    case "WATCH": return "#ffeb3b";
    case "WEAK": return "#ff9100";
    case "AVOID": return "#ff5252";
    default: return "#888";
  }
}

export function getScoreColor(score) {
  if (score >= 75) return "#00e676";
  if (score >= 60) return "#69f0ae";
  if (score >= 45) return "#ffeb3b";
  if (score >= 30) return "#ff9100";
  return "#ff5252";
}

export function shortenText(text, maxLen) {
  var max = maxLen || 10;
  if (!text) return "—";
  return text.length > max ? text.substring(0, max) + "..." : text;
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "—";
  return parseFloat(num).toLocaleString("en-IN");
}
