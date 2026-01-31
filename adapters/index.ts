import { SupportedChain, OpenTxEvent } from '@/lib/types';
import * as bittensor from './bittensor';
import * as polkadot from './polkadot';
import * as osmosis from './osmosis';
import * as ronin from './ronin';

// Adapter registry
export const adapters: Record<SupportedChain, {
  fetchAllTransactions: (address: string, onProgress?: (progress: number) => void) => Promise<OpenTxEvent[]>;
  validateAddress: (address: string) => boolean;
}> = {
  bittensor,
  polkadot,
  osmosis,
  ronin,
};

// Get adapter for chain
export function getAdapter(chain: SupportedChain) {
  return adapters[chain];
}

// Validate address for chain
export function validateAddress(chain: SupportedChain, address: string): boolean {
  const adapter = adapters[chain];
  return adapter?.validateAddress(address) ?? false;
}

// Fetch transactions for chain
export async function fetchTransactions(
  chain: SupportedChain,
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  const adapter = adapters[chain];
  if (!adapter) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  return adapter.fetchAllTransactions(address, onProgress);
}
