pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom";

template AgeVerification() {
    // Inputs
    signal input verificationCredentials;     // Credentials from IndexedDB
    signal input credential_hash;             // Hash of verificationCredentials from Solana
    signal input dateOfBirth;                 // Unix timestamp of birth date
    signal input currentTime;                 // Current Unix timestamp
    signal input issuerPublicKeyX;            // Issuer's public key X coordinate
    signal input issuerPublicKeyY;            // Issuer's public key Y coordinate
    signal input signatureR8x;                // EdDSA signature R8 point X coordinate
    signal input signatureR8y;                // EdDSA signature R8 point Y coordinate
    signal input signatureS;                  // EdDSA signature S value
    
    // Output
    signal output isValid;

    // Step 1: Verify the credential hash matches
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== verificationCredentials;
    poseidon.out === credential_hash;

    // Step 2: Verify EdDSA signature on the credential hash
    component signatureVerifier = EdDSAPoseidonVerifier();
    signatureVerifier.enabled <== 1;
    signatureVerifier.Ax <== issuerPublicKeyX;
    signatureVerifier.Ay <== issuerPublicKeyY;
    signatureVerifier.R8x <== signatureR8x;
    signatureVerifier.R8y <== signatureR8y;
    signatureVerifier.S <== signatureS;
    signatureVerifier.M <== credential_hash;

    // Step 3: Age Verification (check if age >= 18)
    signal ageInSeconds;
    ageInSeconds <== currentTime - dateOfBirth;
    
    signal eighteenYearsInSeconds;
    eighteenYearsInSeconds <== 18 * 365 * 24 * 60 * 60;
    
    component isAdult = GreaterEqThan(64);
    isAdult.in[0] <== ageInSeconds;
    isAdult.in[1] <== eighteenYearsInSeconds;


    // Output is valid only if age check passes
    isValid <== isAdult.out;
}

component main {public [currentTime]} = AgeVerification();