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

#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub version: u8,
    pub bump: u8,
}

impl ProgramConfig {
    pub const SIZE: usize = 8 + 32 + 1 + 1; // 8(discriminator) + 34 = 42 bytes total
}
