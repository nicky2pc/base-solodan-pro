import React from 'react';
import './App.css';
import Game from './components/Game/Game';
import { Providers } from './providers/Provider';

function App() {
  return (
    <div className="App">
      <Providers>
        <Game />
      </Providers>
    </div>
  );
}

export default App;
