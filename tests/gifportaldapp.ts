import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Gifportaldapp } from '../target/types/gifportaldapp';
import assert from 'assert';

const { SystemProgram } = anchor.web3;


describe('gifportaldapp', () => {

  const provider = anchor.Provider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const baseAccount = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Gifportaldapp as Program<Gifportaldapp>;

  it('Is initialized!', async () => {
    await program.rpc.initialize({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.totalGifs.eq(new anchor.BN(0)))
  });

  it('Gif added', async () => {

    const gifLink = 'insert_a_giphy_link_here';
    await program.rpc.addGif(gifLink, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    assert.ok(account.totalGifs.eq(new anchor.BN(1)))
    assert.equal(account.gifList[0].gifLink, gifLink);
    assert.equal(Object.keys(account.gifList).length, 1)

  });

  it('Gif upvoted', async () => {

    const gifLink = 'insert_a_giphy_link_here';
    await program.rpc.incrementUpVote(gifLink, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    assert.ok(account.gifList[0].upVotes.eq(new anchor.BN(1)));
  });
});
