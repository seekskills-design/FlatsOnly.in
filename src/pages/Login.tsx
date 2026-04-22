import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Building2, Phone, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useAuth } from "@/contexts/AuthContext"
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth"
import { auth } from "@/firebase"
import SEO from "@/components/SEO"

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function Login() {
  const { signInWithPhone, verifyOtp, loading, user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [role, setRole] = useState<"tenant" | "owner">(location.state?.role || "tenant")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && profile) {
      const from = location.state?.from?.pathname || (profile.role === 'admin' ? "/admin/dashboard" : profile.role === 'owner' ? "/dashboard" : "/dashboard/profile");
      const state = location.state?.from?.state || location.state;
      navigate(from, { replace: true, state });
    }
  }, [user, profile, navigate, location])

  useEffect(() => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = null
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    } catch (error) {
      console.error("Error initializing RecaptchaVerifier:", error)
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
          window.recaptchaVerifier = null
        } catch (e) {
          // Ignore clear errors
        }
      }
    }
  }, []);

  const handleSendOtp = async () => {
    // Strip any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }
    
    // Always use +91 for India
    const formattedPhone = `+91${cleanNumber}`
    
    setError("")
    setIsLoggingIn(true)
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhone(formattedPhone, appVerifier)
      setConfirmationResult(result)
    } catch (error: any) {
      console.error("Failed to send OTP:", error)
      setError(error.message || "Failed to send OTP. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    if (!confirmationResult) return

    setError("")
    setIsLoggingIn(true)
    try {
      await verifyOtp(confirmationResult, otp, role)
      // Navigation is handled by the useEffect watching user and profile
    } catch (error: any) {
      console.error("Failed to verify OTP:", error)
      setError(error.message || "Invalid OTP. Please try again.")
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO 
        title="Login or Sign Up" 
        description="Login to FlatsOnly.in to find to your next home zero brokerage or list your property."
        canonical="/login"
      />
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">FlatsOnly.in</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
        <Card className="shadow-xl border-gray-100/50">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-500">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!confirmationResult && (
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      role === "tenant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setRole("tenant")}
                  >
                    I'm a Tenant
                  </button>
                  <button
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                      role === "owner" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                    onClick={() => setRole("owner")}
                  >
                    I'm an Owner
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div id="recaptcha-container"></div>

              {!confirmationResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Phone Number</label>
                    <div className="relative flex">
                      <div className="flex items-center justify-center bg-gray-50 border border-r-0 border-gray-200 rounded-l-md px-3 text-gray-500 font-medium">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setPhoneNumber(val);
                        }}
                        className="rounded-l-none h-12"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendOtp} 
                    disabled={isLoggingIn || loading || phoneNumber.length !== 10}
                    className="w-full h-12 text-base shadow-md"
                  >
                    {isLoggingIn ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Enter OTP</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 h-12 tracking-widest"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleVerifyOtp} 
                    disabled={isLoggingIn || loading || !otp}
                    className="w-full h-12 text-base shadow-md"
                  >
                    {isLoggingIn ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <button 
                    onClick={() => {
                      setConfirmationResult(null)
                      setOtp("")
                      setError("")
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-900 mt-2"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}
              
              <p className="text-xs text-center text-gray-500 mt-6">
                By continuing, you agree to our <a href="#" className="font-medium text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-blue-600 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
