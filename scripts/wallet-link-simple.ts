import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

export class UserLinkClient {
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

    static deriveCollegeRegistryPDA(
        programId: PublicKey
    ): [PublicKey, number] {
        return PublicKey.findProgramAddressSync(
            [Buffer.from("college_registry")],
            programId
        );
    }

    async initializeUserLink(
        userWallet: PublicKey,
        schoolWallet: PublicKey,
        authority: Keypair
    ): Promise<string> {
        const [userLinkPDA] = UserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .initializeUserLink(schoolWallet)
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ User link initialized: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);
        console.log(`🔗 School Wallet: ${schoolWallet.toString()}`);
        console.log(`📍 PDA: ${userLinkPDA.toString()}`);

        return tx;
    }

    async updateSchoolWallet(
        userWallet: PublicKey,
        newSchoolWallet: PublicKey,
        authority: Keypair
    ): Promise<string> {
        const [userLinkPDA] = UserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .updateSchoolWallet(newSchoolWallet)
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ School wallet updated: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);
        console.log(`🔗 New School Wallet: ${newSchoolWallet.toString()}`);

        return tx;
    }

    async removeSchoolLink(
        userWallet: PublicKey,
        authority: Keypair
    ): Promise<string> {
        const [userLinkPDA] = UserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .removeSchoolLink()
            .accounts({
                userLink: userLinkPDA,
                user: userWallet,
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ School link removed: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);

        return tx;
    }

    async transferAuthority(
        userWallet: PublicKey,
        newAuthority: PublicKey,
        currentAuthority: Keypair
    ): Promise<string> {
        const [userLinkPDA] = UserLinkClient.deriveUserLinkPDA(
            userWallet,
            this.program.programId
        );

        const tx = await this.program.methods
            .transferAuthority(newAuthority)
            .accounts({
                userLink: userLinkPDA,
                authority: currentAuthority.publicKey,
            })
            .signers([currentAuthority])
            .rpc();

        console.log(`✅ Authority transferred: ${tx}`);
        console.log(`👤 User Wallet: ${userWallet.toString()}`);
        console.log(`👑 New Authority: ${newAuthority.toString()}`);

        return tx;
    }

    async getUserLink(userWallet: PublicKey) {
        const [userLinkPDA] = UserLinkClient.deriveUserLinkPDA(
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

    async getCollegeRegistry() {
        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        try {
            const collegeRegistry = await this.program.account.collegeRegistry.fetch(collegeRegistryPDA);
            return {
                pda: collegeRegistryPDA,
                ...collegeRegistry,
            };
        } catch (error) {
            console.log("College registry not found or doesn't exist");
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

    async isSchoolRegistered(schoolWallet: PublicKey): Promise<boolean> {
        const collegeRegistry = await this.getCollegeRegistry();
        if (!collegeRegistry) return false;
        
        return collegeRegistry.schoolWallets.some(
            (wallet: PublicKey) => wallet.equals(schoolWallet)
        );
    }

    async initializeCollegeRegistry(
        schoolWallets: PublicKey[],
        authority: Keypair
    ): Promise<string> {
        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .initializeCollegeRegistry(schoolWallets)
            .accounts({
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ College registry initialized: ${tx}`);
        console.log(`👑 Authority: ${authority.publicKey.toString()}`);
        console.log(`📚 Schools registered: ${schoolWallets.length}`);

        return tx;
    }

    async addSchoolToRegistry(
        schoolWallet: PublicKey,
        authority: Keypair
    ): Promise<string> {
        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .addSchoolToRegistry(schoolWallet)
            .accounts({
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ School added to registry: ${tx}`);
        console.log(`🔗 School Wallet: ${schoolWallet.toString()}`);

        return tx;
    }

    async removeSchoolFromRegistry(
        schoolWallet: PublicKey,
        authority: Keypair
    ): Promise<string> {
        const [collegeRegistryPDA] = UserLinkClient.deriveCollegeRegistryPDA(
            this.program.programId
        );

        const tx = await this.program.methods
            .removeSchoolFromRegistry(schoolWallet)
            .accounts({
                collegeRegistry: collegeRegistryPDA,
                authority: authority.publicKey,
            })
            .signers([authority])
            .rpc();

        console.log(`✅ School removed from registry: ${tx}`);
        console.log(`🔗 School Wallet: ${schoolWallet.toString()}`);

        return tx;
    }
} 