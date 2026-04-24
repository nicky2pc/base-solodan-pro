import React, { useEffect } from 'react';
import { useAccount, useDisconnect, useConnect, useBalance as useWagmiBalance } from 'wagmi';

export default function LoginBtn() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending } = useConnect();
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

  return (
    <>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          className='login-btn'
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? 'Connecting...' : 'Login'}
        </button>
      ))}
    </>
  );
}
