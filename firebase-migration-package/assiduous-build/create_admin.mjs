import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE",
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:cf93349a7f50a2e7c3f56b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('Creating admin@assiduousrealty.com...\n');

try {
  const userCredential = await createUserWithEmailAndPassword(auth, 'admin@assiduousrealty.com', 'admin123');
  const user = userCredential.user;
  
  console.log('✅ Created in Firebase Auth');
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
  
  console.log('✅ Created Firestore profile\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SUCCESS! Account is ready!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('You can now login at: https://assiduous-prod.web.app/');
  console.log('Email: admin@assiduousrealty.com');
  console.log('Password: admin123\n');
  process.exit(0);
} catch (error) {
  if (error.code === 'auth/email-already-in-use') {
    console.log('✅ Account already exists!\n');
    console.log('You can login at: https://assiduous-prod.web.app/');
    console.log('Email: admin@assiduousrealty.com');
    console.log('Password: admin123\n');
    process.exit(0);
  } else {
    console.error('❌ Error:', error.code);
    console.error('   Message:', error.message);
    process.exit(1);
  }
}
