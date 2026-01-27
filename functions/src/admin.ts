import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();

    try {
        // Create a corresponding document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            role: 'user', // Default role
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            subscription_active: false
        });

        console.log(`Created user document for ${user.uid}`);
    } catch (error) {
        console.error('Error creating user document:', error);
    }
});
