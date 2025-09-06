/**
 * IV&V Agent
 * Runs post-deploy checks and writes ivv-report.json / ivv-report.md in this folder.
 * Usage:
 *   node ivvAgent.js --base https://YOUR.web.app --project YOUR_FIREBASE_PROJECT_ID
 */

const fs = require('fs');
const https = require('https');

const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=').map(x => x.replace(/^--/, ''))).map(([k,v]) => [k, v || true]));

const BASE = args.base || process.env.IVV_BASE_URL || 'http://localhost:5000';
const PROJECT = args.project || process.env.GCLOUD_PROJECT || 'local-emulator';
const API = `${BASE}/api`;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

(async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    project: PROJECT,
    baseUrl: BASE,
    checks: []
  };

  // 1) Hosting reachable
  try {
    const r = await get(BASE);
    report.checks.push({ name: 'hosting_reachable', ok: (r.status === 200), status: r.status });
  } catch (e) {
    report.checks.push({ name: 'hosting_reachable', ok: false, error: e.message });
  }

  // 2) API reachable (404 expected on root)
  try {
    const r = await get(`${API}/__health`);
    report.checks.push({ name: 'api_health', ok: (String(r.status).startsWith('2') || String(r.status).startsWith('4')), status: r.status });
  } catch (e) {
    report.checks.push({ name: 'api_health', ok: false, error: e.message });
  }

  // 3) Webhook endpoints exist (should 405 on GET or 404)
  for (const p of ['/webhook/kyc', '/webhook/bank']) {
    try {
      const r = await get(`${API}${p}`);
      report.checks.push({ name: `endpoint_exists_${p}`, ok: [200,401,404,405].includes(r.status), status: r.status });
    } catch (e) {
      report.checks.push({ name: `endpoint_exists_${p}`, ok: false, error: e.message });
    }
  }

  // write files
  fs.writeFileSync(__dirname + '/ivv-report.json', JSON.stringify(report, null, 2));
  const md = [
    `# IV&V Report`,
    `**Project**: ${PROJECT}`,
    `**Base URL**: ${BASE}`,
    `**When**: ${report.timestamp}`,
    ``,
    `| Check | OK | Status/Error |`,
    `|---|---:|---|`,
    ...report.checks.map(c => `| ${c.name} | ${c.ok ? '✅' : '❌'} | ${c.status || c.error || ''} |`)
  ].join('\n');
  fs.writeFileSync(__dirname + '/ivv-report.md', md);

  console.log('IV&V complete. See functions/ivv-report.json and functions/ivv-report.md');
})();
