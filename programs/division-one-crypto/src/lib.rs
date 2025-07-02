use anchor_lang::prelude::*;

declare_id!("BAnYCRzAkVJSTNiHYZcDnRo8B1e2pSssQwAJEjdEcLbL");

#[program]
pub mod division_one_crypto {
    use super::*;

    /// Initialize a wallet link for a user with their first school wallet
    pub fn initialize_user_link(
        ctx: Context<InitializeUserLink>,
        school_wallet: Pubkey,
    ) -> Result<()> {
        let user_link = &mut ctx.accounts.user_link;
        
        user_link.user_wallet = ctx.accounts.user.key();
        user_link.school_wallet = school_wallet;
        user_link.created_at = Clock::get()?.unix_timestamp;
        user_link.updated_at = Clock::get()?.unix_timestamp;
        user_link.bump = ctx.bumps.user_link;

        emit!(UserLinkCreated {
            user_wallet: user_link.user_wallet,
            school_wallet: user_link.school_wallet,
        });

        Ok(())
    }

    /// Update the school wallet linked to a user (user can change schools)
    pub fn update_school_wallet(
        ctx: Context<UpdateUserLink>,
        new_school_wallet: Pubkey,
    ) -> Result<()> {
        let user_link = &mut ctx.accounts.user_link;

        require_keys_eq!(
            ctx.accounts.user.key(),
            user_link.user_wallet,
            ErrorCode::UserLinkNotFound
        );

        let old_school_wallet = user_link.school_wallet;
        user_link.school_wallet = new_school_wallet;
        user_link.updated_at = Clock::get()?.unix_timestamp;

        emit!(SchoolWalletUpdated {
            user_wallet: user_link.user_wallet,
            old_school_wallet,
            new_school_wallet,
        });

        Ok(())
    }

    /// Remove the school wallet link (sets school_wallet to system program)
    pub fn remove_school_link(ctx: Context<UpdateUserLink>) -> Result<()> {
        let user_link = &mut ctx.accounts.user_link;

        require_keys_eq!(
            ctx.accounts.user.key(),
            user_link.user_wallet,
            ErrorCode::UserLinkNotFound
        );

        let old_school_wallet = user_link.school_wallet;
        user_link.school_wallet = System::id(); // Set to system program to indicate no school linked
        user_link.updated_at = Clock::get()?.unix_timestamp;

        emit!(SchoolLinkRemoved {
            user_wallet: user_link.user_wallet,
            school_wallet: old_school_wallet,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUserLink<'info> {
    #[account(
        init,
        payer = user,
        space = UserLink::LEN,
        seeds = [b"user_link", user.key().as_ref()],
        bump
    )]
    pub user_link: Account<'info, UserLink>,

    /// CHECK: This is validated by being used as a seed for the PDA
    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUserLink<'info> {
    #[account(
        mut,
        seeds = [b"user_link", user_link.user_wallet.as_ref()],
        bump = user_link.bump,
        has_one = user_wallet @ ErrorCode::UnauthorizedAccess
    )]
    pub user_link: Account<'info, UserLink>,
    
    /// CHECK: Used for PDA seed consistency validation
    pub user: Signer<'info>,
}

#[account]
pub struct UserLink {
    /// The user wallet public key
    pub user_wallet: Pubkey,
    /// The linked school wallet public key
    pub school_wallet: Pubkey,
    /// Timestamp when the link was created
    pub created_at: i64,
    /// Timestamp when the link was last updated
    pub updated_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl UserLink {
    pub const LEN: usize = 8 + // discriminator
        32 + // user_wallet
        32 + // school_wallet  
        8 +  // created_at
        8 +  // updated_at
        1; // bump
}

#[event]
pub struct UserLinkCreated {
    pub user_wallet: Pubkey,
    pub school_wallet: Pubkey,
}

#[event]
pub struct SchoolWalletUpdated {
    pub user_wallet: Pubkey,
    pub old_school_wallet: Pubkey,
    pub new_school_wallet: Pubkey,
}

#[event]
pub struct SchoolLinkRemoved {
    pub user_wallet: Pubkey,
    pub school_wallet: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access to user link")]
    UnauthorizedAccess,
    #[msg("Invalid school wallet provided")]
    InvalidSchoolWallet,
    #[msg("User link already exists")]
    UserLinkAlreadyExists,
    #[msg("User link does not exist")]
    UserLinkNotFound,
}
