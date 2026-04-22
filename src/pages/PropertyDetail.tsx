import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { MapPin, Home, BedDouble, Bath, Square, Calendar, Phone, CheckCircle2, ShieldCheck, X, Loader2, User, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { db } from "@/firebase"
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import SEO from "@/components/SEO"

interface OwnerProfile {
  name: string;
  photoUrl?: string;
  userType?: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
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
  ownerPhotoUrl?: string;
  ownerUserType?: string;
  amenities?: string[];
  furnishing?: string;
  availableFrom?: string;
  tenantPreference?: string;
}

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([])
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tenantName, setTenantName] = useState(profile?.name || user?.displayName || "")
  const [tenantPhone, setTenantPhone] = useState(profile?.phone || user?.phoneNumber || "")
  const [submittingLead, setSubmittingLead] = useState(false)
  const [leadSuccess, setLeadSuccess] = useState(false)
  const [error, setError] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (location.state?.action === 'contact' && user) {
      setIsModalOpen(true);
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, user, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "properties", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const propData = { id: docSnap.id, ...docSnap.data() } as Property;
          setProperty(propData);

          // Fetch nearby properties
          try {
            const nearbyQ = query(
              collection(db, "properties"),
              where("status", "==", "active"),
              where("location", "==", propData.location),
              limit(4)
            );
            const nearbySnapshot = await getDocs(nearbyQ);
            const fetchedNearby = nearbySnapshot.docs
              .map(d => ({ id: d.id, ...d.data() } as Property))
              .filter(p => p.id !== propData.id)
              .slice(0, 3);
            
            // If not enough nearby properties by exact location, fetch some general active ones
            if (fetchedNearby.length < 3) {
              const fallbackQ = query(
                collection(db, "properties"),
                where("status", "==", "active"),
                orderBy("createdAt", "desc"),
                limit(5)
              );
              const fallbackSnapshot = await getDocs(fallbackQ);
              const fallbackProps = fallbackSnapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as Property))
                .filter(p => p.id !== propData.id && !fetchedNearby.find(n => n.id === p.id));
              
              setNearbyProperties([...fetchedNearby, ...fallbackProps].slice(0, 3));
            } else {
              setNearbyProperties(fetchedNearby);
            }
          } catch (err) {
            console.error("Error fetching nearby properties:", err);
          }

          if (propData.ownerId) {
            setOwnerProfile({
              name: propData.ownerName || "Unknown",
              photoUrl: propData.ownerPhotoUrl,
              userType: propData.ownerUserType || "Property Owner"
            });
          }
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleContactClick = () => {
    if (!user) {
      navigate('/login', { state: { role: 'tenant', from: location, action: 'contact' } });
      return;
    }
    setIsModalOpen(true);
  };

  const handleContactOwner = async () => {
    setError("");
    if (!tenantPhone || tenantPhone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!property) return;

    setSubmittingLead(true);
    try {
      await addDoc(collection(db, "leads"), {
        propertyId: property.id,
        propertyTitle: property.title,
        tenantId: user ? user.uid : "anonymous",
        tenantName: tenantName || profile?.name || user?.displayName || "Anonymous",
        tenantPhone: tenantPhone || profile?.phone || user?.phoneNumber || "Unknown",
        ownerId: property.ownerId,
        ownerName: property.ownerName || "Unknown",
        ownerPhone: property.ownerPhone || "Unknown",
        status: "new",
        createdAt: serverTimestamp()
      });
      setLeadSuccess(true);
    } catch (error) {
      console.error("Error submitting lead:", error);
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-500 mb-6">The property you are looking for does not exist or has been removed.</p>
          <Link to="/flats">
            <Button>Browse Other Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      <SEO 
        title={`${property.bhk} in ${property.location} for rent`} 
        description={`Rent ${property.title} for ₹${property.rent}/month. Zero brokerage. Find more properties in ${property.location} exclusively on FlatsOnly.`}
        canonical={`/property/${property.id}`}
        image={Array.isArray(property.images) ? property.images[0] : (typeof property.images === 'string' ? property.images : undefined)}
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": property.title,
          "description": property.description,
          "image": Array.isArray(property.images) ? property.images : undefined,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": property.rent,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        }}
      />
      {/* Image Gallery */}
      <div className="w-full h-[calc(40vh+90px)] md:h-[calc(60vh+90px)] bg-gray-200 relative overflow-hidden group">
        <img 
          src={Array.isArray(property.images) ? property.images[selectedImageIndex] : (typeof property.images === 'string' ? property.images : `https://picsum.photos/seed/${property.id}/1920/1080`)} 
          alt={property.title} 
          className="w-full h-full object-cover transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Navigation Arrows */}
        {Array.isArray(property.images) && property.images.length > 1 && (
          <>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setSelectedImageIndex(prev => prev === 0 ? property.images!.length - 1 : prev - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setSelectedImageIndex(prev => prev === property.images!.length - 1 ? 0 : prev + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-4 md:left-12 text-white z-10">
          <Badge variant="success" className="mb-3 bg-emerald-500/90 text-white border-emerald-500">Verified Property</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{property.title}</h1>
          <p className="text-lg md:text-xl text-gray-200 flex items-start gap-2">
            <MapPin className="w-5 h-5 mt-1 shrink-0" /> <span>{property.society ? `${property.society}, ` : ''}{property.location}</span>
          </p>
        </div>
      </div>

      {/* Thumbnails */}
      {Array.isArray(property.images) && property.images.length > 1 && (
        <div className="container mx-auto px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-24 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === idx ? 'border-blue-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Overview Card */}
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5"><Home className="w-4 h-4" /> Configuration</span>
                    <span className="font-semibold text-gray-900">{property.bhk}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5"><BedDouble className="w-4 h-4" /> Furnishing</span>
                    <span className="font-semibold text-gray-900">{property.furnishing || 'Not Specified'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Available</span>
                    <span className="font-semibold text-gray-900">
                      {property.status === 'rented' ? 'Rented Out' : (property.availableFrom || 'Immediately')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About Property</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Properties */}
            {nearbyProperties.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nearby Available Flats/Apartments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyProperties.map((nearbyProp) => (
                    <Link key={nearbyProp.id} to={`/flats/${nearbyProp.id}`} className="group block">
                      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={Array.isArray(nearbyProp.images) ? nearbyProp.images[0] : (typeof nearbyProp.images === 'string' ? nearbyProp.images : `https://picsum.photos/seed/${nearbyProp.id}/800/600`)} 
                            alt={nearbyProp.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-white/90 text-gray-900 backdrop-blur-sm font-semibold shadow-sm">
                              {nearbyProp.bhk}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {nearbyProp.title}
                            </h3>
                          </div>
                          <p className="text-gray-500 text-sm flex items-start gap-1.5 mb-4">
                            <MapPin className="w-4 h-4 shrink-0 mt-[2px]" /> <span className="line-clamp-2">{nearbyProp.society ? `${nearbyProp.society}, ` : ''}{nearbyProp.location}</span>
                          </p>
                          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-xl font-bold text-blue-600">₹ {nearbyProp.rent?.toLocaleString()} <span className="text-sm text-gray-500 font-normal">/mo</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Pricing Card */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg sticky top-24">
              <div className="mb-6">
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Monthly Rent</span>
                <div className="text-4xl font-bold text-gray-900 mt-1">₹ {property.rent?.toLocaleString()}</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Deposit</span>
                  <span className="font-semibold text-gray-900">₹ {property.deposit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Brokerage</span>
                  <span className="font-semibold text-emerald-600">Zero</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Tenant Preference</span>
                  <span className="font-semibold text-gray-900">{property.tenantPreference || 'Any'}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl mb-6 flex items-start gap-3 border border-blue-100">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Direct {ownerProfile?.userType === 'Property Agent' ? 'Agent' : 'Owner'} Listing</h4>
                  <p className="text-xs text-blue-700 mt-1">Verify your phone number to get the {ownerProfile?.userType === 'Property Agent' ? 'agent' : 'owner'}'s contact details instantly.</p>
                </div>
              </div>

              {/* Owner/Agent Profile */}
              {ownerProfile && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 shrink-0 border-2 border-white shadow-sm">
                    {ownerProfile.photoUrl ? (
                      <img src={ownerProfile.photoUrl} alt={ownerProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{ownerProfile.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{ownerProfile.userType}</p>
                  </div>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full text-lg h-14 shadow-md"
                onClick={handleContactClick}
              >
                <Phone className="w-5 h-5 mr-2" />
                Contact {ownerProfile?.userType === 'Property Agent' ? 'Agent' : 'Owner'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-40">
        <Button 
          size="lg" 
          className="w-full text-lg h-14 shadow-md"
          onClick={handleContactClick}
        >
          <Phone className="w-5 h-5 mr-2" />
          Contact {ownerProfile?.userType === 'Property Agent' ? 'Agent' : 'Owner'}
        </Button>
      </div>

      {/* OTP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Get Contact Details</h3>
              <button onClick={() => { setIsModalOpen(false); setError(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!leadSuccess ? (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm mb-6">Please provide your details to view the {ownerProfile?.userType === 'Property Agent' ? 'agent' : 'owner'}'s contact information. We keep your data safe.</p>
                  
                  {error && (
                    <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name *</label>
                    <Input 
                      placeholder="Enter your name" 
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
                    <div className="flex gap-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 flex items-center text-gray-500 font-medium">
                        +91
                      </div>
                      <Input 
                        type="tel" 
                        placeholder="10-digit mobile number" 
                        className="flex-1" 
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-12 mt-4" 
                    onClick={handleContactOwner}
                    disabled={submittingLead || !tenantName || !tenantPhone || tenantPhone.length < 10}
                  >
                    {submittingLead ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      "View Contact Details"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                  <p className="text-gray-600 text-sm">Your inquiry has been sent to the {ownerProfile?.userType === 'Property Agent' ? 'agent' : 'owner'}. Here are their contact details:</p>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left">
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 uppercase font-semibold">{ownerProfile?.userType === 'Property Agent' ? 'Agent' : 'Owner'} Name</span>
                      <p className="font-medium text-gray-900">{property.ownerName || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">Phone Number</span>
                      <p className="font-bold text-lg text-blue-600">{property.ownerPhone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-12" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
