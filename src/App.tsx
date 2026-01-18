import React, { useEffect } from 'react';
import './App.css';
import Game from './components/Game/Game';
import { Providers } from './providers/Provider';
import { sdk } from '@farcaster/miniapp-sdk';

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="App">
      <Providers>
        <Game />
      </Providers>
    </div>
  );
}

export default App;
