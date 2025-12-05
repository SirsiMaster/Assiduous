import { useEffect, useState } from 'react';
import { auth, db, doc, onSnapshot, User } from '../lib/firebase';

export interface AssiduousEntitlements {
  planId: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  hasActiveSubscription: boolean;
}

export interface UseEntitlementsState {
  user: User | null;
  loading: boolean;
  entitlements: AssiduousEntitlements | null;
  role: string | null;
}

const DEFAULT_ENTITLEMENTS: AssiduousEntitlements = {
  planId: null,
  status: null,
  currentPeriodEnd: null,
  hasActiveSubscription: false,
};

/**
 * useEntitlements subscribes to the current Firebase user and their Firestore
 * user document, returning subscription status for Assiduous Realty.
 */
export function useEntitlements(): UseEntitlementsState {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [entitlements, setEntitlements] = useState<AssiduousEntitlements | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Watch auth state first.
    const unsubscribeAuth = auth.onAuthStateChanged(async nextUser => {
      setUser(nextUser);
      setEntitlements(null);
      setRole(null);
      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await nextUser.getIdTokenResult();
        const claimRole = (tokenResult.claims?.role as string | undefined) || null;
        setRole(claimRole);
      } catch (err) {
        console.error('[useEntitlements] failed to load custom claims', err);
        setRole(null);
      }

      // Once we have a user, subscribe to their Firestore profile.
      const userRef = doc(db, 'users', nextUser.uid);
      const unsubscribeDoc = onSnapshot(
        userRef,
        snap => {
          if (!snap.exists()) {
            setEntitlements(DEFAULT_ENTITLEMENTS);
            setLoading(false);
            return;
          }

          const data = snap.data() as any;
          const sub = data.subscriptions?.assiduousRealty || {};

          const status = (sub.status as string | undefined) || null;
          const planId = (sub.planId as string | undefined) || null;

          let currentPeriodEnd: Date | null = null;
          const rawEnd = sub.currentPeriodEnd;
          if (rawEnd && typeof rawEnd.toDate === 'function') {
            currentPeriodEnd = rawEnd.toDate();
          } else if (typeof rawEnd === 'number') {
            currentPeriodEnd = new Date(rawEnd * 1000);
          }

          const hasActiveSubscription = status === 'active' || status === 'trialing';

          setEntitlements({ planId, status, currentPeriodEnd, hasActiveSubscription });
          setLoading(false);
        },
        error => {
          console.error('[useEntitlements] snapshot error', error);
          setEntitlements(DEFAULT_ENTITLEMENTS);
          setLoading(false);
        },
      );

      return unsubscribeDoc;
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, entitlements, loading, role };
}
