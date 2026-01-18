import React from 'react';
import {PrivyProvider} from '@privy-io/react-auth';

export default function PrivyWalletProvider({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cm7qn49t001cqd4xbdns54wk6"
      config={{
        supportedChains: [
          {
            id: 8453,
            name: "Base",
            rpcUrls: {
              default: {
                http: ["https://mainnet.base.org"],
              },
              public: {
                http: ["https://mainnet.base.org"],
              },
            },
            blockExplorers: {
              default: {
                name: "BaseScan",
                url: "https://basescan.org",
              },
            },
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
        mfa: {
          noPromptOnMfaRequired: true,
        },
        appearance: {
          theme: 'light',
          accentColor: '#0000f5',
          logo: '',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}