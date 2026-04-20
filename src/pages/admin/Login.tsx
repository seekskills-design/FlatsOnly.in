import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldAlert, Mail } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "@/contexts/AuthContext"

export default function AdminLogin() {
  const { signInWithGoogle, loading, user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate("/admin/dashboard")
      } else {
        // Redirect non-admins to their respective pages
        navigate(profile.role === 'owner' ? "/dashboard" : "/")
      }
    }
  }, [user, profile, navigate])

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoggingIn(true)
    try {
      await signInWithGoogle("admin")
    } catch (error: any) {
      console.error("Failed to sign in with Google:", error)
      setError(error.message || "Failed to sign in. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">Admin Portal</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
        <Card className="shadow-2xl border-slate-800 bg-slate-800 text-white">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg border border-red-800">
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGoogleLogin} 
                disabled={isLoggingIn || loading}
                className="w-full h-12 text-base shadow-md bg-white text-slate-900 hover:bg-slate-100 border border-slate-200"
              >
                <Mail className="w-5 h-5 mr-2 text-slate-700" />
                Sign in with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
