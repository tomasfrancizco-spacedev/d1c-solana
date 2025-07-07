# Division One Crypto - Transfer Fee Testing Setup

This guide walks you through the complete process of creating a token with 3.5% transfer fees and testing the fee functionality on both localhost and devnet.

## 📋 Prerequisites

### Required Tools
- Node.js and npm/yarn installed
- Solana CLI installed (`solana --version`)
- TypeScript (`npm install -g typescript`)

### Solana Wallet Setup
```bash
# Create a keypair if you don't have one
solana-keygen new

# Check current configuration
solana config get

# Check wallet balance
solana balance
```

## ⚙️ Configuration

Both scripts support localhost and devnet. Configure by editing the `USE_LOCALHOST` flag:

**In `scripts/create-token.ts` and `scripts/test-transfer-fee.ts`:**
```typescript
const USE_LOCALHOST = true;  // For localhost testing
const USE_LOCALHOST = false; // For devnet testing
```

---

## 🏠 Localhost Testing (Recommended for Development)

### Step 1: Start Local Validator
```bash
# Start the local Solana validator (keep this running)
solana-test-validator

# Optional: Start with a clean state
solana-test-validator --reset
```

### Step 2: Configure Solana CLI
```bash
# Set Solana CLI to use localhost
solana config set --url localhost

# Verify configuration
solana config get

# Check balance (should show ~500M SOL)
solana balance

# Request more SOL if needed
solana airdrop 10
```

### Step 3: Create Token with Transfer Fees
```bash
# Ensure USE_LOCALHOST = true in create-token.ts
npx ts-node scripts/create-token.ts
```

**Expected Output:**
```
Using cluster: localhost:8899
Using wallet: [WalletAddress]
Creating mint account with both extensions...
Mint address: [NewMintAddress]
Required space: XXX
Extensions: MetadataPointer, TransferFeeConfig

✅ Token created successfully with both metadata and transfer fees!
Transaction signature: [TransactionSignature]
Mint Address: [COPY_THIS_ADDRESS]
Fee: 350 basis points (3.5%)
```

### Step 4: Update Test Script
Edit `scripts/test-transfer-fee.ts`:
```typescript
// Replace this line (around line 26)
const MINT_ADDRESS = new PublicKey("MINT_ADDRESS_HERE");

// With your actual mint address
const MINT_ADDRESS = new PublicKey("PASTE_MINT_ADDRESS_HERE");
```

### Step 5: Run Transfer Fee Test
```bash
# Ensure USE_LOCALHOST = true in test-transfer-fee.ts
npx ts-node scripts/test-transfer-fee.ts
```

**Expected Output:**
```
🧪 Testing Token Transfer with 3.5% Fee...

Using cluster: localhost:8899
📊 Mint Info:
Decimals: 9
Transfer Fee Config:
  Fee Basis Points: 350

🧮 Transfer Calculations:
Transfer amount: 1 tokens
Expected fee (3.5%): 0.035 tokens
Expected received amount: 0.965 tokens

📊 Final Balances:
Sender balance: 0 tokens
Receiver balance: 0.965 tokens
Actual fee deducted: 0.035 tokens
Actual fee percentage: 3.50%

✅ Verification Results:
Expected fee matches actual fee: ✅ PASS
Fee percentage verification: ✅ PASS (3.5% fee applied correctly)

🎉 Transfer fee test completed successfully!
```

---

## 🌐 Devnet Testing (For Production-like Environment)

### Step 1: Configure for Devnet
```bash
# Set Solana CLI to use devnet
solana config set --url devnet

# Check balance
solana balance

# Request SOL airdrop (limited to 2 SOL per day)
solana airdrop 2
```

### Step 2: Update Scripts for Devnet
Edit both `scripts/create-token.ts` and `scripts/test-transfer-fee.ts`:
```typescript
const USE_LOCALHOST = false; // Change to false
```

### Step 3: Create Token
```bash
npx ts-node scripts/create-token.ts
```

### Step 4: Update Test Script
Copy the mint address from Step 3 output and update `test-transfer-fee.ts`:
```typescript
const MINT_ADDRESS = new PublicKey("PASTE_DEVNET_MINT_ADDRESS_HERE");
```

### Step 5: Run Test
```bash
npx ts-node scripts/test-transfer-fee.ts
```

---

## 🔍 What Each Script Does

### `create-token.ts`
- ✅ Creates mint account with TOKEN-2022 program
- ✅ Initializes MetadataPointer extension
- ✅ Initializes TransferFeeConfig extension (3.5% fee)
- ✅ Sets up token metadata (name: "Division 1", symbol: "DC1")
- ✅ Outputs mint address for testing

### `test-transfer-fee.ts`
- ✅ Creates test sender/receiver wallets
- ✅ Airdrops SOL to test wallets
- ✅ Creates associated token accounts
- ✅ Mints 1 token to sender
- ✅ Transfers tokens with fee calculation
- ✅ Verifies exactly 3.5% fee was deducted
- ✅ Shows detailed before/after analysis

---

## 📊 Expected Fee Calculation

| Amount | Operation | Result |
|--------|-----------|--------|
| 1.000 tokens | Transfer Amount | Input |
| 0.035 tokens | Fee (3.5%) | Deducted |
| 0.965 tokens | Received Amount | Final |

**Fee Formula:** `fee = (amount × 350) / 10,000`

---

## 🛠️ Troubleshooting

### Common Issues

**❌ "Mint account not found"**
- Ensure you've updated `YOUR_MINT_ADDRESS_HERE` with the actual mint address
- Verify you're using the same network (localhost/devnet) for both scripts

**❌ "Insufficient SOL balance"**
- **Localhost:** Run `solana airdrop 10`
- **Devnet:** Run `solana airdrop 2` (limited per day)

**❌ "Local Solana validator not running"**
- Start validator: `solana-test-validator`
- Check if running: `solana cluster-version`

**❌ "Network issues"**
- **Localhost:** Restart `solana-test-validator`
- **Devnet:** Check internet connection, try again later

**❌ "Transfer fee config not found"**
- Re-run `create-token.ts` to ensure proper extension setup
- Verify TOKEN-2022 program is being used

### Verification Commands

```bash
# Check current Solana configuration
solana config get

# Check validator is running (localhost)
solana cluster-version

# Check wallet balance
solana balance

# View account info for a specific address
solana account [MINT_ADDRESS]
```

---

## 🎯 Testing Scenarios

### Basic Test (Included)
- Transfer 1 token
- Verify 3.5% fee deduction
- Check final balances

### Additional Test Ideas
- Transfer different amounts (0.1, 10, 100 tokens)
- Test maximum fee limits
- Test with different sender/receiver pairs
- Verify withheld fees accumulation

---

## 🔗 Useful Links

- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Explorer (Localhost)](https://explorer.solana.com/?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899)
- [TOKEN-2022 Documentation](https://spl.solana.com/token-2022)
- [Transfer Fee Extension Guide](https://spl.solana.com/token-2022/extensions#transfer-fee)

---

## 📝 Quick Reference

### Complete Localhost Flow
```bash
# Terminal 1: Start validator
solana-test-validator

# Terminal 2: Run tests
solana config set --url localhost
npx ts-node scripts/create-token.ts
# Copy mint address, update test script
npx ts-node scripts/test-transfer-fee.ts
```

### Complete Devnet Flow
```bash
solana config set --url devnet
solana airdrop 2
# Update USE_LOCALHOST = false in both scripts
npx ts-node scripts/create-token.ts
# Copy mint address, update test script
npx ts-node scripts/test-transfer-fee.ts
```

---

*Happy testing! 🚀* 