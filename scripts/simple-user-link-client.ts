// scripts/simple-user-link-client.ts
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

export class SimpleUserLinkClient {
    constructor(
        private program: any,
        private provider: anchor.AnchorProvider
    ) {}

    static deriveUserLinkPDA(
        userWallet: PublicKey,
        programId: PublicKey
    ): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("user_link"), userWallet.toBuffer()],
            programId
        );
    }

    async initializeUserLink(
        userWallet: PublicKey,
        schoolWallet: PublicKey,
        user: Keypair
    ): Promise<string> {
        const [userLinkPDA] = SimpleUserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const tx = await this.program.methods
            .initializeUserLink(schoolWallet)
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
                systemProgram: SystemProgram.programId,
            })
            .signers([user])
            .rpc();

        console.log(`✅ User link initialized: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);
        console.log(`🔗 School Wallet: ${schoolWallet.toString()}`);
        console.log(`�� PDA: ${userLinkPDA.toString()}`);

        return tx;
    }

    async updateSchoolWallet(
        userWallet: PublicKey,
        newSchoolWallet: PublicKey,
        user: Keypair
    ): Promise<string> {
        const [userLinkPDA] = SimpleUserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const tx = await this.program.methods
            .updateSchoolWallet(newSchoolWallet)
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
            })
            .signers([user])
            .rpc();

        console.log(`✅ School wallet updated: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);
        console.log(`�� New School Wallet: ${newSchoolWallet.toString()}`);

        return tx;
    }

    async removeSchoolLink(
        userWallet: PublicKey,
        user: Keypair
    ): Promise<string> {
        const [userLinkPDA] = SimpleUserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const tx = await this.program.methods
            .removeSchoolLink()
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
            })
            .signers([user])
            .rpc();

        console.log(`✅ School link removed: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);

        return tx;
    }

    async getUserLink(userWallet: PublicKey) {
        const [userLinkPDA] = SimpleUserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        try {
            const userLink = await this.program.account.userLink.fetch(userLinkPDA);
            return {
                pda: userLinkPDA,
                ...userLink,
            };
        } catch (error) {
            console.log("User link not found or doesn't exist");
            return null;
        }
    }

    async userLinkExists(userWallet: PublicKey): Promise<boolean> {
        const userLink = await this.getUserLink(userWallet);
        return userLink !== null;
    }

    async getLinkedSchoolWallet(userWallet: PublicKey): Promise<PublicKey | null> {
        const userLink = await this.getUserLink(userWallet);
        if (!userLink) return null;
        
        if (userLink.schoolWallet.equals(SystemProgram.programId)) {
            return null;
        }
        
        return userLink.schoolWallet;
    }
}