# @tetherto/pear-wrk-wdk

Note: This package is published as `@tetherto/pear-wrk-wdk` (folder name: `pear-wrk-wdk`).

A cross-runtime WDK manager and worklet bundle for mobile (iOS/Android) and Node environments. It unifies multi-chain wallet operations (EVM, TON, TRON, BTC, Solana) with optional account abstraction, provides a generated worklet bundle for React Native Bare Kit, and ships an HRPC schema for host↔worklet communication.

### 🔍 About WDK

Part of the WDK (Wallet Development Kit) ecosystem for building secure, non-custodial wallets with unified blockchain access, stateless design, and full user control.

See docs at `https://docs.wallet.tether.io`.

### 🌟 Features

- Unified manager API over multiple chains: Ethereum, Arbitrum, Polygon, TON, TRON, Bitcoin, Solana
- Account abstraction support (EVM 4337, TON gasless, TRON gasfree)
- Pluggable per-chain configs; multi-seed or single-seed inputs
- Fee rates, address management, transfers, token balances, and receipts
- Prebuilt worklet bundle for mobile via `bare-pack` (generated on postinstall)
- HRPC spec and docs for host↔worklet RPC

## 🧩 Architecture Overview

- **WDK (default export)**: Multi-chain wallet manager that dynamically loads per-chain wallet packages and exposes a unified API.
- **Worklet bundle (`bundle`)**: Prebuilt module produced by `bare-pack` on postinstall, intended for React Native Bare to run wallet logic off the main JS thread.
- **HRPC**: Typed RPC interface between host and worklet (see `hrpc-doc.md`).
- **Choose a mode**:
    - Use `WDK` directly in Node or simple React Native apps.
    - Use `bundle` + `HRPC` in RN Bare apps that require background/off-thread execution.

## 🧱 Platform Prerequisites

- Node.js 18+ recommended
- iOS toolchain (Xcode) and Android NDK/SDK when regenerating bundles
- `npx` available to run `bare-pack`

## ⬇️ Installation

```bash
npm install @tetherto/pear-wrk-wdk
```

## 🚀 Quick Start

### Importing

```javascript
import WDK, { HRPC, bundle } from '@tetherto/pear-wrk-wdk'
```

- `default` export: `WDK` (multi-chain manager)
- `HRPC`: exported spec for host↔worklet RPC
- `bundle`: prebuilt worklet (`bundle/worklet.bundle.mjs`) generated on postinstall

### Creating the Manager

You can pass a single seed (used for all chains) or a map of per-chain seeds.

```javascript
const seed = 'test test test ...' // BIP39 mnemonic string or Uint8Array

const wdk = new WDK(seed, {
  ethereum: { provider: 'https://eth-mainnet.example', transferMaxFee: 1_000_000_000n },
  arbitrum: { provider: 'https://arb1.example' },
  polygon:  { provider: 'https://polygon.example' },
  ton:      { /* TON config */ },
  tron:     { /* TRON config */ },
  bitcoin:  { /* BTC config */ },
  solana:   { /* Solana config */ }
})
```

Or with per-chain seeds:

```javascript
const wdk = new WDK({
  ethereum: 'seed phrase...',
  arbitrum: 'seed phrase...',
  polygon:  'seed phrase...',
  ton:      'seed phrase...',
  tron:     'seed phrase...',
  bitcoin:  'seed phrase...',
  solana:   'seed phrase...'
}, {/* same config object as above */})
```

### Accounts and Addresses

```javascript
// EVM example: get account by index (BIP-44 m/44'/60'/0'/0/index)
const account = await wdk.getAccount('ethereum', 0)
const address = await wdk.getAddress('ethereum', 0)

// Custom path
const accountByPath = await wdk.getAccountByPath('ethereum', "0'/0/5")

// Fee rates (chain-specific)
const fees = await wdk.getFeeRates('ethereum')
```

### Transfers and Quotes (Native)

```javascript
// Quote native transfer fee
const quote = await wdk.quoteSendTransaction('ethereum', 0, {
  to: '0xRecipient',
  value: 1000000000000000n // 0.001 ETH
})

// Send native transfer
const result = await wdk.sendTransaction('ethereum', 0, {
  to: '0xRecipient',
  value: 1000000000000000n
})
console.log(result.hash)
```

### Account Abstraction Flows

Supported on EVM (ERC-4337), TON (gasless), TRON (gasfree).

```javascript
// Derive an abstracted account and read balances
const aaAddress = await wdk.getAbstractedAddress('ethereum', 0)
const aaNativeBalance = await wdk.getAbstractedAddressBalance('ethereum', 0)

// Token balance (e.g., ERC20 on EVM)
const tokenBalance = await wdk.getAbstractedAddressTokenBalance(
  'ethereum', 0, '0xdAC17F958D2ee523a2206206994597C13D831ec7'
)

// Token transfer via AA
const transfer = await wdk.abstractedAccountTransfer('ethereum', 0, {
  token: '0xdAC17F...ec7',
  recipient: '0xRecipient',
  amount: 1_000_000n // base units
}, {
  // Optionally override configured transferMaxFee or paymaster token
  transferMaxFee: 2_000_000n,
  paymasterToken: { address: '0xPaymasterToken' }
})

// Quote AA transfer
const transferQuote = await wdk.abstractedAccountQuoteTransfer('ethereum', 0, {
  token: '0xdAC17F...ec7',
  recipient: '0xRecipient',
  amount: 1_000_000n
})

// AA send transaction (array of EVM tx objects)
const txResult = await wdk.abstractedSendTransaction('ethereum', 0, [{
  to: '0xContract',
  value: 0,
  data: '0x...' // encoded calldata
}])

// Receipt lookup
const receipt = await wdk.getTransactionReceipt('ethereum', 0, txResult.hash)
```


```javascript
const approveTx = await wdk.getApproveTransaction({
  token: '0xdAC17F...ec7',
  recipient: '0xSpender',
  amount: 1000000n
})
// { to, value: 0, data }
```

### Disposing

```javascript
wdk.dispose()

## 🔌 Integration Guide (React Native Bare)

1. Install the package; `postinstall` generates the bundle automatically.
2. Import `bundle` early in app startup to ensure the worklet code is loaded.
3. Use `HRPC` requests (see `hrpc-doc.md`) to call worklet commands, or call `WDK` directly if off-thread execution is not required.
4. For account abstraction, ensure relevant chain configs include `paymasterToken` if needed.

Minimal example:

```javascript
import WDK, { bundle, HRPC } from '@tetherto/pear-wrk-wdk'
const wdk = new WDK(seed, config)
const address = await wdk.getAddress('ethereum', 0)
```
```

## 📚 API Reference

### WDK

Constructor:

```javascript
new WDK(seedOrSeeds, config)
```

- `seedOrSeeds`: `string | Uint8Array | { ethereum, arbitrum, polygon, ton, tron, bitcoin, solana }`
- `config`: `{ ethereum, arbitrum, polygon, ton, tron, bitcoin, solana }` where each chain entry matches its wallet package config

Methods (async unless noted):

- `getAccount(blockchain, index=0): Promise<IWalletAccount>`
- `getAccountByPath(blockchain, path): Promise<IWalletAccount>`
- `getFeeRates(blockchain): Promise<FeeRates>`
- `getAddress(blockchain, index): Promise<string>`
- `getAddressBalance(blockchain, index): Promise<number>`
- `quoteSendTransaction(blockchain, index, options): Promise<{ fee: bigint }>`
- `sendTransaction(blockchain, index, options): Promise<{ hash: string, fee: bigint }>`
- `getAbstractedAccount(blockchain, index=0): Promise<IWalletAccount>`
- `getAbstractedAccountByPath(blockchain, path): Promise<IWalletAccount>`
- `getAbstractedAddress(blockchain, index): Promise<string>`
- `getAbstractedAddressBalance(blockchain, index): Promise<number>`
- `getAbstractedAddressTokenBalance(blockchain, index, tokenAddress): Promise<number>`
- `getAbstractedAddressPaymasterTokenBalance(blockchain, index): Promise<number>`
- `abstractedAccountTransfer(blockchain, index, transferOptions, transferConfig?): Promise<TransferResult>`
- `abstractedAccountQuoteTransfer(blockchain, index, transferOptions, transferConfig?): Promise<Omit<TransferResult,'hash'>>`
- `abstractedSendTransaction(blockchain, index, evmTransactions[], transferConfig?): Promise<TransactionResult>`
- `getTransactionReceipt(blockchain, index, hash): Promise<unknown | null>`
- `getApproveTransaction({ token, recipient, amount }): Promise<EvmTransaction>`
- `dispose(): void`

Supported blockchains enum values: `ethereum`, `arbitrum`, `polygon`, `ton`, `tron`, `bitcoin`, `solana`.

## 📦 Bundle Lifecycle & Performance

The prebuilt bundle is generated on `postinstall` via `bare-pack` for common iOS and Android targets.

- Regenerate when updating targets or this package: `npm run gen:bundle`.
- If CI cannot run `bare-pack`, consider committing the bundle to the repo.
- Performance: load once at startup and reuse the HRPC context to avoid re-initialization costs.

```javascript
import { bundle } from '@tetherto/pear-wrk-wdk'
// bundle points to bundle/worklet.bundle.mjs
```

Targets (from `gen:bundle`):
- iOS: `ios-arm64`, `ios-arm64-simulator`, `ios-x64-simulator`
- Android: `android-arm`, `android-arm64`, `android-ia32`, `android-x64`

## 🔌 HRPC

An HRPC schema and helpers are provided to integrate the worklet in a host app. See `hrpc-doc.md` for the current commands (e.g., `workletStart`, `getAddress`, `sendTransaction`, AA variants, etc.).

```javascript
import { HRPC } from '@tetherto/pear-wrk-wdk'
// Use HRPC.spec / messages as needed in your host runtime
```

## 🌐 Supported Chains

- Ethereum, Arbitrum, Polygon (EVM and Account Abstraction via `@tetherto/wdk-wallet-evm` and `@tetherto/wdk-wallet-evm-erc-4337`)
- TON (standard and gasless variants)
- TRON (standard and gasfree variants)
- Bitcoin, Solana

## 🔒 Security Considerations

- Treat seed phrases and private keys as highly sensitive; never log them
- Use trusted RPC endpoints; consider running your own nodes in production
- Always estimate costs before sending transactions
- Dispose managers when no longer needed to clear in-memory secrets

## 🛠️ Development

```bash
# Install deps
npm install

# Generate worklet bundle (also runs on postinstall)
npm run gen:bundle

# Generate schemas and HRPC docs
npm run gen:schema

# Build TypeScript declarations
npm run build:types

# Lint
npm run lint
# Fix lint issues
npm run lint:fix
```

## 🔗 Version & Compatibility

- Wallet dependencies are pinned to specific SHAs in `package.json`; keep your app's direct dependencies compatible when mixing.
- Node 18+ recommended. Ensure iOS/Android toolchains match `gen:bundle` targets when rebuilding bundles.

## 📜 License

Apache-2.0 - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please open a PR.

## 🆘 Support

For support, please open an issue in the repository.
