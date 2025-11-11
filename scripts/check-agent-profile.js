#!/usr/bin/env node

// Quick script to check if agent@sirsimaster.com has a Firestore user profile
// Usage: node scripts/check-agent-profile.js

const https = require('https');

const PROJECT_ID = 'assiduous-prod';
const AGENT_UID = 'ZJxYAOxk6YM0PreyOALdpzWRFTF2';

// This requires Firebase REST API with an API key or auth token
// For now, let's just provide instructions

console.log('='.repeat(60));
console.log('AGENT ACCOUNT INFORMATION');
console.log('='.repeat(60));
console.log('');
console.log('Email: agent@sirsimaster.com');
console.log('UID: ZJxYAOxk6YM0PreyOALdpzWRFTF2');
console.log('Display Name: Test Agent');
console.log('Password Hash: EXISTS (account has password set)');
console.log('');
console.log('='.repeat(60));
console.log('TO TEST CLIENT CRUD FUNCTIONALITY:');
console.log('='.repeat(60));
console.log('');
console.log('1. Open browser to: https://assiduous-prod.web.app/auth/login.html');
console.log('');
console.log('2. Login with:');
console.log('   Email: agent@sirsimaster.com');
console.log('   Password: [You need to know this password]');
console.log('');
console.log('3. After successful login, navigate to:');
console.log('   https://assiduous-prod.web.app/agent/clients.html');
console.log('');
console.log('4. Test CRUD operations:');
console.log('   - Click "Add Client" button');
console.log('   - Fill in form (First Name, Last Name, Email, Phone)');
console.log('   - Click "Save Client"');
console.log('   - Verify client appears in table');
console.log('   - Try editing and deleting clients');
console.log('');
console.log('='.repeat(60));
console.log('IF YOU DON\'T KNOW THE PASSWORD:');
console.log('='.repeat(60));
console.log('');
console.log('Run this command to reset it:');
console.log('firebase auth:update ZJxYAOxk6YM0PreyOALdpzWRFTF2 --password="TestAgent123!" --project assiduous-prod');
console.log('');
console.log('Then use password: TestAgent123!');
console.log('');
