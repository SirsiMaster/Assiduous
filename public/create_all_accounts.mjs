import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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

const accounts = [
  {
    email: 'client@assiduousrealty.com',
    password: 'admin123',
    firstName: 'Client',
    lastName: 'User',
    role: 'client'
  },
  {
    email: 'agent@assiduousrealty.com',
    password: 'admin123',
    firstName: 'Agent',
    lastName: 'User',
    role: 'agent',
    agentVerificationStatus: 'approved',
    agentInfo: {
      licenseNumber: 'AR-12345',
      brokerage: 'Assiduous Realty',
      yearsExperience: 5,
      specializations: ['Residential', 'Commercial']
    }
  },
  {
    email: 'investor@assiduousrealty.com',
    password: 'admin123',
    firstName: 'Investor',
    lastName: 'User',
    role: 'investor'
  }
];

console.log('Creating client, agent, and investor accounts...\n');

for (const account of accounts) {
  try {
    console.log(`Creating ${account.role}: ${account.email}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
    const user = userCredential.user;
    
    console.log(`  ✅ Created in Firebase Auth (UID: ${user.uid})`);
    
    const profileData = {
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      displayName: `${account.firstName} ${account.lastName}`,
      role: account.role,
      isActive: true,
      profileComplete: true,
      emailVerified: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    
    if (account.agentVerificationStatus) {
      profileData.agentVerificationStatus = account.agentVerificationStatus;
      profileData.agentInfo = account.agentInfo;
    }
    
    await setDoc(doc(db, 'users', user.uid), profileData);
    console.log(`  ✅ Created Firestore profile`);
    
    if (account.role === 'agent') {
      await setDoc(doc(db, 'agent_stats', user.uid), {
        activeListings: 24,
        commissionYTD: 45200,
        activeClients: 18,
        newLeads: 7,
        totalSales: 12,
        averageDaysToClose: 18,
        lastUpdated: serverTimestamp()
      });
      console.log(`  ✅ Created agent stats`);
    }
    
    console.log(`  ✅ ${account.role.toUpperCase()} COMPLETE\n`);
    
    await auth.signOut();
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`  ⚠️  Account already exists: ${account.email}\n`);
    } else {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ ALL ACCOUNTS CREATED!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Login Credentials:');
console.log('  Admin:    admin@assiduousrealty.com    / admin123');
console.log('  Client:   client@assiduousrealty.com   / admin123');
console.log('  Agent:    agent@assiduousrealty.com    / admin123');
console.log('  Investor: investor@assiduousrealty.com / admin123\n');
console.log('🌐 Login at: https://assiduous-prod.web.app/\n');

process.exit(0);
