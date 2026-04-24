import React, { useEffect } from 'react';
import { useAccount, useDisconnect, useConnect, useBalance as useWagmiBalance } from 'wagmi';

export default function LoginBtn() {
  const { isConnected, address, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending, variables } = useConnect();
  const { data: balance, refetch: refetchBalance } = useWagmiBalance({
    address,
    chainId: 8453,
  });

  useEffect(() => {
    if (isConnected) {
      refetchBalance();
    }
  }, [isConnected]);

  if (isConnected) {
    return (
      <>
        <button className='login-btn' onClick={() => disconnect()}>
          Logout
        </button>
        <div className='balance-container'>
          <p>
            {balance?.formatted ? Number(balance.formatted).toFixed(4) : '0.0000'}{' '}
            {balance?.symbol || 'ETH'}
          </p>
        </div>
      </>
    );
  }

  // prefer injected (Base App native wallet), fallback to first available
  const primaryConnector =
    connectors.find((c) => c.id === 'injected') ?? connectors[0];

  const isThisConnectorPending =
    isPending && variables?.connector?.id === primaryConnector?.id;

  const isLoading = isConnecting || isReconnecting || isThisConnectorPending;

  return (
    <button
      className='login-btn'
      onClick={() => primaryConnector && connect({ connector: primaryConnector })}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : 'Login'}
    </button>
  );
}
