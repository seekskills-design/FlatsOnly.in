import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Edit, Trash2, CheckCircle2, MoreVertical, Plus, Loader2, Home, Key } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/firebase"
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore"

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
}

export default function MyListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProperties = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "properties"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error fetching user properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await deleteDoc(doc(db, "properties", id));
        setProperties(properties.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting property:", error);
        alert("Failed to delete property.");
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    // Only allow toggling between active and rented
    if (currentStatus !== 'active' && currentStatus !== 'rented') {
      alert("You can only toggle status for approved properties.");
      return;
    }

    const newStatus = currentStatus === 'active' ? 'rented' : 'active';
    try {
      await updateDoc(doc(db, "properties", id), {
        status: newStatus
      });
      setProperties(properties.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (error) {
      console.error("Error updating property status:", error);
      alert("Failed to update property status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Listings</h1>
          <p className="text-blue-100 text-sm mt-1">Manage your properties and update their status.</p>
        </div>
        <Link to="/dashboard/add-property">
          <Button variant="accent" className="shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Property Details</th>
                <th className="px-6 py-4 font-medium">Rent & Deposit</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No properties found. Click "Add Property" to list your first flat.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <img src={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/200/200`)} alt="Property" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{property.title}</p>
                          <p className="text-gray-500 text-xs mt-1">{property.society ? `${property.society}, ` : ''}{property.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">₹ {property.rent?.toLocaleString()}<span className="text-gray-400 text-xs font-normal">/mo</span></div>
                      <div className="text-xs text-gray-500 mt-1">Dep: ₹ {property.deposit?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {property.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : property.status === 'pending' ? (
                        <Badge variant="warning">Under Review</Badge>
                      ) : property.status === 'rented' ? (
                        <Badge variant="secondary">Rented Out</Badge>
                      ) : (
                        <Badge variant="outline">{property.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(property.status === 'active' || property.status === 'rented') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 text-xs ${property.status === 'active' ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                            onClick={() => handleToggleStatus(property.id, property.status)}
                          >
                            {property.status === 'active' ? (
                              <><Key className="w-3 h-3 mr-1" /> Mark Rented</>
                            ) : (
                              <><Home className="w-3 h-3 mr-1" /> Mark Available</>
                            )}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => navigate(`/dashboard/edit-property/${property.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(property.id)}
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
    </div>
  )
}
