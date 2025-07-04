// scripts/test-simple-flow.ts
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import * as fs from "fs";
import * as os from 'os';
import { SimpleUserLinkClient } from "./simple-user-link-client";

async function main() {
    console.log("🧪 Testing Simple User Link Flow\n");

    // Setup
    const payerKeypairPath = `${os.homedir()}/.config/solana/id.json`;
    const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
    const payerKeypair = Keypair.fromSecretKey(new Uint8Array(payerKeypairData));

    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payerKeypair), {
        commitment: "confirmed",
    });
    anchor.setProvider(provider);

    const program = await anchor.workspace.DivisionOneCrypto;
    const client = new SimpleUserLinkClient(program, provider);

    // Load some school wallets from JSON for testing
    const schools = JSON.parse(fs.readFileSync("./data/schools-wallets.json", "utf-8"));
    const schoolWallets: PublicKey[] = Object.keys(schools).map((key: string) => new PublicKey(schools[key]));

    try {
        // Create and fund test user
        console.log("0️⃣ Setting up test user...");
        const testUser = Keypair.generate();
        const school1 = schoolWallets[0];
        
        // Fund the test user with some SOL
        const fundTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: payerKeypair.publicKey,
                toPubkey: testUser.publicKey,
                lamports: 10_000_000, // 0.01 SOL
            })
        );
        
        await provider.sendAndConfirm(fundTx, [payerKeypair]);
        console.log(`✅ Test user funded: ${testUser.publicKey.toString()}`);

        // Step 1: Test user link creation
        console.log("\n1️⃣ Testing user link creation...");
        
        try {
            await client.initializeUserLink(testUser.publicKey, school1, testUser);
            console.log("✅ User link created successfully");
        } catch (error) {
            console.log("❌ User link creation failed:", error.message);
            return; // Exit early if creation fails
        }

        // Step 2: Test user link retrieval
        console.log("\n2️⃣ Testing user link retrieval...");
        const userLink = await client.getUserLink(testUser.publicKey);
        if (userLink) {
            console.log("✅ User link retrieved:");
            console.log(`   User: ${userLink.userWallet.toString().slice(0, 8)}...`);
            console.log(`   School: ${userLink.schoolWallet.toString().slice(0, 8)}...`);
            console.log(`   Created: ${new Date(userLink.createdAt * 1000).toISOString()}`);
        } else {
            console.log("❌ User link not found");
            return;
        }

        // Step 3: Test school wallet update
        console.log("\n3️⃣ Testing school wallet update...");
        const school2 = schoolWallets[1];
        
        try {
            await client.updateSchoolWallet(testUser.publicKey, school2, testUser);
            console.log("✅ School wallet updated successfully");
        } catch (error) {
            console.log("❌ School wallet update failed:", error.message);
        }

        // Step 4: Verify the update
        console.log("\n4️⃣ Verifying the update...");
        const updatedLink = await client.getUserLink(testUser.publicKey);
        if (updatedLink && updatedLink.schoolWallet.equals(school2)) {
            console.log("✅ School wallet update verified");
        } else {
            console.log("❌ School wallet update verification failed");
        }

        // Step 5: Test school link removal
        console.log("\n5️⃣ Testing school link removal...");
        
        try {
            await client.removeSchoolLink(testUser.publicKey, testUser);
            console.log("✅ School link removed successfully");
        } catch (error) {
            console.log("❌ School link removal failed:", error.message);
        }

        // Step 6: Verify removal
        console.log("\n6️⃣ Verifying removal...");
        const removedLink = await client.getUserLink(testUser.publicKey);
        if (removedLink && removedLink.schoolWallet.equals(SystemProgram.programId)) {
            console.log("✅ School link removal verified");
        } else {
            console.log("❌ School link removal verification failed");
        }

        console.log("\n🎉 Simple flow test finished!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

main().catch(console.error);