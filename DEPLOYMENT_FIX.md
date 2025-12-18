# Deployment Issue: Backend URL Configuration

## 🚨 Current Problem

Your **simulation-dex** is deployed on **Vercel** but is failing with this error:
```
❌ Error in verify-callback: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 🔍 Root Cause

The error `Unexpected token '<', "<!DOCTYPE "...` means the backend is returning **HTML** instead of **JSON**. This happens because:

1. Your simulation-dex on Vercel is trying to connect to `http://localhost:3000/verify`
2. **Vercel's servers cannot access `localhost`** - that only works on your local machine
3. When the request fails, it gets an HTML error page (404 or similar) instead of JSON
4. The code tries to parse this HTML as JSON → error!

## ✅ Solution

You need to **deploy your backend** and configure Vercel environment variables to point to it.

### ⚠️ Common Mistakes

1. **Missing `https://` protocol:**
   - ❌ Wrong: `solidkyc-production.up.railway.app`
   - ✅ Correct: `https://solidkyc-production.up.railway.app`

2. **Including `/verify` in the base URL:**
   - ❌ Wrong: `NEXT_PUBLIC_BACKEND_URL=https://solidkyc-production.up.railway.app/verify`
   - ✅ Correct: `NEXT_PUBLIC_BACKEND_URL=https://solidkyc-production.up.railway.app`

3. **Not redeploying after changing env vars:**
   - Vercel requires a redeploy for env var changes to take effect
   - Push a commit or manually trigger redeploy in Vercel dashboard

### 🔍 Debug Your Configuration

Visit this URL after deploying:
```
https://solidkyc-simulation-dex.vercel.app/api/config
```

This will show you exactly what environment variables are being used. Make sure:
- `NEXT_PUBLIC_BACKEND_URL` starts with `https://`
- `NEXT_PUBLIC_BACKEND_URL` does NOT end with `/verify`

### Option 1: Deploy Backend to Railway (Recommended)

1. **Deploy the backend folder to Railway:**
   - See `RAILWAY_DEPLOY.md` for instructions
   - Railway will give you a URL like: `https://your-backend.railway.app`

2. **Update Vercel Environment Variables:**
   - Go to your Vercel project → Settings → Environment Variables
   - Add/Update: `NEXT_PUBLIC_BACKEND_URL` = `https://your-backend.railway.app`
   - Add/Update: `NEXT_PUBLIC_SOLIDKYC_URL` = `https://your-frontend.vercel.app`
   - Add/Update: `NEXT_PUBLIC_DEX_CALLBACK_URL` = `https://solidkyc-simulation-dex.vercel.app/verify-callback`

3. **Update Backend CORS:**
   - In your Railway backend environment variables, add:
   - `CORS_ALLOWED_ORIGINS` = `https://your-frontend.vercel.app,https://solidkyc-simulation-dex.vercel.app`

4. **Redeploy simulation-dex on Vercel:**
   - Push changes to trigger a new build
   - Or manually redeploy from Vercel dashboard

### Option 2: Deploy Backend to Render

Similar to Railway, but use Render.com:
- Deploy backend as a Web Service
- Get the URL (e.g., `https://your-backend.onrender.com`)
- Update Vercel environment variables as above

## 📋 Environment Variable Checklist

### For Vercel (simulation-dex):
- ✅ `NEXT_PUBLIC_BACKEND_URL` → Deployed backend URL (NOT localhost)
- ✅ `NEXT_PUBLIC_SOLIDKYC_URL` → Deployed frontend URL (NOT localhost)
- ✅ `NEXT_PUBLIC_DEX_CALLBACK_URL` → Your Vercel simulation-dex URL

### For Railway/Render (backend):
- ✅ `CORS_ALLOWED_ORIGINS` → Include both frontend and simulation-dex Vercel URLs
- ✅ `SOLANA_RPC_URL` → Your Solana RPC endpoint
- ✅ `ZK_PRIVATE_KEY` → Your ZK private key
- ✅ Other config from `backend/.env.example`

## 🧪 Testing Locally vs Production

**Localhost (Development):**
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Simulation-DEX: `http://localhost:3001`

**Production (Deployed):**
- Backend: `https://your-backend.railway.app`
- Frontend: `https://solidkyc-frontend.vercel.app`
- Simulation-DEX: `https://solidkyc-simulation-dex.vercel.app`

## 🔧 Improved Error Handling

I've updated `simulation-dex/src/app/verify-callback/route.ts` to:
- ✅ Log the backend URL being used
- ✅ Check response content-type before parsing JSON
- ✅ Show clear error messages when backend is unreachable
- ✅ Display response preview for debugging

This will help you see exactly what's going wrong in Vercel logs.

## 📝 Next Steps

1. Deploy your backend to Railway or Render
2. Get the backend URL
3. Configure Vercel environment variables
4. Redeploy and test

Once deployed, the error should be resolved! 🚀
