#!/usr/bin/env node

/**
 * Admin Account Setup Script
 * 
 * This script creates an admin account in Firebase for preview/demo purposes.
 * Run this once to set up the default admin account.
 * 
 * Usage: node setup-admin.js
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'goldbackbond-agency',
});

const auth = admin.auth();
const db = admin.firestore();

const ADMIN_ACCOUNT = {
  email: 'admin@goldbandagency.com',
  password: 'Demo@123456',
  displayName: 'Admin User',
};

async function setupAdminAccount() {
  try {
    console.log('🔐 Setting up admin account...');
    console.log(`📧 Email: ${ADMIN_ACCOUNT.email}`);

    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(ADMIN_ACCOUNT.email);
      console.log('✓ Admin account already exists');
      console.log(`  UID: ${existingUser.uid}`);
      return;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      // User doesn't exist, proceed with creation
    }

    // Create the admin user
    const userRecord = await auth.createUser({
      email: ADMIN_ACCOUNT.email,
      password: ADMIN_ACCOUNT.password,
      displayName: ADMIN_ACCOUNT.displayName,
      emailVerified: true,
    });

    console.log('✓ Admin user created successfully');
    console.log(`  UID: ${userRecord.uid}`);

    // Set custom claims for admin role
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
    });

    console.log('✓ Admin claims set');

    // Try to create user document in Firestore, but don't fail if it doesn't work
    try {
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: ADMIN_ACCOUNT.email,
        displayName: ADMIN_ACCOUNT.displayName,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        permissions: ['all'],
      });
      console.log('✓ User document created in Firestore');
    } catch (firestoreError) {
      console.log('⚠ Note: Could not create user document in Firestore (this is OK, will be created on first login)');
    }

    // Try to create default agency, but don't fail if it doesn't work
    let agencyDoc = null;
    try {
      agencyDoc = await db.collection('agencies').add({
        name: 'GoldBand Agency Demo',
        legal_name: 'GoldBand Agency Inc.',
        industry: 'Financial Services',
        timezone: 'UTC',
        currency: 'USD',
        website: 'https://goldbandagency.com',
        email: ADMIN_ACCOUNT.email,
        subscription_tier: 'professional',
        subscription_active: true,
        settings: {
          allow_loan_against_staking: true,
          apy_rate: 9,
          leverage_ratio: 3,
          minimum_investment: 20000,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        member_count: 1,
      });

      console.log('✓ Default agency created');
      console.log(`  Agency ID: ${agencyDoc.id}`);

      // Update user with agency reference
      try {
        await db.collection('users').doc(userRecord.uid).update({
          agency_id: agencyDoc.id,
        });
      } catch (updateError) {
        // Ignore if user doc doesn't exist yet
      }
    } catch (agencyError) {
      console.log('⚠ Note: Could not create default agency (this is OK, can be created later)');
    }

    console.log('\n✅ Admin account setup completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${ADMIN_ACCOUNT.email}`);
    console.log(`   Password: ${ADMIN_ACCOUNT.password}`);
    console.log('\n💡 You can now sign in at: http://localhost:5173/signin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin account:', error);
    process.exit(1);
  }
}

// Run setup
setupAdminAccount();
