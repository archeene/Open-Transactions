# API Setup Guide

This application uses free APIs from various blockchain data providers. To run this app with your own API keys, follow the instructions below.

## Required APIs

### 1. Goldrush (by Covalent) - Used for Ronin Chain

**Website:** https://www.goldrush.com/

**Purpose:** Fetching Ronin blockchain transactions

**Setup:**
1. Go to https://www.goldrush.com/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Create a new API key
5. Copy your API key

**Free Tier Limits:**
- Rate limited (free tier: ~5 requests/second)
- Sufficient for personal use and testing

**Environment Variable:**
```bash
NEXT_PUBLIC_GOLDRUSH_API_KEY=your_api_key_here
```

---

### 2. Subscan - Used for Polkadot

**Website:** https://www.subscan.io/

**Purpose:** Fetching Polkadot blockchain transactions

**Setup:**
1. Go to https://www.subscan.io/
2. Sign up for a free account
3. Navigate to Account → API Key
4. Create a new API key
5. Copy your API key

**Free Tier Limits:**
- Limited requests per day
- Suitable for testing and light usage

**Environment Variable:**
```bash
NEXT_PUBLIC_SUBSCAN_API_KEY=your_api_key_here
```

---

### 3. Taostats - Used for Bittensor

**Website:** https://taostats.io/

**Purpose:** Fetching Bittensor blockchain transactions

**Setup:**
1. Go to https://taostats.io/
2. Sign up for a free account
3. Navigate to API section in your account
4. Generate an API key
5. Copy your API key

**Free Tier Limits:**
- Rate limited requests
- Check current limits on their pricing page

**Environment Variable:**
```bash
NEXT_PUBLIC_TAOSTATS_API_KEY=your_api_key_here
```

---

### 4. Mintscan (by Cosmostation) - Used for Osmosis

**Website:** https://mintscan.io/

**Purpose:** Fetching Osmosis blockchain transactions

**Setup:**
1. Go to https://mintscan.io/
2. Sign up for a free account
3. Navigate to Account → API
4. Request API access (may require email approval)
5. After approval, copy your API key

**Note:** API key approval may require emailing api@cosmostation.io

**Environment Variable:**
```bash
NEXT_PUBLIC_MINTSCAN_API_KEY=your_jwt_token_here
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Chain-Transactions
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env.local` file

Create a file named `.env.local` in the project root and add your API keys:

```env
NEXT_PUBLIC_GOLDRUSH_API_KEY=your_goldrush_key
NEXT_PUBLIC_SUBSCAN_API_KEY=your_subscan_key
NEXT_PUBLIC_TAOSTATS_API_KEY=your_taostats_key
NEXT_PUBLIC_MINTSCAN_API_KEY=your_mintscan_token
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Key Security

- **NEVER commit `.env.local` to Git**
- The `.gitignore` file already excludes `.env.local`
- API keys are prefixed with `NEXT_PUBLIC_` because they're used in both server and client components
- The `/api/proxy` endpoint forwards API keys securely to bypass CORS

---

## Free API Limitations

| Provider | Chain | Free Tier Limit |
|----------|-------|-----------------|
| Goldrush | Ronin | ~5 requests/second |
| Subscan | Polkadot | Limited daily requests |
| Taostats | Bittensor | Rate limited |
| Mintscan | Osmosis | Varies, may require approval |

If you hit rate limits:
- Wait a few minutes before trying again
- Consider upgrading to paid tier for production use
- The app includes delays between requests to minimize rate limiting

---

## Troubleshooting

### Transactions not showing up

**Issue:** You scan an address but get 0 results.

**Possible causes:**
1. **Contract address scanned:** You scanned a smart contract address instead of a user wallet address. Contracts don't send/receive transactions directly.
2. **Empty wallet:** The address has no transaction history on that chain.
3. **API key invalid:** Check that your API key is correct and active.

**Solution:** Try a known active wallet address from the test addresses in the app.

### Rate limit errors

**Issue:** API returns 429 status code.

**Solution:** The app includes automatic delays between requests. If you still hit rate limits, wait a few minutes before retrying.

### CORS errors

**Issue:** Browser console shows CORS errors.

**Solution:** The app uses a built-in proxy at `/api/proxy` to bypass CORS. If you're still seeing CORS errors, ensure the Next.js dev server is running.

---

## Test Addresses

These addresses have known transaction history for testing:

| Chain | Address |
|-------|---------|
| Bittensor | `5FFApaS75bv5pJHfAp2FVLBj9ZaXuFDjEypsaBNc1wCfe52v` |
| Polkadot | `16ZL8yLyXv3V3L3z9ofR1ovFLziyXaN1DPq4yffMAZ9czzBD` |
| Osmosis | `osmo1z0sh4s80u99l6y9d3vfy582p8jejeeu6tcucs2` |
| Ronin | `ronin:a459322a949b97c1cbcf3c82dfc4de9fefc6fb7c` |

---

## API Documentation Links

- **Goldrush/Covalent:** https://www.covalenthq.com/docs/api/
- **Subscan:** https://docs.api.subscan.io/
- **Taostats:** https://docs.taostats.io/
- **Mintscan:** https://docs.cosmostation.io/

---

## Contributing

If you find better free APIs or want to add support for more chains:
1. Create a new adapter in the `adapters/` directory
2. Follow the existing adapter pattern
3. Update `lib/chains.ts` with the new chain info
4. Update this README with API setup instructions

---

## Disclaimer

This application is for educational purposes. Always verify transaction data before using for tax reporting. The Awaken Tax CSV format is based on their public documentation - check https://help.awaken.tax for the latest format requirements.

The APIs used here are third-party services. Their availability, pricing, and terms of service are subject to change.
