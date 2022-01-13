import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Gifportaldapp } from '../target/types/gifportaldapp';
import assert from 'assert';
import AccountFactory from '@project-serum/anchor/dist/cjs/program/namespace/account';

const { SystemProgram } = anchor.web3;

describe('gifportaldapp', () => {

  const provider = anchor.Provider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const baseAccount = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Gifportaldapp as Program<Gifportaldapp>;

  const gifContributor = anchor.web3.Keypair.generate();


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
    assert.ok(account.gifList[0].id.eq(new anchor.BN(0)));
    assert.equal(Object.keys(account.gifList).length, 1)

  });


  it('Second Gif Added', async () => {
    const gifLink = 'second link';
    await program.rpc.addGif(gifLink, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    assert.ok(account.totalGifs.eq(new anchor.BN(2)))
    assert.equal(account.gifList[1].gifLink, gifLink);
    assert.ok(account.gifList[1].id.eq(new anchor.BN(1)));
    assert.equal(Object.keys(account.gifList).length, 2);
  });

  it('Gif upvoted', async () => {

    const gifId = '0';

    await program.rpc.incrementUpVote(gifId, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    assert.ok(account.gifList[0].upVotes.eq(new anchor.BN(1)));
  });

  it('Tip gif poster', async () => {
    const gifLink = 'insert_a_giphy_link_here';
    let sendAmount = anchor.web3.LAMPORTS_PER_SOL;

    await program.rpc.tip(sendAmount.toString(), {
      accounts: {
        from: provider.wallet.publicKey,
        to: gifContributor.publicKey,
        systemProgram: SystemProgram.programId
      }
    });

    const gifOwnerBalance = await provider.connection.getBalance(gifContributor.publicKey);
    assert.equal(sendAmount, gifOwnerBalance);
  });
});
