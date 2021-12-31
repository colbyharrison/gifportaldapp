use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction::transfer};
declare_id!("J47bu99JDY6GdnyQ6yZ7nz4uRePWPa99zpjQz2ubc9xt");

#[program]
pub mod gifportaldapp {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    // The function now accepts a gif_link param from the user. We also reference the user from the Context
    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // Build the struct.
        let item = ItemStruct {
            id: base_account.total_gifs, // TODO need a better id than count (rand not available)
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            up_votes: 0,
        };

        // Add it to the gif_list vector.
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn increment_up_vote(ctx: Context<IncrementUpVote>, gif_id: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let id = gif_id.trim().parse::<u64>().expect("This must be a number");

        for item in base_account.gif_list.iter_mut() {
            if id == item.id {
                item.up_votes += 1;
            }
        }

        Ok(())
    }

    pub fn tip(ctx: Context<Tip>, amount: String) -> ProgramResult {
        //Todo there should be some validation that the to account has actually posted a gif
        let to = &mut ctx.accounts.to;
        let from = &mut ctx.accounts.from;
        let lamport_tip = amount.trim().parse::<u64>().expect("This must be a number");

        let transfer = transfer(
            from.to_account_info().key,
            to.to_account_info().key,
            lamport_tip,
        );
        invoke(
            &transfer,
            &[
                from.to_account_info(),
                to.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 10000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Add the signer who calls the AddGif method to the struct so that we can save it
#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct IncrementUpVote<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Tip<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
// Create a custom struct for us to work with.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub id: u64,
    pub gif_link: String,
    pub user_address: Pubkey,
    pub up_votes: u64,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    // Attach a Vector of type ItemStruct to the account.
    pub gif_list: Vec<ItemStruct>,
}
