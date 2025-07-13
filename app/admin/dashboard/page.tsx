"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Clock,
  Trash2,
  LogOut,
  Settings,
  Database,
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"
import { fetchEntries, fetchStats, updateEntryStatus, deleteEntry, type GiveawayEntry, type AdminStats, bulkDeleteEntries } from "@/lib/admin-service"
import { setGiveawayState, subscribeGiveawayState } from "@/lib/database"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEntries, setUserEntries] = useState<GiveawayEntry[]>([])
  const [oneHourLeft, setOneHourLeft] = useState(0)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    todayUsers: 0,
    pendingEntries: 0,
    verifiedEntries: 0,
    completedEntries: 0,
    recentEntries: [],
  })
  const [customTimeout, setCustomTimeout] = useState("")
  const [giveawayActive, setGiveawayActive] = useState(true)
  const [giveawayTimer, setGiveawayTimer] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showOtp, setShowOtp] = useState<{ [key: string]: boolean }>({})
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check admin authentication
    const adminSession = localStorage.getItem("adminSession")
    if (!adminSession) {
      router.push("/admin/login")
      return
    }

    try {
      const session = JSON.parse(adminSession)
      if (!session.isAuthenticated) {
        router.push("/admin/login")
        return
      }
      setIsAuthenticated(true)
    } catch {
      router.push("/admin/login")
      return
    }

    // Load user data and stats
    loadUserData()
    loadStats()

    // Subscribe to real-time giveaway state
    const unsub = subscribeGiveawayState((state) => {
      setGiveawayActive(state.isActive)
      if (state.isActive && state.closeTime) {
        const msLeft = state.closeTime.getTime() - Date.now()
        setGiveawayTimer(msLeft > 0 ? Math.floor(msLeft / 1000) : 0)
      } else {
        setGiveawayTimer(null)
      }
    })

    // Auto-refresh dashboard every 5 seconds
    const autoRefresh = setInterval(() => {
      loadUserData()
      loadStats()
    }, 5000)

    return () => {
      clearInterval(autoRefresh)
      unsub()
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [router])

  // Add this effect to make the timer dynamic
  useEffect(() => {
    if (giveawayActive && giveawayTimer !== null) {
      if (timerInterval.current) clearInterval(timerInterval.current)
      timerInterval.current = setInterval(() => {
        setGiveawayTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0))
      }, 1000)
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [giveawayActive, giveawayTimer])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      const filters: any = {}
      if (selectedStatus !== "all") {
        filters.status = selectedStatus
      }
      
      const result = await fetchEntries(filters)
      if (result.success) {
        setUserEntries(result.entries)
      } else {
        console.error("Failed to load entries:", result.error)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await fetchStats()
      if (result.success && result.stats) {
        setStats(result.stats)
      } else {
        console.error("Failed to load stats:", result.error)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminSession")
    router.push("/admin/login")
  }

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all user data? This action cannot be undone.")) {
      setIsLoading(true)
      try {
        // Use bulk delete for better performance
        const entryIds = userEntries.map(entry => entry.id)
        const result = await bulkDeleteEntries(entryIds)
        
        if (result.success) {
          setUserEntries([])
          await loadStats()
          alert("All user data has been cleared.")
        } else {
          alert(`Failed to clear data: ${result.error}`)
        }
      } catch (error) {
        console.error("Error clearing data:", error)
        alert("Failed to clear data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleEndGiveaway = async () => {
    if (window.confirm("Are you sure you want to end the current giveaway immediately?")) {
      await setGiveawayState(false, null)
      alert("Giveaway has been ended. Users will no longer be able to enter.")
    }
  }

  const handleReactivateGiveaway = async () => {
    const closeTime = new Date(Date.now() + 60 * 60 * 1000)
    await setGiveawayState(true, closeTime)
    alert("Giveaway has been reactivated for 1 hour!")
  }

  const handleSetCustomTimeout = () => {
    if (!customTimeout) return

    const hours = Number.parseInt(customTimeout)
    if (isNaN(hours) || hours < 1 || hours > 24) {
      alert("Please enter a valid number of hours (1-24)")
      return
    }

    const endTime = new Date()
    endTime.setHours(endTime.getHours() + hours)
    localStorage.setItem("customGiveawayEnd", endTime.toISOString())

    alert(`Giveaway will end in ${hours} hours at ${endTime.toLocaleString()}`)
    setCustomTimeout("")
  }

  const handleStatusChange = async (entryId: string, newStatus: 'pending' | 'verified' | 'completed') => {
    try {
      const result = await updateEntryStatus(entryId, newStatus)
      if (result.success) {
        // Update local state
        setUserEntries(prev => prev.map(entry => 
          entry.id === entryId ? { ...entry, status: newStatus } : entry
        ))
        await loadStats() // Refresh stats
      } else {
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status. Please try again.")
    }
  }

  // let oneHourTimer = null
  // if (oneHourLeft > 0) {
  //   const min = Math.floor(oneHourLeft / 60)
  //   const sec = oneHourLeft % 60
  //   oneHourTimer = (
  //     <div className="text-center mb-4 text-yellow-400 font-bold">
  //       Giveaway closes in {min}:{sec.toString().padStart(2, '0')}
  //     </div>
  //   )
  // }

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const result = await deleteEntry(entryId)
        if (result.success) {
          setUserEntries(prev => prev.filter(entry => entry.id !== entryId))
          await loadStats() // Refresh stats
        } else {
          alert(`Failed to delete entry: ${result.error}`)
        }
      } catch (error) {
        console.error("Error deleting entry:", error)
        alert("Failed to delete entry. Please try again.")
      }
    }
  }

  const toggleOtpVisibility = (entryId: string) => {
    setShowOtp(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'verified': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      verified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // After fetching userEntries
  const pendingEntries = userEntries.filter(e => e.status === 'pending')
  const verifiedEntries = userEntries.filter(e => e.status === 'verified')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Manage giveaway and view user data</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => { loadUserData(); loadStats(); }}
              disabled={isLoading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Today's Entries</p>
                  <p className="text-2xl font-bold text-white">{stats.todayUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm text-gray-400">Verified</p>
                  <p className="text-2xl font-bold text-white">{stats.verifiedEntries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The only timer display should be: */}
          {giveawayActive && giveawayTimer !== null && (
            <div className="text-center mb-4 text-yellow-400 font-bold">
              Giveaway closes in {`${Math.floor(giveawayTimer / 60)}:${(giveawayTimer % 60).toString().padStart(2, '0')}`}
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Timer className="w-5 h-5 mr-2" />
                Giveaway Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                {giveawayActive ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white">Status: {giveawayActive ? "Active" : "Ended"}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Set Custom Timeout (Hours)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="Hours"
                    value={customTimeout}
                    onChange={(e) => setCustomTimeout(e.target.value)}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                  <Button onClick={handleSetCustomTimeout} className="bg-blue-600 hover:bg-blue-700">
                    Set
                  </Button>
                </div>
              </div>

              <div className="flex space-x-2">
                {giveawayActive ? (
                  <Button onClick={handleEndGiveaway} className="bg-red-600 hover:bg-red-700 flex-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    End Giveaway Now
                  </Button>
                ) : (
                  <Button onClick={handleReactivateGiveaway} className="bg-green-600 hover:bg-green-700 flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate Giveaway
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Filter by Status</Label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    loadUserData()
                  }}
                  className="w-full bg-gray-700/50 border-gray-600 text-white rounded-md p-2"
                  aria-label="Filter entries by status"
                >
                  <option value="all">All Entries</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <Button onClick={handleClearData} className="w-full bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All User Data
              </Button>

              <Button onClick={() => { loadUserData(); loadStats(); }} className="w-full bg-gray-600 hover:bg-gray-700">
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Data Table */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Pending Entries (Before UPI/OTP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Name</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Phone</th>
                    <th className="text-left p-3 text-gray-300">Date</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-400">
                        No pending entries
                      </td>
                    </tr>
                  ) : (
                    pendingEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-700/25">
                        <td className="p-3 text-white">{entry.name}</td>
                        <td className="p-3 text-gray-300">{entry.email}</td>
                        <td className="p-3 text-gray-300">{entry.phone}</td>
                        <td className="p-3 text-gray-300">{entry.date}</td>
                        <td className="p-3">{getStatusBadge(entry.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Verified Entries Table */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Verified Entries (After UPI/OTP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Name</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Phone</th>
                    <th className="text-left p-3 text-gray-300">UPI ID</th>
                    <th className="text-left p-3 text-gray-300">OTP</th>
                    <th className="text-left p-3 text-gray-300">Date</th>
                    <th className="text-left p-3 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>No verified entries</td>
                    </tr>
                  ) : (
                    verifiedEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-700/25">
                        <td className="p-3 text-white">{entry.name}</td>
                        <td className="p-3 text-gray-300">{entry.email}</td>
                        <td className="p-3 text-gray-300">{entry.phone}</td>
                        <td className="p-3 text-gray-300">{entry.upiId}</td>
                        <td className="p-3 text-gray-300">{entry.otp}</td>
                        <td className="p-3 text-gray-300">{entry.date}</td>
                        <td className="p-3">{getStatusBadge(entry.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
