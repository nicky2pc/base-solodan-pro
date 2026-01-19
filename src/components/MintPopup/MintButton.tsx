import React, { useState, useEffect, useRef } from 'react';
import {
  useAccount,
  useConnect,
  useSwitchChain,
} from 'wagmi';
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { base } from "wagmi/chains";
import { useTransactions } from '../../hooks/useTransactions';
import { sdk } from '@farcaster/miniapp-sdk';

interface MintButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  currentScore: number; // 👈 Новый проп
}

function isUserRejectionError(error: any): boolean {
  if (!error) return false;
  const errorMessage = error.message || error.toString();
  const errorMessageLower = errorMessage.toLowerCase();
  return (
    errorMessageLower.includes('user rejected') ||
    errorMessageLower.includes('user denied') ||
    errorMessageLower.includes('rejected by user') ||
    errorMessageLower.includes('transaction declined') ||
    errorMessageLower.includes('transaction was rejected') ||
    errorMessageLower.includes('user cancelled') ||
    errorMessageLower.includes('user canceled') ||
    errorMessageLower.includes('action_rejected') ||
    (error.code && (error.code === 4001 || error.code === 'ACTION_REJECTED'))
  );
}

export function MintButton({ onSuccess, onError, currentScore }: MintButtonProps) {
  const { isConnected, address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { connect } = useConnect();

  const [isLoadingTxData, setIsLoadingTxData] = useState(false);
  const [userRejected, setUserRejected] = useState(false);
  const [chainMismatch, setChainMismatch] = useState(false);
  const [wasMinted, setWasMinted] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const {
    handleWagmiMint,
    writeHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    waitError,
  } = useTransactions();
  
  const MINT_CONTRACT_ADDRESS = "0x184F7c859212054fC569B13D163BddDb9C08adEb";
  const MIN_SCORE_REQUIRED = 5;

  const isPending = isLoadingTxData || isWritePending || isConfirming;
  const successHandled = useRef(false);
  const targetChainId = base.id;

  useEffect(() => {
    if (!isConnected) {
      setWasMinted(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if ((userRejected || chainMismatch) && !isPending) {
      const timer = setTimeout(() => {
        setUserRejected(false);
        setChainMismatch(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userRejected, chainMismatch, isPending]);

  useEffect(() => {
    if (isConfirmed && !successHandled.current) {
      successHandled.current = true;
      onSuccess();
      successHandled.current = false;
    }
  }, [isConfirmed, onSuccess]);

  useEffect(() => {
    if (writeError || waitError) {
      const error = writeError || waitError;
      if (isUserRejectionError(error)) {
        setUserRejected(true);
      } else if (
        error?.message?.includes('chain') &&
        error?.message?.includes('does not match')
      ) {
        setChainMismatch(true);
      } else {
        onError(error?.message || 'Transaction failed');
      }
    }
  }, [writeError, waitError, onError]);

  useEffect(() => {
    return () => {
      setIsLoadingTxData(false);
      setUserRejected(false);
      setWasMinted(false);
      setChainMismatch(false);
      setScoreError(null);
      successHandled.current = false;
    };
  }, []);

  const handleMint = async () => {
    try {
      // Проверка скора
      if (currentScore < MIN_SCORE_REQUIRED) {
        setScoreError(`Need ${MIN_SCORE_REQUIRED}+ points to mint (current: ${currentScore})`);
        return;
      }

      setIsLoadingTxData(true);
      setScoreError(null);
      successHandled.current = false;
      setUserRejected(false);
      setChainMismatch(false);

      if (!isConnected || !address) {
        connect({ connector: farcasterMiniApp() });
        return;
      }

      try {
        switchChain({ chainId: targetChainId });
      } catch (error) {
        if (isUserRejectionError(error)) {
          setUserRejected(true);
          setIsLoadingTxData(false);
          return;
        }
      }

      const result = await handleWagmiMint(currentScore);
      
      if (result.status === 'error') {
        setScoreError(result.error);
        setIsLoadingTxData(false);
        return;
      }
      
      setWasMinted(true);
    } catch (error) {
      if (isUserRejectionError(error)) {
        setUserRejected(true);
        setWasMinted(false);
      } else if (
        error instanceof Error &&
        error.message.includes('chain') &&
        error.message.includes('does not match')
      ) {
        setChainMismatch(true);
        setWasMinted(false);
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Something went wrong during minting';
        onError(errorMessage);
        setWasMinted(false);
      }
    } finally {
      setIsLoadingTxData(false);
    }
  };

  return (
    <>
      {scoreError && (
        <p style={{ 
          color: '#ef4444', 
          fontWeight: 600, 
          marginBottom: '12px',
          textAlign: 'center' 
        }}>
          {scoreError}
        </p>
      )}
      
      <button
        className={`mint-button ${isPending ? 'disabled' : ''} ${
          userRejected ? 'rejected' : ''
        } ${chainMismatch ? 'chain-error' : ''} ${
          currentScore < MIN_SCORE_REQUIRED ? 'disabled' : ''
        }`}
        onClick={
          writeHash && wasMinted && isConnected
            ? () =>
                sdk.actions.openUrl(
                  `https://basescan.org/tx/${writeHash}`
                )
            : handleMint
        }
        disabled={isPending || currentScore < MIN_SCORE_REQUIRED}
      >
        {!isConnected
          ? 'Connect Wallet'
          : chainId !== targetChainId
          ? 'Switch Network'
          : currentScore < MIN_SCORE_REQUIRED
          ? `Need ${MIN_SCORE_REQUIRED}+ points to mint`
          : isPending
          ? 'Processing...'
          : userRejected
          ? 'Transaction Canceled'
          : chainMismatch
          ? 'Network Mismatch'
          : writeHash && wasMinted
          ? 'View Transaction'
          : 'Mint for 0.0001 ETH'}
      </button>
    </>
  );
}