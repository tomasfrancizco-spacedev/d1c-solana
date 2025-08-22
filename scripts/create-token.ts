import {
  clusterApiUrl,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import * as fs from 'fs';
import * as os from 'os';

(async () => {
  // Load payer from Solana config
  const payerKeypairPath = `${os.homedir()}/.config/solana/id.json`;
  const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));
  
  console.log('Using wallet:', payer.publicKey.toBase58());

  // Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const decimals = 9;
  const mintAuthority = payer.publicKey;
  const updateAuthority = payer.publicKey;

  // Transfer fee configuration
  const transferFeeConfigAuthority = payer.publicKey;
  const withdrawWithheldAuthority = payer.publicKey;
  const feeBasisPoints = 350; // 3.5%
  const maxFee = BigInt(1_000_000_000_000_000_000); // 1 billion tokens

  // Metadata to store in Mint Account
  const metaData: TokenMetadata = {
    updateAuthority: updateAuthority,
    mint: mint,
    name: "Division 1",
    symbol: "D1C",
    uri: "https://api.jsonbin.io/v3/qs/68641c458561e97a502fc72a",
    additionalMetadata: [["description", "Division One Crypto Token"]],
  };

  // Configuration
  const USE_LOCALHOST = true; // Set to false for devnet
  
  const connection = new Connection(
    USE_LOCALHOST ? "http://localhost:8899" : clusterApiUrl("devnet"), 
    "confirmed"
  );
  
  console.log('Using cluster:', USE_LOCALHOST ? 'localhost:8899' : 'devnet');

  // Extensions for both metadata and transfer fees
  const extensions = [ExtensionType.MetadataPointer, ExtensionType.TransferFeeConfig];
  
  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;
  // Size of Mint Account with both extensions
  const mintLen = getMintLen(extensions);
  
  // Minimum lamports required for Mint Account
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen,
  );

  console.log('Creating mint account with both extensions...');
  console.log('Mint address:', mint.toBase58());
  console.log('Required space:', mintLen + metadataExtension + metadataLen);
  console.log('Extensions:', extensions.map(ext => ExtensionType[ext]).join(', '));

  // Build transaction with correct instruction ordering
  const transaction = new Transaction().add(
    // 1. Create the mint account
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    
    // 2. Initialize MetadataPointer extension (before mint initialization)
    createInitializeMetadataPointerInstruction(
      mint,
      updateAuthority,
      mint, // metadata will be stored on the mint account itself
      TOKEN_2022_PROGRAM_ID,
    ),
    
    // 3. Initialize TransferFeeConfig extension (before mint initialization)
    createInitializeTransferFeeConfigInstruction(
      mint,
      transferFeeConfigAuthority,
      withdrawWithheldAuthority,
      feeBasisPoints,
      maxFee,
      TOKEN_2022_PROGRAM_ID
    ),
    
    // 4. Initialize the mint (after all extensions)
    createInitializeMintInstruction(
      mint,
      decimals,
      mintAuthority,
      null, // No freeze authority
      TOKEN_2022_PROGRAM_ID,
    ),
    
    // 5. Initialize metadata (after mint is initialized)
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: updateAuthority,
      mint: mint,
      mintAuthority: mintAuthority,
      name: metaData.name,
      symbol: metaData.symbol,
      uri: metaData.uri,
    }),
  );

  try {
    console.log('Sending transaction...');
    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, mintKeypair],
    );

    console.log('\n✅ Token created successfully with both metadata and transfer fees!');
    
    if (USE_LOCALHOST) {
      console.log('Transaction signature:', transactionSignature);
      console.log('View in Solana Explorer (localhost):', `https://explorer.solana.com/tx/${transactionSignature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`);
    } else {
      console.log('Transaction:', `https://explorer.solana.com/address/${transactionSignature}?cluster=devnet`);
    }
    
    console.log('Mint Address:', mint.toBase58());
    console.log('Mint Authority:', mintAuthority.toBase58());
    console.log('Update Authority:', updateAuthority.toBase58());
    console.log('Transfer Fee Config Authority:', transferFeeConfigAuthority.toBase58());
    console.log('Withdraw Withheld Authority:', withdrawWithheldAuthority.toBase58());
    console.log(`Fee: ${feeBasisPoints} basis points (${feeBasisPoints / 100}%)`);
    console.log(`Max Fee: ${maxFee} tokens`);

  } catch (error) {
    console.error('❌ Transaction failed:', error);
    console.log('\nThis might be due to:');
    if (USE_LOCALHOST) {
      console.log('1. Local Solana validator not running (run: solana-test-validator)');
      console.log('2. Insufficient SOL balance (request airdrop: solana airdrop 10)');
      console.log('3. Extension configuration problems');
    } else {
      console.log('1. Insufficient SOL balance');
      console.log('2. Network issues');
      console.log('3. Extension configuration problems');
    }
  }
})(); 