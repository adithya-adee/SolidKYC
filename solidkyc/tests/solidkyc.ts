import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solidkyc } from "../target/types/solidkyc";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("solidkyc", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solidkyc as Program<Solidkyc>;

  let issuerAuthority: Keypair;
  let holder: Keypair;
  let unauthorizedUser: Keypair;

  let issuerPDA: PublicKey;
  let issuerBump: number;
  const issuerName = "Test KYC Issuer";

  let credentialPDA: PublicKey;
  let credentialBump: number;

  // Sample ZK data
  const zkPublicKeyX = Array(32).fill(1);
  const zkPublicKeyY = Array(32).fill(2);
  const credentialHash = Array(32).fill(3);
  const zkSignatureR8x = Array(32).fill(4);
  const zkSignatureR8y = Array(32).fill(5);
  const zkSignatureS = Array(32).fill(6);

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
    // Generate KeyPairs
    issuerAuthority = Keypair.generate();
    holder = Keypair.generate();
    unauthorizedUser = Keypair.generate();

    // AIRDROP SOL to test accounts
    const airdropAmount = 10 * anchor.web3.LAMPORTS_PER_SOL;
    await airdrop(issuerAuthority.publicKey, airdropAmount);
    await airdrop(holder.publicKey, airdropAmount);
    await airdrop(unauthorizedUser.publicKey, airdropAmount);

    // Derive PDAs
    [issuerPDA, issuerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("issuer"), issuerAuthority.publicKey.toBuffer(), Buffer.from(issuerName)],
      program.programId
    );

    console.log("Issuer PDA:", issuerPDA.toString());
    console.log("Issuer Authority:", issuerAuthority.publicKey.toString());
    console.log("Holder:", holder.publicKey.toString());
  });

  describe("Initialize Issuer", () => {
    it("Should initialize issuer successfully", async () => {
      try {
        const txn = await program.methods
          .initializeIssuer(issuerName, zkPublicKeyX, zkPublicKeyY)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Initialize issuer transaction signature:", txn);

        // Fetch and validate the created account
        const issuerAccount = await program.account.issuerAccount.fetch(
          issuerPDA
        );

        assert.equal(
          issuerAccount.authority.toString(),
          issuerAuthority.publicKey.toString(),
          "Authority should match"
        );
        assert.equal(issuerAccount.name, issuerName, "Name should match");
        assert.isTrue(issuerAccount.isActive, "Issuer should be active");
        assert.equal(
          issuerAccount.credentialsIssued.toNumber(),
          0,
          "Credentials issued should be 0"
        );
        assert.deepEqual(
          Array.from(issuerAccount.zkPublicKeyX),
          zkPublicKeyX,
          "ZK public key X should match"
        );
        assert.deepEqual(
          Array.from(issuerAccount.zkPublicKeyY),
          zkPublicKeyY,
          "ZK public key Y should match"
        );

        console.log("Issuer initialized successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });

    it("Should fail to initialize issuer twice with same name and authority", async () => {
      try {
        await program.methods
          .initializeIssuer(issuerName, zkPublicKeyX, zkPublicKeyY)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "already in use");
      }
    });

    it("Should allow creating multiple issuers for same authority with different names", async () => {
      try {
        const secondIssuerName = "Second KYC Issuer";
        const [secondIssuerPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("issuer"), issuerAuthority.publicKey.toBuffer(), Buffer.from(secondIssuerName)],
          program.programId
        );

        const txn = await program.methods
          .initializeIssuer(secondIssuerName, zkPublicKeyX, zkPublicKeyY)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Second issuer created:", txn);

        const issuerAccount = await program.account.issuerAccount.fetch(
          secondIssuerPDA
        );

        assert.equal(issuerAccount.name, secondIssuerName, "Second issuer name should match");
        console.log("Successfully created multiple issuers for same authority!");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });
  });

  describe("Issue Credential", () => {
    before(async () => {
      // Derive credential PDA
      [credentialPDA, credentialBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("credential"),
          holder.publicKey.toBuffer(),
          issuerPDA.toBuffer(),
        ],
        program.programId
      );

      console.log("Credential PDA:", credentialPDA.toString());
    });

    it("Should issue credential successfully", async () => {
      try {
        const issuedAt = new anchor.BN(Date.now() / 1000);
        const expiresAt = new anchor.BN(Date.now() / 1000 + 365 * 24 * 60 * 60); // 1 year from now

        const txn = await program.methods
          .issueCredential(
            issuerName,
            credentialHash,
            issuedAt,
            expiresAt,
            zkSignatureR8x,
            zkSignatureR8y,
            zkSignatureS
          )
          .accountsPartial({
            issuerAuthority: issuerAuthority.publicKey,
            holder: holder.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Issue credential transaction signature:", txn);

        // Fetch and validate the credential
        const credential = await program.account.userCredential.fetch(
          credentialPDA
        );

        assert.equal(
          credential.holder.toString(),
          holder.publicKey.toString(),
          "Holder should match"
        );
        assert.equal(
          credential.issuer.toString(),
          issuerPDA.toString(),
          "Issuer should match"
        );
        assert.deepEqual(
          Array.from(credential.credentialHash),
          credentialHash,
          "Credential hash should match"
        );
        assert.isFalse(credential.isRevoked, "Should not be revoked");

        // Check issuer's credential count
        const issuerAccount = await program.account.issuerAccount.fetch(
          issuerPDA
        );
        assert.equal(
          issuerAccount.credentialsIssued.toNumber(),
          1,
          "Credentials issued should be 1"
        );

        console.log("Credential issued successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });

    it("Should fail to issue credential with unauthorized issuer", async () => {
      const [anotherCredentialPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("credential"),
          unauthorizedUser.publicKey.toBuffer(),
          issuerPDA.toBuffer(),
        ],
        program.programId
      );

      try {
        const issuedAt = new anchor.BN(Date.now() / 1000);
        const expiresAt = new anchor.BN(Date.now() / 1000 + 365 * 24 * 60 * 60);

        await program.methods
          .issueCredential(
            issuerName,
            credentialHash,
            issuedAt,
            expiresAt,
            zkSignatureR8x,
            zkSignatureR8y,
            zkSignatureS
          )
          .accountsPartial({
            issuerAccount: issuerPDA,
            issuerAuthority: unauthorizedUser.publicKey,
            holder: unauthorizedUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasUnauthorized =
          errorStr.includes("UnauthorizedIssuer") ||
          errorStr.includes("ConstraintRaw") ||
          errorStr.includes("ConstraintSeeds") ||
          (error.logs &&
            error.logs.some(
              (log) =>
                log.includes("UnauthorizedIssuer") ||
                log.includes("ConstraintRaw") ||
                log.includes("ConstraintSeeds")
            ));

        assert.isTrue(
          hasUnauthorized,
          `Expected unauthorized or constraint error, got: ${errorStr}`
        );
      }
    });
  });

  describe("Revoke Credential", () => {
    it("Should revoke credential successfully", async () => {
      try {
        const txn = await program.methods
          .revokeCredential(issuerName)
          .accountsPartial({
            credentialAccount: credentialPDA,
            issuerAccount: issuerPDA,
            issuerAuthority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Revoke credential transaction signature:", txn);

        // Fetch and validate the credential
        const credential = await program.account.userCredential.fetch(
          credentialPDA
        );

        assert.isTrue(credential.isRevoked, "Credential should be revoked");

        console.log("Credential revoked successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });

    it("Should fail to revoke already revoked credential", async () => {
      try {
        await program.methods
          .revokeCredential(issuerName)
          .accountsPartial({
            credentialAccount: credentialPDA,
            issuerAccount: issuerPDA,
            issuerAuthority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasAlreadyRevoked =
          errorStr.includes("CredentialAlreadyRevoked") ||
          (error.logs &&
            error.logs.some((log) =>
              log.includes("CredentialAlreadyRevoked")
            ));

        assert.isTrue(
          hasAlreadyRevoked,
          `Expected CredentialAlreadyRevoked error, got: ${errorStr}`
        );
      }
    });

    it("Should fail to revoke credential with unauthorized issuer", async () => {
      // Create a new credential to test unauthorized revocation
      const newHolder = Keypair.generate();
      await airdrop(newHolder.publicKey, anchor.web3.LAMPORTS_PER_SOL);

      const [newCredentialPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("credential"),
          newHolder.publicKey.toBuffer(),
          issuerPDA.toBuffer(),
        ],
        program.programId
      );

      try {
        const issuedAt = new anchor.BN(Date.now() / 1000);
        const expiresAt = new anchor.BN(Date.now() / 1000 + 365 * 24 * 60 * 60);

        // First issue a credential
        await program.methods
          .issueCredential(
            issuerName,
            credentialHash,
            issuedAt,
            expiresAt,
            zkSignatureR8x,
            zkSignatureR8y,
            zkSignatureS
          )
          .accountsPartial({
            issuerAuthority: issuerAuthority.publicKey,
            holder: newHolder.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        // Try to revoke with wrong authority
        await program.methods
          .revokeCredential(issuerName)
          .accountsPartial({
            credentialAccount: newCredentialPDA,
            issuerAccount: issuerPDA,
            issuerAuthority: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasUnauthorized =
          errorStr.includes("UnauthorizedIssuer") ||
          errorStr.includes("ConstraintSeeds") ||
          errorStr.includes("ConstraintSigner") ||
          (error.logs &&
            error.logs.some(
              (log) =>
                log.includes("UnauthorizedIssuer") ||
                log.includes("ConstraintSeeds") ||
                log.includes("ConstraintSigner")
            ));

        assert.isTrue(
          hasUnauthorized,
          `Expected unauthorized or constraint error, got: ${errorStr}`
        );
      }
    });
  });

  describe("Deactivate and Reactivate Issuer", () => {
    it("Should deactivate issuer successfully", async () => {
      try {
        const txn = await program.methods
          .deactivateIssuer(issuerName)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Deactivate issuer transaction signature:", txn);

        // Fetch and validate
        const issuerAccount = await program.account.issuerAccount.fetch(
          issuerPDA
        );

        assert.isFalse(issuerAccount.isActive, "Issuer should be inactive");

        console.log("Issuer deactivated successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });

    it("Should fail to deactivate already inactive issuer", async () => {
      try {
        await program.methods
          .deactivateIssuer(issuerName)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasAlreadyInactive =
          errorStr.includes("IssuerAlreadyInactive") ||
          (error.logs &&
            error.logs.some((log) => log.includes("IssuerAlreadyInactive")));

        assert.isTrue(
          hasAlreadyInactive,
          `Expected IssuerAlreadyInactive error, got: ${errorStr}`
        );
      }
    });

    it("Should fail to issue credential when issuer is inactive", async () => {
      const newHolder = Keypair.generate();
      await airdrop(newHolder.publicKey, anchor.web3.LAMPORTS_PER_SOL);

      const [newCredPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("credential"),
          newHolder.publicKey.toBuffer(),
          issuerPDA.toBuffer(),
        ],
        program.programId
      );

      try {
        const issuedAt = new anchor.BN(Date.now() / 1000);
        const expiresAt = new anchor.BN(Date.now() / 1000 + 365 * 24 * 60 * 60);

        await program.methods
          .issueCredential(
            issuerName,
            credentialHash,
            issuedAt,
            expiresAt,
            zkSignatureR8x,
            zkSignatureR8y,
            zkSignatureS
          )
          .accountsPartial({
            issuerAuthority: issuerAuthority.publicKey,
            holder: newHolder.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([issuerAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasInactive =
          errorStr.includes("IssuerInactive") ||
          (error.logs && error.logs.some((log) => log.includes("IssuerInactive")));

        assert.isTrue(
          hasInactive,
          `Expected IssuerInactive error, got: ${errorStr}`
        );
      }
    });

    it("Should reactivate issuer successfully", async () => {
      try {
        const txn = await program.methods
          .reactivateIssuer(issuerName)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        console.log("Reactivate issuer transaction signature:", txn);

        // Fetch and validate
        const issuerAccount = await program.account.issuerAccount.fetch(
          issuerPDA
        );

        assert.isTrue(issuerAccount.isActive, "Issuer should be active");

        console.log("Issuer reactivated successfully");
      } catch (error) {
        console.error("Test failed:", error);
        throw error;
      }
    });

    it("Should fail to reactivate already active issuer", async () => {
      try {
        await program.methods
          .reactivateIssuer(issuerName)
          .accountsPartial({
            authority: issuerAuthority.publicKey,
          })
          .signers([issuerAuthority])
          .rpc();

        assert.fail("Should have thrown an error");
      } catch (error) {
        const errorStr = error.toString();
        const hasAlreadyActive =
          errorStr.includes("IssuerAlreadyActive") ||
          (error.logs &&
            error.logs.some((log) => log.includes("IssuerAlreadyActive")));

        assert.isTrue(
          hasAlreadyActive,
          `Expected IssuerAlreadyActive error, got: ${errorStr}`
        );
      }
    });
  });
});
