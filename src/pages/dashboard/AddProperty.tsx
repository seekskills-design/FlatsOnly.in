import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronRight, UploadCloud, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import { db, storage } from "@/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { useAuth } from "@/contexts/AuthContext"
import SEO from "@/components/SEO"

// Utility function to compress image before upload
const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL(file.type || 'image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface Society {
  id: string;
  name: string;
  city: string;
  area: string;
  status: string;
}

export default function AddProperty() {
  const [step, setStep] = useState(1)
  const totalSteps = 6
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Society Autocomplete State
  const [societies, setSocieties] = useState<Society[]>([])
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([])
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false)
  const societyInputRef = useRef<HTMLDivElement>(null)

  // Image Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    bhk: "",
    furnishing: "",
    city: "",
    locality: "",
    address: "",
    society: "",
    rent: "",
    deposit: "",
    maintenance: "",
    maintenanceType: "Per Month",
    tenantPreference: "",
    availableFrom: "",
    description: "",
  })

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const q = query(collection(db, "societies"), where("status", "==", "verified"));
        const snapshot = await getDocs(q);
        const fetchedSocieties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Society[];
        setSocieties(fetchedSocieties);
      } catch (error) {
        console.error("Error fetching societies:", error);
      }
    };
    fetchSocieties();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (societyInputRef.current && !societyInputRef.current.contains(event.target as Node)) {
        setShowSocietyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSocietySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, society: value }));
    
    if (value.trim() === "") {
      setFilteredSocieties([]);
      setShowSocietyDropdown(false);
      return;
    }

    const filtered = societies.filter(s => 
      s.name.toLowerCase().includes(value.toLowerCase()) ||
      s.area.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSocieties(filtered);
    setShowSocietyDropdown(true);
  };

  const selectSociety = (society: Society) => {
    setFormData(prev => ({ 
      ...prev, 
      society: society.name,
      city: society.city,
      locality: society.area
    }));
    setShowSocietyDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file as Blob));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]); // Free memory
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const isStepValid = () => {
    if (step === 1) return !!(formData.title && formData.bhk && formData.furnishing);
    if (step === 2) return !!(formData.city && formData.locality && formData.address);
    if (step === 3) return !!formData.society;
    if (step === 4) return !!(formData.rent && formData.deposit);
    if (step === 5) return !!(formData.tenantPreference && formData.availableFrom);
    return true;
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.bhk || !formData.furnishing) {
        alert("Please fill all mandatory fields (Title, BHK, Furnishing).");
        return;
      }
    } else if (step === 2) {
      if (!formData.city || !formData.locality || !formData.address) {
        alert("Please fill all mandatory fields (City, Locality, Address).");
        return;
      }
    } else if (step === 3) {
      if (!formData.society) {
        alert("Please select or enter a Society Name.");
        return;
      }
    } else if (step === 4) {
      if (!formData.rent || !formData.deposit) {
        alert("Please fill all mandatory fields (Rent, Deposit).");
        return;
      }
    } else if (step === 5) {
      if (!formData.tenantPreference || !formData.availableFrom) {
        alert("Please fill all mandatory fields (Tenant Preference, Available From).");
        return;
      }
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in to post a property.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Compress images and get base64 strings
      const uploadPromises = selectedFiles.map(async (file) => {
        try {
          if (file.type.startsWith('image/')) {
            return await compressImage(file);
          } else {
            // If it's not an image (shouldn't happen based on accept="image/*"), we can't compress it
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
            });
          }
        } catch (err) {
          console.warn("Image compression failed", err);
          throw err;
        }
      });
      
      let uploadedImageUrls: string[] = [];
      try {
        uploadedImageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("Image processing failed:", uploadError);
        alert("Image processing failed. Submitting property without images.");
        uploadedImageUrls = [];
      }

      const propertyData = {
        title: formData.title,
        bhk: formData.bhk,
        furnishing: formData.furnishing,
        location: `${formData.locality}, ${formData.city}`,
        address: formData.address,
        society: formData.society,
        rent: Number(formData.rent),
        deposit: Number(formData.deposit),
        maintenance: Number(formData.maintenance) || 0,
        maintenanceType: formData.maintenanceType,
        tenantPreference: formData.tenantPreference,
        availableFrom: formData.availableFrom,
        description: formData.description || `A beautiful ${formData.bhk} property located in ${formData.locality}, ${formData.city}.`,
        images: uploadedImageUrls,
        status: "pending", // Requires admin approval
        ownerId: user.uid,
        ownerName: profile?.name || user.displayName || "Owner",
        ownerPhone: profile?.phone || user.phoneNumber || "",
        ownerPhotoUrl: profile?.photoUrl || "",
        ownerUserType: profile?.userType || "Property Owner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const addDocPromise = addDoc(collection(db, "properties"), propertyData);
      const dbTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database timeout: Could not save property. Please check your connection.")), 10000);
      });

      await Promise.race([addDocPromise, dbTimeoutPromise]);
      alert("Property submitted successfully! It will be visible after admin approval.");
      navigate("/dashboard/listings");
    } catch (error) {
      console.error("Error adding property: ", error);
      alert("Failed to submit property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SEO title="Add New Property" description="List a new flat on FlatsOnly." noindex={true} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Post Property</h1>
        <span className="text-blue-100 font-medium">Step {step} of {totalSteps}</span>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div 
          className="bg-emerald-400 h-full transition-all duration-300 ease-in-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <Card className="shadow-xl border-none">
        <CardContent className="p-8">
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
            <span className="text-red-500 font-bold">*</span> fields are required!
          </p>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Details</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Property Title *</label>
                <Input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Beautiful 2 BHK in HSR Layout" 
                  className="h-12" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">BHK Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['1 BHK', '2 BHK', '3 BHK', '4+ BHK'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => handleSelectChange('bhk', type)}
                      className={`h-12 rounded-xl border transition-colors text-sm font-medium ${
                        formData.bhk === type 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Furnishing *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map(type => (
                    <button 
                      key={type} 
                      onClick={() => handleSelectChange('furnishing', type)}
                      className={`h-12 rounded-xl border transition-colors text-sm font-medium ${
                        formData.furnishing === type 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Location Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">City *</label>
                  <Input 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Bangalore" 
                    className="h-12" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Locality / Area *</label>
                  <Input 
                    name="locality"
                    value={formData.locality}
                    onChange={handleInputChange}
                    placeholder="e.g. HSR Layout" 
                    className="h-12" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Full Address *</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Society Details</h2>
              
              <div className="relative" ref={societyInputRef}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Society Name *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    name="society"
                    value={formData.society}
                    onChange={handleSocietySearch}
                    onFocus={() => {
                      if (formData.society.trim() !== "") {
                        setShowSocietyDropdown(true);
                      }
                    }}
                    placeholder="Search society or enter new" 
                    className="h-12 pl-10" 
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Start typing to search existing societies. Selecting one will auto-fill city and area.</p>

                {/* Autocomplete Dropdown */}
                {showSocietyDropdown && filteredSocieties.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredSocieties.map((society) => (
                      <div 
                        key={society.id}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                        onClick={() => selectSociety(society)}
                      >
                        <div className="font-medium text-gray-900">{society.name}</div>
                        <div className="text-xs text-gray-500">{society.area}, {society.city}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Monthly Rent (₹) *</label>
                  <Input 
                    type="number" 
                    name="rent"
                    value={formData.rent}
                    onChange={handleInputChange}
                    placeholder="e.g. 25000" 
                    className="h-12" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Security Deposit (₹) *</label>
                  <Input 
                    type="number" 
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    placeholder="e.g. 100000" 
                    className="h-12" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Maintenance (₹)</label>
                <div className="flex gap-4">
                  <Input 
                    type="number" 
                    name="maintenance"
                    value={formData.maintenance}
                    onChange={handleInputChange}
                    placeholder="e.g. 2000" 
                    className="h-12 flex-1" 
                  />
                  <select 
                    name="maintenanceType"
                    value={formData.maintenanceType}
                    onChange={handleInputChange}
                    className="h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Per Month">Per Month</option>
                    <option value="Included in Rent">Included in Rent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences & Availability</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tenant Preference *</label>
                  <select 
                    name="tenantPreference"
                    value={formData.tenantPreference}
                    onChange={handleInputChange}
                    className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select preference</option>
                    <option value="Any">Any</option>
                    <option value="Family">Family</option>
                    <option value="Students">Students</option>
                    <option value="Boys/Men only">Boys/Men only</option>
                    <option value="Girls/Women only">Girls/Women only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Available *</label>
                  <select 
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleInputChange}
                    className="w-full h-12 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select availability</option>
                    <option value="Immediately">Immediately</option>
                    <option value="Soon">Soon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Property Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                  placeholder="Describe your property..."
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Photos</h2>
              
              <div 
                className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Click to upload or drag & drop</h3>
                <p className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              {previewUrls.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Images ({previewUrls.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={step === 1 || isSubmitting}
              className="h-12 px-6"
            >
              Back
            </Button>
            
            {step < totalSteps ? (
              <Button 
                onClick={nextStep} 
                disabled={!isStepValid()}
                className={`h-12 px-8 shadow-md transition-opacity duration-300 ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                variant="accent" 
                className="h-12 px-8 shadow-md" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Submit Property</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
