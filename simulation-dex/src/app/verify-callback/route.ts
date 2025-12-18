import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
const DEX_BASE_URL = process.env.NEXT_PUBLIC_DEX_CALLBACK_URL?.replace('/verify-callback', '') || "http://localhost:3001"

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
    console.log(`🔗 Attempting to verify with backend: ${BACKEND_URL}/verify`)
    
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

    console.log(`📡 Backend response status: ${verifyResponse.status}`)

    // Check if response is actually JSON
    const contentType = verifyResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await verifyResponse.text()
      console.error("❌ Backend returned non-JSON response:", responseText.substring(0, 200))
      
      throw new Error(
        `Backend returned ${contentType || 'unknown content type'} instead of JSON. ` +
        `This usually means the backend is not accessible at ${BACKEND_URL}. ` +
        `Status: ${verifyResponse.status}. Response preview: ${responseText.substring(0, 100)}`
      )
    }

    const verificationResult = await verifyResponse.json()

    console.log("✅ Verification result:", verificationResult)

    if (verificationResult.verified) {
      // Return success redirect URL
      return NextResponse.json(
        {
          success: true,
          redirectUrl: `${DEX_BASE_URL}?verified=true`,
          message: "Age verification successful!",
        },
        { headers: corsHeaders }
      )
    } else {
      // Return failure redirect URL
      return NextResponse.json(
        {
          success: false,
          redirectUrl: `${DEX_BASE_URL}?verified=false`,
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
        redirectUrl: `${DEX_BASE_URL}?verified=false`,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
