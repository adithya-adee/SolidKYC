# SolidKYC - Quick Start Guide

## 🚀 New Simplified Flow

### Step 1: Create/Access Vault
```
Home Page
  ↓
Click "Create Vault" (first time) or "Access Vault" (returning user)
  ↓
Enter Master Password (min 8 characters)
  ↓
[Vault Unlocked]
```

### Step 2: Issue KYC Credential
```
Vault Page
  ↓
Find "Issue KYC Credential" card
  ↓
Click "Pick a date" button
  ↓
[Calendar Opens]
  ↓
Select your Date of Birth
  ↓
Click "Issue Credential"
  ↓
[Processing...]
  - Converts date to Unix timestamp
  - Sends to backend /issue_credentials
  - Receives credential response
  - Encrypts response with master password
  - Stores in IndexedDB
  ↓
✅ Success! Credential stored securely
  ↓
[Auto-resets after 3 seconds]
```

### Step 3: View Your Credentials
```
Vault Page
  ↓
Click "View All" or "Access Indexed DB"
  ↓
[Modal Opens]
  ↓
See list of all stored credentials
  ↓
Click any credential to decrypt and view
  ↓
Enter master password (if prompted)
  ↓
View credential details
```

---

## 📸 What You'll See

### **Issue KYC Credential Card**
```
┌─────────────────────────────────────────┐
│ 📅 Issue KYC Credential                 │
│ Select your date of birth to issue a   │
│ blockchain credential                   │
├─────────────────────────────────────────┤
│                                         │
│ Date of Birth                           │
│ ┌─────────────────────────────────┐    │
│ │ 📅  Pick a date          ▼      │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### **After Selecting Date**
```
┌─────────────────────────────────────────┐
│ 📅 Issue KYC Credential                 │
│ Select your date of birth to issue a   │
│ blockchain credential                   │
├─────────────────────────────────────────┤
│                                         │
│ Date of Birth                           │
│ ┌─────────────────────────────────┐    │
│ │ 📅  1990-03-15          ▼      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │  📤 Issue Credential            │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### **Processing**
```
┌─────────────────────────────────────────┐
│ 📅 Issue KYC Credential                 │
│ Select your date of birth to issue a   │
│ blockchain credential                   │
├─────────────────────────────────────────┤
│                                         │
│ Date of Birth                           │
│ ┌─────────────────────────────────┐    │
│ │ 📅  1990-03-15          ▼      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │  ⏳ Issuing Credential...       │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### **Success**
```
┌─────────────────────────────────────────┐
│ 📅 Issue KYC Credential                 │
│ Select your date of birth to issue a   │
│ blockchain credential                   │
├─────────────────────────────────────────┤
│                                         │
│            ✅                           │
│                                         │
│      Credential Issued!                 │
│      DOB: 1990-03-15                    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Instructions

### **Test 1: Issue First Credential**
1. Access vault with master password
2. Click "Pick a date" in Issue KYC Credential card
3. Select any date (e.g., 1990-03-15)
4. Click "Issue Credential"
5. Wait 2-3 seconds
6. Should see success animation
7. Check console for backend logs

**Expected:**
- ✅ Toast: "Issuing credential for DOB: 1990-03-15"
- ✅ Toast: "Credential issued successfully!"
- ✅ Toast: "Credential stored securely!"
- ✅ Green checkmark animation
- ✅ Card resets after 3 seconds

### **Test 2: View Stored Credential**
1. Click "View All" button
2. Should see 1 credential listed
3. Name: "KYC Credential - 1990-03-15"
4. Click to view
5. Should show decrypted credential response

**Expected Response Structure:**
```json
{
  "success": true,
  "transaction_signature": "...",
  "credential": {
    "dob": 638323200,
    "current_time": 1702598400,
    "expires_at": 1702599000
  },
  "credential_hash": "...",
  "signature": { "R8x": "...", "R8y": "...", "S": "..." },
  "issuer_public_key": { "x": "...", "y": "..." },
  "holder": "FakeHolderPubKey...",
  "credential_pda": "..."
}
```

### **Test 3: Issue Multiple Credentials**
1. Issue credential for 1985-06-25
2. Issue credential for 2000-12-01
3. Check "View All"
4. Should see 3 total credentials

**Expected:**
- ✅ All stored separately
- ✅ Different timestamps in metadata
- ✅ All encrypted with master password

### **Test 4: Backend Offline Error**
1. Stop backend server
2. Try to issue credential
3. Should show error toast

**Expected:**
- ❌ Error: "Failed to issue credential. Make sure backend is running."

---

## 🔧 Troubleshooting

### **Calendar Not Showing?**
- Check browser console for errors
- Ensure `react-day-picker` CSS is imported in `main.tsx`
- Clear browser cache and reload

### **Date Not Sending to Backend?**
- Check Network tab for `/issue_credentials` request
- Verify backend is running on port 3000
- Check VITE_BACKEND_URL in `.env`

### **Credential Not Storing?**
- Check if master password is set
- Verify IndexedDB is enabled in browser
- Check browser console for storage errors

### **Wrong Date Format?**
- Should always display as YYYY-MM-DD (ISO format)
- Backend receives Unix timestamp (seconds)
- Example: 1990-03-15 → 638323200

---

## 📋 Technical Details

### **Date Conversion**
```typescript
// User selects from calendar
const selectedDate = new Date('1990-03-15')

// Convert to Unix timestamp (seconds)
const timestamp = Math.floor(selectedDate.getTime() / 1000)
// Result: 638323200

// Send to backend
await issueCredential(timestamp)
```

### **Storage Structure**
```typescript
// What gets encrypted and stored
const dataToStore = {
  // Entire credential response from backend (unchanged)
  success: true,
  transaction_signature: "...",
  credential: { ... },
  credential_hash: "...",
  signature: { ... },
  issuer_public_key: { ... },
  holder: "...",
  credential_pda: "..."
}

// Metadata (not encrypted, for listing)
const metadata = {
  name: "KYC Credential - 1990-03-15",
  description: "Issued at 12/14/2025, 10:15:35 PM"
}

// Type identifier
const type = "kyc_credential"
```

### **Calendar Configuration**
```typescript
// Date picker settings
<Calendar
  mode="single"                          // Single date selection
  selected={selectedDate}                // Currently selected date
  onSelect={(date) => setSelectedDate(date)}
  disabled={(date) =>
    date > new Date() ||                 // No future dates
    date < new Date('1900-01-01')        // No dates before 1900
  }
/>
```

---

## ✅ Checklist Before Use

- [ ] Backend running on port 3000
- [ ] Solana validator running (for backend)
- [ ] Frontend running on port 5173
- [ ] Master password created
- [ ] `.env` file configured with VITE_BACKEND_URL
- [ ] Browser has IndexedDB enabled
- [ ] No console errors

---

## 🎯 Summary

**Old Flow:** Upload PDF → Extract DOB → Issue Credential  
**New Flow:** Pick Date → Issue Credential  

**Result:** ⚡ Faster, Simpler, Better UX! 🎉
