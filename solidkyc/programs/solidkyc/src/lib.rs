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

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_hash: [u8; 32],
        issued_at: i64,
        expires_at: i64,
    ) -> Result<()> {
        let issuer_registry = &ctx.accounts.issuer_registry;
        let issuer_pubkey = ctx.accounts.issuer.key();

        let is_valid_issuer = issuer_registry
            .issuers
            .iter()
            .any(|issuer| *issuer == issuer_pubkey);
        require!(is_valid_issuer, SolidKycError::IssuerNotRegistered);

        let current_time = Clock::get()?.unix_timestamp;
        require!(
            issued_at <= current_time,
            SolidKycError::InvalidIssuedTimestamp
        );
        require!(
            expires_at > current_time,
            SolidKycError::InvalidExpiryTimestamp
        );
        require!(expires_at > issued_at, SolidKycError::ExpiryBeforeIssuance);

        let user_identity = &mut ctx.accounts.user_identity;

        user_identity.issuer = issuer_pubkey;
        user_identity.owner = ctx.accounts.user.key();
        user_identity.credential_hash = credential_hash;
        user_identity.issued_at = issued_at;
        user_identity.expires_at = expires_at;
        user_identity.bump = ctx.bumps.user_identity;

        msg!(
            "Credential issued to user: {} by issuer: {}",
            user_identity.owner,
            user_identity.issuer
        );
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

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(
        seeds = [b"issuer_registry"],
        bump
    )]
    pub issuer_registry: Box<Account<'info, IssuerRegistry>>,

    #[account(
        init,
        payer = issuer,
        space = UserIdentity::SIZE,
        seeds = [b"user_identity", user.key().as_ref()],
        bump
    )]
    pub user_identity: Account<'info, UserIdentity>,

    /// CHECK: This is the user receiving the credential
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    pub issuer: Signer<'info>,

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

#[account]
pub struct UserIdentity {
    pub owner: Pubkey,
    pub issuer: Pubkey,
    pub credential_hash: [u8; 32],
    pub revocation_nonce: u64,
    pub issued_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}

impl UserIdentity {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1; // 8 (discriminator) + 121 = 129 bytes total
}

#[error_code]
pub enum SolidKycError {
    #[msg("Unauthorized: Only admin can perform this action")]
    UnauthorizedAdmin,

    #[msg("Issuer is not registered in the registry")]
    IssuerNotRegistered,

    #[msg("Invalid issued timestamp: cannot be in the future")]
    InvalidIssuedTimestamp,

    #[msg("Invalid expiry timestamp: must be in the future")]
    InvalidExpiryTimestamp,

    #[msg("Expiry timestamp must be after issuance timestamp")]
    ExpiryBeforeIssuance,
}
