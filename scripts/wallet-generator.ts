import fs from "fs";
import path from "path";
import { Keypair } from "@solana/web3.js";

const WALLET_DIR = "./data/wallets";

const files = fs.readdirSync(WALLET_DIR).filter(f => f.endsWith(".json"));

files.forEach(filename => {
  const filepath = path.join(WALLET_DIR, filename);
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(filepath, "utf-8")));
  const keypair = Keypair.fromSecretKey(secretKey);
  console.log(`"${filename.replace(".json", "")}": "${keypair.publicKey.toBase58()}",`);
});


// Script to generate wallets for each school (Already ran)
// import { Keypair } from "@solana/web3.js";
// import * as fs from "fs";

// const ncaaSchools = JSON.parse(fs.readFileSync("schools.json", "utf-8"));

// ncaaSchools.forEach((school) => {
//   const keypair = Keypair.generate();
//   const outPath = `wallets/${school.code}.json`;

//   fs.writeFileSync(outPath, JSON.stringify([...keypair.secretKey]));
//   console.log(`${school.name}: ${keypair.publicKey.toBase58()}`);
// });