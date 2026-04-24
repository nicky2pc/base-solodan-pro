# Base App Migration: Farcaster SDK → Standard Web App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Mondalak game from the deprecated Farcaster mini-app SDK to the new Base App standard web app stack (wagmi v3 + `baseAccount` connector), fixing wallet connection and lag.

**Architecture:** Remove all `@farcaster/*` packages and SDK calls. Replace `FarcasterProvider` + `FrameWalletProvider` with a single wagmi config using `baseAccount()` and `injected()` connectors from `wagmi/connectors`. User identity moves from FID to wallet address via `useAccount()`.

**Tech Stack:** wagmi v3.3.2 (already installed), viem 2.44.1, `@base-org/account` (new), `@tanstack/react-query` v5

---

## Context: What changed on April 9, 2026

Base App deprecated the Farcaster mini-app spec. All apps now run as standard web apps. Deprecated SDK methods (per official docs):
- `sdk.actions.ready()` → **not needed**, app is ready when it loads
- `sdk.actions.openUrl(url)` → `window.open(url, '_blank')`
- `sdk.actions.composeCast({...})` → **no replacement in Base App**, remove button
- Farcaster identity/FID → `useAccount()` wallet address

The old `farcasterMiniApp()` wagmi connector never connects because Base App no longer injects the Farcaster SDK → always guest mode. The `FarcasterProvider` useEffect loops retrying `sdk.context` → re-renders → lag.

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| DELETE | `src/providers/FarcasterProvider.tsx` | Entire file gone |
| DELETE | `src/hooks/useMiniAppContext.ts` | Entire file gone (unused after migration) |
| REWRITE | `package.json` | Remove 7 `@farcaster/*` packages, add `@base-org/account` |
| REWRITE | `src/providers/FrameWalletProvider.tsx` | `baseAccount()` + `injected()` connectors |
| REWRITE | `src/providers/Provider.tsx` | Remove `FrameProvider` wrapper |
| REWRITE | `src/App.tsx` | Remove `sdk` import and `sdk.actions.ready()` |
| MODIFY | `src/components/LoginBtn/LoginBtn.tsx` | Standard wagmi connect via `connectors.map` |
| MODIFY | `src/components/Game/Game.tsx` | Remove 6 Farcaster references, fix share buttons, fix login handler |

---

## Task 1: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove Farcaster packages and add @base-org/account**

Replace the `dependencies` section. Remove these 7 packages:
`@farcaster/auth-client`, `@farcaster/auth-kit`, `@farcaster/frame-node`, `@farcaster/frame-sdk`, `@farcaster/frame-wagmi-connector`, `@farcaster/miniapp-sdk`, `@farcaster/miniapp-wagmi-connector`

Also pin `wagmi` and `viem` (they were `latest` which caused wagmi v3 to install — wagmi v3 is correct, keep it).
Also remove `@privy-io/react-auth` (Privy is not in the providers tree, unused).

Final `dependencies` block (replace entirely):
```json
{
  "name": "tanks",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@base-org/account": "latest",
    "@tanstack/react-query": "^5.45.1",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.5.2",
    "@wagmi/core": "^2.17.1",
    "ethers": "^6.13.5",
    "nipplejs": "^0.10.2",
    "react": "^18.3.1",
    "react-device-detect": "^2.2.3",
    "react-dom": "^18.3.1",
    "uuid": "^13.0.0",
    "vconsole": "^3.15.1",
    "viem": "^2.44.1",
    "wagmi": "^3.3.2",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  },
  "devDependencies": {
    "@types/node": "^20.17.46",
    "@types/react": "^18.3.21",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^4.4.1",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.4",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Reinstall dependencies**

```bash
cd /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro
rm -rf node_modules package-lock.json
npm install
```

Expected: install completes with no peer dependency errors about wagmi.

- [ ] **Step 3: Verify key packages installed**

```bash
cat package-lock.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
pkgs=['wagmi','viem','@base-org/account']
[print(k, d['packages'].get('node_modules/'+k,{}).get('version','MISSING')) for k in pkgs]
"
```

Expected output:
```
wagmi 3.x.x
viem 2.x.x
@base-org/account [some version]
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: migrate from Farcaster SDK to Base standard web app stack"
```

---

## Task 2: Rewrite FrameWalletProvider.tsx

**Files:**
- Modify: `src/providers/FrameWalletProvider.tsx`

- [ ] **Step 1: Replace file content**

```tsx
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    baseAccount({
      appName: "Mondalak",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

Note: `config` is still exported because `src/hooks/useTransactions.ts` imports it.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `FrameWalletProvider.tsx`. (There will be errors from other files we haven't fixed yet — that's fine at this step.)

- [ ] **Step 3: Commit**

```bash
git add src/providers/FrameWalletProvider.tsx
git commit -m "feat: replace Farcaster wagmi connector with baseAccount + injected"
```

---

## Task 3: Delete FarcasterProvider.tsx and useMiniAppContext.ts

**Files:**
- Delete: `src/providers/FarcasterProvider.tsx`
- Delete: `src/hooks/useMiniAppContext.ts`

- [ ] **Step 1: Delete FarcasterProvider**

```bash
rm /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro/src/providers/FarcasterProvider.tsx
```

- [ ] **Step 2: Delete useMiniAppContext**

```bash
rm /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro/src/hooks/useMiniAppContext.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove FarcasterProvider and useMiniAppContext (deprecated Farcaster SDK)"
```

---

## Task 4: Rewrite Provider.tsx

**Files:**
- Modify: `src/providers/Provider.tsx`

- [ ] **Step 1: Replace file content**

```tsx
import React from 'react';
import { ProvidersProps } from '../types.ts';
import { FrameMultiplierProvider } from './FrameMultiplierProvider.tsx';
import WalletProvider from './FrameWalletProvider.tsx';

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <WalletProvider>
      <FrameMultiplierProvider>
        {children}
      </FrameMultiplierProvider>
    </WalletProvider>
  );
};

export default Providers;
```

- [ ] **Step 2: Commit**

```bash
git add src/providers/Provider.tsx
git commit -m "chore: remove FarcasterProvider from root providers tree"
```

---

## Task 5: Fix App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove sdk import and ready() call**

`sdk.actions.ready()` is deprecated. Per docs: "Not needed. Your app is ready to display when it loads."

Replace file content:
```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "chore: remove deprecated sdk.actions.ready() from App"
```

---

## Task 6: Rewrite LoginBtn.tsx

**Files:**
- Modify: `src/components/LoginBtn/LoginBtn.tsx`

- [ ] **Step 1: Replace file content**

The new pattern: iterate `connectors` from `useConnect()` — wagmi auto-discovers `injected` (browser wallet) and `baseAccount` (Base App wallet). In Base App the injected wallet IS the Base Account, so the user sees one button.

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LoginBtn/LoginBtn.tsx
git commit -m "feat: replace Farcaster SDK login with standard wagmi connector login"
```

---

## Task 7: Fix Game.tsx — Remove Farcaster SDK references

**Files:**
- Modify: `src/components/Game/Game.tsx`

This is the biggest file. Make changes in this exact order to avoid breaking the build mid-edit.

### Step 1: Fix imports (lines 20–24)

- [ ] **Remove 3 Farcaster imports**

Find and remove these lines:
```tsx
import farcasterMiniApp from '@farcaster/miniapp-wagmi-connector';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFrame } from '../../providers/FarcasterProvider.tsx';
```

Also remove `useConnect` from the wagmi import since it's no longer needed in Game.tsx (LoginBtn handles connect):
```tsx
// Change this line:
import { useAccount, useConnect, useDisconnect } from 'wagmi';
// To:
import { useAccount } from 'wagmi';
```

### Step 2: Remove useFrame destructure (line 36)

- [ ] **Remove the useFrame() call**

Remove this line entirely:
```tsx
const { isSDKLoaded, isEthProviderAvailable, context, actions } = useFrame();
```

Also remove `const {connect} = useConnect();` from line 35 if present.

### Step 3: Remove sdk.actions.ready() call (lines 298–317)

- [ ] **Remove ready() and simplify init useEffect**

Find:
```tsx
useEffect(() => {
    const init = async () => {
      sdk.actions.ready();
      console.log('SDK ready');
      if (isMobileDevice()) {
        // Initial joystick setup - no need to call initJoystick() here
        // We'll handle it in the fullscreen effect below
      }
    };
  
    init();
  
    return () => {
      if (managerRef.current) {
        console.log('Destroying nipplejs on component unmount');
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);
```

Replace with (remove only the init/ready parts, keep cleanup):
```tsx
useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);
```

### Step 4: Rewrite handleLogin (lines 950–970)

- [ ] **Replace handleLogin with standard wagmi connect**

Find:
```tsx
const handleLogin = async () => {
    try {
  
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
```

Replace with (Game.tsx delegates to LoginBtn — but handleLogin is also called from UI buttons inside Game.tsx, so keep it, use `useConnect`):

First add `useConnect` back to the wagmi import:
```tsx
import { useAccount, useConnect } from 'wagmi';
```

Then replace handleLogin:
```tsx
const { connect, connectors } = useConnect();

const handleLogin = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };
```

### Step 5: Remove dead code block (lines 990–1003)

- [ ] **Remove the dead `!isEthProviderAvailable && false` block**

Find and remove:
```tsx
  if (!isEthProviderAvailable && false) {
   return (
     <div className="bg-mobile bg">
       <div className="mobile-warning">
         <h2>Browser is not supported</h2>
         <p>Launch this game on Warpcast to play.</p>
         <a className="warpcast-button" href="https://warpcast.com/miniapps/ywWY5OuZbl_0/monagayanimals" target="_blank" style={{  backgroundColor: '#472A91', color: 'white', display: 'flex', width: '300px', fontWeight: '500', marginTop: '10px', fontSize: '16px', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                 >
                   Play
                   </a>
       </div>
     </div>
   )
  }
```

### Step 6: Fix login buttons (lines 1138 and 1230)

- [ ] **Remove `disabled={!isEthProviderAvailable}` from both login buttons**

Line ~1138: Change:
```tsx
<button className='ui-login-btn' style={{minWidth: "240px"}} onClick={handleLogin} disabled={!isEthProviderAvailable}>
```
To:
```tsx
<button className='ui-login-btn' style={{minWidth: "240px"}} onClick={handleLogin}>
```

Line ~1230: Change:
```tsx
<button className='ui-login-btn' onClick={handleLogin} disabled={!isEthProviderAvailable}>
```
To:
```tsx
<button className='ui-login-btn' onClick={handleLogin}>
```

### Step 7: Fix share buttons (lines ~1247 and ~1259)

- [ ] **Replace `sdk.actions.openUrl` with `window.open`**

Find:
```tsx
await sdk.actions.openUrl(twitterUrl);
```
Replace with:
```tsx
window.open(twitterUrl, '_blank');
```

- [ ] **Remove `composeCast` button entirely**

`composeCast` has no replacement in Base App. Find and remove the entire button:
```tsx
<button
    onClick={async () => {
      const text = getShareText();
      const url = "https://base-solodan-pro.vercel.app";

      try {
        await sdk.actions.composeCast({
          text: text,
          embeds: [url]
        });
      } catch (error) {
        console.error("Compose cast failed:", error);
        // можно добавить fallback на warpcast url если очень хочется
      }
    }}
    style={{...}}
  >
    ...
</button>
```

### Step 8: Remove unused state

- [ ] **Remove `warpcastShareLoading` state**

Find and remove:
```tsx
const [warpcastShareLoading, setWarpcastShareLoading] = useState(false);
```

### Step 9: Verify TypeScript

- [ ] **Run TypeScript check**

```bash
cd /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro
npx tsc --noEmit 2>&1
```

Expected: 0 errors. Fix any remaining references to removed variables.

- [ ] **Commit**

```bash
git add src/components/Game/Game.tsx
git commit -m "feat: remove Farcaster SDK from Game.tsx, fix share/login to use standard web APIs"
```

---

## Task 8: Verify build and run

- [ ] **Step 1: Build**

```bash
cd /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro
npm run build 2>&1
```

Expected: Build completes with no errors. May have warnings (unused vars, etc.) — those are OK.

- [ ] **Step 2: Dev server smoke test**

```bash
cd /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro
npm run dev
```

Expected: Vite starts, no runtime errors in console. Game loads. Login button visible and not disabled.

- [ ] **Step 3: Verify no Farcaster imports remain**

```bash
grep -r "farcaster\|miniapp-sdk\|frame-sdk\|sdk\.actions\|sdk\.wallet" \
  /Users/nick/Desktop/Work/Code/soft/Base/base-mobile-pro/src/ \
  --include="*.ts" --include="*.tsx"
```

Expected: **no output** (zero matches).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Base App migration complete — Farcaster SDK removed, standard web app"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `sdk.actions.ready()` removed from App.tsx and Game.tsx
- [x] `sdk.actions.openUrl()` → `window.open()`
- [x] `sdk.actions.composeCast()` → button removed
- [x] Farcaster wagmi connector → `baseAccount()` + `injected()`
- [x] `isEthProviderAvailable` guards removed (always connected in Base App)
- [x] All `@farcaster/*` packages removed from package.json
- [x] `@base-org/account` added
- [x] `FarcasterProvider` deleted
- [x] `useMiniAppContext` deleted
- [x] `handleLogin` uses standard wagmi `connect()`
- [x] LoginBtn.tsx uses `connectors.map`
- [x] `wagmi` pinned to `^3.3.2` (not `latest`)

**What is NOT changed (intentionally):**
- `FrameMultiplierProvider` — delta-time logic, unrelated to migration
- `src/game/utils.ts` — uses ethers.js directly, no Farcaster references
- `src/hooks/useTransactions.ts` — uses wagmi hooks + imports `config` from FrameWalletProvider (still works after rewrite)
- `src/hooks/useBalance.ts` — uses wagmi, no Farcaster
- All game logic (canvas, nipplejs, enemies, bullets, etc.)
