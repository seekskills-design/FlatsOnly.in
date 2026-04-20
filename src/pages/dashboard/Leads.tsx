import { useState, useEffect } from "react"
import { Phone, Mail, Calendar, CheckCircle2, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/firebase"
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore"

interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  status: string;
  createdAt: any;
}

export default function Leads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "leads"),
        where("ownerId", "==", user.uid),
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
  }, [user]);

  const handleMarkContacted = async (leadId: string) => {
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status: "contacted"
      });
      fetchLeads(); // Refresh the list
    } catch (error) {
      console.error("Error updating lead status:", error);
      alert("Failed to update lead status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
          <p className="text-blue-100 text-sm mt-1">Manage inquiries from potential tenants.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input placeholder="Search leads..." className="pl-9 h-10 w-full sm:w-64 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white focus:text-gray-900" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant Details</th>
                <th className="px-6 py-4 font-medium">Property Inquired</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                          {lead.tenantName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{lead.tenantName || 'Unknown User'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Phone className="w-3 h-3" /> {lead.tenantPhone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{lead.propertyTitle || 'Unknown Property'}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {lead.propertyId.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'Unknown'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 ml-5">
                        {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === 'contacted' ? (
                        <Badge variant="success">Contacted</Badge>
                      ) : lead.status === 'new' ? (
                        <Badge variant="warning">New</Badge>
                      ) : (
                        <Badge variant="outline">{lead.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.tenantPhone && (
                          <a href={`tel:${lead.tenantPhone}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <Phone className="w-3 h-3 mr-1.5" /> Call
                            </Button>
                          </a>
                        )}
                        {lead.status === 'new' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Mark as Contacted" onClick={() => handleMarkContacted(lead.id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
