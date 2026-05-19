// background.js – fetches & caches exchange rates

const CACHE_KEY = "exchangeRates";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

async function fetchRates(baseCurrency = "USD") {
  const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const cacheEntry = {
      rates: data.rates,
      base: data.base,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({ [CACHE_KEY]: cacheEntry });
    return cacheEntry;
  } catch (err) {
    console.error("[CurrencyExt] Failed to fetch rates:", err);
    return null;
  }
}

async function getRates(baseCurrency = "USD") {
  const result = await chrome.storage.local.get(CACHE_KEY);
  const cached = result[CACHE_KEY];
  if (cached && cached.base === baseCurrency && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  return await fetchRates(baseCurrency);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_RATES") {
    getRates(message.base || "USD").then(data => sendResponse({ data }));
    return true; // keep channel open for async
  }
});
