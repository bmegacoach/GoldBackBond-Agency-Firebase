import { useState, useCallback, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    getDoc,
    writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';

interface UseDataStoreOptions {
    collectionName: string;
}

// Cache to store fetched data
const dataCache = new Map<string, any[]>();

// Helper to check if user is paid - now properly async
const isPaidUser = async (): Promise<boolean> => {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        const token = await user.getIdTokenResult();
        return token.claims?.stripeRole === 'paid' ||
               token.claims?.subscriptionStatus === 'active' ||
               token.claims?.role === 'paid';
    } catch (error) {
        console.error('Error checking paid status:', error);
        return false;
    }
};

// Helper to migrate data from localStorage to Firebase
const migrateLocalToFirebase = async <_T extends { id?: string }>(
    collectionName: string
): Promise<number> => {
    const key = `crm_data_${collectionName}`;
    const stored = localStorage.getItem(key);
    if (!stored) return 0;

    try {
        const items = JSON.parse(stored);
        if (!Array.isArray(items) || items.length === 0) return 0;

        const batch = writeBatch(db);
        let migratedCount = 0;

        for (const item of items) {
            if (item.id && item.id.startsWith('local_')) {
                const { id, ...data } = item;
                const docRef = doc(collection(db, collectionName));
                batch.set(docRef, {
                    ...data,
                    migratedFromLocal: true,
                    migratedAt: new Date(),
                    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                    updatedAt: new Date(),
                });
                migratedCount++;
            }
        }

        if (migratedCount > 0) {
            await batch.commit();
            // Clear localStorage after successful migration
            localStorage.removeItem(key);
            console.log(`Migrated ${migratedCount} items from localStorage to Firebase`);
        }

        return migratedCount;
    } catch (error) {
        console.error('Migration error:', error);
        return 0;
    }
};

export function useDataStore<T extends { id?: string, createdAt?: any, updatedAt?: any }>(
    options: UseDataStoreOptions
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T[]>([]);
    const cacheKey = `crm_data_${options.collectionName}`;
    
    // Cache management
    const updateCache = (newData: T[]) => {
        dataCache.set(cacheKey, newData);
        setData(newData);
    };

    // --- Local Storage Adapter ---
    const getLocalStorageKey = () => `crm_data_${options.collectionName}`;
    const DEMO_MODE_LIMIT = parseInt(import.meta.env.VITE_DEMO_MODE_LIMIT || '50');

    const checkDemoLimits = (items: any[]) => {
        if (items.length >= DEMO_MODE_LIMIT) {
            throw new Error(`Demo mode limit reached (${DEMO_MODE_LIMIT} records). Upgrade to add more.`);
        }
    };

    const localCreate = async (data: Omit<T, 'id'>) => {
        const key = getLocalStorageKey();
        const stored = localStorage.getItem(key);
        const items = stored ? JSON.parse(stored) : [];
        
        // Check demo mode limits
        checkDemoLimits(items);

        const newItem = {
            ...data,
            id: 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _demoMode: true, // Mark as demo mode data
        };

        items.push(newItem);
        localStorage.setItem(key, JSON.stringify(items));
        return newItem as unknown as T;
    };

    const localUpdate = async (id: string, data: Partial<T>) => {
        const key = getLocalStorageKey();
        const stored = localStorage.getItem(key);
        const items = stored ? JSON.parse(stored) : [];

        const index = items.findIndex((item: any) => item.id === id);
        if (index === -1) throw new Error('Item not found');

        const updatedItem = {
            ...items[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        items[index] = updatedItem;
        localStorage.setItem(key, JSON.stringify(items));
        return updatedItem as unknown as T;
    };

    const localRemove = async (id: string) => {
        const key = getLocalStorageKey();
        const stored = localStorage.getItem(key);
        if (!stored) return;

        const items = JSON.parse(stored);
        const filtered = items.filter((item: any) => item.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
    };

    const localFetchAll = async () => {
        const key = getLocalStorageKey();
        const stored = localStorage.getItem(key);
        if (!stored) return [];
        return JSON.parse(stored) as T[];
    };

    // --- Firebase Adapter with improvements ---
    const firebaseCreate = async (data: Omit<T, 'id'>) => {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                const err = new Error('Firestore write operation timed out after 15 seconds.');
                (err as any).code = 'TIMEOUT';
                reject(err);
            }, 15000);
        });

        const docRef = await Promise.race([
            addDoc(collection(db, options.collectionName), {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
            timeoutPromise
        ]);

        return { id: docRef.id, ...data } as unknown as T;
    };

    const firebaseUpdate = async (id: string, data: Partial<T>) => {
        await updateDoc(doc(db, options.collectionName, id), {
            ...data,
            updatedAt: new Date(),
        });
        return { id, ...data } as unknown as T;
    };

    const firebaseRemove = async (id: string) => {
        await deleteDoc(doc(db, options.collectionName, id));
    };

    const firebaseFetchAll = async () => {
        const querySnapshot = await getDocs(collection(db, options.collectionName));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        } as T));
    };

    const firebaseFetchById = async (id: string) => {
        const docSnap = await getDoc(doc(db, options.collectionName, id));
        if (!docSnap.exists()) throw new Error('Item not found');
        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data()?.createdAt?.toDate?.() || docSnap.data()?.createdAt,
            updatedAt: docSnap.data()?.updatedAt?.toDate?.() || docSnap.data()?.updatedAt,
        } as unknown as T;
    };

    // --- Optimistic Updates and State Management ---
    
    const create = useCallback(async (data: Omit<T, 'id'>) => {
        setLoading(true);
        setError(null);
        try {
            const paid = await isPaidUser();
            
            if (paid) {
                // Check for local data to migrate
                await migrateLocalToFirebase<T>(options.collectionName);
                const result = await firebaseCreate(data);
                await refreshData(); // Refresh to get consistent state
                return result;
            } else {
                const result = await localCreate(data);
                await refreshData(); // Refresh local data
                return result;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create record';
            console.error(message, err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [options.collectionName]);

    const update = useCallback(async (id: string, data: Partial<T>) => {
        setLoading(true);
        setError(null);
        
        // Get current data for rollback and optimistic update
        const currentData = dataCache.get(cacheKey) || [];
        const itemIndex = currentData.findIndex(item => item.id === id);
        const previousItem = itemIndex >= 0 ? { ...currentData[itemIndex] } : null;
        
        // Optimistic update
        if (itemIndex >= 0) {
            const optimisticData = [...currentData];
            optimisticData[itemIndex] = {
                ...optimisticData[itemIndex],
                ...data,
                updatedAt: new Date(),
            };
            updateCache(optimisticData);
        }
        
        try {
            const paid = await isPaidUser();
            const isLocalId = id.startsWith('local_');

            if (isLocalId || !paid) {
                const result = await localUpdate(id, data);
                await refreshData();
                return result;
            } else {
                const result = await firebaseUpdate(id, data);
                await refreshData();
                return result;
            }
        } catch (err) {
            // Rollback on error
            if (previousItem && itemIndex >= 0) {
                const rollbackData = [...(dataCache.get(cacheKey) || [])];
                rollbackData[itemIndex] = previousItem;
                updateCache(rollbackData);
            }
            
            const message = err instanceof Error ? err.message : 'Failed to update record';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [options.collectionName, cacheKey]);

    const remove = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        
        // Store for potential rollback
        const currentData = dataCache.get(cacheKey) || [];
        const itemIndex = currentData.findIndex(item => item.id === id);
        const removedItem = itemIndex >= 0 ? currentData[itemIndex] : null;
        
        // Optimistic removal
        if (itemIndex >= 0) {
            const optimisticData = currentData.filter(item => item.id !== id);
            updateCache(optimisticData);
        }
        
        try {
            const paid = await isPaidUser();
            
            if (id.startsWith('local_') || !paid) {
                await localRemove(id);
            } else {
                await firebaseRemove(id);
            }
            
            // No need to refresh, optimistic update already applied
        } catch (err) {
            // Rollback on error
            if (removedItem) {
                updateCache([...(dataCache.get(cacheKey) || []), removedItem]);
            }
            
            const message = err instanceof Error ? err.message : 'Failed to delete record';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [options.collectionName, cacheKey]);

    const refreshData = useCallback(async () => {
        try {
            const paid = await isPaidUser();
            let result: T[] = [];
            
            if (paid) {
                // Migrate any local data first
                await migrateLocalToFirebase<T>(options.collectionName);
                result = await firebaseFetchAll();
            } else {
                result = await localFetchAll();
            }
            
            updateCache(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch records';
            setError(message);
            return [];
        }
    }, [options.collectionName, cacheKey]);

    const fetchAll = useCallback(async () => {
        // Return cached data if available
        const cached = dataCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const result = await refreshData();
            return result;
        } finally {
            setLoading(false);
        }
    }, [cacheKey, refreshData]);

    const fetchById = useCallback(async (id: string) => {
        const paid = await isPaidUser();
        
        if (id.startsWith('local_') || !paid) {
            const all = await localFetchAll();
            return all.find(item => item.id === id) || null;
        } else {
            return await firebaseFetchById(id);
        }
    }, [options.collectionName]);

    // Simplified fetch query
    const fetch = useCallback(async (fieldName: string, fieldValue: string) => {
        setLoading(true);
        setError(null);
        try {
            const paid = await isPaidUser();
            
            if (paid) {
                const q = query(collection(db, options.collectionName), where(fieldName, '==', fieldValue));
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
                    updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
                } as T));
            } else {
                const all = await localFetchAll();
                return all.filter(item => (item as any)[fieldName] === fieldValue);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch records';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [options.collectionName]);

    // Auto-refresh data when user auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(() => {
            refreshData();
        });
        
        return unsubscribe;
    }, [refreshData]);

    return {
        create,
        update,
        remove,
        fetchAll,
        fetch,
        fetchById,
        refreshData,
        loading,
        error,
        data,
        isPaid: isPaidUser,
    };
}
