import { OpenTxEvent } from '@/lib/types';
import { CHAINS, formatAmount, formatDate } from '@/lib/chains';

const chain = CHAINS.bittensor;

// Taostats API key
const TAOSTATS_API_KEY = process.env.NEXT_PUBLIC_TAOSTATS_API_KEY || 'tao-ea8c7786-3415-4e62-b07a-2478987c9dee:cfe3995e';

// Fetch through proxy to avoid CORS
async function fetchThroughProxy(url: string): Promise<any> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Authorization': TAOSTATS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  return response.json();
}

async function fetchTransactionsFromTaostats(
  address: string,
  page: number = 1
): Promise<{ data: any[]; pagination: any }> {
  try {
    const url = `https://api.taostats.io/api/transfer/v1?coldkey=${address}&page=${page}&limit=100`;
    const result = await fetchThroughProxy(url);
    return {
      data: result.data || [],
      pagination: result.pagination || { total_items: 0 },
    };
  } catch (error) {
    console.warn('Taostats API error:', error);
    return { data: [], pagination: { total_items: 0 } };
  }
}

export async function fetchAllTransactions(
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  const events: OpenTxEvent[] = [];
  const seenTxs = new Set<string>();

  try {
    const initial = await fetchTransactionsFromTaostats(address, 1);
    const totalCount = initial.pagination.total_items || 0;

    if (totalCount === 0) {
      if (onProgress) onProgress(100);
      return [];
    }

    let page = 1;
    let hasMore = true;
    let processed = 0;

    while (hasMore) {
      const { data, pagination } = await fetchTransactionsFromTaostats(address, page);

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const tx of data) {
        const txHash = tx.transaction_hash || tx.extrinsic_id;
        if (seenTxs.has(txHash)) continue;
        seenTxs.add(txHash);

        const isIncoming = tx.to?.ss58 === address;
        const timestamp = new Date(tx.timestamp).getTime() / 1000;

        const event: OpenTxEvent = {
          date: formatDate(timestamp),
          chain: 'Bittensor',
          wallet: address,
          txHash,
          from: tx.from?.ss58 || tx.from?.hex,
          to: tx.to?.ss58 || tx.to?.hex,
          txType: 'transfer',
          protocol: 'balances',
          blockHeight: String(tx.block_number),
          explorerUrl: `${chain.explorerUrl}/extrinsic/${txHash}`,
        };

        const amount = tx.amount || '0';

        if (isIncoming) {
          event.receivedQty = formatAmount(amount, chain.decimals);
          event.receivedCurrency = chain.symbol;
          event.notes = `Received from ${tx.from?.ss58?.slice(0, 8) || tx.from?.hex?.slice(0, 10)}...`;
        } else {
          event.sentQty = formatAmount(amount, chain.decimals);
          event.sentCurrency = chain.symbol;
          event.notes = `Sent to ${tx.to?.ss58?.slice(0, 8) || tx.to?.hex?.slice(0, 10)}...`;
        }

        if (tx.fee && tx.fee !== '0') {
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
      if (!pagination.next_page || data.length < 100) {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('Error fetching Bittensor transactions:', error);
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
  return /^5[a-zA-Z0-9]{47}$/.test(address);
}
