# Division One Crypto

A comprehensive Solana ecosystem combining Token-2022 with transfer fees and a custom program for linking user wallets to college athletics funding.

## Overview

This project creates Division One ($D1C) tokens using Solana's Token-2022 standard with built-in transfer fees, plus a custom Solana program that allows users to link their wallets to specific college wallets for fee distribution purposes.

**Current Implementation:**
- ✅ Token-2022 with metadata extension (name, symbol, URI)
- ✅ 3.5% transfer fees collected automatically on all transfers
- ✅ 1 billion token supply with automated minting
- ✅ Solana program for user-to-school wallet linking via PDAs
- ✅ Complete client libraries and testing infrastructure
- ✅ 361 Division I schools with pre-generated wallet addresses

**Future Development:**
- Solana program to link user accounts to college wallets via PDAs
- Automated fee off-chain distribution system

## Features

### Token Features
- ✅ Token-2022 compliant with metadata extension
- ✅ Built-in 3.5% transfer fees
- ✅ On-chain metadata (name: "Division 1", symbol: "D1C")
- ✅ 1 billion token supply with 9 decimals
- ✅ Automated token creation and minting scripts

### Program Features
- ✅ User wallet linking to school wallets via PDAs
- ✅ Initialize, update, and remove school wallet links
- ✅ Event emissions for all link operations
- ✅ Secure PDA-based account management
- ✅ Comprehensive error handling

## Token Details

- **Name**: Division 1
- **Symbol**: D1C
- **Decimals**: 9
- **Max Supply**: 1,000,000,000 tokens
- **Transfer Fee**: 3.5% (350 basis points)
- **Max Fee Cap**: 1 billion tokens
- **Network**: Solana Devnet
- **Program ID**: `4iGFn1jtAj41Ttn7EKyXzfLWvSvpKYYw9saqCVSD6dRF`

## Prerequisites

- [Node.js](https://nodejs.org/) 16+
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.18+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.30+
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

4. **Build the Anchor program**
   ```bash
   anchor build
   ```

5. **Deploy the program**
   ```bash
   anchor deploy
   ```

## Project Structure

```
division-one-crypto/
├── programs/
│   └── division-one-crypto/
│       └── src/
│           └── lib.rs              # Main Solana program
├── scripts/
│   ├── create-token.ts             # Token-2022 creation
│   ├── mint-tokens.ts              # Token minting
│   ├── wallet-generator.ts         # Generate school wallets
│   ├── wallet-link-simple.ts       # Original client library
│   ├── simple-user-link-client.ts  # Simplified client library
│   └── test-simple-flow.ts         # Complete flow testing
├── data/
│   ├── schools.json                # 361 Division I schools
│   └── schools-wallets.json        # Schools with wallet addresses
├── tests/                          # Anchor tests
├── migrations/                     # Anchor deployment
├── Anchor.toml                     # Anchor configuration
└── README.md
```

## Scripts & Usage

### 1. Token Creation and Minting

#### Create Token
Creates a new Token-2022 mint with metadata and transfer fee extensions.

```bash
yarn ts-node scripts/create-token.ts
```

**Features:**
- Token-2022 with metadata extension
- 3.5% transfer fees on all transfers
- On-chain metadata (name, symbol, URI)
- Configurable authorities

#### Mint Tokens
Mints 1 billion tokens to your wallet.

```bash
yarn ts-node scripts/mint-tokens.ts
```

**Before running:** Update the `mintAddress` in the script with your token's mint address.

### 2. School Wallet Management

#### Generate School Wallets
Creates wallet addresses for all Division I schools.

```bash
yarn ts-node scripts/wallet-generator.ts
```

**Output:** Updates `data/schools-wallets.json` with generated wallet addresses for 361 schools.

### 3. User Wallet Linking

#### Simple Client Library
Use the simplified client for wallet linking operations:

```typescript
import { SimpleUserLinkClient } from './scripts/simple-user-link-client';

const client = new SimpleUserLinkClient(connection, wallet);

// Initialize user link with a school
await client.initializeUserLink(schoolWallet);

// Update school wallet
await client.updateSchoolWallet(newSchoolWallet);

// Remove school link
await client.removeSchoolLink();

// Get user link info
const userLink = await client.getUserLink();
```

#### Test Complete Flow
Run the complete testing flow:

```bash
yarn ts-node scripts/test-simple-flow.ts
```

**What this does:**
1. Generates a test user wallet
2. Funds the test user with SOL
3. Creates user link with a random school
4. Updates the school wallet link
5. Removes the school link
6. Verifies all operations

## Solana Program Details

### Program ID
`4iGFn1jtAj41Ttn7EKyXzfLWvSvpKYYw9saqCVSD6dRF`

### Instructions

1. **initialize_user_link** - Create initial user-to-school wallet link
2. **update_school_wallet** - Change linked school wallet
3. **remove_school_link** - Remove school wallet link

### Account Structure

```rust
pub struct UserLink {
    pub user_wallet: Pubkey,      // User's wallet address
    pub school_wallet: Pubkey,    // Linked school wallet
    pub created_at: i64,          // Creation timestamp
    pub updated_at: i64,          // Last update timestamp
    pub bump: u8,                 // PDA bump seed
}
```

### PDA Seeds
User links are stored in PDAs with seeds: `["user_link", user_wallet]`

### Events
- `UserLinkCreated` - Emitted when user creates initial link
- `SchoolWalletUpdated` - Emitted when user changes school
- `SchoolLinkRemoved` - Emitted when user removes school link

## School Data

The project includes comprehensive data for 361 Division I schools:

- **schools.json** - Complete school information (name, location, conference, etc.)
- **schools-wallets.json** - Same data with generated Solana wallet addresses

### Sample School Entry
```json
{
  "id": "001",
  "School": "Abilene Christian University",
  "Common name": "Abilene Christian",
  "Nickname": "Wildcats",
  "City": "Abilene",
  "State": "TX",
  "Type": "Private",
  "Subdivision": "FCS",
  "Primary": "Western Athletic Conference",
  "Wallet Address": "7HyYr2WDccUyMBDSajsddoNXS4yKiMrwcJHAiaeqMn14"
}
```

## Fee Structure & Future Distribution

| Component | Rate | Current Status | Future Purpose |
|-----------|------|---------------|----------------|
| Transfer Fee | 3.5% | ✅ Collected automatically | College athletics funding based on user links |
| Distribution | TBD | 🚧 Planned | Automated distribution to linked school wallets |

**Current Fee Collection:**
- Fees are automatically deducted from all token transfers
- Accumulated fees are held in token accounts
- Fee authorities can withdraw accumulated fees

## Development Workflow

1. **Token Development:**
   ```bash
   yarn ts-node scripts/create-token.ts
   yarn ts-node scripts/mint-tokens.ts
   ```

2. **Program Development:**
   ```bash
   anchor build
   anchor deploy
   anchor test
   ```

3. **Integration Testing:**
   ```bash
   yarn ts-node scripts/test-simple-flow.ts
   ```