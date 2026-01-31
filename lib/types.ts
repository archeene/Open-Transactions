// Core transaction type for all chains
export type OpenTxEvent = {
  date: string; // "MM/DD/YYYY HH:mm:ss" UTC
  
  receivedQty?: string;
  receivedCurrency?: string;
  
  sentQty?: string;
  sentCurrency?: string;
  
  feeAmount?: string;
  feeCurrency?: string;
  
  notes?: string;
  
  // enrichment fields
  chain?: string;
  wallet?: string;
  txHash?: string;
  from?: string;
  to?: string;
  txType?: string;       // "transfer", "staking", "fee", "other"
  protocol?: string;     // "balances", "xcm", "staking", etc.
  blockHeight?: string;
  explorerUrl?: string;
};

// Chain adapter interface
export interface ChainAdapter {
  id: string;              // "polkadot", "bittensor", etc.
  name: string;            // "Polkadot", "Bittensor", etc.
  symbol: string;          // "DOT", "TAO", etc.
  logo: string;            // logo path
  explorerUrl: string;     // base explorer URL
  validateAddress: (address: string) => boolean;
  fetchTransactions: (address: string, onProgress?: (progress: number) => void) => Promise<OpenTxEvent[]>;
}

// Supported chains enum
export type SupportedChain = 
  | 'bittensor'
  | 'polkadot'
  | 'osmosis'
  | 'ronin';

// Chain metadata
export interface ChainInfo {
  id: SupportedChain;
  name: string;
  symbol: string;
  logo: string;
  color: string;
  explorerUrl: string;
  apiUrl: string;
  decimals: number;
}

// API Response types
export interface SubscanTransfer {
  hash: string;
  block_num: number;
  block_timestamp: number;
  from: string;
  to: string;
  amount: string;
  success: boolean;
  fee: string;
  module: string;
  asset_symbol: string;
}

export interface SubscanExtrinsic {
  extrinsic_hash: string;
  block_num: number;
  block_timestamp: number;
  call_module: string;
  call_module_function: string;
  success: boolean;
  fee: string;
  params: string;
}

// Taostats API types for Bittensor
export interface TaostatsTransfer {
  hash: string;
  block: number;
  timestamp: number;
  from: string;
  to: string;
  amount: string;
  fee: string;
  success: boolean;
}

// Mintscan API types for Osmosis
export interface MintscanTx {
  txhash: string;
  height: string;
  timestamp: string;
  messages: {
    type: string;
    value: any;
  }[];
  fee: {
    amount: { denom: string; amount: string }[];
  };
}

// Ronin API types
export interface RoninTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: boolean;
}
