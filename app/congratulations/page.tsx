"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Home, Calendar, Trophy ,Plane } from "lucide-react"
import { updateGiveawayEntry } from "@/lib/database"

export default function CongratulationsPage() {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentDate, setCurrentDate] = useState("")
  const [nextGiveaway, setNextGiveaway] = useState("")
  const [entryId, setEntryId] = useState<string | null>(null)
  const [timer, setTimer] = useState(30)
  const [showConfirmed, setShowConfirmed] = useState(false)

  useEffect(() => {
    // Get entry ID from sessionStorage
    console.log("sessionStorage :", sessionStorage);
    
    const storedEntryId = sessionStorage.getItem("entryId")
    if (!storedEntryId) {
      console.log("No entry ID found")
      // If no entry ID, redirect to homepage
      router.push("/")
      return
    }
    setEntryId(storedEntryId)

    // Update entry status to completed
    const completeEntry = async () => {
      try {
        await updateGiveawayEntry(storedEntryId, {
          status: "completed"
        })
      } catch (error) {
        console.error('Error completing entry:', error)
      }
    }
    completeEntry()

    // Countdown timer
    setTimer(30)
    setShowConfirmed(false)
    setShowConfetti(false) // <-- Ensure confetti is hidden initially
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setShowConfirmed(true)
          setShowConfetti(true) // <-- Show confetti when timer ends
          setTimeout(() => setShowConfetti(false), 3000) // <-- Hide after 3s
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [router])

  const handleNewEntry = () => {
    // Clear session storage
    sessionStorage.removeItem("giveawayEntryId")
    sessionStorage.removeItem("giveawayData")
    // Navigate to homepage
    router.push("https://t.me/D5TBOSS")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-r from-yellow-600/20 to-green-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Confetti Animation and Hurray Message only after timer */}
      {showConfirmed && showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-2xl">{["🎉", "🎊", "✨", "🌟", "💫"][Math.floor(Math.random() * 5)]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Success Steps Indicator and Hurray only after timer */}
        {showConfirmed && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <span className="text-white text-sm font-semibold">✓</span>
                </div>
              </div>
              <div className="w-12 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <span className="text-white text-sm font-semibold">✓</span>
                </div>
              </div>
              <div className="w-12 h-0.5 bg-green-500"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <span className="text-white text-sm font-semibold">✓</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="shadow-2xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {showConfirmed && (
                <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 animate-pulse shadow-lg shadow-green-500/25">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">You're In!</h1>
                  <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto rounded-full mb-4"></div>
                </>
              )}
            </div>

            <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-4 border border-green-700/50 mb-6">
              {!showConfirmed ? (
                <div>
                  <p className="text-5xl font-extrabold text-yellow-400 mb-2">{timer}s</p>
                  <p className="text-lg text-white font-semibold">Please wait while we confirm your entry...</p>
                </div>
              ) : (
                <div>
                  <p className="text-green-400 text-2xl font-bold mb-1">TODAY'S ENTRY CONFIRMED</p>
                  <p className="text-white text-lg font-bold">{currentDate}</p>
                  {entryId && (
                    <p className="text-gray-400 text-xs mt-1">Entry ID: {entryId.slice(-8)}</p>
                  )}
                </div>
              )}
            </div>

            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Thanks for entering today's giveaway.
              <br />
              We'll contact winners soon!
            </p>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-700/50">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-blue-400 text-sm font-semibold">NEXT GIVEAWAY</span>
                </div>
                <p className="text-white font-bold">{nextGiveaway}</p>
                <p className="text-gray-400 text-xs mt-1">New prizes, new chances!</p>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold h-12 shadow-lg shadow-blue-500/25"
                  onClick={handleNewEntry}
                >
                  <Plane className="w-4 h-4 mr-2" />
                  Telegram Channel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-600 hover:bg-gray-800/50 h-12 bg-transparent text-gray-300 hover:text-white"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Daily Giveaway!",
                        text: "I just entered today's giveaway! Join tomorrow's round!",
                        url: window.location.origin,
                      })
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-400 mt-6">
          Entry confirmed for {currentDate} • Come back tomorrow! 🚀
        </p>
      </div>
    </div>
  )
}