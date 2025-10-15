import * as sgMail from "@sendgrid/mail";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

/**
 * Email Service using SendGrid
 * Handles all transactional emails for Assiduous platform
 */

// Initialize SendGrid (API key from environment)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn("SendGrid API key not configured. Email sending disabled.");
}

const FROM_EMAIL = "noreply@assiduous.com";
const FROM_NAME = "Assiduous Real Estate";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: any;
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    logger.warn("Cannot send email - SendGrid not configured");
    return false;
  }

  try {
    const msg: any = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
    };

    // Use dynamic template or raw HTML
    if (options.templateId && options.dynamicTemplateData) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.dynamicTemplateData;
    } else {
      msg.html = options.html;
      if (options.text) {
        msg.text = options.text;
      }
    }

    await sgMail.send(msg);
    logger.info(`Email sent successfully to ${options.to}`);

    // Log to Firestore
    await admin.firestore().collection("email_logs").add({
      to: options.to,
      subject: options.subject,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "sent",
    });

    return true;
  } catch (error: any) {
    logger.error("Email send error:", error);

    // Log error to Firestore
    await admin.firestore().collection("email_logs").add({
      to: options.to,
      subject: options.subject,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "failed",
      error: error.message,
    });

    return false;
  }
}

/**
 * Check if user has opted into emails
 */
async function canSendEmail(userId: string, emailType: string): Promise<boolean> {
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData) return false;

  const preferences = userData.emailPreferences || {
    marketing: true,
    transactional: true,
    propertyAlerts: true,
    leadNotifications: true,
  };

  // Transactional emails always sent
  if (emailType === "transactional") return true;

  // Check specific preferences
  return preferences[emailType] !== false;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Welcome email for new users
 */
export async function sendWelcomeEmail(userId: string, email: string, name: string): Promise<boolean> {
  const canSend = await canSendEmail(userId, "transactional");
  if (!canSend) return false;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4299e1; color: white; padding: 30px; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #4299e1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Assiduous!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>We're thrilled to have you join Assiduous, the AI-powered micro-flipping platform that's revolutionizing real estate investing.</p>
      
      <p><strong>Here's what you can do next:</strong></p>
      <ul>
        <li>Browse our curated property listings with micro-flip potential</li>
        <li>Get instant ROI projections powered by AI</li>
        <li>Save your favorite properties and set up alerts</li>
        <li>Schedule viewings with local agents</li>
      </ul>

      <a href="https://assiduous-prod.web.app/client/" class="button">Explore Properties</a>

      <p>Our platform analyzes thousands of properties daily to find you the best micro-flipping opportunities with $2-5K profit potential.</p>

      <p>Questions? Reply to this email or contact our support team anytime.</p>

      <p>Happy investing!<br>
      The Assiduous Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Assiduous Real Estate. All rights reserved.</p>
      <p><a href="https://assiduous-prod.web.app/">Visit Website</a> | <a href="https://assiduous-prod.web.app/admin/settings.html">Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: email,
    subject: "Welcome to Assiduous - Start Your Micro-Flipping Journey!",
    html,
    text: `Hi ${name}, Welcome to Assiduous! Browse properties at https://assiduous-prod.web.app/client/`,
  });
}

/**
 * Lead notification for agents
 */
export async function sendLeadNotification(
  agentEmail: string,
  leadData: any
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #48bb78; color: white; padding: 30px; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .lead-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .label { font-weight: bold; color: #2d3748; }
    .value { color: #4a5568; margin-bottom: 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #48bb78; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New Lead Alert!</h1>
    </div>
    <div class="content">
      <p>You have a new lead inquiry from Assiduous.</p>
      
      <div class="lead-info">
        <div class="label">Contact Information:</div>
        <div class="value"><strong>Name:</strong> ${leadData.name}</div>
        <div class="value"><strong>Email:</strong> ${leadData.email}</div>
        <div class="value"><strong>Phone:</strong> ${leadData.phone || "Not provided"}</div>
        
        <div class="label" style="margin-top: 20px;">Property Interest:</div>
        <div class="value"><strong>Property:</strong> ${leadData.propertyTitle || "General inquiry"}</div>
        ${leadData.propertyId ? `<div class="value"><strong>Property ID:</strong> ${leadData.propertyId}</div>` : ""}
        
        <div class="label" style="margin-top: 20px;">Message:</div>
        <div class="value">${leadData.message || "No message provided"}</div>
        
        <div class="value" style="margin-top: 20px;"><strong>Type:</strong> ${leadData.type || "General inquiry"}</div>
        <div class="value"><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
      </div>

      <a href="https://assiduous-prod.web.app/admin/leads.html" class="button">View in CRM</a>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Respond within 5 minutes for best conversion rates</li>
        <li>Check the lead's property preferences in the CRM</li>
        <li>Schedule a viewing if appropriate</li>
      </ul>

      <p>Good luck closing this deal!</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Assiduous Real Estate</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: agentEmail,
    subject: `New Lead: ${leadData.name} - ${leadData.propertyTitle || "General Inquiry"}`,
    html,
  });
}

/**
 * Viewing confirmation email
 */
export async function sendViewingConfirmation(
  userEmail: string,
  viewingData: any
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4299e1; color: white; padding: 30px; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .viewing-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299e1; }
    .label { font-weight: bold; color: #2d3748; }
    .value { color: #4a5568; margin-bottom: 10px; }
    .button { display: inline-block; padding: 12px 24px; background: #4299e1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Viewing Confirmed!</h1>
    </div>
    <div class="content">
      <p>Your property viewing has been confirmed.</p>
      
      <div class="viewing-details">
        <div class="label">Property:</div>
        <div class="value">${viewingData.propertyTitle}</div>
        <div class="value">${viewingData.propertyAddress}</div>
        
        <div class="label" style="margin-top: 20px;">Date & Time:</div>
        <div class="value"><strong>${viewingData.date}</strong> at <strong>${viewingData.time}</strong></div>
        
        <div class="label" style="margin-top: 20px;">Agent:</div>
        <div class="value">${viewingData.agentName}</div>
        <div class="value">${viewingData.agentPhone}</div>
        <div class="value">${viewingData.agentEmail}</div>
        
        ${viewingData.notes ? `<div class="label" style="margin-top: 20px;">Special Instructions:</div><div class="value">${viewingData.notes}</div>` : ""}
      </div>

      <a href="https://assiduous-prod.web.app/client/viewings.html" class="button">View My Schedule</a>

      <p><strong>Before the Viewing:</strong></p>
      <ul>
        <li>Review the property details and micro-flip analysis</li>
        <li>Prepare questions about renovation costs and timeline</li>
        <li>Arrive 5 minutes early</li>
        <li>Bring photo ID</li>
      </ul>

      <p>Need to reschedule? <a href="https://assiduous-prod.web.app/client/viewings.html">Click here</a></p>
    </div>
    <div class="footer">
      <p>Add to calendar: <a href="#">Google Calendar</a> | <a href="#">Outlook</a></p>
      <p>&copy; 2025 Assiduous Real Estate</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: `Viewing Confirmed: ${viewingData.propertyTitle} - ${viewingData.date}`,
    html,
  });
}

/**
 * Property alert email
 */
export async function sendPropertyAlert(
  userEmail: string,
  properties: any[]
): Promise<boolean> {
  const propertyList = properties.map((p) => `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 10px 0; color: #2d3748;">${p.title}</h3>
      <p style="color: #4a5568; margin: 5px 0;"><strong>Price:</strong> $${p.price.toLocaleString()}</p>
      <p style="color: #4a5568; margin: 5px 0;"><strong>ROI Potential:</strong> ${p.roiPotential || "$2-5K"}</p>
      <p style="color: #4a5568; margin: 5px 0;">${p.bedrooms} bed, ${p.bathrooms} bath | ${p.squareFeet} sq ft</p>
      <a href="https://assiduous-prod.web.app/client/property-detail.html?id=${p.id}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #4299e1; color: white; text-decoration: none; border-radius: 4px;">View Details</a>
    </div>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f6ad55; color: white; padding: 30px; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 New Properties Match Your Criteria!</h1>
    </div>
    <div class="content">
      <p>We found ${properties.length} new micro-flipping ${properties.length === 1 ? "opportunity" : "opportunities"} that match your preferences:</p>
      
      ${propertyList}

      <p style="margin-top: 30px;">These properties were selected based on your saved preferences and have strong micro-flip potential.</p>

      <p><a href="https://assiduous-prod.web.app/admin/settings.html">Update your alert preferences</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Assiduous Real Estate</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: `${properties.length} New Properties Match Your Criteria`,
    html,
  });
}

/**
 * Transaction update email
 */
export async function sendTransactionUpdate(
  userEmail: string,
  transactionData: any
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #9f7aea; color: white; padding: 30px; text-align: center; }
    .content { background: #f7fafc; padding: 30px; }
    .status { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9f7aea; }
    .button { display: inline-block; padding: 12px 24px; background: #9f7aea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Transaction Update</h1>
    </div>
    <div class="content">
      <p>Your transaction status has been updated.</p>
      
      <div class="status">
        <h3 style="margin: 0 0 15px 0;">${transactionData.propertyTitle}</h3>
        <p><strong>Status:</strong> <span style="color: #9f7aea; font-weight: bold;">${transactionData.status}</span></p>
        <p><strong>Update:</strong> ${transactionData.updateMessage}</p>
        ${transactionData.nextStep ? `<p><strong>Next Step:</strong> ${transactionData.nextStep}</p>` : ""}
        ${transactionData.dueDate ? `<p><strong>Due Date:</strong> ${transactionData.dueDate}</p>` : ""}
      </div>

      <a href="https://assiduous-prod.web.app/client/transactions.html" class="button">View Transaction</a>

      <p>Questions? Contact your agent or our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Assiduous Real Estate</p>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: userEmail,
    subject: `Transaction Update: ${transactionData.propertyTitle} - ${transactionData.status}`,
    html,
  });
}

// Export all email functions
export const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendLeadNotification,
  sendViewingConfirmation,
  sendPropertyAlert,
  sendTransactionUpdate,
};
