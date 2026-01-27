#!/usr/bin/env node

/**
 * Firebase Database Cleanup Script
 * 
 * This script cleans up dummy data from Firebase Firestore.
 * USE WITH EXTREME CAUTION - DATA DELETION IS PERMANENT
 * 
 * Usage: node cleanup-database.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

// Configuration
const SERVICE_ACCOUNT_PATH = './firebase-service-account.json';
const BATCH_SIZE = 500; // Firestore limit for batched writes

// Collections to clean
const COLLECTIONS_TO_CLEAN = [
  'leads',
  'customers', 
  'payments',
  'tickets',
  'workflows',
  'content',
  'campaigns',
  'auditLogs',
  'userPreferences'
];

// Initialize Firebase Admin
let db;

try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
  console.log('✅ Connected to Firebase');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  console.log('\nMake sure firebase-service-account.json exists and is valid');
  process.exit(1);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Count documents in collection
async function countDocuments(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.size;
  } catch (error) {
    console.error(`Error counting ${collectionName}:`, error.message);
    return 0;
  }
}

// Delete all documents in a collection
async function deleteAllDocuments(collectionName) {
  try {
    console.log(`\n🗑️  Deleting all documents from ${collectionName}...`);
    
    let totalDeleted = 0;
    let snapshot = await db.collection(collectionName).limit(BATCH_SIZE).get();
    
    while (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      totalDeleted += snapshot.docs.length;
      console.log(`  Deleted ${snapshot.docs.length} documents (total: ${totalDeleted})`);
      
      // Get next batch
      snapshot = await db.collection(collectionName).limit(BATCH_SIZE).get();
    }
    
    console.log(`✅ Deleted ${totalDeleted} documents from ${collectionName}`);
    return totalDeleted;
  } catch (error) {
    console.error(`❌ Error deleting from ${collectionName}:`, error.message);
    return 0;
  }
}

// Delete dummy data (documents with specific markers)
async function deleteDummyDocuments(collectionName) {
  try {
    console.log(`\n🗑️  Deleting dummy documents from ${collectionName}...`);
    
    let totalDeleted = 0;
    
    // Common dummy data patterns
    const dummyPatterns = [
      { field: 'email', operator: '==', value: 'test@example.com' },
      { field: 'email', operator: '==', value: 'demo@goldbandagency.com' },
      { field: 'firstName', operator: '==', value: 'Test' },
      { field: 'company', operator: '==', value: 'Test Company' },
      { field: 'isDummy', operator: '==', value: true },
      { field: 'isTest', operator: '==', value: true },
    ];
    
    for (const pattern of dummyPatterns) {
      let snapshot = await db.collection(collectionName)
        .where(pattern.field, pattern.operator, pattern.value)
        .limit(BATCH_SIZE)
        .get();
      
      while (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        totalDeleted += snapshot.docs.length;
        console.log(`  Deleted ${snapshot.docs.length} dummy documents (total: ${totalDeleted})`);
        
        snapshot = await db.collection(collectionName)
          .where(pattern.field, pattern.operator, pattern.value)
          .limit(BATCH_SIZE)
          .get();
      }
    }
    
    console.log(`✅ Deleted ${totalDeleted} dummy documents from ${collectionName}`);
    return totalDeleted;
  } catch (error) {
    console.error(`❌ Error deleting dummy data from ${collectionName}:`, error.message);
    return 0;
  }
}

// List all collections and their document counts
async function listCollections() {
  console.log('\n📊 Current Database State:');
  console.log('==========================');
  
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    const count = await countDocuments(collectionName);
    console.log(`${collectionName}: ${count} documents`);
  }
}

// Main cleanup function
async function runCleanup() {
  console.log('\n🔥 Firebase Database Cleanup Tool');
  console.log('====================================');
  console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE data!');
  console.log('\nSafety checks:');
  console.log('- Service account: ' + SERVICE_ACCOUNT_PATH);
  console.log('- Project ID: ' + (process.env.FIREBASE_PROJECT_ID || 'from service account'));
  
  // Confirm environment
  const env = await askQuestion('\nAre you running in (d)evelopment, (s)taging, or (p)roduction? ');
  if (env.toLowerCase() === 'p') {
    const confirmProd = await askQuestion('⚠️  You are about to clean PRODUCTION data! Type "YES" to confirm: ');
    if (confirmProd !== 'YES') {
      console.log('❌ Production cleanup cancelled');
      rl.close();
      return;
    }
  }
  
  // Show current state
  await listCollections();
  
  // Choose cleanup mode
  console.log('\n🎯 Cleanup Modes:');
  console.log('1. Delete ALL documents from collections');
  console.log('2. Delete only DUMMY/TEST documents');
  console.log('3. Reset entire database (delete all collections)');
  console.log('4. Cancel');
  
  const mode = await askQuestion('\nSelect mode (1-4): ');
  
  switch (mode) {
    case '1':
      await cleanupAllDocuments();
      break;
    case '2':
      await cleanupDummyDocuments();
      break;
    case '3':
      await resetDatabase();
      break;
    case '4':
      console.log('✅ Cleanup cancelled');
      break;
    default:
      console.log('❌ Invalid option');
  }
  
  // Show final state
  console.log('\n📊 Final Database State:');
  console.log('==========================');
  await listCollections();
  
  rl.close();
  console.log('\n✅ Cleanup complete!');
}

// Cleanup all documents
async function cleanupAllDocuments() {
  const confirm = await askQuestion('\n⚠️  Are you sure you want to delete ALL documents? Type "DELETE ALL" to confirm: ');
  if (confirm !== 'DELETE ALL') {
    console.log('❌ Operation cancelled');
    return;
  }
  
  let totalDeleted = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    const count = await countDocuments(collectionName);
    if (count > 0) {
      const deleted = await deleteAllDocuments(collectionName);
      totalDeleted += deleted;
    }
  }
  
  console.log(`\n🗑️  Total documents deleted: ${totalDeleted}`);
}

// Cleanup dummy documents only
async function cleanupDummyDocuments() {
  const confirm = await askQuestion('\n🧹 Clean up dummy/test data? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled');
    return;
  }
  
  let totalDeleted = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    const deleted = await deleteDummyDocuments(collectionName);
    totalDeleted += deleted;
  }
  
  console.log(`\n🗑️  Total dummy documents deleted: ${totalDeleted}`);
}

// Reset entire database
async function resetDatabase() {
  const confirm = await askQuestion('\n🚨 Are you sure you want to RESET THE ENTIRE DATABASE? Type "RESET EVERYTHING" to confirm: ');
  if (confirm !== 'RESET EVERYTHING') {
    console.log('❌ Reset cancelled');
    return;
  }
  
  console.log('\n🚨 This will delete ALL collections and documents!');
  const confirm2 = await askQuestion('Type "I UNDERSTAND" to confirm: ');
  if (confirm2 !== 'I UNDERSTAND') {
    console.log('❌ Reset cancelled');
    return;
  }
  
  let totalDeleted = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    const count = await countDocuments(collectionName);
    if (count > 0) {
      const deleted = await deleteAllDocuments(collectionName);
      totalDeleted += deleted;
    }
  }
  
  console.log(`\n💥 Database reset complete! ${totalDeleted} documents deleted.`);
}

// Run the cleanup
runCleanup().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});