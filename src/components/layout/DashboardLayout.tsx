import { Link, Outlet, useLocation, Navigate } from "react-router-dom"
import { Building2, LayoutDashboard, PlusCircle, List, Users, LogOut, Menu, X, ChevronDown, User } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

export function DashboardLayout() {
  const { user, profile, loading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect tenants from root dashboard or unauthorized routes to profile
  if (profile?.role === 'tenant' && location.pathname !== '/dashboard/profile') {
    return <Navigate to="/dashboard/profile" replace />
  }

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ['owner'] },
    { name: "Add Property", href: "/dashboard/add-property", icon: PlusCircle, roles: ['owner'] },
    { name: "My Listings", href: "/dashboard/listings", icon: List, roles: ['owner'] },
    { name: "Leads", href: "/dashboard/leads", icon: Users, roles: ['owner'] },
    { name: "Profile", href: "/dashboard/profile", icon: User, roles: ['owner', 'tenant'] },
  ].filter(item => item.roles.includes(profile?.role || 'tenant'))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-gray-100 bg-white px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">FlatsOnly</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 hidden md:flex">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">FlatsOnly</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            {profile?.role === 'tenant' ? 'Tenant Dashboard' : 'Owner Dashboard'}
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Gradient Header for Dashboard */}
        <div className="h-48 bg-gradient-to-r from-slate-900 to-blue-900 shrink-0 relative">
        </div>
        
        <div className="flex-1 relative z-10 -mt-32 px-4 sm:px-6 lg:px-8 pb-12 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
