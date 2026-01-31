import { ChainInfo, SupportedChain } from './types';

export const CHAINS: Record<SupportedChain, ChainInfo> = {
  bittensor: {
    id: 'bittensor',
    name: 'Bittensor',
    symbol: 'TAO',
    logo: '/chains/bittensor.svg',
    color: '#000000',
    explorerUrl: 'https://taostats.io',
    apiUrl: 'https://taostats.io/api',
    decimals: 9,
  },
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    logo: '/chains/polkadot.svg',
    color: '#FF6B00',
    explorerUrl: 'https://polkadot.subscan.io',
    apiUrl: 'https://polkadot.api.subscan.io',
    decimals: 10,
  },
  osmosis: {
    id: 'osmosis',
    name: 'Osmosis',
    symbol: 'OSMO',
    logo: '/chains/osmosis.svg',
    color: '#5E12A0',
    explorerUrl: 'https://www.mintscan.io/osmosis',
    apiUrl: 'https://lcd-osmosis.keplr.app',
    decimals: 6,
  },
  ronin: {
    id: 'ronin',
    name: 'Ronin',
    symbol: 'RON',
    logo: '/chains/ronin.svg',
    color: '#1273EA',
    explorerUrl: 'https://app.roninchain.com',
    apiUrl: 'https://api.roninchain.com',
    decimals: 18,
  },
};

// Test wallet addresses for each chain (public addresses with known transactions)
export const TEST_ADDRESSES: Record<SupportedChain, string> = {
  bittensor: '5FFApaS75bv5pJHfAp2FVLBj9ZaXuFDjEypsaBNc1wCfe52v',
  polkadot: '16ZL8yLyXv3V3L3z9ofR1ovFLziyXaN1DPq4yffMAZ9czzBD',
  osmosis: 'osmo1z0sh4s80u99l6y9d3vfy582p8jejeeu6tcucs2',
  ronin: '0xa459322a949b97c1cbcf3c82dfc4de9fefc6fb7c',
};

// Address validation patterns
export const ADDRESS_PATTERNS: Record<SupportedChain, RegExp> = {
  bittensor: /^5[a-zA-Z0-9]{47}$/, // SS58 format
  polkadot: /^1[a-zA-Z0-9]{47}$|^[a-zA-Z0-9]{47,48}$/, // SS58 format
  osmosis: /^osmo1[a-z0-9]{38}$/, // Bech32 format
  ronin: /^0x[a-fA-F0-9]{40}$|^ronin:[a-fA-F0-9]{40}$/, // Ethereum-like
};

export function validateAddress(chain: SupportedChain, address: string): boolean {
  const pattern = ADDRESS_PATTERNS[chain];
  return pattern.test(address);
}

export function formatAmount(amount: string, decimals: number): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 8);
  return `${whole}.${fractionStr}`.replace(/\.?0+$/, '') || '0';
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}
