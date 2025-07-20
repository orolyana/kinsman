# 🤖 Kinsman – AI-Powered Forex Signal Copilot

**Kinsman** is a real-time, multi-currency Forex trading assistant that merges technical analysis, live news sentiment, and LLM-powered reasoning to generate actionable signals. It broadcasts structured trade alerts (LONG/SHORT) to Telegram with full decision context.

---

## 🚀 Features

- **📈 Candlestick Data Fetching**  
  Retrieves OHLC data for multiple currency pairs (e.g., `USDJPY=X`, `EURUSD=X`) from Yahoo Finance on a regular interval.

- **7‑Step “Steps to Heaven” Signal Engine**  
  Evaluates potential trade entries using indicators including trend direction, momentum, ADX strength, overbought/oversold conditions, candlestick reversals, stop-loss placement, and volatility.

- **📰 Real-Time News Sentiment**  
  Fetches GDELT currency-related headlines for both base and quote currencies over the last 24 hours, filtered for financial relevance.

- **🤖 LLM-Assisted Validation**  
  Constructs structured prompts combining technical insights, historical signal history, and sentiment — feeds them to an LLM that returns a JSON verdict (`{ supported, reason, confidence }`).

- **📬 Telegram Broadcast**  
  Sends fully detailed alerts to a Telegram channel, including technical summary, reasoning, sentiment context, and LLM confidence.

---

## 🧩 Architecture Overview

1. **Data Retrieval**  
   Periodic candlestick fetch via Yahoo Finance API  
   Headline fetch via `GDELTEngine.fetch(symbol)`

2. **Signal Detection**  
   Applies comprehensive 7-step algorithm  
   Builds `signal.cachedPrompt` array for LLM context

3. **Sentiment Extraction**  
   Parses and filters headlines per currency  
   Groups them by currency for clarity

4. **Prompt Composition**  
   Compressed, role-based content for system + user  
   Includes:

   - Indicator summary
   - Signal history
   - Recent news headlines
   - Final task prompt

5. **LLM Judgement & Storage**  
   Queries LLM (via `GroqEngine.request`)  
   Stores JSON verdict in `BroadcastEngine.aiHistory[symbol]`

6. **Broadcasting**  
   Sends formatted message to Telegram (via bot token + chat ID)

---

## ⚙️ Getting Started

### Requirements

- Node.js (≥ 18) + npm
- Telegram bot token & target chat ID
- Free GDELT access (no API key needed)
- Yahoo Finance API can be via public endpoints or third-party library

### Setup

1. **Clone the Repo**

   ```bash
   git clone https://github.com/newben420/kinsman.git
   cd kinsman
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**  
    Create a .env file at repo root:

   ```ini
    PORT="4000"
    TITLE="Kin"
    PRODUCTION="false"
    FORCE_FAMILY_4="true"
    EXIT_ON_UNCAUGHT_EXCEPTION="true"
    EXIT_ON_UNHANDLED_REJECTION="true"
    PROD_URL="https://example.com"
    MAX_ALLOWED_FLOG_LOG_WEIGHT="5"
    PE_INTERVAL_MS="300000"
    PE_MAX_RECORDS="100"
    PE_DATA_TIMEOUT_MS="120000"
    PE_SOURCE_URL="https://query1.finance.yahoo.com/v8/finance/chart"
    PE_INITIAL_PAIRS="EURUSD=X JPYEUR=X"
    PE_TP_SL_MULTIPLIER="1"

    TG_TOKEN="7638323240:AAGwkW-5aIzzgrh3atdNyzrjt17_j4I7jY8"
    TG_CHAT_ID="7784013343"
    TG_POLLING="true"
    TG_WH_SECRET_TOKEN="ewudyftcguhirwgsw"
    TG_BOT_URL="https://t.me/kinsmanfxbot"

    IN_CFG="MN_DATA_LEN 100 DIR_LEN 5 MX_SIGHIST_LEN 5 PSR_ST 0.02 PSR_MX 0.2 MCD_FSP 12 MCD_SLP 26 MCD_SGP 9 MAP 20 STC_P 14 STC_SP 3 ICH_CVP 9 ICH_BSP 26 ICH_SPP 52 ICH_DIS 26 AOS_FSP 5 AOS_SLP 34 TRX_P 15 ADX_P 14 STC_P 14 STC_SP 3 RSI_P 14 CCI_P 14 MFI_P 14 ATR_P 14 KST_RP1 10 KST_RP2 15 KST_RP3 20 KST_RP4 30 KST_SGP 9 KST_SP1 10 KST_SP2 10 KST_SP3 10 KST_SP4 15"

    STR_ENTRY_IND="MCD" # ICH|MCD|PSR => 1
    STR_TREND_IND="BLL SMA EMA WMA MCD VWP AOS TRX KST" # BLL|SMA|EMA|WMA|MCD|VWP|AOS|TRX|KST => _
    STR_TREND_CV="0" # 1|0|(0,1)
    STR_TREND_FV="0" # 1|0
    STR_STG_FV="0" # 1|0
    STR_OB_IND="SRS CCI MFI RSI STC" # STC|RSI|CCI|MFI|SRS => _
    STR_OB_CV="1" # 1|0|(0,1)
    STR_OB_FV="0" # 1|0
    STR_REV_IND_BULL="EST TBC DCC PIL TTP" # STR|HGM|EST|TBC|PIL|DCC|TTP|ABB|BEP|EDS|GSD|BRH|BRM|BHC => _
    STR_REV_IND_BEAR="MST HMR TBT" # TWS|MST|HMR|TBT|ABB|BLE|MDS|DFD|BLH|BLM|BLC => _
    STR_REV_CV="1" # 1|0|(0,1)
    STR_REV_FV="0" # 1|0
    STR_TSL_IND="PSR" # PSR|ICH => 1
    STR_VOL_RNG="0 0" # MIN MAX

    DC_MAX_LATEST_SIGNALS="7"
    DC_MIN_DOM_PERC="80"

    GROQ_USE="true"
    GROQ_KEY=""
    GROQ_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODELS="gemma2-9b-it llama-3.1-8b-instant llama-3.3-70b-versatile deepseek-r1-distill-llama-70b qwen/qwen3-32b compound-beta"
    GROQ_REQUEST_TIMEOUT_MS="0"
    GROQ_MAX_RETRIES="4"
    GROQ_HTTP_TIMEOUT_MS="60000"
    GROQ_MAX_HISTORY_COUNT="5"

    WS_URL="wss://streamer.finance.yahoo.com"
    WS_RECON_DELYAY_MS="5000"

   ```

(Optional) Add LLM-specific flags for GroqEngine.

4. **Run the Bot**

```bash
npm start
```

---

## 📂 Code Modules

- **pair.ts** – Core orchestrator: tracks added pairs.

- **gdelt.ts** – Handles financial news retrieval and filtering.

- **analysis.ts** – Implements your 7-step indicator logic.

- **broadcast.ts** – Constructs LLM-friendly prompt strings.

- **telegram.ts** – Sends formatted alerts to your Telegram bot.

---

## 💡 Usage Tips

- **Add More Pairs**  
   Extend the monitored pairs list (e.g. GBPJPY=X, AUDUSD=X) – the algorithm auto-scans them.

- **Tweak Signal Logic**  
   Customize the 7-step indicators to suit your strategy tolerance / timeframe.

- **Fine-Tune Prompt**  
   Adjust headline limits, news filtering, or wording for better LLM performance.

- **Persist Data**  
   Connect a small DB (SQLite/Postgres/MongoDB) to store verdict history + outcomes.

---

## 📈 Roadmap Ideas

- **Backtesting Mode** – Replay historical data + simulate LLM verdicts

- **Sentiment Scoring** – Pre-score headlines (e.g. 🚀 bullish/🔻 bearish)

- **Web Dashboard + Webhooks** – For multi-channel alerts (Discord, Slack)

- **Fine-Tune LLMs** – Use your collected signals + outcomes to build your own model

---

## 🧾 License & Contribution

Kinsman is released under the MIT License.

Contributions are welcome — please open issues or PRs for clearly scoped feature improvements or data integrations.