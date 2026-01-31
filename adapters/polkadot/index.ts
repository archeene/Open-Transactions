import { OpenTxEvent } from '@/lib/types';
import { CHAINS, formatAmount, formatDate } from '@/lib/chains';

const chain = CHAINS.polkadot;

// Subscan API key from environment
const SUBSCAN_API_KEY = process.env.NEXT_PUBLIC_SUBSCAN_API_KEY || 'abff27624a0746d9af46fe9b0db84fe8';

// Fetch through proxy to avoid CORS
async function fetchThroughProxy(url: string, options?: RequestInit): Promise<any> {
  // Use POST for proxy to forward headers properly
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    ...options,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  return response.json();
}

// Fetch transfers from Subscan via proxy
export async function fetchTransfers(
  address: string,
  page: number = 0,
  row: number = 100
): Promise<{ count: number; transfers: any[] }> {
  try {
    const url = `https://polkadot.api.subscan.io/api/v2/scan/transfers`;
    const response = await fetchThroughProxy(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SUBSCAN_API_KEY,
      },
      body: JSON.stringify({ address, page, row }),
    });

    if (response.code !== 0) {
      console.warn('Subscan error:', response.message);
      return { count: 0, transfers: [] };
    }

    return response.data || { count: 0, transfers: [] };
  } catch (error) {
    console.warn('Subscan fetch error:', error);
    return { count: 0, transfers: [] };
  }
}

export async function fetchAllTransactions(
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  const events: OpenTxEvent[] = [];
  const seenTxs = new Set<string>();

  try {
    const initial = await fetchTransfers(address, 0, 100);
    const totalCount = initial.count;

    if (totalCount === 0) {
      if (onProgress) onProgress(100);
      return [];
    }

    let page = 0;
    let hasMore = true;
    let processed = 0;

    while (hasMore) {
      const { transfers } = await fetchTransfers(address, page, 100);

      if (!transfers || transfers.length === 0) {
        hasMore = false;
        break;
      }

      for (const tx of transfers) {
        if (seenTxs.has(tx.hash)) continue;
        seenTxs.add(tx.hash);

        const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();

        const event: OpenTxEvent = {
          date: formatDate(tx.block_timestamp),
          chain: 'Polkadot',
          wallet: address,
          txHash: tx.hash,
          from: tx.from,
          to: tx.to,
          txType: 'transfer',
          protocol: tx.module || 'balances',
          blockHeight: String(tx.block_num),
          explorerUrl: `${chain.explorerUrl}/extrinsic/${tx.hash}`,
        };

        const symbol = tx.asset_symbol || chain.symbol;

        if (isIncoming) {
          event.receivedQty = formatAmount(tx.amount || '0', chain.decimals);
          event.receivedCurrency = symbol;
          event.notes = `Received from ${tx.from?.slice(0, 8)}...`;
        } else {
          event.sentQty = formatAmount(tx.amount || '0', chain.decimals);
          event.sentCurrency = symbol;
          event.notes = `Sent to ${tx.to?.slice(0, 8)}...`;
        }

        if (!isIncoming && tx.fee) {
          event.feeAmount = formatAmount(tx.fee, chain.decimals);
          event.feeCurrency = chain.symbol;
        }

        events.push(event);
        processed++;

        if (onProgress && totalCount > 0) {
          onProgress(Math.min((processed / totalCount) * 100, 100));
        }
      }

      page++;
      if (transfers.length < 100) {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('Error fetching Polkadot transactions:', error);
    if (onProgress) onProgress(100);
  }

  events.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return events;
}

export function validateAddress(address: string): boolean {
  return /^1[a-zA-Z0-9]{47}$|^[a-zA-Z0-9]{47,48}$/.test(address);
}
