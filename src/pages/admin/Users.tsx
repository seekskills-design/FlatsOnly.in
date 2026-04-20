import { useState, useEffect } from "react"
import { Search, MoreVertical, ShieldBan, Trash2, Loader2, ShieldCheck, Filter } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
  photoURL?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: newStatus
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const matchesSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users Management</h1>
          <p className="text-slate-300 text-sm mt-1">View and manage platform users.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search users..." 
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
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500 mt-1">{user.phone || user.email || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 capitalize">{user.role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">
                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : (typeof user.createdAt === 'string' ? new Date(user.createdAt).toLocaleDateString() : 'Unknown')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === 'blocked' ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Blocked</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'blocked' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600" title="Unblock User" onClick={() => handleUpdateStatus(user.id, 'active')}>
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-amber-600" title="Block User" onClick={() => handleUpdateStatus(user.id, 'blocked')}>
                            <ShieldBan className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" title="Delete User" onClick={() => handleDelete(user.id)}>
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
