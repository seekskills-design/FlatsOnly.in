import { Link, Outlet, useLocation, Navigate } from "react-router-dom"
import { Building2, LayoutDashboard, Users, Home, Settings, LogOut, Menu, X, ShieldAlert } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

export function AdminLayout() {
  const { user, profile, loading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Properties", href: "/admin/properties", icon: Home },
    { name: "Societies", href: "/admin/societies", icon: Building2 },
    { name: "Leads", href: "/admin/leads", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-gray-100 bg-white px-4 h-16 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Admin</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 hidden md:flex">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">FlatsOnly Admin</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Management</div>
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
                    ? "bg-blue-600 text-white" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Gradient Header for Admin */}
        <div className="h-48 bg-gradient-to-r from-slate-900 to-slate-800 shrink-0" />
        
        <div className="flex-1 -mt-32 px-4 sm:px-6 lg:px-8 pb-12 overflow-y-auto">
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
