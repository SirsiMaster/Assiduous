#!/usr/bin/env node

/**
 * Universal CI/CD Pipeline Setup Script
 * Interactive configuration for multi-cloud deployments
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════╗
║   Universal CI/CD Pipeline Setup Wizard    ║
╚════════════════════════════════════════════╝${colors.reset}

This wizard will help you set up automated deployments
to your preferred cloud provider.
`);

async function main() {
  try {
    // Project Information
    console.log(`\n${colors.blue}📋 Project Information${colors.reset}\n`);
    
    const projectName = await question('Project name: ') || path.basename(process.cwd());
    const projectType = await selectOption('Project type:', [
      'web - Static website or SPA',
      'api - Backend API service',
      'fullstack - Full-stack application',
      'mobile - Mobile application',
      'desktop - Desktop application'
    ]);
    
    const framework = await selectOption('Framework/Technology:', [
      'react - React',
      'nextjs - Next.js',
      'vue - Vue.js',
      'angular - Angular',
      'svelte - Svelte/SvelteKit',
      'vanilla - Vanilla HTML/CSS/JS',
      'node - Node.js',
      'python - Python',
      'dotnet - .NET',
      'other - Other/Custom'
    ]);

    // Build Configuration
    console.log(`\n${colors.blue}🏗️ Build Configuration${colors.reset}\n`);
    
    const buildCommand = await question('Build command (e.g., npm run build): ') || 'npm run build';
    const outputDir = await question('Build output directory (e.g., dist, build): ') || 'dist';
    const nodeVersion = await question('Node.js version (e.g., 18, 20): ') || '18';

    // Testing Configuration
    console.log(`\n${colors.blue}🧪 Testing Configuration${colors.reset}\n`);
    
    const enableTesting = await confirm('Enable automated testing?');
    let testCommand = 'npm test';
    let coverageThreshold = 80;
    
    if (enableTesting) {
      testCommand = await question('Test command: ') || 'npm test';
      const enableCoverage = await confirm('Enable code coverage checks?');
      if (enableCoverage) {
        coverageThreshold = parseInt(await question('Coverage threshold % (e.g., 80): ') || '80');
      }
    }

    // Deployment Providers
    console.log(`\n${colors.blue}☁️ Deployment Configuration${colors.reset}\n`);
    
    const environments = [];
    
    // Production
    console.log(`\n${colors.yellow}Production Environment:${colors.reset}`);
    const prodProvider = await selectOption('Production provider:', [
      'firebase - Firebase Hosting',
      'aws - AWS S3 + CloudFront',
      'azure - Azure Storage + CDN',
      'vercel - Vercel',
      'netlify - Netlify',
      'gcp - Google Cloud Platform',
      'custom - Custom/Self-hosted'
    ]);
    
    const prodConfig = await getProviderConfig(prodProvider);
    environments.push({ name: 'production', provider: prodProvider, ...prodConfig });
    
    // Staging
    if (await confirm('\nConfigure staging environment?')) {
      console.log(`\n${colors.yellow}Staging Environment:${colors.reset}`);
      const stagingProvider = await selectOption('Staging provider:', [
        'firebase - Firebase Hosting',
        'aws - AWS S3 + CloudFront',
        'azure - Azure Storage + CDN',
        'vercel - Vercel',
        'netlify - Netlify',
        'same - Same as production'
      ]);
      
      const stagingConfig = stagingProvider === 'same' 
        ? { ...prodConfig, environment: 'staging' }
        : await getProviderConfig(stagingProvider);
      
      environments.push({ name: 'staging', provider: stagingProvider === 'same' ? prodProvider : stagingProvider, ...stagingConfig });
    }
    
    // Development
    if (await confirm('\nConfigure development environment?')) {
      console.log(`\n${colors.yellow}Development Environment:${colors.reset}`);
      const devProvider = await selectOption('Development provider:', [
        'firebase - Firebase Hosting',
        'vercel - Vercel',
        'netlify - Netlify',
        'local - Local only'
      ]);
      
      if (devProvider !== 'local') {
        const devConfig = await getProviderConfig(devProvider);
        environments.push({ name: 'development', provider: devProvider, ...devConfig });
      }
    }

    // Advanced Options
    console.log(`\n${colors.blue}⚙️ Advanced Options${colors.reset}\n`);
    
    const enableCaching = await confirm('Enable dependency caching?', true);
    const enableSecurityScan = await confirm('Enable security scanning?', true);
    const enableMetrics = await confirm('Track deployment metrics?', true);
    const enableNotifications = await confirm('Enable deployment notifications?');
    
    let notificationConfig = {};
    if (enableNotifications) {
      const notificationType = await selectOption('Notification channel:', [
        'slack - Slack',
        'discord - Discord',
        'email - Email',
        'teams - Microsoft Teams'
      ]);
      
      if (notificationType === 'slack' || notificationType === 'discord') {
        console.log(`\n${colors.yellow}Add webhook URL as secret: ${notificationType.toUpperCase()}_WEBHOOK${colors.reset}`);
      }
      
      notificationConfig = {
        type: notificationType,
        enabled: true
      };
    }

    // Generate Configuration
    const config = {
      project: {
        name: projectName,
        type: projectType.split(' ')[0],
        framework: framework.split(' ')[0]
      },
      build: {
        command: buildCommand,
        outputDir: outputDir,
        nodeVersion: nodeVersion
      },
      testing: {
        enabled: enableTesting,
        command: testCommand,
        coverage: {
          enabled: coverageThreshold > 0,
          threshold: coverageThreshold
        }
      },
      providers: {},
      notifications: notificationConfig,
      advanced: {
        caching: enableCaching,
        securityScan: enableSecurityScan,
        metrics: enableMetrics
      }
    };
    
    // Add environments to config
    environments.forEach(env => {
      config.providers[env.name] = env;
    });

    // Create directories
    console.log(`\n${colors.blue}📁 Creating configuration files...${colors.reset}\n`);
    
    const dirs = ['.cicd', '.github/workflows'];
    dirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`${colors.green}✓${colors.reset} Created ${dir}/`);
      }
    });

    // Write config file
    const configPath = path.join(process.cwd(), '.cicd', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`${colors.green}✓${colors.reset} Created .cicd/config.json`);

    // Generate workflow file
    const workflowContent = generateWorkflow(config);
    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
    fs.writeFileSync(workflowPath, workflowContent);
    console.log(`${colors.green}✓${colors.reset} Created .github/workflows/deploy.yml`);

    // Generate environment files
    environments.forEach(env => {
      const envExample = generateEnvExample(env);
      const envPath = path.join(process.cwd(), '.cicd', `${env.name}.env.example`);
      fs.writeFileSync(envPath, envExample);
      console.log(`${colors.green}✓${colors.reset} Created .cicd/${env.name}.env.example`);
    });

    // Display next steps
    console.log(`
${colors.green}${colors.bright}✅ Setup Complete!${colors.reset}

${colors.yellow}📋 Next Steps:${colors.reset}

1. ${colors.cyan}Add secrets to your repository:${colors.reset}
   Go to Settings → Secrets → Actions
   `);
    
    const secrets = getRequiredSecrets(config);
    secrets.forEach(secret => {
      console.log(`   • ${secret}`);
    });
    
    console.log(`
2. ${colors.cyan}Review and customize:${colors.reset}
   • .cicd/config.json - Main configuration
   • .github/workflows/deploy.yml - GitHub Actions workflow
   • .cicd/*.env.example - Environment templates

3. ${colors.cyan}Test your pipeline:${colors.reset}
   git add .
   git commit -m "feat: add CI/CD pipeline"
   git push

4. ${colors.cyan}Monitor deployments:${colors.reset}
   Go to Actions tab in your GitHub repository

${colors.blue}📚 Documentation:${colors.reset} https://github.com/sirsimaster/universal-cicd
${colors.blue}💬 Support:${colors.reset} https://discord.gg/sirsimaster
`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

async function selectOption(prompt, options) {
  console.log(`\n${prompt}`);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });
  
  const answer = await question('\nSelect (number): ');
  const index = parseInt(answer) - 1;
  
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  
  return options[0];
}

async function confirm(prompt, defaultValue = false) {
  const answer = await question(`${prompt} (y/n) [${defaultValue ? 'y' : 'n'}]: `);
  if (!answer) return defaultValue;
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function getProviderConfig(provider) {
  const type = provider.split(' ')[0];
  const config = { type };
  
  switch (type) {
    case 'firebase':
      config.projectId = await question('Firebase project ID: ');
      config.site = await question('Firebase site name (optional): ') || config.projectId;
      break;
    
    case 'aws':
      config.bucket = await question('S3 bucket name: ');
      config.region = await question('AWS region (e.g., us-east-1): ') || 'us-east-1';
      config.cloudfront = await question('CloudFront distribution ID (optional): ');
      break;
    
    case 'azure':
      config.storageAccount = await question('Storage account name: ');
      config.resourceGroup = await question('Resource group: ');
      config.container = await question('Container name (default: $web): ') || '$web';
      break;
    
    case 'vercel':
      config.orgId = await question('Vercel org/team ID (optional): ');
      config.projectName = await question('Vercel project name (optional): ');
      break;
    
    case 'netlify':
      config.siteId = await question('Netlify site ID: ');
      break;
    
    case 'custom':
      config.deployScript = await question('Path to deploy script: ') || '.cicd/deploy.sh';
      break;
  }
  
  return config;
}

function generateWorkflow(config) {
  const prodProvider = config.providers.production?.type || 'firebase';
  
  return `name: Deploy Pipeline
# Generated by Universal CI/CD Setup

on:
  push:
    branches:
      - main
      - staging
      - develop
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - production
          - staging
          - development

jobs:
  deploy:
    name: Deploy to Cloud
    uses: sirsimaster/universal-cicd/.github/workflows/universal-deploy.yml@main
    with:
      provider: '${prodProvider}'
      environment: \${{ github.event.inputs.environment || (github.ref == 'refs/heads/main' && 'production') || (github.ref == 'refs/heads/staging' && 'staging') || 'development' }}
      node-version: '${config.build.nodeVersion}'
      build-command: '${config.build.command}'
      test-command: '${config.testing.command}'
      output-directory: '${config.build.outputDir}'
      enable-testing: ${config.testing.enabled}
      enable-caching: ${config.advanced.caching}
      enable-security-scan: ${config.advanced.securityScan}
      enable-metrics: ${config.advanced.metrics}
    secrets: inherit
`;
}

function generateEnvExample(env) {
  const lines = [`# ${env.name.toUpperCase()} Environment Variables\n`];
  
  switch (env.type) {
    case 'firebase':
      lines.push('FIREBASE_TOKEN=your-firebase-token');
      lines.push(`FIREBASE_PROJECT=${env.projectId}`);
      break;
    
    case 'aws':
      lines.push('AWS_ACCESS_KEY_ID=your-access-key');
      lines.push('AWS_SECRET_ACCESS_KEY=your-secret-key');
      lines.push(`AWS_REGION=${env.region}`);
      lines.push(`AWS_S3_BUCKET=${env.bucket}`);
      if (env.cloudfront) {
        lines.push(`AWS_CLOUDFRONT_ID=${env.cloudfront}`);
      }
      break;
    
    case 'azure':
      lines.push('AZURE_CREDENTIALS={"clientId":"","clientSecret":"","subscriptionId":"","tenantId":""}');
      lines.push(`AZURE_STORAGE_ACCOUNT=${env.storageAccount}`);
      lines.push(`AZURE_RESOURCE_GROUP=${env.resourceGroup}`);
      break;
    
    case 'vercel':
      lines.push('VERCEL_TOKEN=your-vercel-token');
      if (env.orgId) lines.push(`VERCEL_ORG_ID=${env.orgId}`);
      break;
    
    case 'netlify':
      lines.push('NETLIFY_AUTH_TOKEN=your-netlify-token');
      lines.push(`NETLIFY_SITE_ID=${env.siteId}`);
      break;
  }
  
  return lines.join('\n');
}

function getRequiredSecrets(config) {
  const secrets = new Set();
  
  Object.values(config.providers).forEach(provider => {
    switch (provider.type) {
      case 'firebase':
        secrets.add('FIREBASE_TOKEN');
        break;
      case 'aws':
        secrets.add('AWS_ACCESS_KEY_ID');
        secrets.add('AWS_SECRET_ACCESS_KEY');
        break;
      case 'azure':
        secrets.add('AZURE_CREDENTIALS');
        break;
      case 'vercel':
        secrets.add('VERCEL_TOKEN');
        break;
      case 'netlify':
        secrets.add('NETLIFY_AUTH_TOKEN');
        secrets.add('NETLIFY_SITE_ID');
        break;
    }
  });
  
  if (config.notifications.type === 'slack') {
    secrets.add('SLACK_WEBHOOK');
  } else if (config.notifications.type === 'discord') {
    secrets.add('DISCORD_WEBHOOK');
  }
  
  return Array.from(secrets);
}

// Run the setup
main().catch(console.error);
