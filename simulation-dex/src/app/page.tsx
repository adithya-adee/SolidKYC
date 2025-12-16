"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const SOLIDKYC_URL = "http://localhost:5173"
const BACKEND_URL = "http://localhost:3000"
const DEX_CALLBACK_URL = "http://localhost:3001/verify-callback"

type VerificationState = "idle" | "verifying" | "success" | "failed"

export default function SimulationDEX() {
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [verificationMessage, setVerificationMessage] = useState("")

  useEffect(() => {
    // Check if we're coming back from callback
    const params = new URLSearchParams(window.location.search)
    const verified = params.get("verified")
    
    if (verified === "true") {
      setVerificationState("success")
      setVerificationMessage("Age verification successful! Welcome to SimDEX.")
      toast.success("Verification complete!")
    } else if (verified === "false") {
      setVerificationState("failed")
      setVerificationMessage("Age verification failed. Please try again.")
      toast.error("Verification failed")
    }
  }, [])

  const handleVerifyAge = () => {
    // Redirect to SolidKYC with callback URL
    const callbackParam = encodeURIComponent(DEX_CALLBACK_URL)
    window.location.href = `${SOLIDKYC_URL}?callback=${callbackParam}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
            SimDEX
          </h1>
          <p className="text-slate-400 text-lg">
            Decentralized Exchange • Privacy-First Trading
          </p>
        </div>

        {/* Verification Card */}
        <Card className="w-full max-w-xl bg-slate-900/80 border-slate-800 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl text-white">Age Verification Required</CardTitle>
            <CardDescription className="text-slate-400 text-base mt-2">
              To access SimDEX, you must verify that you are 18+ years old
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {verificationState === "idle" && (
              <>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3">
                  <h3 className="text-white font-semibold text-lg">How it works:</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">1.</span>
                      <span>Click "Verify via SolidKYC" below</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">2.</span>
                      <span>Unlock your vault and generate a zero-knowledge proof</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">3.</span>
                      <span>We'll verify your proof without accessing your personal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">4.</span>
                      <span>Access granted! No information shared.</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleVerifyAge}
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
                  size="lg"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Verify via SolidKYC
                </Button>

                <div className="text-center text-xs text-slate-500">
                  <p>🔒 Zero-knowledge proof technology</p>
                  <p>Your personal information stays private</p>
                </div>
              </>
            )}

            {verificationState === "verifying" && (
              <div className="text-center py-8">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Verifying Proof...</h3>
                <p className="text-slate-400">
                  Processing your zero-knowledge proof
                </p>
              </div>
            )}

            {verificationState === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-green-500">Verification Successful!</h3>
                <p className="text-slate-300">
                  {verificationMessage}
                </p>
                <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-6 mt-6">
                  <p className="text-sm text-slate-300 mb-2">
                    <strong className="text-green-400">This is how zero-knowledge proofs work!</strong>
                  </p>
                  <p className="text-xs text-slate-400">
                    You just proved you're 18+ without sharing your date of birth, name, or any other personal information. 
                    The DEX verified your proof cryptographically without ever seeing your actual data.
                  </p>
                </div>
                <Button 
                  onClick={() => setVerificationState("idle")}
                  variant="outline"
                  className="mt-4"
                >
                  Verify Again
                </Button>
              </div>
            )}

            {verificationState === "failed" && (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-red-500">Verification Failed</h3>
                <p className="text-slate-300">
                  {verificationMessage}
                </p>
                <Button 
                  onClick={() => setVerificationState("idle")}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Powered by SolidKYC Zero-Knowledge Proofs</p>
        </div>
      </div>
    </div>
  )
}
