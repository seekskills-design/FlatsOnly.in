import { Link, Outlet } from "react-router-dom"
import { Building2, Menu, X, LogOut, User, ChevronDown, LayoutDashboard } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "../ui/Button"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { SafetyPopup } from "@/components/SafetyPopup"

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { user, profile, logout } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">FlatsOnly.in</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/flats" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Find Flats</Link>
            <Link to="/dashboard/add-property" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Post Property</Link>
            <div className="h-4 w-px bg-gray-200" />
            
            {user ? (
              <div className="relative z-50" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner overflow-hidden">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{profile?.name || 'User'}</span>
                  <ChevronDown className={cn("w-4 h-4 opacity-70 transition-transform", isProfileOpen && "rotate-180")} />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{profile?.phone}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {profile?.role !== 'admin' && (
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsProfileOpen(false)}
                          className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      )}
                      {profile?.role === 'admin' && (
                        <Link 
                          to="/admin/dashboard" 
                          onClick={() => setIsProfileOpen(false)}
                          className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }} 
                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/dashboard/add-property">
                  <Button size="sm">Post Free Ad</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
            <Link to="/flats" className="text-sm font-medium text-gray-600 hover:text-blue-600 p-2" onClick={() => setIsMenuOpen(false)}>Find Flats</Link>
            <Link to="/dashboard/add-property" className="text-sm font-medium text-gray-600 hover:text-blue-600 p-2" onClick={() => setIsMenuOpen(false)}>Post Property</Link>
            <div className="h-px bg-gray-100 my-2" />
            
            {user ? (
              <>
                <div className="p-2 text-sm font-medium text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {profile?.name || 'User'}
                </div>
                {profile?.role !== 'admin' && (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Dashboard</Button>
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Admin</Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { logout(); setIsMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">Log in</Button>
                </Link>
                <Link to="/dashboard/add-property" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full justify-center">Post Free Ad</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <SafetyPopup />

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">FlatsOnly.in</span>
              </Link>
              <p className="text-gray-500 text-sm max-w-xs">
                Flats for Rent. Nothing Else. We connect tenants directly with property owners.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/flats" className="hover:text-blue-600 transition-colors">Find Flats</Link></li>
                <li><Link to="/dashboard/add-property" className="hover:text-blue-600 transition-colors">Post Property</Link></li>
                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Login / Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <p>© {new Date().getFullYear()} FlatsOnly.in. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
