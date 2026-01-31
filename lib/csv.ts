import { OpenTxEvent } from './types';

// Escape CSV values
export function escapeCsv(value: string | undefined): string {
  if (!value) return '';
  // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Generate Awaken Tax compatible CSV
export function generateCsv(events: OpenTxEvent[], mode: 'strict' | 'enriched'): string {
  const strictHeaders = [
    'Date',
    'Received Quantity',
    'Received Currency',
    'Sent Quantity',
    'Sent Currency',
    'Fee Amount',
    'Fee Currency',
    'Transaction Hash',
    'Notes'
  ];

  const enrichedHeaders = [
    'Chain',
    'Wallet',
    'From',
    'To',
    'Tx Type',
    'Protocol',
    'Block Height',
    'Explorer URL'
  ];

  const headers = mode === 'strict'
    ? strictHeaders
    : [...strictHeaders, ...enrichedHeaders];

  const rows = [headers.map(escapeCsv).join(',')];

  for (const event of events) {
    const strictCols = [
      event.date,
      event.receivedQty,
      event.receivedCurrency,
      event.sentQty,
      event.sentCurrency,
      event.feeAmount,
      event.feeCurrency,
      event.txHash,
      event.notes,
    ];

    const enrichedCols = [
      event.chain,
      event.wallet,
      event.from,
      event.to,
      event.txType,
      event.protocol,
      event.blockHeight,
      event.explorerUrl,
    ];

    const cols = mode === 'strict'
      ? strictCols
      : [...strictCols, ...enrichedCols];

    rows.push(cols.map(escapeCsv).join(','));
  }

  return rows.join('\n');
}

// Download CSV as file
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
