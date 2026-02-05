#!/usr/bin/env node

/**
 * Add a new user to the CRM system
 * 
 * Usage: node add-user.js <email> <password> <displayName> [role]
 * 
 * Roles: sales_rep (default), manager, admin
 * 
 * Examples:
 *   node add-user.js sydney@example.com Password123! "Sydney Smith" sales_rep
 *   node add-user.js john@example.com SecurePass! "John Doe" manager
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
    console.log('❌ Usage: node add-user.js <email> <password> <displayName> [role]');
    console.log('   Roles: sales_rep (default), manager, admin');
    console.log('');
    console.log('   Example: node add-user.js sydney@example.com Password123! "Sydney Smith" sales_rep');
    process.exit(1);
}

const [email, password, displayName, role = 'sales_rep'] = args;

// Validate role
const validRoles = ['sales_rep', 'manager', 'admin'];
if (!validRoles.includes(role)) {
    console.log(`❌ Invalid role: ${role}`);
    console.log(`   Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
}

// Load service account
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.log('❌ firebase-service-account.json not found');
    console.log('   Please place the Firebase service account JSON in the project root');
    process.exit(1);
}

const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountRaw);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'goldbackbond-agency',
});

const auth = admin.auth();
const db = admin.firestore();

async function addUser() {
    try {
        console.log('');
        console.log('🔐 Adding new user to CRM...');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Name: ${displayName}`);
        console.log(`🎭 Role: ${role}`);
        console.log('');

        let userRecord;
        
        // Check if user already exists
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('⚠️  User account already exists');
            console.log(`   UID: ${userRecord.uid}`);
            console.log('   Updating user data...');
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
            // User doesn't exist, create them
            userRecord = await auth.createUser({
                email: email,
                password: password,
                displayName: displayName,
                emailVerified: true,
            });
            console.log('✓ User account created');
            console.log(`   UID: ${userRecord.uid}`);
        }

        // Set custom claims for authentication
        await auth.setCustomUserClaims(userRecord.uid, {
            role: 'paid',
            subscriptionStatus: 'active'
        });
        console.log('✓ Authentication claims set');

        // Determine department based on role
        const department = role === 'admin' ? 'Administration' : 
                          role === 'manager' ? 'Management' : 'Sales';

        // Create/Update user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: email,
            displayName: displayName,
            role: role,
            department: department,
            subscription_active: true,
            subscription_tier: 'professional',
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log('✓ User profile created in database');

        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('✅ USER ADDED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════');
        console.log('');
        console.log('📝 Login credentials:');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role:     ${role}`);
        console.log('');
        console.log(`🔗 Login at: https://gold-back-bond-agency-firebase-2uji.vercel.app/`);
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ Error adding user:', error.message);
        if (error.code) {
            console.error(`   Error code: ${error.code}`);
        }
        process.exit(1);
    }
}

// Run
addUser();
