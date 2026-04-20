import { useState, useEffect } from "react"
import { Search, CheckCircle2, XCircle, Trash2, Eye, Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"

interface Property {
  id: string;
  title: string;
  rent: number;
  deposit: number;
  bhk: string;
  location: string;
  society?: string;
  images: string[];
  status: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "properties"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleUpdateStatus = async (propertyId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "properties", propertyId), {
        status: newStatus
      });
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error("Error updating property status:", error);
      alert("Failed to update property status.");
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await deleteDoc(doc(db, "properties", propertyId));
        fetchProperties(); // Refresh the list
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("Failed to delete property.");
      }
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
      p.title.toLowerCase().includes(term) || 
      p.location.toLowerCase().includes(term) ||
      (p.society && p.society.toLowerCase().includes(term)) ||
      p.id.toLowerCase().includes(term)
    );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Properties Management</h1>
          <p className="text-slate-300 text-sm mt-1">Review and approve property listings.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search properties..." 
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
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Property Details</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Rent & Deposit</th>
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
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No properties found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <img src={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/200/200`)} alt="Property" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{property.title}</p>
                          <p className="text-gray-500 text-xs mt-1">{property.society ? `${property.society}, ` : ''}{property.location}</p>
                          <div className="text-xs text-gray-400 mt-1">ID: {property.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{property.ownerName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-1">{property.ownerPhone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">₹ {property.rent?.toLocaleString()}<span className="text-gray-400 text-xs font-normal">/mo</span></div>
                      <div className="text-xs text-gray-500 mt-1">Dep: ₹ {property.deposit?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {property.status === 'pending' ? (
                        <Badge variant="warning">Pending Review</Badge>
                      ) : property.status === 'rejected' ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
                      ) : property.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="outline">{property.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {property.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Approve" onClick={() => handleUpdateStatus(property.id, 'active')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Reject" onClick={() => handleUpdateStatus(property.id, 'rejected')}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" title="Delete" onClick={() => handleDelete(property.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
