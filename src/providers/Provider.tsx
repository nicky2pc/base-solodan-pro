import React from 'react';
import { ProvidersProps } from '../types.ts';
import { FrameMultiplierProvider } from './FrameMultiplierProvider.tsx';
import WalletProvider from './FrameWalletProvider.tsx';

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <WalletProvider>
      <FrameMultiplierProvider>
        {children}
      </FrameMultiplierProvider>
    </WalletProvider>
  );
};

export default Providers;
