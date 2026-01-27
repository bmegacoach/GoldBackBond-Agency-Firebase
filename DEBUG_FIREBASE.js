// Add this to browser console to debug Firebase authentication and Firestore access

// Check if user is authenticated
console.log('=== FIREBASE DEBUG ===');
console.log('Firebase Auth:', firebase.auth());
console.log('Current User:', firebase.auth().currentUser);

if (firebase.auth().currentUser) {
  console.log('✅ User is authenticated');
  console.log('Email:', firebase.auth().currentUser.email);
  console.log('UID:', firebase.auth().currentUser.uid);
  
  // Try to get auth token
  firebase.auth().currentUser.getIdToken().then(token => {
    console.log('✅ ID Token received (length: ' + token.length + ')');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
  }).catch(err => {
    console.error('❌ Error getting ID token:', err);
  });
} else {
  console.error('❌ No user authenticated!');
}

// Try a simple Firestore write
console.log('\n=== TESTING FIRESTORE WRITE ===');
const testRef = firebase.firestore().collection('leads').doc('_test');
testRef.set({test: true, timestamp: new Date()})
  .then(() => {
    console.log('✅ Firestore write successful!');
    // Clean up
    testRef.delete().then(() => console.log('✅ Test document deleted'));
  })
  .catch(err => {
    console.error('❌ Firestore write failed:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
  });

// Check Firestore config
console.log('\n=== FIRESTORE CONFIG ===');
console.log('Firestore DB:', firebase.firestore());
console.log('Project ID:', firebase.app().options.projectId);
