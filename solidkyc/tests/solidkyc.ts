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
  let fake_admin: Keypair;

  let configPDA: PublicKey;
  let configBump: number;

  let issuerRegistryPDA: PublicKey;
  let issuerRegistryBump: number;

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
    fake_admin = Keypair.generate();

    // AIRDROP SOL to test accounts
    const airdropAmount = 10 * anchor.web3.LAMPORTS_PER_SOL;
    await airdrop(admin.publicKey, airdropAmount);
    await airdrop(fake_admin.publicKey, airdropAmount);

    // Derive PDAs
    [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [issuerRegistryPDA, issuerRegistryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("issuer_registry")],
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

  describe("Initialize Issuer Registry", () => {
    it("Should be created by only trusted admin", async () => {
      try {
        // Check admin balance before transaction
        const balance = await provider.connection.getBalance(fake_admin.publicKey);
        console.log(
          `Fake Admin balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`
        );

        await program.methods
          .initializeIssuerRegistry()
          .accounts({
            config: configPDA,
            issuerRegistry: issuerRegistryPDA,
            admin: fake_admin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([fake_admin])
          .rpc();

        assert.fail("Should have thrown an error for unauthorized admin");
      } catch (error) {
        const errorStr = error.toString();
        const hasUnauthorized =
          errorStr.includes("Unauthorized") ||
          errorStr.includes("UnauthorizedAdmin") ||
          (error.logs &&
            error.logs.some((log) => log.includes("Unauthorized")));

        assert.isTrue(
          hasUnauthorized,
          `Expected unauthorized error, got: ${errorStr}`
        );
      }
    });
    it("Should initialize issuer registry successfully", async () => {
      try {
        // Check admin balance before transaction
        const balance = await provider.connection.getBalance(admin.publicKey);
        console.log(
          `Admin balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`
        );

        const txn = await program.methods
          .initializeIssuerRegistry()
          .accounts({
            config: configPDA,
            issuerRegistry: issuerRegistryPDA,
            admin: admin.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([admin])
          .rpc();

        console.log("Initialize transaction signature:", txn);

        const issuerRegistry = await program.account.issuerRegistry.fetch(
          issuerRegistryPDA
        );

        assert.equal(
          issuerRegistry.admin.toString(),
          admin.publicKey.toString()
        );
        assert.equal(issuerRegistry.count, 0);
        assert.equal(issuerRegistry.bump, issuerRegistryBump);
      } catch (error) {
        console.error(error);
        throw error;
      }
    });
  });
});
