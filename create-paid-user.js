#!/usr/bin/env node

/**
 * Manually create a paid user
 * 
 * Usage: node create-paid-user.js
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

const PAID_USER = {
    email: 'awansaad6927@gmail.com',
    password: 'Password123!', // You should change this after first login
    displayName: 'Awan Saad',
};

async function createPaidUser() {
    try {
        console.log('🔐 Setting up paid user...');
        console.log(`📧 Email: ${PAID_USER.email}`);

        let userRecord;
        // Check if user already exists
        try {
            userRecord = await auth.getUserByEmail(PAID_USER.email);
            console.log('✓ User account already exists');
            console.log(`  UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
            // User doesn't exist, proceed with creation
            userRecord = await auth.createUser({
                email: PAID_USER.email,
                password: PAID_USER.password,
                displayName: PAID_USER.displayName,
                emailVerified: true,
            });
            console.log('✓ User created successfully');
            console.log(`  UID: ${userRecord.uid}`);
        }

        // Set custom claims to ensure frontend recognizes "paid" status
        await auth.setCustomUserClaims(userRecord.uid, {
            role: 'paid',
            subscriptionStatus: 'active'
        });
        console.log('✓ Custom claims set (role: paid)');

        // Create/Update user document in Firestore with paid status
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: PAID_USER.email,
            displayName: PAID_USER.displayName,
            role: 'sales_rep', // Default role
            department: 'Sales',
            subscription_active: true,
            subscription_tier: 'professional',
            isActive: true, // Field used in UserManagementPanel
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log('✓ User document created/updated in Firestore with "paid" status');

        console.log('\n✅ Paid user setup completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log(`   Email: ${PAID_USER.email}`);
        console.log(`   Password: ${PAID_USER.password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating paid user:', error);
        process.exit(1);
    }
}

// Run setup
createPaidUser();
