import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import './CharacterSelect.css';

const PREMIUM_CONTRACT = "0x37e80527E81Af0789c0551F8948dF812Fb45801E" as `0x${string}`;
const PREMIUM_ABI = [
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasPremium",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

interface CharacterSelectProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelect: (characterType: 'basic' | 'premium') => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ 
  isOpen, 
  onClose, 
  onCharacterSelect 
}) => {
  const { address, isConnected } = useAccount();
  const [selectedChar, setSelectedChar] = useState<'basic' | 'premium'>('basic');
  
  // Проверяем владение Premium NFT
  const { data: hasPremium, refetch } = useReadContract({
    address: PREMIUM_CONTRACT,
    abi: PREMIUM_ABI,
    functionName: 'hasPremium',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected
    }
  });

  // Минт Premium NFT
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetch(); // Обновляем статус владения
    }
  }, [isSuccess, refetch]);

  const handleMintPremium = async () => {
    if (!address) return;
    
    writeContract({
      address: PREMIUM_CONTRACT,
      abi: PREMIUM_ABI,
      functionName: 'mint',
      value: BigInt('1000000000000000') // 0.001 ETH
    });
  };

  const handleSelect = () => {
    if (selectedChar === 'premium' && !hasPremium) {
      alert('You need to own Premium NFT first!');
      return;
    }
    onCharacterSelect(selectedChar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="character-select-overlay">
      <div className="character-select-modal">
        <h2>Choose Your Character</h2>
        
        <div className="characters-grid">
          {/* Basic Character */}
          <div 
            className={`character-card ${selectedChar === 'basic' ? 'selected' : ''}`}
            onClick={() => setSelectedChar('basic')}
          >
            <img src="/chars/15.svg" alt="Basic Jesse" />
            <h3>Basic Jesse</h3>
            <div className="stats">
              <p>🔫 Fire Rate: 200ms</p>
              <p>💨 Speed: 2.0</p>
              <p>💥 Damage: 1</p>
            </div>
            <span className="price">FREE</span>
          </div>

          {/* Premium Character */}
          <div 
            className={`character-card premium ${selectedChar === 'premium' ? 'selected' : ''} ${!hasPremium ? 'locked' : ''}`}
            onClick={() => hasPremium && setSelectedChar('premium')}
          >
            {!hasPremium && <div className="lock-overlay">🔒</div>}
            <img src="/chars/premium.svg" alt="Premium Jesse" />
            <h3>Premium Jesse ⭐</h3>
            <div className="stats">
              <p>🔫 Fire Rate: 120ms</p>
              <p>💨 Speed: 2.5</p>
              <p>💥 Damage: 2</p>
              <p>❤️ +2 HP</p>
            </div>
            
            {!hasPremium ? (
              <button 
                className="mint-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMintPremium();
                }}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? 'Minting...' : 'Mint for 0.001 ETH'}
              </button>
            ) : (
              <span className="price owned">OWNED ✓</span>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button 
            onClick={handleSelect} 
            className="btn-primary"
            disabled={selectedChar === 'premium' && !hasPremium}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};