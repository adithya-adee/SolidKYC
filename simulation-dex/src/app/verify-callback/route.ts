import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = "http://localhost:3000"

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proof, publicInputs, holderPublicKey } = body

    if (!proof || !publicInputs) {
      return NextResponse.json(
        { error: "Missing proof or publicInputs" },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log("📥 Received proof from SolidKYC:", {
      proof: JSON.stringify(proof).substring(0, 100) + "...",
      publicInputs,
      holderPublicKey,
    })

    // Verify the proof with the backend
    const verifyResponse = await fetch(`${BACKEND_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proof,
        public: publicInputs,
        holderPublicKey,
      }),
    })

    const verificationResult = await verifyResponse.json()

    console.log("✅ Verification result:", verificationResult)

    if (verificationResult.verified) {
      // Return success redirect URL
      return NextResponse.json(
        {
          success: true,
          redirectUrl: "http://localhost:3001?verified=true",
          message: "Age verification successful!",
        },
        { headers: corsHeaders }
      )
    } else {
      // Return failure redirect URL
      return NextResponse.json(
        {
          success: false,
          redirectUrl: "http://localhost:3001?verified=false",
          message: verificationResult.error || "Verification failed",
        },
        { headers: corsHeaders }
      )
    }
  } catch (error) {
    console.error("❌ Error in verify-callback:", error)
    return NextResponse.json(
      {
        success: false,
        redirectUrl: "http://localhost:3001?verified=false",
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
