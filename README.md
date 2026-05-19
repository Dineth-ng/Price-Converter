# 💱 Price Converter (LKR & More)

> ✨ Your web-browsing currency wingman. No more mental math when shopping online.

![Vibe](https://img.shields.io/badge/vibe-immaculate-blueviolet?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/built_with-vanilla_js-yellow?style=for-the-badge)
![License](https://img.shields.io/badge/license-open_source-success?style=for-the-badge)

Let's be real: constantly opening a new tab to Google "USD to LKR" or "EUR to INR" when you're just trying to buy something is annoying. 

I built this extension to just... handle it. It quietly scans the page you're on, spots foreign prices, and slips a neat little badge next to them with your local currency. Plus, there's a slick built-in calculator for when you need to crunch numbers manually.

## ✨ Why it's cool (Features)

- **🪄 Magic Inline Conversion:** Reads prices (USD, EUR, GBP, JPY, etc.) on the fly and drops a sleek badge with the converted amount right next to it.
- **🧮 Built-in Mini Calc:** A dedicated "Converter" tab right in the extension popup. Fast, beautiful, and supports 13 currencies instantly.
- **⚡ Stupid Fast:** Fetches live rates via ExchangeRate-API and caches them for an hour. No lag, no unnecessary API spam.
- **⚙️ Your Rules:** Turn it off for specific pages or swap your target currency in two clicks.
- **💨 Zero Bloat:** Just clean vanilla HTML, CSS, and JS. No heavy frameworks weighing down your browser.

## 🚀 How to use it right now (Dev Mode)

Since it's fresh and not on the Chrome Web Store just yet, here's how you load it up:

1. Clone or download this repo to your machine.
2. Open up Chrome, Edge, Brave, or whatever Chromium browser you rock.
3. Head over to the extensions page (`chrome://extensions/` or `edge://extensions/`).
4. Flick on that **Developer mode** switch (usually top right).
5. Hit **Load unpacked** and select this project's folder.
6. Pin it to your toolbar and let it do its thing!

## 🛠️ How it works

### Auto-Magic on Pages
1. Click the 💱 icon in your toolbar.
2. Hit the **Settings** tab.
3. Make sure **"Enable on this page"** is vibing (checked).
4. Pick your local currency.
5. Hit **Apply & Refresh Page**.
6. Boom. Prices like `$49.99` suddenly make sense locally (e.g., `$49.99 [14,500 LKR]`).

### The Manual Calculator
1. Open the extension popup.
2. It lands right on the **Converter** tab.
3. Type an amount, swap currencies around, or use the quick buttons (10, 50, 100). The math happens instantly as you type.

## 📂 What's under the hood?

- `manifest.json`: The blueprint (Manifest V3).
- `popup.html` & `popup.js`: The UI vibes—calculator and settings.
- `content.js`: The worker bee that runs on the page, sniffing out prices using Regex and dropping badges.
- `background.js`: The silent hero fetching and caching API rates in the background.
- `icons/`: The eye candy (16px, 48px, 128px).

## 🤝 API Shoutout

Powered by the free tier of [ExchangeRate-API](https://www.exchangerate-api.com/). They keep the rates fresh so we don't have to.

## 📜 License

It's open-source. Fork it, tweak it, make it yours.
