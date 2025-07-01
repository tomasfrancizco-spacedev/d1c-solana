import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as os from 'os';

(async () => {
  // Load payer from Solana config
  const payerKeypairPath = `${os.homedir()}/.config/solana/id.json`;
  const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));
  
  console.log('Using wallet:', payer.publicKey.toBase58());

  // Token mint address - replace with your latest token mint address
  const mintAddress = new PublicKey('REPLACE_WITH_YOUR_MINT_ADDRESS');
  
  // Amount to mint: 1 billion tokens
  // With 9 decimals: 1,000,000,000 * 10^9 = 1,000,000,000,000,000,000
  const tokensToMint = BigInt(1_000_000_000) * BigInt(10 ** 9); // 1 billion tokens
  
  console.log('Mint address:', mintAddress.toBase58());
  console.log('Tokens to mint:', tokensToMint.toString(), '(1 billion tokens)');

  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Get or create associated token account for the payer
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mintAddress,
    payer.publicKey,
    false, // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID,
  );

  console.log('Associated token account:', associatedTokenAccount.toBase58());

  const transaction = new Transaction();

  // Check if the token account already exists
  try {
    await getAccount(connection, associatedTokenAccount, 'confirmed', TOKEN_2022_PROGRAM_ID);
    console.log('✅ Token account already exists');
  } catch (error) {
    // Token account doesn't exist, create it
    console.log('Creating associated token account...');
    const createATAInstruction = createAssociatedTokenAccountInstruction(
      payer.publicKey, // payer
      associatedTokenAccount, // associated token account
      payer.publicKey, // owner
      mintAddress, // mint
      TOKEN_2022_PROGRAM_ID,
    );
    transaction.add(createATAInstruction);
  }

  // Create mint instruction
  const mintInstruction = createMintToInstruction(
    mintAddress, // mint
    associatedTokenAccount, // destination
    payer.publicKey, // mint authority (your wallet)
    tokensToMint, // amount
    [], // multi signers (none)
    TOKEN_2022_PROGRAM_ID,
  );

  transaction.add(mintInstruction);

  try {
    console.log('\n🚀 Minting tokens...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
    );

    console.log('\n✅ Successfully minted 1 billion tokens!');
    console.log('Transaction:', `https://solana.fm/tx/${signature}?cluster=devnet`);
    console.log('Token Account:', associatedTokenAccount.toBase58());
    console.log('Amount minted:', tokensToMint.toString(), 'smallest units');
    console.log('Amount minted:', '1,000,000,000 tokens');
    
    // Show the token account on explorer
    console.log('🔗 View token account:', `https://solana.fm/address/${associatedTokenAccount.toBase58()}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Minting failed:', error);
    console.log('\nPossible reasons:');
    console.log('1. You are not the mint authority');
    console.log('2. Insufficient SOL for transaction fees');
    console.log('3. Network issues');
    console.log('4. Invalid mint address');
  }
})();