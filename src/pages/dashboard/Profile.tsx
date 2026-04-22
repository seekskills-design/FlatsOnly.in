import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser, signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Loader2, User, Phone, Save, Camera, Building } from "lucide-react";
import SEO from "@/components/SEO";

// Utility function to compress image before upload
const compressImage = async (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<string> => {
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

export default function Profile() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<'Property Owner' | 'Property Agent' | ''>("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setUserType(profile.userType || (profile.role === 'owner' ? 'Property Owner' : ''));
      setPhotoUrl(profile.photoUrl || "");
    }
  }, [profile]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedBase64 = await compressImage(file);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim(),
        userType: userType,
        photoUrl: photoUrl,
      });
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: error.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || profile?.role !== 'tenant') return;
    
    setIsDeleting(true);
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, "users", user.uid));
      
      // Try to delete auth user (might fail if requires recent login)
      try {
        await deleteUser(user);
      } catch (authError) {
        console.warn("Could not delete auth user, signing out instead:", authError);
        await signOut(auth);
      }
      
      // Will redirect to home via AuthContext state change
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      setMessage({ type: "error", text: "Failed to delete profile. Please try again." });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SEO title="Profile Settings" description="Manage your user profile on FlatsOnly." noindex={true} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile Settings</h1>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your photo, name, and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {message.text && (
              <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="text-center sm:text-left pt-2">
                <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a professional photo. JPG, PNG or GIF (max. 2MB).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Note: This phone number will be visible to users who inquire about your properties.
              </p>
            </div>

            {profile?.role === 'owner' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">I am a...</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType('Property Owner')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                      userType === 'Property Owner'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Property Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('Property Agent')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                      userType === 'Property Agent'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span className="text-sm font-medium">Property Agent</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-gray-100">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>

              {profile?.role === 'tenant' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  {isDeleting ? "Deleting..." : "Delete Tenant Profile"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Profile?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your tenant profile? This action cannot be undone. You will need to register again if you want to use the platform.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Profile"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
