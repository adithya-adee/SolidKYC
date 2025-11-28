use anchor_lang::prelude::*;

declare_id!("5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg");

#[program]
pub mod solidkyc {
    use super::*;

    pub fn initialize_program_config(ctx: Context<InitializeProgramConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.admin = ctx.accounts.admin.key();
        config.version = 1;
        config.bump = ctx.bumps.config;

        msg!("SolidKYC initialized with admin: {}", config.admin);
        Ok(())
    }

    pub fn initialize_issuer_registry(ctx: Context<InitializeIssuerRegistry>) -> Result<()> {
        let issuer_registry = &mut ctx.accounts.issuer_registry;

        issuer_registry.admin = ctx.accounts.admin.key();
        issuer_registry.count = 0;
        issuer_registry.bump = ctx.bumps.issuer_registry;

        msg!("Issuer registry initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProgramConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = ProgramConfig::SIZE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeIssuerRegistry<'info> {
    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = admin,
        space = IssuerRegistry::SIZE,
        seeds = [b"issuer_registry"],
        bump
    )]
    pub issuer_registry: Box<Account<'info, IssuerRegistry>>,

    #[account(
        mut,
        address = config.admin @ SolidKycError::UnauthorizedAdmin
    )]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub version: u8,
    pub bump: u8,
}

impl ProgramConfig {
    pub const SIZE: usize = 8 + 32 + 1 + 1; // 8(discriminator) + 34 = 42 bytes total
}

#[account]
pub struct IssuerRegistry {
    pub admin: Pubkey,
    pub issuers: [Pubkey; 32],
    pub count: u8,
    pub bump: u8,
}

impl IssuerRegistry {
    pub const SIZE: usize = 8 + 32 + 32 * 32 + 1 + 1; // 8 (discriminator) + 1058 = 1066 bytes total
}

#[error_code]
pub enum SolidKycError {
    #[msg("Unauthorized: Only admin can perform this action")]
    UnauthorizedAdmin,
}
