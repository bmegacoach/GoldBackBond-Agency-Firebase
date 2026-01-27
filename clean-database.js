/**
 * Run this script to delete all data from Firestore collections
 * Usage: node clean-database.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = ['leads', 'customers', 'payments', 'tickets', 'packages', 'workflows', 'content'];

async function deleteCollection(collectionName) {
  console.log(`Deleting all documents from ${collectionName}...`);
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);

    let deleteCount = 0;
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      deleteCount++;
    }

    console.log(`✓ Deleted ${deleteCount} documents from ${collectionName}`);
    return deleteCount;
  } catch (error) {
    console.error(`✗ Error deleting ${collectionName}:`, error.message);
    return 0;
  }
}

async function cleanDatabase() {
  console.log('Starting database cleanup...\n');

  let totalDeleted = 0;
  for (const collectionName of collections) {
    const count = await deleteCollection(collectionName);
    totalDeleted += count;
  }

  console.log(`\n✓ Database cleanup complete! Deleted ${totalDeleted} total documents.`);
  process.exit(0);
}

cleanDatabase().catch((error) => {
  console.error('Database cleanup failed:', error);
  process.exit(1);
});
