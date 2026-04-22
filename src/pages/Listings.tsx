import { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search, MapPin, Home, Filter, SlidersHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import SEO from "@/components/SEO"

interface Property {
  id: string;
  title: string;
  rent: number;
  bhk: string;
  location: string;
  address?: string;
  society?: string;
  images: string[];
  status: string;
  furnishing?: string;
}

export default function Listings() {
  const [searchParams] = useSearchParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedBhk, setSelectedBhk] = useState<string[]>([])
  const [minRent, setMinRent] = useState<string>("")
  const [maxRent, setMaxRent] = useState<string>("")
  const [selectedFurnishing, setSelectedFurnishing] = useState<string[]>([])

  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(
          collection(db, "properties"),
          where("status", "==", "active"),
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

    fetchProperties();
  }, []);

  const toggleBhk = (bhk: string) => {
    setSelectedBhk(prev => 
      prev.includes(bhk) ? prev.filter(item => item !== bhk) : [...prev, bhk]
    )
  }

  const toggleFurnishing = (type: string) => {
    setSelectedFurnishing(prev => 
      prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBhk([])
    setMinRent("")
    setMaxRent("")
    setSelectedFurnishing([])
  }

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      const searchMatch = searchTerms.length === 0 || searchTerms.every(term => 
        property.title.toLowerCase().includes(term) ||
        property.location.toLowerCase().includes(term) ||
        (property.society && property.society.toLowerCase().includes(term)) ||
        (property.address && property.address.toLowerCase().includes(term))
      );

      // BHK filter
      const bhkMatch = selectedBhk.length === 0 || selectedBhk.includes(property.bhk);

      // Rent filter
      const minRentMatch = !minRent || property.rent >= parseInt(minRent);
      const maxRentMatch = !maxRent || property.rent <= parseInt(maxRent);

      // Furnishing filter
      const furnishingMatch = selectedFurnishing.length === 0 || 
        (property.furnishing && selectedFurnishing.includes(property.furnishing));

      return searchMatch && bhkMatch && minRentMatch && maxRentMatch && furnishingMatch;
    });
  }, [properties, searchTerm, selectedBhk, minRent, maxRent, selectedFurnishing]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SEO 
        title={searchTerm ? `Flats for Rent in ${searchTerm}` : "All Flats for Rent"} 
        description="Browse hundreds of verified NO BROKERAGE flats for rent. Use our filters to find 1 BHK, 2 BHK, and 3 BHK houses in your preferred location."
        canonical="/flats"
      />
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl border border-gray-200">
              <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
              <Input 
                placeholder="Search by city, area, or society..." 
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="md:hidden h-12"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col md:flex-row gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className={`w-full md:w-64 shrink-0 space-y-6 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" /> Filters
              </h3>
              <button 
                className="text-sm text-blue-600 font-medium hover:underline"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">BHK Type</label>
                <div className="flex flex-wrap gap-2">
                  {['1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(bhk => (
                    <button 
                      key={bhk} 
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        selectedBhk.includes(bhk) 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-blue-600 hover:text-blue-600'
                      }`}
                      onClick={() => toggleBhk(bhk)}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Budget (₹)</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    className="h-9" 
                    value={minRent}
                    onChange={(e) => setMinRent(e.target.value)}
                  />
                  <span className="text-gray-400">-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    className="h-9" 
                    value={maxRent}
                    onChange={(e) => setMaxRent(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Furnishing</label>
                <div className="flex flex-col gap-2">
                  {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        checked={selectedFurnishing.includes(type)}
                        onChange={() => toggleFurnishing(type)}
                      />
                      <span className="text-sm text-gray-600">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full md:hidden" onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1 w-full">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Flats for rent in Bangalore</h1>
            <span className="text-sm text-gray-500">Showing {filteredProperties.length} results</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search criteria.</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProperties.map((property) => (
                <Link to={`/flats/${property.id}`} key={property.id} className="block group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <img 
                        src={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/800/600`)} 
                        alt={property.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="default" className="bg-white/90 text-gray-900 backdrop-blur-sm shadow-sm">
                          For Rent
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-xl text-gray-900">₹ {property.rent?.toLocaleString()} <span className="text-xs text-gray-500 font-medium">/ month</span></div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-1">{property.title}</h3>
                      <div className="flex items-start text-sm text-gray-500 mb-4 gap-1">
                        <MapPin className="w-4 h-4 shrink-0 mt-[2px]" />
                        <span className="line-clamp-2">{property.society ? `${property.society}, ` : ''}{property.location}</span>
                      </div>
                      
                      <div className="mt-auto flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Home className="w-4 h-4 text-gray-400" />
                          <span>{property.bhk}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
