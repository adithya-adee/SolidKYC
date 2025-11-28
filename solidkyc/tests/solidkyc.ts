import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solidkyc } from "../target/types/solidkyc";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("solidkyc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solidkyc as Program<Solidkyc>;

  let admin: Keypair;

  let configPDA: PublicKey;
  let configBump: number;

  async function airdrop(publicKey: PublicKey, amount: number) {
    try {
      console.log(
        `Requesting airdrop of ${
          amount / anchor.web3.LAMPORTS_PER_SOL
        } SOL to ${publicKey.toString()}`
      );
      const signature = await provider.connection.requestAirdrop(
        publicKey,
        amount
      );
      const latestBlockhash = await provider.connection.getLatestBlockhash();

      await provider.connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });
      console.log(`Airdrop completed with signature: ${signature}`);
    } catch (error) {
      console.error("Airdrop failed:", error);
      throw error;
    }
  }

  before(async () => {
    // Generate KeyPair
    admin = Keypair.generate();

    // AIRDROP SOL to test accounts
    const airdropAmount = 10 * anchor.web3.LAMPORTS_PER_SOL;
    await airdrop(admin.publicKey, airdropAmount);

    // Derive PDAs
    [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  describe("Initialize Program Configuration", () => {
    it("Should initialize program config successfully", async () => {
      try {
        // Check admin balance before transaction
        const balance = await provider.connection.getBalance(admin.publicKey);
        console.log(
          `Admin balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`
        );

        const txn = await program.methods
          .initializeProgramConfig()
          .accounts({
            config: configPDA,
            admin: admin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
          .rpc();

        console.log("Initialize transaction signature:", txn);

        // Fetch and validate the created account
        const configAccount = await program.account.programConfig.fetch(
          configPDA
        );

        // Assertions with better error messages
        assert.equal(
          configAccount.admin.toString(),
          admin.publicKey.toString(),
          "Admin public key should match"
        );
        assert.equal(configAccount.version, 1, "Version should be 1");
        assert.equal(
          configAccount.bump,
          configBump,
          "Bump should match derived bump"
        );

        console.log("Program configuration initialized successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });
    it("Should fail to initialize config twice", async () => {
      try {
        await program.methods
          .initializeProgramConfig()
          .accounts({
            config: configPDA,
            admin: admin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "already in use");
      }
    });
  });
});
