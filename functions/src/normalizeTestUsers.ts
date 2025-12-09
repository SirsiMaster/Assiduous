/**
 * normalizeTestUsers.ts
 *
 * Cloud Function to normalize test accounts for Assiduous:
 * - Look up Auth user by email
 * - Create/patch users/{uid} with canonical fields
 *
 * Usage (after deploy):
 *   - Call via HTTPS with optional ?dryRun=true to preview changes.
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Ensure admin is initialized (index.ts already calls initializeApp, but guard anyway)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// List of canonical test users to normalize
// These must already exist in Firebase Auth; this function ONLY patches
// their Firestore user profiles (users/{uid}).
const TEST_USERS: Array<{
  email: string;
  // Optional canonical password for test accounts. When provided, normalizeTestUsers
  // will ensure Auth has this exact password (create or update the Auth user).
  password?: string;
  role: "admin" | "agent" | "client" | "investor";
  status?: string;
  agentInfo?: {
    status?: string;
    licenseNumber?: string;
    licenseState?: string;
    brokerageName?: string;
    licenseExpiry?: string; // ISO date string
  };
  profileComplete?: boolean;
}> = [
  {
    email: "admin@assiduousrealty.com",
    password: "Ff1r*E$dh^A5&0PC",
    role: "admin",
    status: "active",
  },
  {
    email: "agent@assiduousrealty.com",
    password: "@QXYbuV5oq#2%Lny",
    role: "agent",
    status: "active",
    agentInfo: {
      status: "approved",
      licenseNumber: "TEST-AGENT",
      licenseState: "PA",
      brokerageName: "Assiduous Realty",
    },
  },
  {
    email: "client@assiduousrealty.com",
    password: "r9V1eDn@vF6EKf^M",
    role: "client",
    status: "active",
    profileComplete: true,
  },
  {
    email: "investor@assiduousrealty.com",
    password: "Or@J7%HKp9aF6*Um",
    role: "investor",
    status: "active",
    profileComplete: true,
  },
];

export const normalizeTestUsers = onRequest({
  region: "us-central1",
  maxInstances: 1,
}, async (req, res) => {
  const dryRun = (req.query.dryRun === "true" || req.query.dryRun === "1");
  logger.info("normalizeTestUsers invoked", {dryRun});

  const auth = admin.auth();
  const results: any[] = [];

  for (const userConfig of TEST_USERS) {
    const {email, role, status, agentInfo, profileComplete, password} = userConfig;
    const result: any = {email};

    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        result.uid = userRecord.uid;
        logger.info("Found Auth user", {email, uid: userRecord.uid});
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          result.authUserMissing = true;
          logger.warn("Auth user missing for test account; will create", {email});
          if (!dryRun && password) {
            userRecord = await auth.createUser({
              email,
              password,
              displayName: email,
              emailVerified: true,
            });
            result.uid = userRecord.uid;
            result.action = "create_auth_user";
          }
        } else {
          throw err;
        }
      }

      if (!userRecord) {
        // In dryRun mode with missing auth user, skip Firestore patch.
        if (!dryRun) {
          throw new Error("Unable to resolve Auth user for " + email);
        }
        results.push({...result, success: true, note: "Would create auth + Firestore user"});
        continue;
      }

      // Ensure password matches canonical value when provided
      if (password && !dryRun) {
        await auth.updateUser(userRecord.uid, {
          password,
          emailVerified: true,
        });
        result.passwordReset = true;
      }

      const uid = userRecord.uid;
      const userDocRef = db.collection("users").doc(uid);
      const userSnap = await userDocRef.get();
      const now = admin.firestore.FieldValue.serverTimestamp();

      const baseProfile: any = {
        email: userRecord.email,
        role: role || "client",
        status: status || "active",
        firstName: userRecord.displayName ? userRecord.displayName.split(" ")[0] : "",
        lastName: userRecord.displayName
          ? userRecord.displayName.split(" ").slice(1).join(" ")
          : "",
        displayName: userRecord.displayName || userRecord.email,
        phone: userRecord.phoneNumber || "",
        updatedAt: now,
      };

      if (role === "agent") {
        const expiryDate = agentInfo?.licenseExpiry
          ? new Date(agentInfo.licenseExpiry)
          : new Date(new Date().getFullYear() + 1, 0, 1);

        baseProfile.agentInfo = {
          status: agentInfo?.status || "approved",
          licenseNumber: agentInfo?.licenseNumber || "TEST-LICENSE",
          licenseState: agentInfo?.licenseState || "PA",
          brokerageName: agentInfo?.brokerageName || "Assiduous Realty",
          licenseExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
          approvedAt: now,
          approvedBy: "normalizeTestUsers-function",
        };
      }

      if (role === "client" || role === "investor") {
        baseProfile.profileComplete =
          typeof profileComplete === "boolean" ? profileComplete : true;
      }

      if (!userSnap.exists) {
        result.action = "create";
        logger.info("Creating new users doc", {uid, email, role});
        if (!dryRun) {
          baseProfile.createdAt = now;
          await userDocRef.set(baseProfile, {merge: true});
        }
      } else {
        result.action = "update";
        logger.info("Updating existing users doc", {uid, email, role});
        if (!dryRun) {
          await userDocRef.set(baseProfile, {merge: true});
        }
      }

      // Also seed/update the sanitized public_profiles/{uid} document used for
      // QR-based public profile views. This ensures test accounts always have
      // a public-facing profile even if triggers were added after creation.
      if (!dryRun) {
        const publicProfile = {
          userId: uid,
          email: baseProfile.email,
          role: baseProfile.role,
          status: baseProfile.status,
          firstName: baseProfile.firstName,
          lastName: baseProfile.lastName,
          displayName: baseProfile.displayName,
          profile: {
            bio: "", // can be edited later via app
            city: "",
            state: "",
            zip: "",
            photoUrl: "",
            linkedinUrl: "",
            twitterHandle: "",
            instagramHandle: "",
            websiteUrl: "",
          },
          updatedAt: now,
        };
        await db.collection("public_profiles").doc(uid).set(publicProfile, {merge: true});
        result.publicProfileSynced = true;
      }

      result.success = true;
    } catch (err: any) {
      logger.error("Failed to normalize test user", {email, error: err.message});
      result.success = false;
      result.error = err.message;
    }

    results.push(result);
  }

  res.status(200).json({
    dryRun,
    results,
  });
});
