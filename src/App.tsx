import React, { useEffect } from 'react';
import './App.css';
import Game from './components/Game/Game';
import { Providers } from './providers/Provider';

function App() {
  useEffect(() => {
    // Scale body once at mount based on actual viewport width.
    // Uses width (not height) so it never changes when browser toolbar appears/hides.
    const scale = Math.min(window.innerWidth / 800, 1);
    if (scale < 1) {
      document.body.style.transform = `scale(${scale})`;
      document.body.style.width = `${100 / scale}%`;
    }
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
