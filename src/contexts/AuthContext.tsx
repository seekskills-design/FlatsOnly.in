import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email?: string;
  name: string;
  role: 'tenant' | 'owner' | 'admin';
  phone?: string;
  photoUrl?: string;
  userType?: 'Property Owner' | 'Property Agent';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string, role?: 'tenant' | 'owner') => Promise<void>;
  signInWithGoogle: (role?: 'tenant' | 'owner' | 'admin') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Listen to user profile changes
          unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), async (userDoc) => {
            if (userDoc.exists()) {
              setProfile(userDoc.data() as UserProfile);
            } else {
              // Default to tenant if not created via explicit sign-in flow
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                phone: currentUser.phoneNumber || '',
                name: 'Anonymous User',
                role: 'tenant',
                createdAt: new Date().toISOString(),
              };
              await setDoc(doc(db, 'users', currentUser.uid), newProfile);
              setProfile(newProfile);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error listening to user profile:", error);
            setProfile(null);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error setting up profile listener:", error);
          setProfile(null);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP", error);
      throw error;
    }
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string, role: 'tenant' | 'owner' = 'tenant') => {
    try {
      const result = await confirmationResult.confirm(otp);
      const currentUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          phone: currentUser.phoneNumber || '',
          name: 'Anonymous User',
          role: role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', currentUser.uid), newProfile);
        setProfile(newProfile);
      } else {
        const existingProfile = userDoc.data() as UserProfile;
        if (existingProfile.role !== role && existingProfile.role !== 'admin') {
          await signOut(auth);
          throw new Error("You are already registered with this phone number.");
        }
        setProfile(existingProfile);
      }
    } catch (error) {
      console.error("Error verifying OTP", error);
      throw error;
    }
  };

  const signInWithGoogle = async (role: 'tenant' | 'owner' | 'admin' = 'tenant') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      
      if (role === 'admin' && currentUser.email !== 'thehotskills@gmail.com') {
        await signOut(auth);
        throw new Error("Access denied. Only authorized administrators can log in here.");
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || 'Anonymous User',
            role: role,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setProfile(newProfile);
        } else {
          const existingProfile = userDoc.data() as UserProfile;
          if (role === 'admin' && existingProfile.role !== 'admin') {
            // If they are trying to log in as admin but aren't one, try to upgrade them (will fail if not authorized)
            await setDoc(doc(db, 'users', currentUser.uid), { role: 'admin' }, { merge: true });
            setProfile({ ...existingProfile, role: 'admin' });
          } else if (existingProfile.role !== role && existingProfile.role !== 'admin') {
            await signOut(auth);
            throw new Error("You are already registered with this account.");
          } else {
            setProfile(existingProfile);
          }
        }
      } catch (dbError: any) {
        // If database operation fails (e.g. permission denied), sign them out
        await signOut(auth);
        if (dbError.message && dbError.message.includes('already registered')) {
          throw dbError;
        }
        throw new Error("Access denied. You do not have permission to log in with this role.");
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithPhone, verifyOtp, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
