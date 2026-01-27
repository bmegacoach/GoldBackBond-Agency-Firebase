import { useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface UseFirebaseFormOptions {
  collectionName: string;
}

export function useFirebaseForm<T extends { id?: string }>(
  options: UseFirebaseFormOptions
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: Omit<T, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useFirebaseForm] Creating document in collection:', options.collectionName);
      console.log('[useFirebaseForm] Data to create:', data);
      
      // Create a timeout promise that rejects after 15 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const err = new Error('Firestore write operation timed out after 15 seconds. Check your security rules in Firebase Console.');
          (err as any).code = 'TIMEOUT';
          reject(err);
        }, 15000);
      });

      // Race between the actual write and the timeout
      const docRef = await Promise.race([
        addDoc(collection(db, options.collectionName), {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        timeoutPromise
      ]);
      
      console.log('[useFirebaseForm] Document created successfully with ID:', docRef.id);
      return { id: docRef.id, ...data } as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create record';
      console.error('[useFirebaseForm] Creation failed:', {
        message,
        error: err,
        code: (err as any)?.code,
        errorMessage: (err as any)?.message,
      });
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      await updateDoc(doc(db, options.collectionName, id), {
        ...data,
        updatedAt: new Date(),
      });
      return { id, ...data } as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update record';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDoc(doc(db, options.collectionName, id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete record';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const querySnapshot = await getDocs(collection(db, options.collectionName));
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch records';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetch = async (fieldName: string, fieldValue: string) => {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, options.collectionName), where(fieldName, '==', fieldValue));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch records';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    update,
    remove,
    fetchAll,
    fetch,
    loading,
    error,
  };
}
