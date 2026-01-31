# ChainTx - Multi-Chain Transaction Exporter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Export blockchain transactions for tax reporting. Generates CSVs in [Awaken Tax](https://awaken.tax) compatible format.

A clean, simple tool for exporting transactions from multiple blockchains. Just paste your wallet address and download your transaction history.

## 🌟 Features

- **Multi-Chain Support**: Bittensor, Polkadot, Osmosis, Ronin
- **No Wallet Connection**: Just paste your address - no signing required
- **Private & Secure**: No data storage, no tracking. Your wallet keys never leave your device.
- **Awaken Tax Compatible**: CSV format ready for direct import
- **Two Export Modes**:
  - **Awaken Tax (Strict)**: Official Awaken Tax format headers
  - **Enriched**: Additional metadata (chain, block height, explorer URL, etc.)
- **Real-time Progress**: Track transaction fetching with progress bar
- **Transaction Stats**: View total received, sent, and fees
- **Explorer Links**: Click any transaction hash to view in block explorer
- **Open Source**: Free to use and contribute

## 🚀 Supported Chains

| Chain | Symbol | API | Explorer |
|-------|--------|-----|----------|
| Bittensor | TAO | Taostats API | taostats.io |
| Polkadot | DOT | Subscan API | polkadot.subscan.io |
| Osmosis | OSMO | Mintscan API | mintscan.io/osmosis |
| Ronin | RON | Goldrush/Covalent API | explorer.roninchain.com |

## 🔑 API Setup

This app uses free APIs from various providers. You need to set up your own API keys to use this application.

**📖 See [API_SETUP.md](API_SETUP.md) for detailed instructions on getting API keys from:**

- [Goldrush (Covalent)](https://www.goldrush.com/) - for Ronin
- [Subscan](https://www.subscan.io/) - for Polkadot
- [Taostats](https://taostats.io/) - for Bittensor
- [Mintscan](https://mintscan.io/) - for Osmosis ⚠️ *Requires email approval*

All providers offer free tiers sufficient for personal use and testing.

## 📋 CSV Format (Awaken Tax)

The exported CSV follows the [official Awaken Tax format](https://help.awaken.tax/en/articles/10422149-how-to-format-your-csv-for-awaken-tax).

**Awaken Tax (Strict) Mode:**
```
Date,Received Quantity,Received Currency,Sent Quantity,Sent Currency,Fee Amount,Fee Currency,Transaction Hash,Notes
```

**Enriched Mode** (additional columns):
```
Chain,Wallet,From,To,Tx Type,Protocol,Block Height,Explorer URL
```

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chain-transactions.git
cd chain-transactions

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Create a `.env.local` file in the project root with your API keys:

```env
# Required API Keys (get free from providers - see API_SETUP.md)
NEXT_PUBLIC_GOLDRUSH_API_KEY=your_goldrush_key
NEXT_PUBLIC_SUBSCAN_API_KEY=your_subscan_key
NEXT_PUBLIC_TAOSTATS_API_KEY=your_taostats_key
NEXT_PUBLIC_MINTSCAN_API_KEY=your_mintscan_token
```

⚠️ **Important:**
- Never commit `.env.local` to Git
- All providers offer free tiers
- See [API_SETUP.md](API_SETUP.md) for setup instructions

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

Click the button below to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or use the CLI:
```bash
vercel deploy
```

### Netlify

```bash
npm run build
# Deploy the .next folder
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add New Chains**: Create an adapter in `/adapters/[chain-name]/index.ts`
2. **Improve Existing Adapters**: Better transaction parsing, handle more tx types
3. **UI Improvements**: Better mobile responsiveness, new features
4. **Bug Fixes**: Report issues or submit PRs

### Adding a New Chain

1. Create adapter folder: `adapters/[chain-name]/`
2. Implement the adapter interface:

```typescript
// adapters/[chain-name]/index.ts
import { OpenTxEvent } from '@/lib/types';

export async function fetchAllTransactions(
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  // Fetch transactions from chain's API
  // Return array of OpenTxEvent objects
}

export function validateAddress(address: string): boolean {
  // Validate address format for this chain
}
```

3. Add chain config to `lib/chains.ts`
4. Register adapter in `adapters/index.ts`

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## ⚠️ Disclaimer

This tool is for informational purposes only. Always verify transaction data before using it for tax reporting. Consult a tax professional for advice specific to your situation.

---

**Made with ❤️ for the crypto community**
