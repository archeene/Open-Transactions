import { OpenTxEvent } from '@/lib/types';
import { CHAINS, formatAmount, formatDate } from '@/lib/chains';

const chain = CHAINS.osmosis;

// Mintscan API key
const MINTSCAN_API_KEY = process.env.NEXT_PUBLIC_MINTSCAN_API_KEY || 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTM2OCwiaWF0IjoxNzY5ODc2Mzg2fQ.4E6horuc-xZ9vTX0eDGb3ZugB6jA96lmvd0QRop52b89BYzkc2kLIWrB5fO2Lbw7uVAaVe9PNS6VEcGt9bKlVQ';

// Fetch through proxy to avoid CORS
async function fetchThroughProxy(url: string): Promise<any> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${MINTSCAN_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  return response.json();
}

// Fetch transactions from Mintscan/Cosmostation LCD Proxy API
async function fetchTransactionsFromMintscan(
  address: string,
  page: number = 0
): Promise<{ hasMore: boolean; transactions: any[] }> {
  try {
    // Cosmostation LCD Proxy endpoint format:
    // https://apis.mintscan.io/:network/lcd/:url
    // We'll use the cosmos tx search endpoint through the proxy
    const offset = page * 100;
    const url = `https://apis.mintscan.io/osmosis/lcd/cosmos/tx/v1beta1/txs?events=message.sender%3D%27${address}%27&pagination.limit=100&pagination.offset=${offset}`;
    const result = await fetchThroughProxy(url);

    const items = result.tx_responses || result.txs || result.data || [];
    const hasMore = items.length === 100;

    return {
      hasMore,
      transactions: items,
    };
  } catch (error) {
    console.warn('Mintscan API error:', error);
    return { hasMore: false, transactions: [] };
  }
}

function denomToSymbol(denom: string): string {
  const denomMap: Record<string, string> = {
    'uosmo': 'OSMO',
    'uion': 'ION',
    'uatom': 'ATOM',
    'usdc': 'USDC',
    'ibc/ED07A3391A112B175915C8FA7438DDD30D8E4E5E': 'USDC',
    'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E85EB': 'USDC',
    'gamm/pool/1': 'OSMO/USDC LP',
    'gamm/pool/': 'LP',
  };

  if (denom.startsWith('ibc/')) {
    return 'IBC';
  }

  if (denom.startsWith('gamm/pool/')) {
    return `LP ${denom.split('/')[2] || ''}`;
  }

  return denomMap[denom] || denom.replace(/^u/, '').toUpperCase();
}

function parseAmount(amount: string, denom: string): string {
  // Most cosmos denoms have 6 decimals
  const decimals = 6;
  try {
    const amountBigInt = BigInt(amount || '0');
    const divisor = BigInt(10 ** decimals);
    const wholeAmount = amountBigInt / divisor;
    const remainder = amountBigInt % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${wholeAmount}.${remainderStr.replace(/0+$/, '')}`;
  } catch {
    return '0';
  }
}

export async function fetchAllTransactions(
  address: string,
  onProgress?: (progress: number) => void
): Promise<OpenTxEvent[]> {
  const events: OpenTxEvent[] = [];
  const seenTxs = new Set<string>();

  try {
    let page = 0;
    let hasMore = true;
    let processed = 0;
    let totalCount = 0;

    while (hasMore) {
      const { transactions, hasMore: morePages } = await fetchTransactionsFromMintscan(address, page);
      hasMore = morePages;

      if (!transactions || transactions.length === 0) {
        break;
      }

      // Check if this is the last page
      const isLastPage = !morePages || transactions.length < 100;

      // Update total count estimate
      if (page === 0 && transactions.length > 0) {
        totalCount = transactions.length * 10;
      } else if (isLastPage) {
        // Last page - we know the total now
        totalCount = processed + transactions.length;
      } else if (processed >= totalCount) {
        // Adjust estimate if we've exceeded it
        totalCount = processed * 2;
      }

      for (const tx of transactions) {
        // Handle both Cosmos tx_responses format and legacy format
        const txHash = tx.txhash || tx.tx_hash;
        if (!txHash) continue;

        if (seenTxs.has(txHash)) continue;
        seenTxs.add(txHash);

        // Get timestamp from different possible locations
        const timestamp = tx.timestamp
          ? new Date(tx.timestamp).getTime() / 1000
          : (tx.time || tx.block_signed_at)
            ? new Date(tx.time || tx.block_signed_at).getTime() / 1000
            : Date.now() / 1000;

        const event: OpenTxEvent = {
          date: formatDate(timestamp),
          chain: 'Osmosis',
          wallet: address,
          txHash,
          blockHeight: String(tx.height || tx.block_height),
          explorerUrl: `${chain.explorerUrl}/tx/${txHash}`,
          txType: 'transfer',
          protocol: 'bank',
        };

        // Parse body for messages (Cosmos tx_responses format)
        let body = tx.body;
        if (tx.tx?.body) body = tx.tx.body;
        const messages = body?.messages || [];

        for (const msg of messages) {
          const type = msg['@type'] || msg.type;

          if (type?.includes('MsgSend') || type?.includes('MsgTransfer')) {
            const value = msg.value || msg;

            if (type?.includes('MsgSend')) {
              const fromAddr = value.from_address;
              const toAddr = value.to_address;
              const amountList = value.amount || [];

              event.from = fromAddr;
              event.to = toAddr;

              for (const amountData of amountList) {
                const formattedAmount = parseAmount(amountData.amount, amountData.denom);
                const symbol = denomToSymbol(amountData.denom);

                if (toAddr === address) {
                  event.receivedQty = formattedAmount;
                  event.receivedCurrency = symbol;
                  event.notes = `Received from ${fromAddr?.slice(0, 10)}...`;
                } else if (fromAddr === address) {
                  event.sentQty = formattedAmount;
                  event.sentCurrency = symbol;
                  event.notes = `Sent to ${toAddr?.slice(0, 10)}...`;
                }
              }
            } else if (type?.includes('MsgTransfer')) {
              const fromAddr = value.sender;
              const toAddr = value.receiver;
              const tokenData = value.token;

              event.from = fromAddr;
              event.to = toAddr;

              if (tokenData) {
                const formattedAmount = parseAmount(tokenData.amount, tokenData.denom);
                const symbol = denomToSymbol(tokenData.denom);

                if (toAddr === address) {
                  event.receivedQty = formattedAmount;
                  event.receivedCurrency = symbol;
                  event.notes = `IBC Transfer from ${fromAddr?.slice(0, 10)}...`;
                } else if (fromAddr === address) {
                  event.sentQty = formattedAmount;
                  event.sentCurrency = symbol;
                  event.notes = `IBC Transfer to ${toAddr?.slice(0, 10)}...`;
                }
              }
            }
          }
        }

        // Check logs for transfer events if not found in messages
        if (!event.receivedQty && !event.sentQty) {
          const logs = tx.logs || [];

          for (const log of logs) {
            const logEvents = log.events || [];
            for (const ev of logEvents) {
              if (ev.type === 'transfer') {
                const attrs = ev.attributes || [];

                // Find transfer attributes
                const getAttr = (key: string) => {
                  const attr = attrs.find((a: any) => a.key === key);
                  return attr?.value;
                };

                const recipient = getAttr('recipient');
                const sender = getAttr('sender');
                const amount = getAttr('amount');

                if (amount && (recipient === address || sender === address)) {
                  const amountParts = amount.split(',');
                  for (const part of amountParts) {
                    const [amt, denom] = part.split(' ') || [part, 'uosmo'];
                    const formattedAmount = parseAmount(amt, denom);
                    const symbol = denomToSymbol(denom);

                    if (recipient === address) {
                      event.receivedQty = formattedAmount;
                      event.receivedCurrency = symbol;
                      event.notes = `Received from ${sender?.slice(0, 10)}...`;
                    } else if (sender === address) {
                      event.sentQty = formattedAmount;
                      event.sentCurrency = symbol;
                      event.notes = `Sent to ${recipient?.slice(0, 10)}...`;
                    }
                  }
                }
              }
            }
          }
        }

        // Add gas fee
        const authInfo = tx.auth_info || tx.tx?.auth_info;
        const feeAmount = authInfo?.fee?.amount?.[0];
        if (feeAmount && feeAmount.amount && feeAmount.amount !== '0') {
          event.feeAmount = parseAmount(feeAmount.amount, feeAmount.denom);
          event.feeCurrency = denomToSymbol(feeAmount.denom);
        }

        if (event.receivedQty || event.sentQty) {
          events.push(event);
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
      // Safety limit
      if (page > 100) {
        hasMore = false;
      }
    }

    // Final progress update if loop completes normally
    if (onProgress && processed > 0) onProgress(100);
  } catch (error) {
    console.error('Error fetching Osmosis transactions:', error);
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
  return /^osmo1[a-z0-9]{38}$/.test(address);
}
