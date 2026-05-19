// content.js – detects prices on the page and injects LKR badges

const CURRENCY_SYMBOLS = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "A$": "AUD",
  "C$": "CAD",
  "S$": "SGD",
  "₩": "KRW",
  "฿": "THB",
  "د.إ": "AED",
  "CHF": "CHF"
};

// Regex: matches prices like $69.00, €1,299, £5.99, ₹2,000, USD 50, etc.
const PRICE_REGEX = /(A\$|C\$|S\$|د\.إ|CHF|[\$€£¥₹₩฿])\s?([\d,]+(?:\.\d{1,2})?)/g;

let targetCurrency = "LKR";
let rates = null;
let baseCurrency = "USD";

// Inject styles for the badge
function injectStyles() {
  if (document.getElementById("ce-styles")) return;
  const style = document.createElement("style");
  style.id = "ce-styles";
  style.textContent = `
    .ce-badge {
      display: inline-block;
      margin-left: 5px;
      padding: 1px 6px;
      background: #1a1a2e;
      color: #f5c842;
      font-size: 0.78em;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      border-radius: 4px;
      border: 1px solid #f5c842;
      vertical-align: middle;
      white-space: nowrap;
      cursor: default;
      position: relative;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      animation: ce-pop 0.2s ease;
      z-index: 9999;
    }
    @keyframes ce-pop {
      from { transform: scale(0.7); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .ce-badge:hover {
      background: #f5c842;
      color: #1a1a2e;
    }
  `;
  document.head.appendChild(style);
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount);
}

function convertAmount(amount, fromCurrency) {
  if (!rates) return null;
  // All rates are relative to our base (USD by default)
  const fromRate = rates[fromCurrency];
  const toRate = rates[targetCurrency];
  if (!fromRate || !toRate) return null;
  const inBase = amount / fromRate;
  return inBase * toRate;
}

function processTextNode(textNode) {
  const text = textNode.nodeValue;
  if (!text || text.trim() === "") return;

  // Skip if parent already has badge
  if (textNode.parentElement && textNode.parentElement.closest("[data-ce-processed]")) return;

  let match;
  let lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let hasMatch = false;

  PRICE_REGEX.lastIndex = 0;

  while ((match = PRICE_REGEX.exec(text)) !== null) {
    hasMatch = true;

    // Text before match
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    // Original price text
    const priceSpan = document.createElement("span");
    priceSpan.setAttribute("data-ce-processed", "true");
    priceSpan.textContent = match[0];
    fragment.appendChild(priceSpan);

    // Determine currency from symbol
    const symbol = match[1];
    const fromCurrency = CURRENCY_SYMBOLS[symbol] || "USD";
    const rawAmount = parseFloat(match[2].replace(/,/g, ""));

    if (fromCurrency !== targetCurrency) {
      const converted = convertAmount(rawAmount, fromCurrency);
      if (converted !== null) {
        const badge = document.createElement("span");
        badge.className = "ce-badge";
        badge.title = `1 ${fromCurrency} = ${(rates[targetCurrency] / rates[fromCurrency]).toFixed(2)} ${targetCurrency}`;
        badge.textContent = formatAmount(converted, targetCurrency);
        priceSpan.appendChild(badge);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (!hasMatch) return;

  // Remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.parentNode.replaceChild(fragment, textNode);
}

function walkAndProcess(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const tag = node.parentElement && node.parentElement.tagName;
        if (["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CODE", "PRE"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.parentElement && node.parentElement.closest("[data-ce-processed]")) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(processTextNode);
}

async function init() {
  // Load user settings
  const stored = await chrome.storage.local.get(["targetCurrency", "enabled"]);
  targetCurrency = stored.targetCurrency || "LKR";
  const enabled = stored.enabled !== false; // default on
  if (!enabled) return;

  // Fetch rates
  const response = await chrome.runtime.sendMessage({ type: "GET_RATES", base: "USD" });
  if (!response || !response.data) {
    console.warn("[CurrencyExt] Could not load exchange rates.");
    return;
  }
  rates = response.data.rates;
  baseCurrency = response.data.base;

  injectStyles();
  walkAndProcess(document.body);

  // Watch for dynamic content (SPAs, lazy-loaded prices)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          walkAndProcess(node);
        } else if (node.nodeType === Node.TEXT_NODE) {
          processTextNode(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SETTINGS_UPDATED") {
    // Remove existing badges and re-run
    document.querySelectorAll(".ce-badge").forEach(b => b.remove());
    targetCurrency = msg.targetCurrency || "LKR";
    if (rates) walkAndProcess(document.body);
  }
});

init();
