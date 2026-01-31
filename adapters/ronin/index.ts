import { OpenTxEvent } from '@/lib/types';
import { CHAINS, formatAmount, formatDate } from '@/lib/chains';

const chain = CHAINS.ronin;

// Goldrush/Covalent API key
const GOLDRUSH_API_KEY = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY || 'cqt_rQJg7hpWdmP9pV8vDbv3xb9gXvg6';

// Fetch through proxy to avoid CORS
async function fetchThroughProxy(url: string): Promise<any> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  return response.json();
}

function normalizeAddress(address: string): string {
  if (address.toLowerCase().startsWith('ronin:')) {
    return '0x' + address.slice(6);
  }
  return address;
}

function formatRoninAddress(address: string): string {
  const normalized = normalizeAddress(address);
  return `ronin:${normalized.slice(2)}`;
}

async function fetchTransactionsFromCovalent(
  address: string,
  page: number = 0
): Promise<{ hasNextPage: boolean; transactions: any[] }> {
  try {
    const normalized = normalizeAddress(address);
    // Goldrush/Covalent uses chain ID 2020 for Ronin (axie-mainnet)
    // Add delay between pages to avoid rate limiting (free tier: ~5 requests/second)
    if (page > 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    const url = `https://api.covalenthq.com/v1/2020/address/${normalized}/transactions_v3/page/${page}/?key=${GOLDRUSH_API_KEY}`;
    const result = await fetchThroughProxy(url);

    const items = result.data?.items || result.items || [];
    const hasNextPage = result.data?.links?.next !== null;

    return {
      hasNextPage,
      transactions: items,
    };
  } catch (error) {
    console.warn('Covalent API error:', error);
    return { hasNextPage: false, transactions: [] };
  }
}

function parseTokenTransfers(tx: any, userAddress: string): { isIncoming: boolean; amount: string; symbol: string; counterparty: string }[] {
  const transfers: { isIncoming: boolean; amount: string; symbol: string; counterparty: string }[] = [];
  const logEvents = tx.log_events || [];

  for (const event of logEvents) {
    // Skip if no decoded params (not a token transfer)
    if (!event.decoded || event.decoded.name !== 'Transfer') {
      continue;
    }

    const params = event.decoded.params || [];
    const fromParam = params.find((p: any) => p.name === 'from');
    const toParam = params.find((p: any) => p.name === 'to');
    const valueParam = params.find((p: any) => p.name === 'value');

    if (!fromParam || !toParam || !valueParam) {
      continue;
    }

    const from = fromParam.value?.toLowerCase();
    const to = toParam.value?.toLowerCase();
    const value = valueParam.value;

    // Skip burns (to zero address) and mints (from zero address)
    if (from === '0x0000000000000000000000000000000000000000' || to === '0x0000000000000000000000000000000000000000') {
      continue;
    }

    const userAddr = userAddress.toLowerCase();
    if (from !== userAddr && to !== userAddr) {
      // Not related to user
      continue;
    }

    const isIncoming = to === userAddr;
    const counterparty = isIncoming ? from : to;
    const symbol = event.sender_contract_ticker_symbol || 'UNKNOWN';
    const decimals = event.sender_contract_decimals || 18;

    // Convert value based on decimals
    const amountBigInt = BigInt(value || '0');
    const divisor = BigInt(10 ** decimals);
    const wholeAmount = amountBigInt / divisor;
    const remainder = amountBigInt % divisor;
    const amountStr = `${wholeAmount}.${remainder.toString().padStart(decimals, '0')}`.replace(/\.?0+$/, '');

    transfers.push({
      isIncoming,
      amount: amountStr,
      symbol,
      counterparty,
    });
  }

  return transfers;
}

export async function fetchAllTransactions(
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  const events: OpenTxEvent[] = [];
  const seenTxs = new Set<string>();
  const normalizedAddress = normalizeAddress(address).toLowerCase();

  try {
    let page = 0;
    let hasMore = true;
    let processed = 0;
    let totalCount = 100; // Initial estimate

    while (hasMore) {
      const { transactions, hasNextPage } = await fetchTransactionsFromCovalent(address, page);
      hasMore = hasNextPage;

      if (!transactions || transactions.length === 0) {
        break;
      }

      // Check if this is the last page
      const isLastPage = !hasNextPage || transactions.length < 100;

      // Update total estimate based on page size
      if (isLastPage) {
        // Last page - we know the total now
        totalCount = processed + transactions.length;
      } else if (page === 0) {
        // First page - estimate based on full page
        totalCount = 100; // At least one page
      } else if (processed >= totalCount) {
        // Adjust estimate if we've exceeded it
        totalCount = processed + (transactions.length * 2);
      }

      for (const tx of transactions) {
        const txHash = tx.tx_hash;
        if (seenTxs.has(txHash)) continue;
        seenTxs.add(txHash);

        const timestamp = new Date(tx.block_signed_at).getTime() / 1000;

        // Parse token transfers from log events
        const transfers = parseTokenTransfers(tx, normalizedAddress);

        if (transfers.length === 0) {
          // No token transfers found, check native value
          const value = tx.value || '0';
          if (value !== '0' && value !== '0x0') {
            const fromAddr = tx.from_address?.toLowerCase() || '';
            const toAddr = tx.to_address?.toLowerCase() || '';
            const isIncoming = toAddr === normalizedAddress;

            const event: OpenTxEvent = {
              date: formatDate(timestamp),
              chain: 'Ronin',
              wallet: formatRoninAddress(address),
              txHash,
              from: formatRoninAddress(tx.from_address || ''),
              to: formatRoninAddress(tx.to_address || ''),
              txType: 'transfer',
              protocol: 'native',
              blockHeight: String(tx.block_height),
              explorerUrl: tx.explorers?.[0]?.url || `${chain.explorerUrl}/tx/${txHash}`,
            };

            const formattedAmount = formatAmount(value, chain.decimals);
            if (isIncoming) {
              event.receivedQty = formattedAmount;
              event.receivedCurrency = chain.symbol;
              event.notes = `Received RON`;
            } else {
              event.sentQty = formattedAmount;
              event.sentCurrency = chain.symbol;
              event.notes = `Sent RON`;
            }

            if (event.receivedQty || event.sentQty) {
              events.push(event);
            }
          }
        } else {
          // Create events for each token transfer
          for (const transfer of transfers) {
            const event: OpenTxEvent = {
              date: formatDate(timestamp),
              chain: 'Ronin',
              wallet: formatRoninAddress(address),
              txHash,
              from: formatRoninAddress(transfer.isIncoming ? transfer.counterparty : address),
              to: formatRoninAddress(transfer.isIncoming ? address : transfer.counterparty),
              txType: 'transfer',
              protocol: transfer.symbol,
              blockHeight: String(tx.block_height),
              explorerUrl: tx.explorers?.[0]?.url || `${chain.explorerUrl}/tx/${txHash}`,
            };

            if (transfer.isIncoming) {
              event.receivedQty = transfer.amount;
              event.receivedCurrency = transfer.symbol;
              event.notes = `Received ${transfer.symbol}`;
            } else {
              event.sentQty = transfer.amount;
              event.sentCurrency = transfer.symbol;
              event.notes = `Sent ${transfer.symbol}`;
            }

            events.push(event);
          }
        }

        processed++;
        if (onProgress) {
          // On last page, calculate progress toward the known total
          // On other pages, cap at 99% to avoid jumping to 100% prematurely
          const progress = isLastPage
            ? Math.min(Math.floor((processed / totalCount) * 100), 100)
            : Math.min(Math.floor((processed / Math.max(totalCount, processed + transactions.length)) * 100), 99);
          onProgress(progress);
        }
      }

      page++;
      // Safety limit to prevent infinite loops and rate limiting
      if (page > 50) {
        hasMore = false;
      }
    }

    if (onProgress) onProgress(100);
  } catch (error) {
    console.error('Error fetching Ronin transactions:', error);
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
  return /^0x[a-fA-F0-9]{40}$/.test(address) || /^ronin:[a-fA-F0-9]{40}$/.test(address);
}
