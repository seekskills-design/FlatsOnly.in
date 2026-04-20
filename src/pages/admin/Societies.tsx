import React, { useState, useEffect } from "react"
import { Search, Edit, Trash2, Plus, Loader2, X, Check, Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore"

interface Society {
  id: string;
  name: string;
  city: string;
  area: string;
  status: string;
}

export default function AdminSocieties() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSociety, setEditingSociety] = useState<Society | null>(null)
  const [formData, setFormData] = useState({ name: "", city: "", area: "", status: "verified" })
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchSocieties = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "societies"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const fetchedSocieties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Society[];
      setSocieties(fetchedSocieties);
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this society?")) {
      try {
        await deleteDoc(doc(db, "societies", id));
        setSocieties(societies.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting society:", error);
        alert("Failed to delete society.");
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "societies", id), { status: newStatus });
      setSocieties(societies.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleOpenModal = (society?: Society) => {
    if (society) {
      setEditingSociety(society);
      setFormData({ name: society.name, city: society.city, area: society.area, status: society.status });
    } else {
      setEditingSociety(null);
      setFormData({ name: "", city: "", area: "", status: "verified" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSociety) {
        await updateDoc(doc(db, "societies", editingSociety.id), formData);
      } else {
        await addDoc(collection(db, "societies"), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      fetchSocieties();
    } catch (error) {
      console.error("Error saving society:", error);
      alert("Failed to save society.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSocieties = societies.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Societies Management</h1>
          <p className="text-slate-300 text-sm mt-1">Manage society database for autocomplete.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search societies..." 
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
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <Button variant="accent" className="h-10 w-full sm:w-auto" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Society Name</th>
                <th className="px-6 py-4 font-medium">City & Area</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredSocieties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No societies found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSocieties.map((society) => (
                  <tr key={society.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{society.name}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {society.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{society.city}</div>
                      <div className="text-xs text-gray-500 mt-1">{society.area}</div>
                    </td>
                    <td className="px-6 py-4">
                      {society.status === 'pending' ? (
                        <Badge variant="warning">Pending Verification</Badge>
                      ) : (
                        <Badge variant="success">Verified</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {society.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" 
                            title="Verify"
                            onClick={() => handleStatusChange(society.id, 'verified')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-blue-600" 
                          title="Edit"
                          onClick={() => handleOpenModal(society)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-red-600" 
                          title="Delete"
                          onClick={() => handleDelete(society.id)}
                        >
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{editingSociety ? 'Edit Society' : 'Add New Society'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Society Name *</label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Prestige Falcon City" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">City *</label>
                <Input 
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g. Bangalore" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Area / Locality *</label>
                <Input 
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="e.g. Kanakapura Road" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                <select 
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Society'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
