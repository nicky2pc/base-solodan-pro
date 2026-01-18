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
}

// Helper function to detect user rejection errors
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

export function MintButton({ onSuccess, onError }: MintButtonProps) {
  const { isConnected, address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { connect } = useConnect();

  const [isLoadingTxData, setIsLoadingTxData] = useState(false);
  const [userRejected, setUserRejected] = useState(false);
  const [chainMismatch, setChainMismatch] = useState(false);
  const [wasMinted, setWasMinted] = useState(false);

  const {
    handleWagmiMint,
    writeHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    waitError,
  } = useTransactions();
  
  const MINT_CONTRACT_ADDRESS = "0x2De241B84F9062925c532735AB56857ad402c209";

  const isPending = isLoadingTxData || isWritePending || isConfirming;
  const successHandled = useRef(false);

  const targetChainId = base.id;

  // Reset wasMinted when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setWasMinted(false);
    }
  }, [isConnected]);

  // Reset rejection / mismatch flags
  useEffect(() => {
    if ((userRejected || chainMismatch) && !isPending) {
      const timer = setTimeout(() => {
        setUserRejected(false);
        setChainMismatch(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [userRejected, chainMismatch, isPending]);

  // Success handler
  useEffect(() => {
    if (isConfirmed && !successHandled.current) {
      successHandled.current = true;
      onSuccess();
      successHandled.current = false;
    }
  }, [isConfirmed, onSuccess]);

  // Error handling
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsLoadingTxData(false);
      setUserRejected(false);
      setWasMinted(false);
      setChainMismatch(false);
      successHandled.current = false;
    };
  }, []);

  const handleMint = async () => {
    try {
      setIsLoadingTxData(true);
      successHandled.current = false;
      setUserRejected(false);
      setChainMismatch(false);

      if (!isConnected || !address) {
        connect({ connector: farcasterMiniApp() });
        return;
      }

      // Ensure Base Mainnet
      try {
        switchChain({ chainId: targetChainId });
      } catch (error) {
        if (isUserRejectionError(error)) {
          setUserRejected(true);
          setIsLoadingTxData(false);
          return;
        }
      }

      await handleWagmiMint();
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
    <button
      className={`mint-button ${isPending ? 'disabled' : ''} ${
        userRejected ? 'rejected' : ''
      } ${chainMismatch ? 'chain-error' : ''}`}
      onClick={
        writeHash && wasMinted && isConnected
          ? () =>
              sdk.actions.openUrl(
                `https://basescan.org/tx/${writeHash}`
              )
          : handleMint
      }
      disabled={isPending}
    >
      {!isConnected
        ? 'Connect Wallet'
        : chainId !== targetChainId
        ? 'Switch Network'
        : isPending
        ? 'Processing...'
        : userRejected
        ? 'Transaction Canceled'
        : chainMismatch
        ? 'Network Mismatch'
        : writeHash && wasMinted
        ? 'View Transaction'
        : 'Mint Now'}
    </button>
  );
}
