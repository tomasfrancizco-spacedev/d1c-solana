# User Link Program Guide

This Solana program allows users to link school wallets to their accounts through Program Derived Addresses (PDAs). The program provides secure functionality for users to set, update, and manage their school affiliations.

## Program Features

### Core Functionality
- **Initialize User Link**: Create a new link for a user with their first school wallet
- **Update School Wallet**: Change the school wallet linked to a user (user can switch schools)
- **Remove School Link**: Remove the school connection (sets school wallet to system program)
- **Transfer Authority**: Change who can manage the user link

### Security Features
- Uses PDAs for deterministic address generation
- Authority-based access control
- Event emission for tracking changes
- Proper error handling

## Program Structure

### Main Instructions

1. **`initialize_user_link`**
   - Creates a new PDA account to store the user link
   - Links a user wallet to their first school wallet
   - Sets the authority who can manage the link

2. **`update_school_wallet`**
   - Updates an existing link with a new school wallet
   - Only the current authority can perform this action
   - User wallet remains fixed

3. **`remove_school_link`**
   - Removes the school link by setting school wallet to system program
   - Maintains the PDA account for potential future use

4. **`transfer_authority`**
   - Transfers control of the user link to a new authority
   - Useful for changing management responsibilities

### Account Structure

The `UserLink` account stores:
```rust
pub struct UserLink {
    pub user_wallet: Pubkey,      // The user wallet (fixed)
    pub school_wallet: Pubkey,    // The linked school wallet (can be updated)
    pub authority: Pubkey,        // Who can modify this link
    pub created_at: i64,          // Creation timestamp
    pub updated_at: i64,          // Last update timestamp
    pub bump: u8,                 // PDA bump seed
}
```

### PDA Derivation

PDAs are derived using:
- Seeds: `["user_link", user_wallet.key()]`
- Program ID: Your deployed program ID

## Building and Deployment

### Prerequisites
```bash
# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Install dependencies
npm install
```

### Build the Program
```bash
# Build the program
anchor build

# Generate TypeScript types
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Running Tests
```bash
# Run tests (after building)
anchor test
```

## Usage Examples

### Using Anchor Client (TypeScript)

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";

// Set up connection and program
const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
const wallet = anchor.Wallet.local();
const provider = new anchor.AnchorProvider(connection, wallet, {});
anchor.setProvider(provider);

const program = anchor.workspace.DivisionOneCrypto;

// Derive PDA
function deriveWalletLinkPDA(schoolWallet: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("wallet_link"), schoolWallet.toBuffer()],
        program.programId
    );
}

// Initialize wallet link
async function initializeWalletLink(
    schoolWallet: PublicKey,
    userWallet: PublicKey,
    authority: Keypair
) {
    const [walletLinkPDA] = deriveWalletLinkPDA(schoolWallet);
    
    const tx = await program.methods
        .initializeWalletLink(userWallet)
        .accounts({
            walletLink: walletLinkPDA,
            schoolWallet: schoolWallet,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    
    console.log("Transaction signature:", tx);
    return tx;
}

// Update wallet link
async function updateWalletLink(
    schoolWallet: PublicKey,
    newUserWallet: PublicKey,
    authority: Keypair
) {
    const [walletLinkPDA] = deriveWalletLinkPDA(schoolWallet);
    
    const tx = await program.methods
        .updateWalletLink(newUserWallet)
        .accounts({
            walletLink: walletLinkPDA,
            authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();
    
    console.log("Update transaction signature:", tx);
    return tx;
}

// Fetch wallet link data
async function getWalletLink(schoolWallet: PublicKey) {
    const [walletLinkPDA] = deriveWalletLinkPDA(schoolWallet);
    
    try {
        const walletLink = await program.account.walletLink.fetch(walletLinkPDA);
        return walletLink;
    } catch (error) {
        console.log("Wallet link not found");
        return null;
    }
}
```

### Using the Simple Client

Use the `WalletLinkClient` class from `scripts/wallet-link-simple.ts`:

```typescript
import { WalletLinkClient } from "./scripts/wallet-link-simple";

const client = new WalletLinkClient(program, provider);

// Initialize a link
await client.initializeWalletLink(schoolWallet, userWallet, authority);

// Update the link
await client.updateWalletLink(schoolWallet, newUserWallet, authority);

// Get linked wallet
const linkedWallet = await client.getLinkedUserWallet(schoolWallet);
```

## Event Monitoring

The program emits events for all major operations:

```typescript
// Listen for wallet link events
program.addEventListener('WalletLinkCreated', (event) => {
    console.log('New wallet link created:', event);
});

program.addEventListener('WalletLinkUpdated', (event) => {
    console.log('Wallet link updated:', event);
});

program.addEventListener('WalletLinkRemoved', (event) => {
    console.log('Wallet link removed:', event);
});

program.addEventListener('AuthorityTransferred', (event) => {
    console.log('Authority transferred:', event);
});
```

## Security Considerations

1. **Authority Management**: Only the designated authority can modify wallet links
2. **PDA Security**: PDAs ensure deterministic and secure address generation
3. **Input Validation**: The program validates all inputs and account relationships
4. **Error Handling**: Comprehensive error codes for debugging

## Error Codes

- `UnauthorizedAccess`: Attempt to modify without proper authority
- `InvalidUserWallet`: Invalid user wallet provided
- `WalletLinkAlreadyExists`: Trying to create a link that already exists
- `WalletLinkNotFound`: Trying to access a non-existent link

## Common Use Cases

1. **School Management Systems**: Link institutional wallets to student/teacher wallets
2. **Educational Platforms**: Connect course wallets to participant wallets
3. **Scholarship Programs**: Link funding wallets to recipient wallets
4. **Academic Credentials**: Connect issuing institution wallets to student wallets

## Troubleshooting

### Build Issues
- Ensure you have the latest Anchor CLI
- Check that all dependencies are installed
- Verify your Rust version is compatible

### TypeScript Issues
- Run `anchor build` to generate types
- Check that the program is properly deployed
- Ensure IDL is generated correctly

### Transaction Failures
- Verify authority signatures
- Check account relationships
- Ensure sufficient SOL for rent and fees

## Next Steps

After setting up the program, you might want to:

1. Create a web interface for wallet management
2. Implement bulk wallet linking operations
3. Add additional metadata to wallet links
4. Integrate with existing school management systems
5. Add time-based expiration for links 