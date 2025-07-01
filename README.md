# Division One Crypto

A Solana Token-2022 implementation with transfer fees and metadata extensions to support college athletics funding.

## Overview

This project creates Division One ($D1C) tokens using Solana's Token-2022 standard with built-in transfer fees and metadata. The token is designed to support college athletics through a fee mechanism that will be distributed to college programs.

**Current Implementation:**
- Token-2022 with metadata extension (name, symbol, URI)
- 3% transfer fees collected automatically on all transfers
- 1 billion token supply
- Scripts for token creation and minting

**Future Development:**
- Solana program to link user accounts to college wallets via PDAs
- Automated fee off-chain distribution system

## Features

- ✅ Token-2022 compliant with metadata extension
- ✅ Built-in 3% transfer fees
- ✅ On-chain metadata (name: "Division 1", symbol: "DC1")
- ✅ 1 billion token supply with 9 decimals
- ✅ Automated token creation and minting scripts
- 🚧 College wallet linking (planned)
- 🚧 Fee distribution mechanism (planned)

## Token Details

- **Name**: Division 1
- **Symbol**: DC1
- **Decimals**: 9
- **Max Supply**: 1,000,000,000 tokens
- **Transfer Fee**: 3% (300 basis points)
- **Max Fee Cap**: 1 billion tokens
- **Network**: Solana Devnet (for testing)

## Prerequisites

- [Node.js](https://nodejs.org/) 16+
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.18+
- Solana wallet with devnet SOL

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd division-one-crypto
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up Solana CLI**
   ```bash
   # Generate a new keypair (if you don't have one)
   solana-keygen new

   # Set to devnet for development
   solana config set --url devnet

   # Get devnet SOL
   solana airdrop 2
   ```

## Scripts

### 1. Create Token

Creates a new Token-2022 mint with both metadata and transfer fee extensions.

```bash
yarn ts-node scripts/create-token.ts
```

**What this script does:**
- Creates a new Token-2022 mint account
- Initializes metadata extension with token name, symbol, and URI
- Configures transfer fees (3% on all transfers)
- Uses your wallet as mint authority and update authority
- Outputs mint address and transaction details

**Configuration in the script:**
```typescript
// Token metadata
name: "Division 1"
symbol: "DC1"
uri: "https://api.jsonbin.io/v3/qs/68641c458561e97a502fc72a"

// Transfer fees
feeBasisPoints: 300 // 3%
maxFee: BigInt(1_000_000_000_000_000_000) // 1 billion tokens
```

### 2. Mint Tokens

Mints 1 billion tokens to your wallet.

```bash
yarn ts-node scripts/mint-tokens.ts
```

**Before running:**
1. Update the `mintAddress` in the script with your token's mint address
2. Ensure you are the mint authority

**What this script does:**
- Creates an associated token account for your wallet (if needed)
- Mints 1,000,000,000 tokens to your account
- Outputs transaction details and token account address

## Usage Example

1. **Create a new token:**
   ```bash
   yarn ts-node scripts/create-token.ts
   ```
   
   Save the mint address from the output.

2. **Update mint-tokens.ts:**
   ```typescript
   const mintAddress = new PublicKey('YOUR_MINT_ADDRESS_HERE');
   ```

3. **Mint 1 billion tokens:**
   ```bash
   yarn ts-node scripts/mint-tokens.ts
   ```

4. **Transfer tokens:** Use any Solana wallet or application. The 3% transfer fee will be automatically collected.

## Token-2022 Extensions Used

### Metadata Pointer Extension
- Stores token metadata directly on the mint account
- Includes name, symbol, URI, and additional metadata
- Allows for on-chain metadata updates

### Transfer Fee Extension
- Automatically collects 3% fee on all token transfers
- Fees accumulate in a withheld balance
- Configurable authorities for fee management

## Fee Structure

| Component | Rate | Authority | Purpose |
|-----------|------|-----------|---------|
| Transfer Fee | 3.0% | Your Wallet | Future college athletics funding, burning, OPs wallet |

**Fee Collection:**
- Fees are automatically deducted from transfers
- Accumulated fees are held in the token accounts
- Fee authorities can withdraw accumulated fees
- No additional transactions required from users

## Future Development

### College Wallet Linking Program
A Solana program that will:
- Create PDAs linking user accounts to their chosen college wallets
- Enable users to register and update their college affiliations
- Provide a registry for fee distribution

## Project Structure

division-one-crypto/
├── scripts/
│ ├── create-token.ts
│ └── mint-tokens.ts
├── package.json
├── tsconfig.json
└── README.md
