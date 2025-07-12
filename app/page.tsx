"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, XCircle, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { subscribeGiveawayState } from "@/lib/database"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [currentDate, setCurrentDate] = useState("")
  const [timeLeft, setTimeLeft] = useState("")
  const [dailyEntries, setDailyEntries] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [giveawayClosedMsg, setGiveawayClosedMsg] = useState("")
  const [oneHourLeft, setOneHourLeft] = useState(0)
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    // Subscribe to real-time giveaway state
    const unsub = subscribeGiveawayState((state) => {
      if (!state.isActive) {
        setShowForm(false)
        setGiveawayClosedMsg("We will start soon.")
        setOneHourLeft(0)
        return
      }
      if (state.closeTime) {
        const msLeft = state.closeTime ? state.closeTime.getTime() - Date.now() : 0
        if (msLeft > 0) {
          setShowForm(true)
          setGiveawayClosedMsg("")
          setOneHourLeft(Math.floor(msLeft / 1000))
          // Start a timer to update every second
          const timer = setInterval(() => {
            const ms = state.closeTime ? state.closeTime.getTime() - Date.now() : 0
            if (ms <= 0) {
              setShowForm(false)
              setGiveawayClosedMsg("We will start soon.")
              setOneHourLeft(0)
              clearInterval(timer)
            } else {
              setOneHourLeft(Math.floor(ms / 1000))
            }
          }, 1000)
          return () => clearInterval(timer)
        } else {
          setShowForm(false)
          setGiveawayClosedMsg("We will start soon.")
          setOneHourLeft(0)
        }
      }
    })

    // Set current date
    const today = new Date()
    setCurrentDate(
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    )

    // Calculate time left until midnight
    const updateTimeLeft = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeLeft(`${hours}h ${minutes}m`)
    }

    updateTimeLeft()
    const timer2 = setInterval(updateTimeLeft, 60000) // Update every minute

    // Load daily entries count from backend
    loadDailyEntries()

    return () => {
      unsub()
      clearInterval(timer2)
    }
  }, [])

  const loadDailyEntries = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success && data.stats) {
        setDailyEntries(data.stats.todayUsers)
      } else {
        setDailyEntries(Math.floor(Math.random() * 500) + 100)
      }
    } catch (error) {
      setDailyEntries(Math.floor(Math.random() * 500) + 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    try {
      // Create pending entry in backend
      const response = await fetch('/api/admin/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString().split("T")[0],
          status: 'pending',
        }),
      })
      const data = await response.json()
      if (data.success && data.entryId) {
        sessionStorage.setItem("entryId", data.entryId)
        sessionStorage.setItem("giveawayFormData", JSON.stringify(formData))
        router.push("/verify")
      } else {
        setError(data.error || "Failed to create entry. Please try again.")
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

  if (!showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="shadow-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">{giveawayClosedMsg}</h1>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If 1hr timer is running, show countdown
  let oneHourTimer = null
  if (oneHourLeft > 0) {
    const min = Math.floor(oneHourLeft / 60)
    const sec = oneHourLeft % 60
    oneHourTimer = (
      <div className="text-center mb-4 text-yellow-400 font-bold">
        Giveaway closes in {min}:{sec.toString().padStart(2, '0')}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Daily Stats Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-400">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Today's Giveaway</span>
            </div>
            <div className="flex items-center text-orange-400">
              <Clock className="w-4 h-4 mr-2" />
              <span>{oneHourTimer}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-300 text-xs">{currentDate}</span>
            <div className="flex items-center text-green-400 text-xs">
              <Users className="w-3 h-3 mr-1" />
              <span>{dailyEntries} entered today</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg shadow-blue-500/25">
            <span className="text-2xl">🎁</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Enter Today's Giveaway</h1>
          <p className="text-gray-300">Join today's competition for amazing prizes</p>
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full mt-2">
            DAILY RESET
          </div>
        </div>

    

        {error && (
          <Alert className="mb-4 bg-red-900/50 border-red-500 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg font-semibold text-white">Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-200">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-12 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit & Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-400 mt-6">
          New giveaway starts every day at midnight • Good luck! 🍀
        </p>
      </div>
    </div>
  )
}
