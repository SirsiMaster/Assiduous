// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.FIREBASE_APP_ID = 'test-app-id';
process.env.FIREBASE_MEASUREMENT_ID = 'test-measurement-id';
process.env.ENCRYPTION_KEY = 'test-encryption-key';

// Mock Web Crypto API
global.crypto = {
  getRandomValues: jest.fn(array => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    importKey: jest.fn(() => Promise.resolve('test-key')),
    deriveKey: jest.fn(() => Promise.resolve('test-derived-key')),
    encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
    decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
  }
};

// Mock TextEncoder/TextDecoder
global.TextEncoder = jest.fn(() => ({
  encode: jest.fn(text => new Uint8Array(text.split('').map(c => c.charCodeAt(0))))
}));

global.TextDecoder = jest.fn(() => ({
  decode: jest.fn(() => 'test-decoded-text')
}));

// Extended matchers
expect.extend({
  toBeEncrypted(received) {
    const pass = received && 
      typeof received === 'object' && 
      received.encrypted && 
      received.iv;
      
    if (pass) {
      return {
        message: () => `expected ${received} not to be encrypted`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be encrypted`,
        pass: false
      };
    }
  }
});
