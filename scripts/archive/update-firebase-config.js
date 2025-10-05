#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Real Firebase configuration from Firebase CLI
const firebaseConfig = {
// REMOVED:   apiKey: "AIzaSyCnQajchoBwP_VMEvc9mKH-vO0xlZjGCRE", // Historical reference only
  authDomain: "assiduous-prod.firebaseapp.com",
  projectId: "assiduous-prod",
  storageBucket: "assiduous-prod.firebasestorage.app",
  messagingSenderId: "9355377564",
  appId: "1:9355377564:web:cee09f952eea43976ee659",
  measurementId: "G-DVBZP21459"
};

console.log('🔥 Updating Firebase Configuration with Real API Keys');
console.log('======================================================\n');

// Files to update
const filesToUpdate = [
  'admin/development/dashboard.html',
  'admin/development/costs.html',
  'admin/development/analytics.html',
  'admin/development/reports.html',
  'assiduous-build/admin/development/dashboard.html',
  'assiduous-build/admin/development/costs.html',
  'assiduous-build/admin/development/analytics.html',
  'assiduous-build/admin/development/reports.html'
];

let updatedCount = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace any existing firebaseConfig
    const configRegex = /window\.firebaseConfig\s*=\s*{[^}]+}/;
    const newConfig = `window.firebaseConfig = ${JSON.stringify(firebaseConfig, null, 12).replace(/"/g, '"')}`;
    
    if (configRegex.test(content)) {
      content = content.replace(configRegex, newConfig);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${file}`);
      updatedCount++;
    } else {
      // If no config found, try to add it before firebase.initializeApp
      const initRegex = /(firebase\.initializeApp\()/;
      if (initRegex.test(content)) {
        content = content.replace(initRegex, `${newConfig};\n        $1window.firebaseConfig || `);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Added config to: ${file}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No Firebase config found in: ${file}`);
      }
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Updated ${updatedCount} files with real Firebase configuration!`);
console.log('\n📊 Configuration Applied:');
console.log('   API Key:', firebaseConfig.apiKey);
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   App ID:', firebaseConfig.appId);
console.log('   Measurement ID:', firebaseConfig.measurementId);

console.log('\n🚀 Next Steps:');
console.log('1. Deploy to Firebase: firebase deploy --only hosting');
console.log('2. Test live dashboards:');
console.log('   https://assiduousflip.web.app/admin/development/dashboard.html');
console.log('   https://assiduousflip.web.app/admin/development/costs.html');
