import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, MapPin, Home as HomeIcon, ShieldCheck, ArrowRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { db } from "@/firebase"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import SEO from "@/components/SEO"

interface Property {
  id: string;
  title: string;
  rent: number;
  bhk: string;
  location: string;
  society?: string;
  images: string[];
  status: string;
}

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [rentedProperties, setRentedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // Check if it's the first visit
    const hasVisited = localStorage.getItem("hasVisitedFlatsOnly")
    if (!hasVisited) {
      const timer = setTimeout(() => {
        setShowPopup(true)
      }, 3000) // Show after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClosePopup = () => {
    setShowPopup(false)
    localStorage.setItem("hasVisitedFlatsOnly", "true")
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(
          collection(db, "properties"),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProperties = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        setFeaturedProperties(fetchedProperties);

        const rentedQ = query(
          collection(db, "properties"),
          where("status", "==", "rented"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const rentedSnapshot = await getDocs(rentedQ);
        const fetchedRented = rentedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Property[];
        setRentedProperties(fetchedRented);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title="Find Flats for Rent with Zero Brokerage" 
        description="Connect directly with verified property owners for the best rental deals zero brokerage. Find 1 BHK, 2 BHK, and 3 BHK flats for rent."
        canonical="/"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FlatsOnly.in",
          "url": "https://flatsonly.in/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://flatsonly.in/flats?query={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      {/* First Time Visitor Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={handleClosePopup}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <div className="h-48 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/home/800/400')] opacity-40 bg-cover bg-center mix-blend-overlay" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30">
                  <HomeIcon className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to FlatsOnly!</h3>
              <p className="text-gray-600 mb-8">
                Find your dream home with zero brokerage. Connect directly with verified property owners and save thousands on your next rental.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/flats" onClick={handleClosePopup}>
                  <Button className="w-full h-12 text-base rounded-xl">
                    Start Searching Now
                  </Button>
                </Link>
                <Link to="/login" onClick={handleClosePopup}>
                  <Button variant="outline" className="w-full h-12 text-base rounded-xl">
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/buildings/1920/1080')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="success" className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Zero Brokerage â 100% Verified
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Find Flats for Rent in <span className="text-blue-400">Seconds</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Connect directly with property owners for the best rental deals in your city.
            </p>

            {/* Search Box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/flats?search=${encodeURIComponent(searchQuery)}`);
                } else {
                  navigate('/flats');
                }
              }}
              className="bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto"
            >
              <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-xl md:rounded-full border border-gray-100">
                <MapPin className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                <Input 
                  placeholder="Search by city, area, or society..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="lg" className="w-full md:w-auto rounded-xl md:rounded-full px-8 text-base h-12">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-blue-200">
              <span>Popular:</span>
              <Link to="/flats?search=Koramangala" className="hover:text-white transition-colors underline underline-offset-4">Koramangala</Link>
              <Link to="/flats?search=HSR+Layout" className="hover:text-white transition-colors underline underline-offset-4">HSR Layout</Link>
              <Link to="/flats?search=Indiranagar" className="hover:text-white transition-colors underline underline-offset-4">Indiranagar</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How FlatsOnly Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Skip the middleman and rent your next home in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Search Flats</h3>
              <p className="text-gray-500">Browse hundreds of verified properties in your preferred location.</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Verify OTP</h3>
              <p className="text-gray-500">Verify your phone number to unlock direct owner contact details.</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                <HomeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Move In</h3>
              <p className="text-gray-500">Contact the owner, visit the property, and finalize your rent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Listings</h2>
              <p className="text-gray-500">Handpicked properties available right now.</p>
            </div>
            <Link to="/flats" className="hidden md:flex items-center text-blue-600 font-medium hover:text-blue-700">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <HomeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No featured properties found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Link to={`/flats/${property.id}`} key={property.id} className="block group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                    <div className="relative h-56 overflow-hidden shrink-0">
                      <img 
                        src={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/800/600`)} 
                        alt={property.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="default" className="bg-white/90 text-gray-900 backdrop-blur-sm shadow-sm">
                          For Rent
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="font-bold text-lg text-gray-900">₹ {property.rent?.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 font-medium"> / month</span>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start text-xs text-gray-500 mb-2 gap-2">
                        <span className="flex items-start"><MapPin className="w-3.5 h-3.5 mr-1 mt-[2px] shrink-0" /> <span className="line-clamp-2">{property.society ? `${property.society}, ` : ''}{property.location}</span></span>
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 line-clamp-1">{property.title}</h3>
                      <div className="mt-auto flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <HomeIcon className="w-4 h-4 text-gray-400" />
                          <span>{property.bhk}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/flats">
              <Button variant="outline" className="w-full">View All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Rented Properties */}
      {!loading && rentedProperties.length > 0 && (
        <section className="py-20 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Recently Rented Properties</h2>
                <p className="text-gray-500">Properties that were recently rented out through our platform.</p>
              </div>
              <Link to="/flats" className="hidden md:flex items-center text-blue-600 font-medium hover:text-blue-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="relative w-full overflow-hidden">
              <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {/* Double the list for seamless scrolling */}
                {[...rentedProperties, ...rentedProperties].map((property, index) => (
                  <Link to={`/flats/${property.id}`} key={`${property.id}-${index}`} className="block group w-[300px] md:w-[350px] shrink-0">
                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col opacity-80 hover:opacity-100">
                      <div className="relative h-48 overflow-hidden shrink-0">
                        <img 
                          src={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/800/600`)} 
                          alt={property.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-red-500 text-white border-red-500 shadow-sm">
                            Rented Out
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="font-bold text-lg text-gray-900 line-through opacity-70">₹ {property.rent?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col whitespace-normal">
                        <div className="flex items-start text-xs text-gray-500 mb-2 gap-2">
                          <span className="flex items-start"><MapPin className="w-3.5 h-3.5 mr-1 mt-[2px] shrink-0" /> <span className="line-clamp-2">{property.society ? `${property.society}, ` : ''}{property.location}</span></span>
                        </div>
                        <h3 className="font-semibold text-base mb-2 text-gray-900 line-clamp-1">{property.title}</h3>
                        <div className="mt-auto flex items-center gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-1.5">
                            <HomeIcon className="w-4 h-4 text-gray-400" />
                            <span>{property.bhk}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link to="/flats">
                <Button variant="outline" className="w-full">View All Rented</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-600/10">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Are you a Property Owner?</h2>
              <p className="text-blue-100 text-lg">List your property on FlatsOnly and connect with verified tenants directly. Zero brokerage, zero hassle.</p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <Link to="/dashboard/add-property">
                <Button size="lg" variant="outline" className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 border-transparent h-14 px-8 text-lg">
                  Post Property Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
