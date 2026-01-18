import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";

export const config = createConfig({
  chains: [base],
  syncConnectedChain: false,
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
