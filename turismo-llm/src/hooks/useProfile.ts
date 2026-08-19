import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface UserProfile {
  name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setProfile(null);
      return;
    }

    // Fallback inicial com dados do Auth nativo
    const fallbackProfile: UserProfile = {
      name: user.displayName || 'Usuário',
      email: user.email || '',
      avatar_url: user.photoURL || undefined,
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || data.full_name || user.displayName || 'Usuário',
          email: data.email || user.email || '',
          avatar_url: data.avatar_url || user.photoURL || undefined,
          role: data.role || ''
        });
      } else {
        setProfile(fallbackProfile);
      }
    } catch (error) {
      console.warn("Firestore indisponível ou offline. Usando dados do Auth:", error);
      // Em caso de erro (offline/permissão), usa os dados do próprio Firebase Auth sem travar o app
      setProfile(fallbackProfile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      refreshProfile().finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [refreshProfile]);

  return { profile, loading, refreshProfile };
}