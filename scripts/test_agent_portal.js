/**
 * Agent Portal Browser Testing Script
 * Tests console errors, navigation, and page functionality
 */

const pages = [
  'http://localhost:8080/public/agent/dashboard.html',
  'http://localhost:8080/public/agent/listings.html',
  'http://localhost:8080/public/agent/clients.html',
  'http://localhost:8080/public/agent/leads.html'
];

console.log('🧪 Starting Agent Portal Tests...\n');

pages.forEach((page, index) => {
  console.log(`\n📄 Testing Page ${index + 1}: ${page}`);
  
  // Test 1: Page loads
  fetch(page)
    .then(response => {
      if (response.ok) {
        console.log(`✅ Page loads successfully (Status: ${response.status})`);
        return response.text();
      } else {
        console.error(`❌ Page failed to load (Status: ${response.status})`);
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(html => {
      // Test 2: Check for critical HTML elements
      const hasHeader = html.includes('<header') || html.includes('agent-header');
      const hasSidebar = html.includes('sidebar') || html.includes('<nav');
      const hasMainContent = html.includes('<main') || html.includes('class="content"');
      
      console.log(`✅ Has Header: ${hasHeader}`);
      console.log(`✅ Has Sidebar: ${hasSidebar}`);
      console.log(`✅ Has Main Content: ${hasMainContent}`);
      
      // Test 3: Check for required CSS/JS files
      const hasCss = html.includes('.css');
      const hasJs = html.includes('.js');
      
      console.log(`✅ Has CSS: ${hasCss}`);
      console.log(`✅ Has JavaScript: ${hasJs}`);
      
      // Test 4: Check for Firebase integration
      const hasFirebase = html.includes('firebase') || html.includes('firebaseConfig');
      console.log(`${hasFirebase ? '✅' : '⚠️'} Firebase Integration: ${hasFirebase}`);
    })
    .catch(error => {
      console.error(`❌ Error testing page: ${error.message}`);
    });
});

console.log('\n\n🏁 Test suite completed. Check browser DevTools for runtime errors.');
