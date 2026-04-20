import { useState, useEffect } from "react"
import { Search, Phone, Calendar, Download, Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, query, getDocs, orderBy } from "firebase/firestore"

interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  status: string;
  createdAt: any;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "leads"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedLeads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesSearch = (l.tenantName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.tenantPhone || "").includes(searchQuery) ||
                          l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.propertyTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Leads</h1>
          <p className="text-slate-300 text-sm mt-1">Monitor all tenant inquiries across the platform.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search leads by phone, name, ID..." 
              className="pl-9 h-10 w-full sm:w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:bg-slate-700 focus:text-white" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="h-10 rounded-md bg-slate-800 border-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Button variant="outline" className="h-10 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Lead ID & Date</th>
                <th className="px-6 py-4 font-medium">Tenant Details</th>
                <th className="px-6 py-4 font-medium">Property Inquired</th>
                <th className="px-6 py-4 font-medium">Owner Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">LD-{lead.id.substring(0, 8)}</div>
                      <div className="flex items-center gap-1.5 text-gray-600 mt-1 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleString() : 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.tenantName || 'Unknown'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Phone className="w-3 h-3" /> {lead.tenantPhone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{lead.propertyTitle || 'Unknown Property'}</div>
                      <div className="text-xs text-blue-600 mt-1 hover:underline cursor-pointer">View Property (PR-{lead.propertyId.substring(0, 8)})</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.ownerName || 'Unknown'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <Phone className="w-3 h-3" /> {lead.ownerPhone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === 'contacted' ? (
                        <Badge variant="success">Contacted</Badge>
                      ) : lead.status === 'new' ? (
                        <Badge variant="warning">New</Badge>
                      ) : lead.status === 'closed' ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : (
                        <Badge variant="outline">{lead.status}</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
