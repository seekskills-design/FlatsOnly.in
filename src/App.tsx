import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"

// Layouts
import { PublicLayout } from "./components/layout/PublicLayout"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { AdminLayout } from "./components/layout/AdminLayout"

// Public Pages
import Home from "./pages/Home"
import Listings from "./pages/Listings"
import PropertyDetail from "./pages/PropertyDetail"
import Login from "./pages/Login"

// Dashboard Pages
import DashboardOverview from "./pages/dashboard/Overview"
import AddProperty from "./pages/dashboard/AddProperty"
import EditProperty from "./pages/dashboard/EditProperty"
import MyListings from "./pages/dashboard/Listings"
import Leads from "./pages/dashboard/Leads"
import Profile from "./pages/dashboard/Profile"

// Admin Pages
import AdminLogin from "./pages/admin/Login"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminUsers from "./pages/admin/Users"
import AdminProperties from "./pages/admin/Properties"
import AdminSocieties from "./pages/admin/Societies"
import AdminLeads from "./pages/admin/Leads"

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="flats" element={<Listings />} />
            <Route path="flats/:id" element={<PropertyDetail />} />
          </Route>
          
          <Route path="/login" element={<Login />} />

          {/* Dashboard Routes (Owner & Tenant) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="add-property" element={<AddProperty />} />
            <Route path="edit-property/:id" element={<EditProperty />} />
            <Route path="listings" element={<MyListings />} />
            <Route path="leads" element={<Leads />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="societies" element={<AdminSocieties />} />
            <Route path="leads" element={<AdminLeads />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
