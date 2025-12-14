# Testing the Zero-Knowledge Proof Generation

## Quick Test Guide

Follow these steps to test the complete ZK proof workflow:

### Prerequisites
✅ Solana test validator running
✅ Backend server running (http://localhost:3000)
✅ Frontend server running (http://localhost:5173)
✅ Wallet extension installed (Phantom or Solflare)
✅ Wallet connected to localhost network

### Step 1: Initialize Issuer (One-time setup)
If not already done, initialize the issuer account on Solana:
```bash
cd solidkyc
anchor build
anchor deploy
# Run issuer initialization if needed
```

### Step 2: Create a Vault & Issue Credential

1. Open http://localhost:5173 in your browser
2. Click **"Create New Vault"**
3. Enter a password (e.g., `mypassword123`)
4. Click **"Create Vault"** 

5. In the Vault page, find the **"Issue KYC Credential"** card
6. **Connect your Solana wallet** (Phantom/Solflare)
   - Click the wallet connect button
   - Approve the connection
7. Select your **Date of Birth** (make sure it's >18 years ago)
8. Click **"Issue Credential to Blockchain"**
9. Approve the Solana transaction in your wallet
10. ✅ Success! Credential is now stored encrypted in IndexedDB

### Step 3: Generate Zero-Knowledge Proof

1. In the Vault page, click **"Generate ZK Proof"** card
2. You'll see your KYC credential listed
3. Click **"Select"** on your credential
4. The system will automatically:
   - ✓ Decrypt the credential
   - ✓ Validate the data
   - ✓ Generate witness using `age_verification.wasm`
   - ✓ Generate proof using `circuit_0000.zkey`
   - ✓ Submit to backend `/verify` endpoint
   - ✓ Verify on Solana blockchain

5. **Watch the console logs** for detailed progress:
   ```
   Decrypting credential...
   Credential validated. Generating witness...
   Proof generated. Verifying on blockchain...
   ✓ Zero-knowledge proof verified successfully!
   ```

6. ✅ Success! You should see:
   - Green checkmark
   - "Proof Verified Successfully!"
   - Verification details
   - Download button for proof JSON

### Step 4: Verify the Proof (Optional)

1. Click **"View Full Proof"** to see the complete proof object
2. Click **"Download Proof"** to save the proof as JSON
3. The downloaded file will contain:
   ```json
   {
     "proof": { ... },
     "publicSignals": [ ... ],
     "verification": { ... },
     "metadata": { ... }
   }
   ```

## What's Being Proven?

The zero-knowledge proof proves:
- ✅ You are over 18 years old
- ✅ You have a valid credential signed by the issuer
- ✅ The credential hasn't expired
- ✅ The credential hasn't been revoked

**WITHOUT revealing:**
- ❌ Your actual date of birth
- ❌ Your exact age
- ❌ Any other personal information

## Backend Logs to Watch

Open the backend terminal to see the verification process:

```
=== Starting Verification Process ===
Credential PDA: <address>
Credential account fetched successfully
✓ Authority verified
✓ Issuer is active
✓ Credential not revoked
✓ Credential holder verified
✓ Credential hash verified
✓ Issuer public key verified
✓ Expiry time verified
✓ Credential not expired
Verifying ZK proof...
✓ ZK proof verified

=== ✓ ALL VERIFICATION CHECKS PASSED ===
```

## Common Issues & Solutions

### Issue: "Wallet not connected"
**Solution**: Click the "Connect Wallet" button and approve the connection

### Issue: "No KYC credentials found"
**Solution**: You need to issue a credential first using the "Issue KYC Credential" card

### Issue: "Invalid credential data"
**Solution**: The credential might be from an old version. Issue a new credential

### Issue: Proof generation takes too long
**Expected**: ZK proof generation can take 5-15 seconds depending on your machine
**Timeout**: If it takes >30 seconds, check browser console for errors

### Issue: "Failed to fetch WASM"
**Solution**: Make sure these files exist in `/frontend/public/`:
- age_verification.wasm
- circuit_0000.zkey
- verification_key.json

### Issue: Backend verification fails
**Solution**: 
- Check backend logs for detailed error
- Ensure Solana test validator is running
- Ensure wallet public key matches the credential holder

## Testing Different Scenarios

### Test 1: Valid Proof (Should Pass ✅)
- Issue credential with DOB >18 years ago
- Generate proof immediately
- Expected: Success ✅

### Test 2: Expired Credential (Should Fail ❌)
- Wait for credential to expire (10 minutes by default)
- Try to generate proof
- Expected: "Credential has expired"

### Test 3: Wrong Wallet (Should Fail ❌)
- Issue credential with Wallet A
- Switch to Wallet B
- Try to generate proof
- Expected: "Credential holder mismatch"

### Test 4: Revoked Credential (Should Fail ❌)
- Issue credential
- Call revoke function on Solana
- Try to generate proof
- Expected: "Credential has been revoked"

## Performance Metrics

Typical timing for proof generation:
- Credential decryption: ~100ms
- Witness generation: ~2-5 seconds
- Proof generation: ~3-8 seconds
- Backend verification: ~500ms-1s
- **Total**: ~5-15 seconds

## Browser Console Debugging

Open browser console (F12) to see detailed logs:
```javascript
// Check IndexedDB
await indexedDB.databases()

// View credentials
const db = await indexedDB.open('SolidKYC_Vault')
// Navigate through Object Stores

// Check if files loaded
fetch('/age_verification.wasm').then(r => console.log('WASM:', r.ok))
fetch('/circuit_0000.zkey').then(r => console.log('ZKEY:', r.ok))
fetch('/verification_key.json').then(r => console.log('VKEY:', r.ok))
```

## Success Criteria

✅ Credential issued and stored in IndexedDB
✅ Proof generated without errors
✅ All 10 backend verification checks pass
✅ Success message displayed
✅ Proof can be downloaded
✅ No errors in browser console
✅ No errors in backend logs

---

**Happy Testing! 🎉**

If you encounter any issues, check the browser console and backend logs for detailed error messages.
