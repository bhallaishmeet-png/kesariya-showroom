/* scripts/bootstrap_owner.js
 * One-time setup script to initialize the first Owner account securely using Firebase Admin SDK.
 *
 * Usage:
 * 1. Place your Firebase Service Account JSON key inside scripts/serviceAccountKey.json
 * 2. Run: node scripts/bootstrap_owner.js <email> <password> <displayName>
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: Service Account JSON key not found at scripts/serviceAccountKey.json");
  console.log("Please download your service account key from Firebase Console -> Project Settings -> Service accounts and place it there.");
  process.exit(1);
}

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const name = args[2] || "Owner";

if (!email || !password) {
  console.error("Error: Email and password arguments are required.");
  console.log("Usage: node scripts/bootstrap_owner.js <email> <password> [displayName]");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK using modern modular style
initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const db = getFirestore();

async function bootstrapOwner() {
  console.log(`Checking if user exists for email: ${email}...`);
  let userRecord;
  let uid;
  
  try {
    userRecord = await auth.getUserByEmail(email);
    uid = userRecord.uid;
    console.log(`User already exists with UID: ${uid}. Updating role claims...`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log("User does not exist. Creating new user account...");
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name
      });
      uid = userRecord.uid;
      console.log(`Successfully created new user account with UID: ${uid}`);
    } else {
      console.error("Error checking user:", error);
      process.exit(1);
    }
  }

  try {
    // 1. Set Custom Claim role = 'owner'
    console.log("Setting Custom Claim role = 'owner'...");
    await auth.setCustomUserClaims(uid, { role: "owner" });
    
    // 2. Set Firestore User Document profile
    console.log("Setting Firestore profile users/{uid}...");
    const profile = {
      uid: uid,
      name: name,
      email: email,
      phone: "",
      role: "owner",
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      photoURL: ""
    };
    await db.collection("users").doc(uid).set(profile);
    
    console.log("\n==============================================");
    console.log("SUCCESS: Initial owner bootstrapping complete!");
    console.log(`Email:        ${email}`);
    console.log(`UID:          ${uid}`);
    console.log("Role claims assigned successfully: { role: 'owner' }");
    console.log("==============================================");
    process.exit(0);

  } catch (err) {
    console.error("Bootstrapping failed:", err);
    process.exit(1);
  }
}

bootstrapOwner();
