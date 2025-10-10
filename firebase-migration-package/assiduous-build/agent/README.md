# Agent Portal Access Guide

## How Agents Access the Dashboard

### 1. Direct Access
Agents can directly navigate to: `/agent/dashboard.html`

There's also a dedicated "Agent Portal" link in the main navigation bar on the landing page.

### 2. Login Access
From the main landing page (`/`):

1. Click "Sign In" in the top navigation
2. Enter your agent credentials:
   - Email: Your agent email (e.g., `sarah.johnson@assiduousrealty.com`)
   - Password: Your secure password

### 3. Auto-Routing Based on Email
The login system automatically detects agent accounts and routes them to the agent dashboard when:
- Email domain is `@assiduousrealty.com`
- Email is recognized as an agent account (e.g., `agent@demo.com`)
- Email is in the pre-approved agent list

### 4. Role-Based Routing
The system automatically routes users based on their role:
- **Agents** → `/agent/dashboard.html`
- **Admins** → `/admin/dashboard.html` 
- **Clients** → `/client/dashboard.html`

## Demo Access
For testing/demo purposes, you can use:
- Email: `agent@demo.com` or `sarah.johnson@assiduousrealty.com`
- Password: Any password (in demo mode)

## Agent Dashboard Features
Once logged in, agents have access to:
- **My Listings** - Manage active property listings
- **My Clients** - Client relationship management
- **My Leads** - Track and manage new leads
- **Schedule** - Appointment and showing calendar
- **Commission Tracker** - Monitor earnings and commissions
- **Resources** - Access training and marketing materials

## Security Notes
- Sessions expire after 24 hours of inactivity
- Agents should always log out when using shared computers
- Multi-factor authentication can be enabled in Settings

## Support
For login issues or account access problems:
- Contact IT Support: support@assiduousrealty.com
- Call Help Desk: 1-800-XXX-XXXX
- Submit a ticket through the admin portal