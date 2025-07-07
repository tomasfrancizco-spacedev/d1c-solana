import {
  clusterApiUrl,
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getTransferFeeConfig,
  unpackMint,
} from "@solana/spl-token";
import * as fs from 'fs';
import * as os from 'os';

(async () => {
  console.log('🧪 Testing Token Transfer with 3.5% Fee...\n');

  // Configuration
  const USE_LOCALHOST = true; // Set to false for devnet
  const MINT_ADDRESS = new PublicKey("TOKEN_MINT_ADDRESS");
  const TRANSFER_AMOUNT = BigInt(1_000_000_000); // 1 token (with 9 decimals)
  const EXPECTED_FEE_BASIS_POINTS = 350; // 3.5%
  
  // Load payer from Solana config
  const payerKeypairPath = `${os.homedir()}/.config/solana/id.json`;
  const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
  const payer = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));
  
  console.log('Using wallet:', payer.publicKey.toBase58());

  // Generate sender and receiver keypairs
  const sender = Keypair.generate();
  const receiver = Keypair.generate();
  
  console.log('Sender:', sender.publicKey.toBase58());
  console.log('Receiver:', receiver.publicKey.toBase58());

  const connection = new Connection(
    USE_LOCALHOST ? "http://localhost:8899" : clusterApiUrl("devnet"), 
    "confirmed"
  );
  
  console.log('Using cluster:', USE_LOCALHOST ? 'localhost:8899' : 'devnet');

  try {
    // Get mint info to verify it has transfer fee extension
    const mintAccountInfo = await connection.getAccountInfo(MINT_ADDRESS);
    if (!mintAccountInfo) {
      throw new Error("Mint account not found. Make sure to replace MINT_ADDRESS_HERE with actual mint address.");
    }
    
    const mintData = unpackMint(MINT_ADDRESS, mintAccountInfo, TOKEN_2022_PROGRAM_ID);
    console.log('\n📊 Mint Info:');
    console.log('Decimals:', mintData.decimals);
    console.log('Mint Authority:', mintData.mintAuthority?.toBase58() || 'None');
    
    // Get transfer fee config
    const transferFeeConfig = getTransferFeeConfig(mintData);
    if (!transferFeeConfig) {
      throw new Error("Transfer fee config not found on mint");
    }
    
    console.log('Transfer Fee Config:');
    console.log('  Fee Basis Points:', transferFeeConfig.newerTransferFee.transferFeeBasisPoints);
    console.log('  Max Fee:', transferFeeConfig.newerTransferFee.maximumFee.toString());
    console.log('  Withheld Authority:', transferFeeConfig.withdrawWithheldAuthority?.toBase58() || 'None');

    // Get associated token addresses
    const senderTokenAccount = getAssociatedTokenAddressSync(
      MINT_ADDRESS,
      sender.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    const receiverTokenAccount = getAssociatedTokenAddressSync(
      MINT_ADDRESS,
      receiver.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log('\n🏦 Token Accounts:');
    console.log('Sender Token Account:', senderTokenAccount.toBase58());
    console.log('Receiver Token Account:', receiverTokenAccount.toBase58());

    // Fund sender and receiver with SOL for account creation
    console.log('\n💰 Funding accounts with SOL...');
    if (USE_LOCALHOST) {
      // On localhost, airdrop more SOL since it's unlimited
      const airdropSig1 = await connection.requestAirdrop(sender.publicKey, 10_000_000_000); // 10 SOL
      const airdropSig2 = await connection.requestAirdrop(receiver.publicKey, 10_000_000_000); // 10 SOL
      
      await connection.confirmTransaction(airdropSig1);
      await connection.confirmTransaction(airdropSig2);
    } else {
      // On devnet, use smaller amounts
      const airdropSig1 = await connection.requestAirdrop(sender.publicKey, 1_000_000_000); // 1 SOL
      const airdropSig2 = await connection.requestAirdrop(receiver.publicKey, 1_000_000_000); // 1 SOL
      
      await connection.confirmTransaction(airdropSig1);
      await connection.confirmTransaction(airdropSig2);
    }
    console.log('✅ SOL airdrop completed');

    // Create associated token accounts
    console.log('\n🏗️  Creating token accounts...');
    const createAccountsTransaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        senderTokenAccount,
        sender.publicKey,
        MINT_ADDRESS,
        TOKEN_2022_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        receiverTokenAccount,
        receiver.publicKey,
        MINT_ADDRESS,
        TOKEN_2022_PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(connection, createAccountsTransaction, [payer]);
    console.log('✅ Token accounts created');

    // Mint tokens to sender
    console.log('\n🪙  Minting tokens to sender...');
    const mintTransaction = new Transaction().add(
      createMintToInstruction(
        MINT_ADDRESS,
        senderTokenAccount,
        payer.publicKey, // mint authority
        TRANSFER_AMOUNT,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    await sendAndConfirmTransaction(connection, mintTransaction, [payer]);
    console.log(`✅ Minted ${Number(TRANSFER_AMOUNT) / 10**mintData.decimals} tokens to sender`);

    // Check initial balances
    console.log('\n📊 Initial Balances:');
    const senderAccountBefore = await getAccount(connection, senderTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
    const receiverAccountBefore = await getAccount(connection, receiverTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
    
    console.log('Sender balance:', Number(senderAccountBefore.amount) / 10**mintData.decimals, 'tokens');
    console.log('Receiver balance:', Number(receiverAccountBefore.amount) / 10**mintData.decimals, 'tokens');

    // Calculate expected fee
    const expectedFee = (TRANSFER_AMOUNT * BigInt(EXPECTED_FEE_BASIS_POINTS)) / BigInt(10_000);
    const expectedReceivedAmount = TRANSFER_AMOUNT - expectedFee;
    
    console.log('\n🧮 Transfer Calculations:');
    console.log('Transfer amount:', Number(TRANSFER_AMOUNT) / 10**mintData.decimals, 'tokens');
    console.log('Expected fee (3.5%):', Number(expectedFee) / 10**mintData.decimals, 'tokens');
    console.log('Expected received amount:', Number(expectedReceivedAmount) / 10**mintData.decimals, 'tokens');

    // Transfer tokens
    console.log('\n🔄 Transferring tokens...');
    const transferTransaction = new Transaction().add(
      createTransferCheckedInstruction(
        senderTokenAccount,
        MINT_ADDRESS,
        receiverTokenAccount,
        sender.publicKey,
        TRANSFER_AMOUNT,
        mintData.decimals,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    const transferSig = await sendAndConfirmTransaction(connection, transferTransaction, [sender]);
    console.log('✅ Transfer completed');
    
    if (USE_LOCALHOST) {
      console.log('Transaction signature:', transferSig);
      console.log('View in Solana Explorer (localhost):', `https://explorer.solana.com/tx/${transferSig}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`);
    } else {
      console.log('Transaction:', `https://explorer.solana.com/tx/${transferSig}?cluster=devnet`);
    }

    // Check final balances
    console.log('\n📊 Final Balances:');
    const senderAccountAfter = await getAccount(connection, senderTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
    const receiverAccountAfter = await getAccount(connection, receiverTokenAccount, "confirmed", TOKEN_2022_PROGRAM_ID);
    
    const senderFinalBalance = Number(senderAccountAfter.amount) / 10**mintData.decimals;
    const receiverFinalBalance = Number(receiverAccountAfter.amount) / 10**mintData.decimals;
    const actualReceivedAmount = receiverAccountAfter.amount;
    const actualFee = TRANSFER_AMOUNT - actualReceivedAmount;
    const actualFeePercentage = (Number(actualFee) / Number(TRANSFER_AMOUNT)) * 100;
    
    console.log('Sender balance:', senderFinalBalance, 'tokens');
    console.log('Receiver balance:', receiverFinalBalance, 'tokens');
    console.log('Actual fee deducted:', Number(actualFee) / 10**mintData.decimals, 'tokens');
    console.log('Actual fee percentage:', actualFeePercentage.toFixed(2) + '%');

    // Verify fee calculation
    console.log('\n✅ Verification Results:');
    const feeMatch = actualFee === expectedFee;
    const receivedAmountMatch = actualReceivedAmount === expectedReceivedAmount;
    
    console.log('Expected fee matches actual fee:', feeMatch ? '✅ PASS' : '❌ FAIL');
    console.log('Expected received amount matches actual:', receivedAmountMatch ? '✅ PASS' : '❌ FAIL');
    
    if (Math.abs(actualFeePercentage - 3.5) < 0.01) {
      console.log('Fee percentage verification:', '✅ PASS (3.5% fee applied correctly)');
    } else {
      console.log('Fee percentage verification:', '❌ FAIL (Expected 3.5%, got ' + actualFeePercentage.toFixed(2) + '%)');
    }

    // Note: Withheld fees are managed by the transfer fee extension
    // and can be withdrawn by the withdraw withheld authority

    console.log('\n🎉 Transfer fee test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nThis might be due to:');
    console.log('1. Incorrect mint address (update MINT_ADDRESS_HERE)');
    if (USE_LOCALHOST) {
      console.log('2. Local Solana validator not running (run: solana-test-validator)');
      console.log('3. Missing transfer fee extension on the mint');
      console.log('4. Mint not created on localhost');
    } else {
      console.log('2. Insufficient SOL balance');
      console.log('3. Network issues');
      console.log('4. Missing transfer fee extension on the mint');
    }
  }
})(); 