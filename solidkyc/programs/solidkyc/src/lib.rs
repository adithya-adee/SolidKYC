use anchor_lang::prelude::*;

declare_id!("5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg");

#[program]
pub mod solidkyc {
    use super::*;

    pub fn initialize_issuer(
        ctx: Context<InitializeIssuer>,
        name: String,
        zk_public_key_x: [u8; 32],
        zk_public_key_y: [u8; 32],
    ) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer_account;
        issuer.authority = ctx.accounts.authority.key();
        issuer.zk_public_key_x = zk_public_key_x;
        issuer.zk_public_key_y = zk_public_key_y;
        issuer.name = name;
        issuer.is_active = true;
        issuer.registered_at = Clock::get()?.unix_timestamp;
        issuer.credentials_issued = 0;
        issuer.bump = ctx.bumps.issuer_account;
        Ok(())
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_hash: [u8; 32],
        date_of_birth: i64,
        issued_at: i64,
        expires_at: i64,
        zk_signature_r8x: [u8; 32],
        zk_signature_r8y: [u8; 32],
        zk_signature_s: [u8; 32],
    ) -> Result<()> {
        let credential = &mut ctx.accounts.credential_account;
        credential.holder = ctx.accounts.holder.key();
        credential.issuer = ctx.accounts.issuer_account.key();
        credential.credential_hash = credential_hash;
        credential.date_of_birth = date_of_birth;
        credential.issued_at = issued_at;
        credential.expires_at = expires_at;
        credential.zk_signature_r8x = zk_signature_r8x;
        credential.zk_signature_r8y = zk_signature_r8y;
        credential.zk_signature_s = zk_signature_s;
        credential.is_revoked = false;
        credential.bump = ctx.bumps.credential_account;

        let issuer = &mut ctx.accounts.issuer_account;
        issuer.credentials_issued = issuer.credentials_issued.checked_add(1).unwrap();

        Ok(())
    }

    pub fn revoke_credential(ctx: Context<RevokeCredential>) -> Result<()> {
        let credential = &mut ctx.accounts.credential_account;
        require!(!credential.is_revoked, SolidKycError::CredentialAlreadyRevoked);
        credential.is_revoked = true;
        Ok(())
    }

    pub fn deactivate_issuer(ctx: Context<DeactivateIssuer>) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer_account;
        require!(issuer.is_active, SolidKycError::IssuerAlreadyInactive);
        issuer.is_active = false;
        Ok(())
    }

    pub fn reactivate_issuer(ctx: Context<ReactivateIssuer>) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer_account;
        require!(!issuer.is_active, SolidKycError::IssuerAlreadyActive);
        issuer.is_active = true;
        Ok(())
    }
}

// Account Structures

#[account]
pub struct IssuerAccount {
    pub authority: Pubkey,              // 32
    pub zk_public_key_x: [u8; 32],      // 32
    pub zk_public_key_y: [u8; 32],      // 32
    pub name: String,                   // 4 + max 50 = 54
    pub is_active: bool,                // 1
    pub registered_at: i64,             // 8
    pub credentials_issued: u64,        // 8
    pub bump: u8,                       // 1
}

impl IssuerAccount {
    pub const MAX_NAME_LEN: usize = 50;
    pub const LEN: usize = 8 + 32 + 32 + 32 + 4 + Self::MAX_NAME_LEN + 1 + 8 + 8 + 1;
}

#[account]
pub struct UserCredential {
    pub holder: Pubkey,                 // 32
    pub issuer: Pubkey,                 // 32
    pub credential_hash: [u8; 32],      // 32
    pub date_of_birth: i64,             // 8
    pub issued_at: i64,                 // 8
    pub expires_at: i64,                // 8
    pub zk_signature_r8x: [u8; 32],     // 32
    pub zk_signature_r8y: [u8; 32],     // 32
    pub zk_signature_s: [u8; 32],       // 32
    pub is_revoked: bool,               // 1
    pub bump: u8,                       // 1
}

impl UserCredential {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 32 + 32 + 32 + 1 + 1;
}

// Instruction Contexts

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeIssuer<'info> {
    #[account(
        init,
        payer = authority,
        space = IssuerAccount::LEN,
        seeds = [b"issuer", authority.key().as_ref()],
        bump
    )]
    pub issuer_account: Account<'info, IssuerAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    #[account(
        init,
        payer = issuer_authority,
        space = UserCredential::LEN,
        seeds = [b"credential", holder.key().as_ref(), issuer_account.key().as_ref()],
        bump
    )]
    pub credential_account: Account<'info, UserCredential>,
    
    #[account(
        mut,
        seeds = [b"issuer", issuer_authority.key().as_ref()],
        bump = issuer_account.bump,
        constraint = issuer_account.authority == issuer_authority.key() @ SolidKycError::UnauthorizedIssuer,
        constraint = issuer_account.is_active @ SolidKycError::IssuerInactive
    )]
    pub issuer_account: Account<'info, IssuerAccount>,
    
    #[account(mut)]
    pub issuer_authority: Signer<'info>,
    
    /// CHECK: This is the credential holder's public key, validated via PDA seeds
    pub holder: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCredential<'info> {
    #[account(
        mut,
        seeds = [b"credential", credential_account.holder.as_ref(), issuer_account.key().as_ref()],
        bump = credential_account.bump,
        constraint = credential_account.issuer == issuer_account.key() @ SolidKycError::InvalidIssuer
    )]
    pub credential_account: Account<'info, UserCredential>,
    
    #[account(
        seeds = [b"issuer", issuer_authority.key().as_ref()],
        bump = issuer_account.bump,
        constraint = issuer_account.authority == issuer_authority.key() @ SolidKycError::UnauthorizedIssuer
    )]
    pub issuer_account: Account<'info, IssuerAccount>,
    
    #[account(mut)]
    pub issuer_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeactivateIssuer<'info> {
    #[account(
        mut,
        seeds = [b"issuer", authority.key().as_ref()],
        bump = issuer_account.bump,
        constraint = issuer_account.authority == authority.key() @ SolidKycError::UnauthorizedAdmin
    )]
    pub issuer_account: Account<'info, IssuerAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReactivateIssuer<'info> {
    #[account(
        mut,
        seeds = [b"issuer", authority.key().as_ref()],
        bump = issuer_account.bump,
        constraint = issuer_account.authority == authority.key() @ SolidKycError::UnauthorizedAdmin
    )]
    pub issuer_account: Account<'info, IssuerAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Error Codes

#[error_code]
pub enum SolidKycError {
    #[msg("Unauthorized: Only admin can perform this action")]
    UnauthorizedAdmin,
    
    #[msg("Unauthorized: Only the issuer can perform this action")]
    UnauthorizedIssuer,
    
    #[msg("Invalid issuer for this credential")]
    InvalidIssuer,
    
    #[msg("Issuer is not active")]
    IssuerInactive,
    
    #[msg("Issuer is already inactive")]
    IssuerAlreadyInactive,
    
    #[msg("Issuer is already active")]
    IssuerAlreadyActive,
    
    #[msg("Credential has already been revoked")]
    CredentialAlreadyRevoked,
    
    #[msg("Invalid credential hash")]
    InvalidCredentialHash,
    
    #[msg("Credential has expired")]
    CredentialExpired,
    
    #[msg("Invalid ZK proof")]
    InvalidZkProof,
}
