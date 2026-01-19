import React, { useEffect, useState } from "react";
import "./MintPopup.css";
import { MintButton } from "./MintButton";

interface MintPopupProps {
  open: boolean;
  onClose: () => void;
  currentScore: number; // 👈 Новый проп
}

const MintPopup: React.FC<MintPopupProps> = ({ open, onClose, currentScore }) => {
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mintError, setMintError] = useState<string>('');
  const [hash, setHash] = useState<string | null>(null);
  const [buttonKey, setButtonKey] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      setHash(null);
      setMintStatus('');
      setMintError('');
    } else {
      setButtonKey(prevKey => prevKey + 1);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('mint-popup-overlay')) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  const handleMintSuccess = () => {
    setMintStatus('success');
  };

  const handleMintError = (errorMessage: string) => {
    setMintError(errorMessage);
    setMintStatus('error');
  };


  return (
    <div className={`mint-popup-overlay  ${open ? 'open' : ''}`}>
      <div className="mint-popup">
        <div className="mint-popup-content">
          <img src="/token.jpg" alt="Token" width={300} height={300} className="token-image" />
          <div className="mint-text">
            <h2>Mint Your Victory NFT</h2>
            <p>Score: {currentScore} points 🏆</p>
            {mintStatus === 'success' && <p className="success-message">Token minted successfully!</p>}
            {mintError && <p className="error-message">{mintError}</p>}
          </div>
          
          {open && (
            <MintButton 
              key={buttonKey}
              currentScore={currentScore} // 👈 Передаем скор
              onSuccess={handleMintSuccess}
              onError={handleMintError}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MintPopup;