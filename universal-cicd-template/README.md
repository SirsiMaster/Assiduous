# Universal CI/CD Pipeline Template
## A Reusable, Multi-Cloud Deployment System

### 🚀 Overview
This is a universal CI/CD pipeline template that can be implemented in any project for automated deployment to Azure, AWS, Firebase, or other cloud providers. It's designed to be flexible, modular, and easily customizable.

### ✨ Features
- **Multi-Cloud Support**: Deploy to Azure, AWS, Firebase, Vercel, Netlify, or custom servers
- **Framework Agnostic**: Works with React, Vue, Angular, Next.js, vanilla JS, Python, Node.js, etc.
- **Automated Testing**: Run tests before deployment
- **Environment Management**: Handle dev, staging, and production environments
- **Metrics & Analytics**: Track deployments, build times, and success rates
- **Rollback Capability**: Automatic rollback on deployment failure
- **Security**: Secret management and security scanning
- **Notifications**: Slack, Discord, email notifications

### 📁 Template Structure
```
universal-cicd-template/
├── README.md                           # This file
├── templates/
│   ├── github-actions/
│   │   ├── universal-deploy.yml        # Main deployment workflow
│   │   ├── pr-checks.yml              # Pull request validation
│   │   ├── scheduled-tasks.yml        # Scheduled jobs
│   │   └── rollback.yml              # Rollback workflow
│   ├── gitlab-ci/
│   │   └── .gitlab-ci.yml            # GitLab CI/CD configuration
│   ├── azure-devops/
│   │   └── azure-pipelines.yml       # Azure DevOps pipeline
│   └── bitbucket/
│       └── bitbucket-pipelines.yml   # Bitbucket pipeline
├── scripts/
│   ├── setup-pipeline.js             # Interactive setup script
│   ├── deploy.js                     # Universal deployment script
│   ├── test-runner.js                # Test execution script
│   └── rollback.js                   # Rollback script
├── configs/
│   ├── providers/
│   │   ├── firebase.config.js        # Firebase configuration
│   │   ├── aws.config.js            # AWS configuration
│   │   ├── azure.config.js          # Azure configuration
│   │   └── custom.config.js         # Custom provider configuration
│   └── environments/
│       ├── development.env.example   # Development environment
│       ├── staging.env.example       # Staging environment
│       └── production.env.example    # Production environment
└── docs/
    ├── SETUP.md                      # Setup instructions
    ├── PROVIDERS.md                  # Provider-specific guides
    └── TROUBLESHOOTING.md           # Common issues and solutions
```

### 🏃 Quick Start

#### 1. Copy Template to Your Project
```bash
# Clone or copy the template
cp -r universal-cicd-template/.github/workflows .github/workflows/

# Or use the setup script
npx @sirsimaster/cicd-setup
```

#### 2. Configure Your Provider
```bash
# Run interactive setup
node scripts/setup-pipeline.js

# Or manually edit the configuration
cp configs/providers/firebase.config.js.example .cicd/config.js
```

#### 3. Set Up Secrets
Add these secrets to your repository:
- **Firebase**: `FIREBASE_TOKEN`
- **AWS**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Azure**: `AZURE_CREDENTIALS`

#### 4. Customize the Workflow
Edit `.github/workflows/universal-deploy.yml` to match your needs.

### 📋 Supported Providers

| Provider | Status | Documentation |
|----------|--------|---------------|
| Firebase | ✅ Ready | [View Docs](#firebase) |
| AWS (S3 + CloudFront) | ✅ Ready | [View Docs](#aws) |
| Azure (Storage + CDN) | ✅ Ready | [View Docs](#azure) |
| Vercel | ✅ Ready | [View Docs](#vercel) |
| Netlify | ✅ Ready | [View Docs](#netlify) |
| Google Cloud | 🚧 Coming Soon | - |
| Digital Ocean | 🚧 Coming Soon | - |
| Custom Server | ✅ Ready | [View Docs](#custom) |

### 🔧 Configuration Options

```javascript
// .cicd/config.js
module.exports = {
  // Project Information
  project: {
    name: 'my-awesome-app',
    type: 'web', // web, api, mobile, desktop
    framework: 'react', // react, vue, angular, nextjs, vanilla, etc.
  },
  
  // Build Configuration
  build: {
    command: 'npm run build',
    outputDir: 'dist',
    nodeVersion: '18',
  },
  
  // Test Configuration
  testing: {
    enabled: true,
    command: 'npm test',
    coverage: {
      enabled: true,
      threshold: 80,
    },
  },
  
  // Deployment Providers
  providers: {
    production: {
      type: 'firebase',
      projectId: 'my-project-prod',
      site: 'my-app',
    },
    staging: {
      type: 'aws',
      bucket: 'my-app-staging',
      region: 'us-east-1',
      cloudfront: 'E1234567890',
    },
    development: {
      type: 'netlify',
      siteId: 'abc-123-def',
    },
  },
  
  // Notifications
  notifications: {
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK,
      channels: {
        success: '#deployments',
        failure: '#alerts',
      },
    },
    email: {
      enabled: false,
      recipients: ['team@example.com'],
    },
  },
  
  // Advanced Options
  advanced: {
    parallelJobs: true,
    caching: true,
    dockerize: false,
    metrics: true,
    security: {
      scanning: true,
      secretsCheck: true,
    },
  },
};
```

### 📊 Metrics & Analytics

The pipeline automatically tracks:
- **Deployment Frequency**: How often you deploy
- **Build Duration**: Time taken for each build
- **Success Rate**: Percentage of successful deployments
- **Rollback Frequency**: How often rollbacks are needed
- **Cost Tracking**: Cloud resource costs (when available)

View metrics at: `https://your-app.com/admin/cicd-metrics`

### 🔄 Rollback Strategy

Automatic rollback triggers when:
- Build fails
- Tests fail
- Deployment fails
- Health checks fail post-deployment

Manual rollback:
```bash
# Rollback to previous version
npm run rollback

# Rollback to specific version
npm run rollback -- --version=v1.2.3
```

### 🔐 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Use secret scanning** - Enabled by default
3. **Implement SAST** - Static Application Security Testing
4. **Use least privilege** - Minimal permissions for CI/CD
5. **Audit logs** - Track all deployments and changes

### 📝 Environment Variables

#### Required for All Providers
```env
NODE_ENV=production
CI_CD_ENABLED=true
PROJECT_NAME=my-app
```

#### Firebase
```env
FIREBASE_TOKEN=your-token
FIREBASE_PROJECT=project-id
```

#### AWS
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=bucket-name
```

#### Azure
```env
AZURE_CREDENTIALS=json-credentials
AZURE_STORAGE_ACCOUNT=account-name
AZURE_RESOURCE_GROUP=rg-name
```

### 🎯 Usage Examples

#### Basic Web App to Firebase
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: sirsimaster/universal-cicd/.github/workflows/deploy.yml@v1
    with:
      provider: firebase
      environment: production
    secrets: inherit
```

#### Node.js API to AWS
```yaml
name: Deploy API to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: sirsimaster/universal-cicd/.github/workflows/deploy.yml@v1
    with:
      provider: aws
      service: lambda
      environment: production
    secrets: inherit
```

#### Multi-Environment Setup
```yaml
name: Multi-Environment Deployment
on:
  push:
    branches: 
      - main
      - staging
      - develop

jobs:
  determine-environment:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.env.outputs.environment }}
    steps:
      - id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
          fi
  
  deploy:
    needs: determine-environment
    uses: sirsimaster/universal-cicd/.github/workflows/deploy.yml@v1
    with:
      environment: ${{ needs.determine-environment.outputs.environment }}
    secrets: inherit
```

### 🤝 Contributing

To add support for a new provider:
1. Create config in `configs/providers/`
2. Add deployment logic to `scripts/deploy.js`
3. Update documentation
4. Submit a pull request

### 📜 License

MIT License - Use freely in all your projects!

### 🙋 Support

- **Documentation**: [Full Docs](https://sirsimaster.dev/cicd-template)
- **Issues**: [GitHub Issues](https://github.com/sirsimaster/universal-cicd/issues)
- **Discord**: [Join Community](https://discord.gg/sirsimaster)

---

*Created by SirsiMaster - Build once, deploy everywhere!*
