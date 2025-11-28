use anchor_lang::prelude::*;

declare_id!("5AFgFmdQthc3DZKmygrsGZkNnCN9JYMefADiAvNXpYCg");

#[program]
pub mod solidkyc {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
