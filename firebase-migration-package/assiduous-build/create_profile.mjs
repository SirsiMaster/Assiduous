import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:84bd6fa0e7c8a2e7c3f56b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Signing in and creating profile...\n');

try {
  const userCredential = await signInWithEmailAndPassword(auth, 'admin@assiduousrealty.com', 'admin123');
  const user = userCredential.user;
  
  console.log('✅ Signed in successfully');
  console.log('   UID:', user.uid);
  
  await setDoc(doc(db, 'users', user.uid), {
    email: 'admin@assiduousrealty.com',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    role: 'admin',
    isActive: true,
    profileComplete: true,
    emailVerified: true,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  });
  
  console.log('✅ Profile created in Firestore\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SUCCESS! Login should work now!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Try logging in at: https://assiduous-prod.web.app/');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.code);
  console.error('   Message:', error.message);
  process.exit(1);
}
