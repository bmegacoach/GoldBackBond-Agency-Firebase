#!/usr/bin/env node

/**
 * Create Firestore Database Script
 * 
 * This script creates a Firestore database using the Admin SDK
 * Run: node create-firestore-db.js
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Check if service account file exists
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ ERROR: firebase-service-account.json not found!');
  console.error('');
  console.error('To get the service account key:');
  console.error('1. Go to: https://console.firebase.google.com/');
  console.error('2. Select project: goldbackbond-agency');
  console.error('3. Click: ⚙️ Project Settings');
  console.error('4. Go to: Service Accounts tab');
  console.error('5. Click: "Generate New Private Key"');
  console.error('6. Save as: firebase-service-account.json in root folder');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'goldbackbond-agency',
  });

  const db = admin.firestore();

  console.log('🔥 Creating Firestore database...');
  console.log('');

  // Create database using Firebase REST API
  const projectId = 'goldbackbond-agency';
  const accessToken = await admin.app().options.credential.getAccessToken();
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
  const databaseId = '(default)';
  
  const data = {
    type: 'FIRESTORE_NATIVE',
    locationId: 'us-central1'
  };

  try {
    const response = await fetch(`${url}?databaseId=${databaseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        console.log('✅ Firestore database already exists!');
      } else if (response.status === 403) {
        throw new Error('Permission denied: You need Owner or Admin role to create a database. Contact your Firebase project owner.');
      } else {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }
    } else {
      console.log('✅ Firestore database created successfully!');
    }

    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy security rules:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('');
    console.log('2. Create admin account:');
    console.log('   node setup-admin.js');
    console.log('');
    console.log('3. Start the app:');
    console.log('   npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Solution:');
    console.error('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.error('2. Select: Goldbackbond Agency');
    console.error('3. Click: Firestore Database');
    console.error('4. Click: Create database');
    console.error('5. Location: us-central1');
    console.error('6. Mode: Start in test mode');
    console.error('7. Click: Create');
    console.error('');
    console.error('This must be done by someone with Owner or Admin role.');
    
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  
  if (error.message.includes('Unexpected token')) {
    console.error('');
    console.error('Invalid JSON in firebase-service-account.json');
    console.error('Make sure the file is valid JSON');
  }
  
  process.exit(1);
}
