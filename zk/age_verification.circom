pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/*
 * AgeVerification Circuit - Enhanced Version
 * 
 * Public Inputs (verifier can see):
 * - currentTime: When proof was generated (prevents replay)
 * - expiresAt: When credential expires (transparent expiry)
 * - issuerPublicKeyX: Issuer's public key X (verifier can check on Solana)
 * - issuerPublicKeyY: Issuer's public key Y (verifier can check on Solana)
 * - credential_hash: Hash of credential
 *
 * Private Inputs (hidden in zero-knowledge):
 * - dateOfBirth: User's actual birth date
 * - signature: Issuer's signature
 */
template AgeVerification() {
    // PRIVATE INPUTS
    
    signal input dateOfBirth;                 // Unix timestamp (PRIVATE)
    
    // Issuer's EdDSA signature (PRIVATE)
    signal input signatureR8x;
    signal input signatureR8y;
    signal input signatureS;
    
    // PUBLIC INPUTS
    
    signal input currentTime;                 // Current timestamp (PUBLIC)
    signal input expiresAt;                   // Expiry timestamp (PUBLIC)
    signal input credential_hash;             // Poseidon hash from Solana (PUBLIC)

    // Issuer's Baby JubJub public key (PUBLIC)
    signal input issuerPublicKeyX;            
    signal input issuerPublicKeyY;
    
    // OUTPUT

    signal output isValid;
    
    // STEP 1: VERIFY CREDENTIAL HASH
    
    component credentialHasher = Poseidon(1);
    credentialHasher.inputs[0] <== dateOfBirth;
    credentialHasher.out === credential_hash;
    
    // STEP 2: VERIFY ISSUER'S EDDSA SIGNATURE
    
    component signatureVerifier = EdDSAPoseidonVerifier();
    signatureVerifier.enabled <== 1;
    signatureVerifier.Ax <== issuerPublicKeyX;
    signatureVerifier.Ay <== issuerPublicKeyY;
    signatureVerifier.R8x <== signatureR8x;
    signatureVerifier.R8y <== signatureR8y;
    signatureVerifier.S <== signatureS;
    signatureVerifier.M <== credential_hash;
    
    // STEP 3: VERIFY CURRENT TIME > DATE OF BIRTH
    
    component timeCheck = GreaterThan(64);
    timeCheck.in[0] <== currentTime;
    timeCheck.in[1] <== dateOfBirth;
    
    // This constraint will fail if currentTime <= dateOfBirth
    timeCheck.out === 1;
    
    // STEP 4: VERIFY AGE >= 18 YEARS
    
    signal ageInSeconds;
    ageInSeconds <== currentTime - dateOfBirth;
    
    // 18 years in seconds: 18 * 365 * 24 * 60 * 60 = 567,648,000
    component ageComparator = GreaterEqThan(64);
    ageComparator.in[0] <== ageInSeconds;
    ageComparator.in[1] <== 567648000;
    
    // STEP 5: VERIFY CREDENTIAL NOT EXPIRED
    
    component expiryComparator = LessThan(64);
    expiryComparator.in[0] <== currentTime;
    expiryComparator.in[1] <== expiresAt;
    
    // STEP 6: COMBINE ALL CHECKS (AND LOGIC)

    // Both age check AND expiry check must pass
    isValid <== ageComparator.out * expiryComparator.out;
}

// Declare public inputs
component main {public [currentTime, expiresAt, credential_hash, issuerPublicKeyX, issuerPublicKeyY]} = AgeVerification();