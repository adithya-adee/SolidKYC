import { NextResponse } from "next/server"

// Diagnostic endpoint to check environment variables
export async function GET() {
  const config = {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "NOT SET",
    NEXT_PUBLIC_SOLIDKYC_URL: process.env.NEXT_PUBLIC_SOLIDKYC_URL || "NOT SET",
    NEXT_PUBLIC_DEX_CALLBACK_URL: process.env.NEXT_PUBLIC_DEX_CALLBACK_URL || "NOT SET",
    NEXT_PUBLIC_CORS_ORIGINS: process.env.NEXT_PUBLIC_CORS_ORIGINS || "NOT SET",
  }

  return NextResponse.json(config)
}
