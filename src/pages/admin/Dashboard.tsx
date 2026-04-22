import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, Home, PhoneCall, TrendingUp, Loader2 } from "lucide-react"
import { db } from "@/firebase"
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore"
import SEO from "@/components/SEO"

interface Property {
  id: string;
  title: string;
  ownerName: string;
  status: string;
  images: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, properties: 0, leads: 0 })
  const [recentProperties, setRecentProperties] = useState<Property[]>([])
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch counts
        const usersSnapshot = await getDocs(collection(db, "users"));
        const propertiesSnapshot = await getDocs(query(collection(db, "properties"), where("status", "==", "active")));
        const leadsSnapshot = await getDocs(collection(db, "leads"));

        setStats({
          users: usersSnapshot.size,
          properties: propertiesSnapshot.size,
          leads: leadsSnapshot.size
        });

        // Fetch recent properties
        const recentPropsQuery = query(collection(db, "properties"), orderBy("createdAt", "desc"), limit(4));
        const recentPropsSnapshot = await getDocs(recentPropsQuery);
        setRecentProperties(recentPropsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[]);

        // Fetch recent users
        const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(4));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        setRecentUsers(recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[]);

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Admin Dashboard" description="FlatsOnly admin control panel." noindex={true} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.users}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Total Registered
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Active Properties</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Home className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.properties}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Currently Listed
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Leads Generated</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <PhoneCall className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.leads}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Total Inquiries
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Recent Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProperties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No properties added yet.
                </div>
              ) : (
                recentProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img 
                          src={Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : (typeof property.images === 'string' ? property.images : "https://images.unsplash.com/photo-1560518883-ce09059ee095?auto=format&fit=crop&q=80&w=100")} 
                          alt="Property" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{property.title}</p>
                        <p className="text-sm text-gray-500">Owner: {property.ownerName || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        property.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        property.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users registered yet.
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.phone || user.email || "No phone"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
                      <p className="text-xs text-gray-500">
                        {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : (typeof user.createdAt === 'string' ? new Date(user.createdAt).toLocaleDateString() : 'Recent')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
