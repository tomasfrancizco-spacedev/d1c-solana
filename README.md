# Division One Crypto

A Solana Token-2022 program implementing a transfer hook that automatically distributes fees on token transfers to support college athletics and operations.

## Overview

This project creates a token with an integrated transfer hook mechanism that automatically deducts and distributes fees on every token transfer:

- **0.5%** goes to operations wallet
- **0.5%** gets burned (deflationary mechanism)  
- **2%** goes to the user's designated college wallet

The program uses Solana's Token-2022 standard with transfer hooks to ensure fees are collected on every transfer without requiring additional transactions.

## Features

- ✅ Token-2022 compliant token with transfer hook
- ✅ Automatic fee distribution on transfers (3% total)
- ✅ User-configurable college wallet assignment
- ✅ Deflationary tokenomics through burning
- ✅ Operations funding mechanism

## Architecture

The program consists of several key components:

1. **Token Initialization**: Creates a Token-2022 mint with transfer hook extension
2. **User Configuration**: Allows users to set their college wallet for fee distribution
3. **Transfer Hook**: Automatically executes on every token transfer to collect and distribute fees
4. **Extra Account Meta List**: Defines additional accounts needed for transfer hook execution

## Prerequisites

- [Rust](https://rustup.rs/) 1.60+
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) 1.18+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.30+
- [Node.js](https://nodejs.org/) 16+
- [Yarn](https://yarnpkg.com/getting-started/install)

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

   # Set to localnet for development
   solana config set --url localhost
   ```

4. **Start local validator**
   ```bash
   solana-test-validator
   ```

## Building

Build the Anchor program:

```bash
anchor build
```

This will compile the Rust program and generate TypeScript types in `target/types/`.

## Testing

Run the test suite:

```bash
anchor test
```

Or run tests with more verbose output:

```bash
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
```

## Deployment

### Local Deployment

1. **Deploy to localnet**
   ```bash
   anchor deploy
   ```

### Devnet Deployment

1. **Update Anchor.toml**
   ```toml
   [provider]
   cluster = "Devnet"
   ```

2. **Get devnet SOL**
   ```bash
   solana airdrop 2
   ```

3. **Deploy to devnet**
   ```bash
   anchor deploy
   ```

## Usage

### Initialize Token

```typescript
const tx = await program.methods
  .initializeToken(
    "Division One Token",  // name
    "DOT",                // symbol  
    9,                    // decimals
    opsWalletPubkey       // operations wallet
  )
  .accounts({
    mint: mintKeypair.publicKey,
    authority: authority.publicKey,
    opsWallet: opsWalletPubkey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .signers([mintKeypair, authority])
  .rpc();
```

### Set College Wallet

Users must set their college wallet before transfers to ensure proper fee distribution:

```typescript
const tx = await program.methods
  .setCollegeWallet(collegeWalletPubkey)
  .accounts({
    userConfig: userConfigPda,
    user: userKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([userKeypair])
  .rpc();
```

### Token Transfers

Once set up, all token transfers automatically trigger the fee mechanism. No additional steps needed from users.

## Program Accounts

### UserConfig
Stores user-specific configuration:
- `user: Pubkey` - The user's wallet address
- `college_wallet: Pubkey` - The designated college wallet for fee distribution
- `bump: u8` - PDA bump seed

### Seeds
- User Config PDA: `["user-config", user_pubkey]`
- Extra Account Meta List: `["extra-account-metas", mint_pubkey]`

## Fee Structure

| Fee Type | Percentage | Destination |
|----------|------------|-------------|
| Operations | 0.5% | Operations wallet |
| Burn | 0.5% | Burned (deflationary) |
| College | 2.0% | User's college wallet |
| **Total** | **3.0%** | - |

## Configuration

Update `Anchor.toml` for different environments:

```toml
[provider]
cluster = "Localnet"  # or "Devnet", "Mainnet-beta"
wallet = "~/.config/solana/id.json"

[programs.localnet]
division_one_crypto = "D6XYa4oPwgMnVX59YbFLxbYstUYEc2YTddx6xTLY4uRs"
```

## Development Commands

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy locally
anchor deploy

# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Run specific test file
yarn run ts-mocha -p ./tsconfig.json tests/specific-test.ts
```

## Program ID

- **Localnet**: `D6XYa4oPwgMnVX59YbFLxbYstUYEc2YTddx6xTLY4uRs`

## Security Considerations

- Transfer hooks execute on every token transfer - ensure gas efficiency
- User configuration accounts use PDAs for security
- Fee calculations use integer arithmetic to avoid precision loss
- All external accounts are validated through program constraints
