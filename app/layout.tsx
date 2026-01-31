import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChainScan | Multi-Chain Transaction Export',
  description: 'Export blockchain transactions for tax reporting. Supports Bittensor, Polkadot, Osmosis, Ronin and more. Generate Awaken Tax compatible CSVs instantly.',
  keywords: ['crypto', 'tax', 'blockchain', 'transactions', 'csv', 'awaken', 'bittensor', 'polkadot', 'osmosis', 'ronin'],
  openGraph: {
    title: 'ChainScan | Multi-Chain Transaction Export',
    description: 'Export blockchain transactions for tax reporting',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#001a4d]">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-white">
                    Chain<span className="text-primary">Scan</span>
                  </span>
                </div>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-white/40 text-sm">
                  Export transactions in{' '}
                  <a
                    href="https://help.awaken.tax/en/articles/10422149-how-to-format-your-csv-for-awaken-tax"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Awaken Tax
                  </a>{' '}
                  compatible format
                </p>
                <p className="text-white/40 text-sm">
                  Open source • No wallet connection required
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
