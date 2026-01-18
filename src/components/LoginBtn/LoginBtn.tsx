import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useConnect, useBalance as useWagmiBalance } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { useMiniAppContext } from '../../hooks/useMiniAppContext.ts';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFrame } from '../../providers/FarcasterProvider.tsx';

export default function LoginBtn() {
  const {isConnected, address} = useAccount();
  const {disconnect} = useDisconnect();
  const {connect} = useConnect();
  const [isLoading, setIsLoading] = useState(false);
  const { data: balance, refetch: refetchBalance } = useWagmiBalance({
    address: address,
    chainId: 8453, // Base mainnet
  });
  const { isSDKLoaded, isEthProviderAvailable, context } = useFrame();

  useEffect(() => {
    if (isConnected) {
      refetchBalance();
    }
  }, [isConnected]);

  const handleLogin = async () => {
    try {
      if (isConnected) {
        await disconnect();
        return;
      }
  
  
      if (!isSDKLoaded || !isEthProviderAvailable || !context) {
        console.warn('SDK not ready or no eth provider');
        return;
      }
  
      const provider = sdk.wallet.ethProvider;
  
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      console.log('[🔑] User accounts:', accounts);
  
      await connect({
        connector: farcasterMiniApp(),
      });
  
    } catch (err) {
      console.error('🧨 Login error:', err);
    }
  };

  return (
    <>
      <button className='login-btn' onClick={() => handleLogin()} disabled={!isConnected && !isEthProviderAvailable}>
      {isConnected ? 'Logout' : 'Login'}
    </button>
      {
        isConnected && (
       <>
          <div className='balance-container'>
            <p>{balance?.formatted ? Number(balance.formatted).toFixed(4) : '0.0000'} {balance?.symbol || 'ETH'}</p>
          </div>
       </>
        )
      }
    </>
  )
}
