export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  try {
    const response = await fetch("https://api.coindcx.com/exchange/v1/markets_details");
    if (!response.ok) {
      throw new Error("CoinDCX returned status " + response.status);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch markets",
      message: err.message,
    });
  }
}
