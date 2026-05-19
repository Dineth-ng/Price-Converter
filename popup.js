// popup.js

const SHOW_CURRENCIES = ["LKR", "USD", "EUR", "GBP", "INR", "AUD", "SGD", "AED", "JPY"];

// ── Settings panel elements ──
const targetSelect = document.getElementById("targetCurrency");
const enableToggle = document.getElementById("enabledToggle");
const applyBtn = document.getElementById("applyBtn");
const ratesList = document.getElementById("ratesList");
const statusEl = document.getElementById("status");

// ── Converter panel elements ──
const convAmount = document.getElementById("convAmount");
const convFrom = document.getElementById("convFrom");
const convTo = document.getElementById("convTo");
const convResultValue = document.getElementById("convResultValue");
const convResultRate = document.getElementById("convResultRate");
const swapBtn = document.getElementById("swapBtn");

// ── Tab elements ──
const tabConverter = document.getElementById("tabConverter");
const tabSettings = document.getElementById("tabSettings");
const panelConverter = document.getElementById("panelConverter");
const panelSettings = document.getElementById("panelSettings");

// Shared rates cache
let ratesData = null;

// Tabs
function switchTab(tab) {
  if (tab === "converter") {
    tabConverter.classList.add("active");
    tabSettings.classList.remove("active");
    panelConverter.classList.add("active");
    panelSettings.classList.remove("active");
  } else {
    tabSettings.classList.add("active");
    tabConverter.classList.remove("active");
    panelSettings.classList.add("active");
    panelConverter.classList.remove("active");
  }
}
tabConverter.addEventListener("click", () => switchTab("converter"));
tabSettings.addEventListener("click", () => switchTab("settings"));

// Settings helpers
async function loadSettings() {
  const stored = await chrome.storage.local.get(["targetCurrency", "enabled"]);
  targetSelect.value = stored.targetCurrency || "LKR";
  enableToggle.checked = stored.enabled !== false;

  // Pre-select convTo to match the page target currency
  convTo.value = stored.targetCurrency || "LKR";
}

async function loadRates() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_RATES", base: "USD" }, (response) => {
      resolve(response && response.data ? response.data : null);
    });
  });
}

function renderRates(data, target) {
  if (!data) {
    ratesList.innerHTML = `<div class="rate-row"><span class="rate-from" style="color:#ff6b6b">Failed to load rates</span></div>`;
    statusEl.textContent = "[Error] Could not load rates. Check connection.";
    statusEl.className = "status err";
    return;
  }

  const rates = data.rates;

  ratesList.innerHTML = SHOW_CURRENCIES
    .filter(c => c !== "USD")
    .map(c => {
      const conv = (rates[target] / rates[c]).toFixed(
        ["JPY", "KRW", "LKR", "INR"].includes(c) ? 1 : 3
      );
      return `<div class="rate-row">
        <span class="rate-from">1 ${c}</span>
        <span class="rate-val">= ${conv} ${target}</span>
      </div>`;
    })
    .join("");

  const updated = new Date(data.timestamp);
  statusEl.textContent = `[Updated] Rates updated at ${updated.toLocaleTimeString()}`;
  statusEl.className = "status ok";
}

// Local Converter
function formatConverted(amount, currency) {
  const isNoDecimal = ["JPY", "KRW"].includes(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: isNoDecimal ? 0 : 2
  }).format(amount);
}

function runConversion() {
  const amount = parseFloat(convAmount.value);
  const from = convFrom.value;
  const to = convTo.value;

  if (!ratesData || !ratesData.rates) {
    convResultValue.textContent = "No rates";
    convResultRate.textContent = "";
    return;
  }
  if (isNaN(amount) || convAmount.value === "") {
    convResultValue.textContent = "—";
    convResultRate.textContent = "";
    return;
  }

  const rates = ratesData.rates;
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    convResultValue.textContent = "N/A";
    convResultRate.textContent = "";
    return;
  }

  const result = (amount / fromRate) * toRate;
  const unitRate = (toRate / fromRate);

  convResultValue.textContent = formatConverted(result, to);
  convResultRate.textContent = `1 ${from} = ${unitRate.toFixed(
    ["JPY", "KRW", "LKR", "INR"].includes(to) ? 2 : 4
  )} ${to}`;
}

// Swap button
swapBtn.addEventListener("click", () => {
  const tmp = convFrom.value;
  convFrom.value = convTo.value;
  convTo.value = tmp;
  runConversion();
});

// Live update on typing or select change
convAmount.addEventListener("input", runConversion);
convFrom.addEventListener("change", runConversion);
convTo.addEventListener("change", runConversion);

// Quick amount buttons
document.querySelectorAll(".quick-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    convAmount.value = btn.dataset.amount;
    runConversion();
  });
});

// Apply button (Settings panel)
applyBtn.addEventListener("click", async () => {
  const target = targetSelect.value;
  const enabled = enableToggle.checked;

  await chrome.storage.local.set({ targetCurrency: target, enabled });

  // Sync convTo to match the new page target
  convTo.value = target;
  runConversion();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATED", targetCurrency: target, enabled });
  }

  applyBtn.textContent = "[DONE] Applied!";
  setTimeout(() => { applyBtn.textContent = "Apply & Refresh Page"; }, 1500);
});

// Settings → target select live re-render
targetSelect.addEventListener("change", () => {
  renderRates(ratesData, targetSelect.value);
});
// Init
async function init() {
  await loadSettings();
  ratesData = await loadRates();
  renderRates(ratesData, targetSelect.value);

  runConversion();
}

init();
