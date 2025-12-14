# CORS Configuration Added ✅

## What Was Done

Added **CORS (Cross-Origin Resource Sharing)** to the backend to allow requests from the frontend running at `http://localhost:5173`.

---

## Changes Made

### **1. Installed Dependencies**
```bash
pnpm add cors
pnpm add -D @types/cors
```

### **2. Updated `/backend/src/index.ts`**

**Added import:**
```typescript
import cors from "cors";
```

**Added CORS middleware:**
```typescript
// CORS configuration - allow requests from frontend
app.use(cors({
  origin: 'http://localhost:5173',      // Frontend URL
  credentials: true,                     // Allow cookies/auth headers
  methods: ['GET', 'POST', 'OPTIONS'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization']  // Allowed headers
}));
```

---

## Configuration Details

### **Allowed Origin:**
- `http://localhost:5173` (Vite dev server)

### **Credentials:**
- `true` - Allows cookies and authorization headers

### **Methods:**
- `GET` - For health checks and read operations
- `POST` - For credential issuance and verification
- `OPTIONS` - For preflight requests

### **Headers:**
- `Content-Type` - For JSON requests
- `Authorization` - For future authentication

---

## Testing

### **Test 1: Health Check**
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/health -v
```

**Expected:** Should see `Access-Control-Allow-Origin: http://localhost:5173` in response headers

### **Test 2: From Frontend**
```typescript
// In browser console at http://localhost:5173
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Should work without CORS errors ✅

### **Test 3: Issue Credential**
1. Open frontend at `http://localhost:5173`
2. Login to vault
3. Issue KYC credential
4. Should work without CORS errors

**Expected:** No "CORS policy" errors in console ✅

---

## Before vs After

### **Before (No CORS):**
```
Frontend (5173) → Backend (3000)
❌ Blocked by CORS policy
Error: Access to fetch at 'http://localhost:3000' 
has been blocked by CORS policy
```

### **After (With CORS):**
```
Frontend (5173) → Backend (3000)
✅ Allowed
Response headers include:
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## Production Considerations

For production deployment, update the CORS origin:

```typescript
// Development
app.use(cors({
  origin: 'http://localhost:5173',
  // ...
}));

// Production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Or allow multiple origins:

```typescript
const allowedOrigins = [
  'http://localhost:5173',        // Development
  'https://yourdomain.com',       // Production
  'https://app.yourdomain.com'    // Production subdomain
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Troubleshooting

### **Still getting CORS errors?**

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check CORS headers:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        -v http://localhost:3000/health
   ```

3. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`

5. **Check frontend URL matches:**
   - Must be exactly `http://localhost:5173`
   - Not `127.0.0.1:5173` or `0.0.0.0:5173`

---

## Status

✅ **CORS configured and ready!**

Your frontend at `http://localhost:5173` can now make requests to the backend at `http://localhost:3000` without CORS errors.

**Test it:** Open your app and issue a credential - should work perfectly! 🚀
