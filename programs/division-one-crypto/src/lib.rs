use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{Token2022, spl_token_2022::{self, extension::{ExtensionType, StateWithExtensions}, state::Mint as Token2022Mint}},
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};
use spl_tlv_account_resolution::{account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList};

declare_id!("D6XYa4oPwgMnVX59YbFLxbYstUYEc2YTddx6xTLY4uRs");

#[program]
pub mod division_one_crypto {
    use super::*;

    /// Initialize the token mint with transfer hook
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        ops_wallet: Pubkey,
    ) -> Result<()> {
        let mint = &ctx.accounts.mint;
        let authority = &ctx.accounts.authority;

        // Initialize mint with transfer hook extension
        let space = ExtensionType::try_calculate_account_len::<Token2022Mint>(&[
            ExtensionType::TransferHook,
            ExtensionType::MetadataPointer,
        ])?;

        // Set transfer hook program ID
        let hook_program_id = crate::ID;
        
        msg!("Initializing token: {} ({})", name, symbol);
        msg!("OPs wallet: {}", ops_wallet);
        msg!("Transfer hook program: {}", hook_program_id);

        Ok(())
    }

    /// Set college wallet for a user
    pub fn set_college_wallet(
        ctx: Context<SetCollegeWallet>,
        college_wallet: Pubkey,
    ) -> Result<()> {
        let user_config = &mut ctx.accounts.user_config;
        user_config.user = ctx.accounts.user.key();
        user_config.college_wallet = college_wallet;
        user_config.bump = ctx.bumps.user_config;

        msg!("Set college wallet {} for user {}", college_wallet, ctx.accounts.user.key());
        Ok(())
    }

    /// Transfer hook implementation
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        // Calculate fees (3% total)
        let ops_fee = amount * 5 / 1000; // 0.5%
        let burn_fee = amount * 5 / 1000; // 0.5%
        let college_fee = amount * 20 / 1000; // 2%
        let total_fees = ops_fee + burn_fee + college_fee;

        msg!("Transfer amount: {}", amount);
        msg!("Fees - OPs: {}, Burn: {}, College: {}", ops_fee, burn_fee, college_fee);

        // Get user's college wallet from config
        let college_wallet = ctx.accounts.user_config.college_wallet;

        // Transfer fees
        if ops_fee > 0 {
            // Transfer to OPs wallet
            let cpi_accounts = anchor_spl::token_interface::Transfer {
                from: ctx.accounts.source_token.to_account_info(),
                to: ctx.accounts.ops_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            anchor_spl::token_interface::transfer(cpi_ctx, ops_fee)?;
        }

        if burn_fee > 0 {
            // Burn tokens
            let cpi_accounts = anchor_spl::token_interface::Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.source_token.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            anchor_spl::token_interface::burn(cpi_ctx, burn_fee)?;
        }

        if college_fee > 0 {
            // Transfer to college wallet
            let cpi_accounts = anchor_spl::token_interface::Transfer {
                from: ctx.accounts.source_token.to_account_info(),
                to: ctx.accounts.college_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            anchor_spl::token_interface::transfer(cpi_ctx, college_fee)?;
        }

        Ok(())
    }

    /// Initialize extra account metas for transfer hook
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        // Define the extra accounts needed for the transfer hook
        let account_metas = vec![
            // User config account
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal {
                    bytes: "user-config".as_bytes().to_vec(),
                }, Seed::AccountKey { index: 3 }], // owner/authority account
                false, // is_signer
                false, // is_writable
            )?,
            // OPs token account
            ExtraAccountMeta::new_external_pda_with_seeds(
                0, // program_id_index (will be set to associated token program)
                &[
                    Seed::AccountKey { index: 4 }, // ops_wallet
                    Seed::AccountKey { index: 1 }, // token_program
                    Seed::AccountKey { index: 2 }, // mint
                ],
                false, // is_signer
                true,  // is_writable
            )?,
            // College token account  
            ExtraAccountMeta::new_external_pda_with_seeds(
                0, // program_id_index (will be set to associated token program)
                &[
                    Seed::AccountData { 
                        account_index: 6, // user_config account
                        data_index: 8,    // offset to college_wallet field
                        length: 32,       // pubkey length
                    },
                    Seed::AccountKey { index: 1 }, // token_program
                    Seed::AccountKey { index: 2 }, // mint
                ],
                false, // is_signer
                true,  // is_writable
            )?,
        ];

        // Initialize the extra account meta list
        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, decimals: u8, ops_wallet: Pubkey)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = authority,
        mint::token_program = token_program,
        extensions::transfer_hook::authority = authority,
        extensions::transfer_hook::program_id = crate::ID,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: OPs wallet pubkey
    pub ops_wallet: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetCollegeWallet<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserConfig::INIT_SPACE,
        seeds = [b"user-config", user.key().as_ref()],
        bump
    )]
    pub user_config: Account<'info, UserConfig>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(token::mint = mint, token::authority = owner)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: destination token account
    pub destination_token: UncheckedAccount<'info>,

    /// CHECK: owner/authority of source token account
    pub owner: UncheckedAccount<'info>,

    /// CHECK: extra account meta list
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(
        seeds = [b"user-config", owner.key().as_ref()],
        bump = user_config.bump
    )]
    pub user_config: Account<'info, UserConfig>,

    /// CHECK: OPs token account (ATA)
    #[account(mut)]
    pub ops_token_account: UncheckedAccount<'info>,

    /// CHECK: College token account (ATA)  
    #[account(mut)]
    pub college_token_account: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList account
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct UserConfig {
    pub user: Pubkey,
    pub college_wallet: Pubkey,
    pub bump: u8,
}