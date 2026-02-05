/**
 * Add a new user to the CRM system
 * Usage: node add-user.cjs <email> <password> <displayName> [role]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
    console.log('Usage: node add-user.cjs <email> <password> <displayName> [role]');
    process.exit(1);
}

const [email, password, displayName, role = 'sales_rep'] = args;

// Load service account
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'goldbackbond-agency',
});

const auth = admin.auth();
const db = admin.firestore();

async function addUser() {
    try {
        console.log('\n🔐 Adding new user to CRM...');
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Name: ${displayName}`);
        console.log(`🎭 Role: ${role}\n`);

        let userRecord;
        
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('⚠️  User already exists, updating...');
        } catch (error) {
            if (error.code !== 'auth/user-not-found') throw error;
            userRecord = await auth.createUser({
                email: email,
                password: password,
                displayName: displayName,
                emailVerified: true,
            });
            console.log('✓ User account created');
        }

        console.log(`   UID: ${userRecord.uid}`);

        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, {
            role: 'paid',
            subscriptionStatus: 'active'
        });
        console.log('✓ Authentication claims set');

        // Create user document
        const department = role === 'admin' ? 'Administration' : 
                          role === 'manager' ? 'Management' : 'Sales';

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
        console.log('\n✅ USER ADDED SUCCESSFULLY!');
        console.log(`\n📝 Login: ${email} / ${password}`);
        console.log('🔗 URL: https://gold-back-bond-agency-firebase-2uji.vercel.app/\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

addUser();
