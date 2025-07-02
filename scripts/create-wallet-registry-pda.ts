import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as fs from "fs";
import * as os from 'os';

const payerKeypairPath = `${os.homedir()}/.config/solana/id.json`;
const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
const payerKeypair = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));

const collegePubkeys: PublicKey[] = JSON.parse(
  fs.readFileSync("./data/schools-wallets.json", "utf-8")
).map((key: string) => new PublicKey(key));

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const PROGRAM_ID = new PublicKey("PROGRAM_ID"); // Change with program ID
const SEED = "college_registry";
const MAX_COLLEGES = 400;
const REGISTRY_SIZE = 8 + 32 + 4 + MAX_COLLEGES * 32; // Anchor header + authority + vec prefix + pubkeys

const [registryPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from(SEED)],
  PROGRAM_ID
);

console.log("Registry PDA:", registryPda.toBase58());

async function getRent() {
  const rentExemption = await connection.getMinimumBalanceForRentExemption(REGISTRY_SIZE);
  console.log(`Rent for ${REGISTRY_SIZE} bytes: ${rentExemption} lamports (~${rentExemption / 1e9} SOL)`);
  return rentExemption;
}

async function createRegistryAccount() {
  const lamports = await getRent();

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerKeypair.publicKey,
      newAccountPubkey: registryPda,
      space: REGISTRY_SIZE,
      lamports,
      programId: PROGRAM_ID,
    })
  );

  const txid = await sendAndConfirmTransaction(connection, tx, [payerKeypair]);
  console.log("✅ Registry account created:", txid);
}

createRegistryAccount().catch(console.error);