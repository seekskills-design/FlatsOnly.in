import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2, Users, Eye, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react"
import { db } from "@/firebase"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import SEO from "@/components/SEO"

interface Lead {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyTitle: string;
  createdAt: any;
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ listings: 0, leads: 0 })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch listings count
        const listingsQuery = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const listingsSnapshot = await getDocs(listingsQuery);
        const listingsCount = listingsSnapshot.size;

        // Fetch leads count
        const leadsQuery = query(collection(db, "leads"), where("ownerId", "==", user.uid));
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsCount = leadsSnapshot.size;

        setStats({ listings: listingsCount, leads: leadsCount });

        // Fetch recent leads
        const recentLeadsQuery = query(
          collection(db, "leads"), 
          where("ownerId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentLeadsSnapshot = await getDocs(recentLeadsQuery);
        const fetchedLeads = recentLeadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lead[];
        setRecentLeads(fetchedLeads);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Dashboard Overview" description="Manage your property listings and leads." noindex={true} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Listings</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.listings}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Active
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.leads}</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Total Inquiries
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Profile Views</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> Coming Soon
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-100">Active Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Free Plan</div>
            <p className="text-xs text-blue-200 mt-1 flex items-center">
              Upgrade to Premium <ArrowUpRight className="w-3 h-3 ml-1" />
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No leads received yet.
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {lead.tenantName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lead.tenantName}</p>
                        <p className="text-sm text-gray-500">{lead.tenantPhone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{lead.propertyTitle}</p>
                      <p className="text-xs text-gray-500">
                        {lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/add-property" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-colors group">
              <span className="font-medium text-gray-700 group-hover:text-blue-700">Add New Property</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </Link>
            <Link to="/dashboard/listings" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-colors group">
              <span className="font-medium text-gray-700 group-hover:text-blue-700">Manage Listings</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </Link>
            <Link to="/dashboard/leads" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-colors group">
              <span className="font-medium text-gray-700 group-hover:text-blue-700">View All Leads</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
