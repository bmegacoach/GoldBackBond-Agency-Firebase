import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isPaid: boolean;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          try {
            // 1. Check custom claims
            const token = await currentUser.getIdTokenResult(true);
            const hasPaidClaim =
              token.claims?.stripeRole === 'paid' ||
              token.claims?.subscriptionStatus === 'active' ||
              token.claims?.role === 'paid';

            if (hasPaidClaim) {
              setIsPaid(true);
            } else {
              // 2. Fallback: Check Firestore
              const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
              const userData = userDoc.data();
              setIsPaid(userData?.subscription_active === true || userData?.role === 'admin');
            }
          } catch (err) {
            console.error('Error checking paid status in context:', err);
            setIsPaid(false);
          }
        } else {
          setIsPaid(false);
        }

        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPaid, loading, error }}>
      {children}
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
