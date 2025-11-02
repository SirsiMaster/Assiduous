# Automated Authentication Tests

Automated end-to-end tests for Assiduous authentication and RBAC using Playwright.

## 📋 Test Coverage

### Implemented Tests (19 test cases)

**Step 12.3: Admin Login Flow**
- TC-01: Admin login success
- TC-02: Admin dashboard access
- TC-03: Admin logout and session termination

**Step 12.4: Agent Login Flow**
- TC-04: Agent login success
- TC-05: Agent dashboard access
- TC-06: Agent cannot access admin pages
- TC-07: Agent logout

**Step 12.5: Client Login Flow**
- TC-08: Client login success
- TC-09: Client dashboard access
- TC-10: Client cannot access admin/agent pages
- TC-11: Client logout

**Step 12.6: Password Reset Flow**
- TC-12: Forgot password link
- TC-13-15: Email flow (manual testing required)

**Step 12.7: Role-Based Access Control**
- TC-16: Admin full access
- TC-17: Agent limited access
- TC-18: Client restricted access
- TC-19: Custom claims verification

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

This installs Playwright and browser binaries (Chromium, Firefox, WebKit).

### 2. Verify Credentials

Ensure `.env.test` file exists with test passwords:

```bash
cat .env.test
```

Should contain:
```
ADMIN_REALTY_PASSWORD=...
AGENT_REALTY_PASSWORD=...
CLIENT_REALTY_PASSWORD=...
```

## 🧪 Running Tests

### Run All Authentication Tests

```bash
npm run test:auth
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:auth:ui
```

This opens Playwright's interactive test runner where you can:
- Watch tests execute in real-time
- Inspect each step
- Time travel through test execution
- View screenshots and videos

### Run Tests in Debug Mode

```bash
npm run test:auth:debug
```

Pauses test execution at each step for debugging.

### Run Tests in Specific Browser

```bash
# Chromium only (fastest)
npm run test:auth:chromium

# All browsers (Chrome, Firefox, Safari, Mobile)
npm run test:auth
```

### View Test Report

```bash
npm run test:auth:report
```

Opens HTML report with:
- Test results summary
- Screenshots of failures
- Videos of test runs
- Traces for debugging

## 📊 Test Results

After running tests:

```
tests/
├── auth.spec.js          # Test file
└── README.md             # This file

test-results/
├── html/                 # HTML test report
│   └── index.html       # Open in browser
├── results.json          # JSON test results
└── videos/              # Test execution videos (on failure)
```

## 🔧 Configuration

Edit `playwright.config.js` to customize:

- **Timeout**: Change test timeout (default 30s)
- **Retries**: Number of retries on failure
- **Browsers**: Enable/disable specific browsers
- **Screenshots**: When to capture screenshots
- **Videos**: When to record videos
- **Base URL**: Target environment URL

## 📝 Writing New Tests

Add new test files to `tests/` directory:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page.html');
    await expect(page.locator('.element')).toBeVisible();
  });
});
```

## 🐛 Debugging Failed Tests

### 1. Check Screenshots

Failed tests automatically capture screenshots:

```bash
open test-results/auth-spec-TC-01-Admin-Login-Success-chromium/test-failed-1.png
```

### 2. Watch Test Video

```bash
open test-results/videos/chromium/auth-spec-TC-01-Admin-Login-Success.webm
```

### 3. Inspect Trace

```bash
npx playwright show-trace test-results/auth-spec-TC-01-Admin-Login-Success-chromium/trace.zip
```

### 4. Run in Debug Mode

```bash
npm run test:auth:debug
```

Use Playwright Inspector to:
- Step through test
- Inspect page state
- Run commands in console
- View locators

## ⚙️ CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run authentication tests
        run: npm run test:auth
        env:
          ADMIN_REALTY_PASSWORD: ${{ secrets.ADMIN_REALTY_PASSWORD }}
          AGENT_REALTY_PASSWORD: ${{ secrets.AGENT_REALTY_PASSWORD }}
          CLIENT_REALTY_PASSWORD: ${{ secrets.CLIENT_REALTY_PASSWORD }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/html
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

## ✅ Test Status

| Test Case | Status | Browser Coverage |
|-----------|--------|------------------|
| TC-01 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-02 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-03 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-04 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-05 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-06 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-07 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-08 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-09 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-10 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-11 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-12 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-13-15 | ⏸️ Manual | Email verification required |
| TC-16 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-17 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-18 | ✅ Automated | Chrome, Firefox, Safari, Mobile |
| TC-19 | ✅ Automated | Chrome, Firefox, Safari, Mobile |

**Total**: 16/19 automated (84%), 3 require manual testing
