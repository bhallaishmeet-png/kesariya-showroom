const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Helper to verify caller is Owner
function verifyIsOwner(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const role = context.auth.token.role;
  if (role !== "owner") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only the website Owner can perform this action."
    );
  }
}

// 1. Auth trigger: Automatically create customer profile document on signup
exports.onUserSignUp = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection("users").doc(user.uid);
  
  // Default user structure
  const profile = {
    uid: user.uid,
    name: user.displayName || user.email.split("@")[0],
    email: user.email,
    phone: user.phoneNumber || "",
    role: "customer", // Default is customer
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    photoURL: user.photoURL || ""
  };

  try {
    await userRef.set(profile);
    console.log(`Created profile user: ${user.uid}`);
  } catch (err) {
    console.error(`Error creating customer profile for ${user.uid}:`, err);
  }
});

// 2. HTTPS Callable: Create Admin account securely from server
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  verifyIsOwner(context);

  const { name, email, password } = data;
  if (!name || !email || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Name, Email and Password are required."
    );
  }

  try {
    // 1. Create Auth Account
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name
    });

    const uid = userRecord.uid;

    // 2. Assign Custom Role Claim
    await admin.auth().setCustomUserClaims(uid, { role: "admin" });

    // 3. Create Firestore User Profile metadata
    const profile = {
      uid: uid,
      name: name,
      email: email,
      phone: "",
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      photoURL: ""
    };
    await db.collection("users").doc(uid).set(profile);

    // 4. Create admin collection record
    const adminRecord = {
      uid: uid,
      name: name,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      status: "active"
    };
    await db.collection("admins").doc(uid).set(adminRecord);

    console.log(`Successfully created Admin account: ${uid}`);
    return { success: true, uid: uid };

  } catch (err) {
    console.error("Error in createAdminUser:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});

// 3. HTTPS Callable: Delete Admin account
exports.deleteAdminUser = functions.https.onCall(async (data, context) => {
  verifyIsOwner(context);

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "UID is required.");
  }

  // Prevent Owner from deleting self
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Owner cannot delete their own account."
    );
  }

  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete Firestore profile
    await db.collection("users").doc(uid).delete();

    // Delete admin record
    await db.collection("admins").doc(uid).delete();

    console.log(`Deleted Admin user: ${uid}`);
    return { success: true };
  } catch (err) {
    console.error("Error in deleteAdminUser:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});

// 4. HTTPS Callable: Disable/Enable Admin account
exports.toggleAdminStatus = functions.https.onCall(async (data, context) => {
  verifyIsOwner(context);

  const { uid, status } = data; // status is 'active' or 'disabled'
  if (!uid || !status) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID and status are required."
    );
  }

  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Owner cannot change their own privileges."
    );
  }

  const disabled = (status === "disabled");

  try {
    // Update Auth account state
    await admin.auth().updateUser(uid, { disabled: disabled });

    // Update status field in admins collection
    await db.collection("admins").doc(uid).update({
      status: status
    });

    console.log(`Toggled status of Admin: ${uid} to ${status}`);
    return { success: true };
  } catch (err) {
    console.error("Error in toggleAdminStatus:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});

// 5. HTTPS Callable: Reset Admin Password
exports.resetAdminPassword = functions.https.onCall(async (data, context) => {
  verifyIsOwner(context);

  const { uid, password } = data;
  if (!uid || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID and new Password are required."
    );
  }

  try {
    // Update password via Auth SDK
    await admin.auth().updateUser(uid, { password: password });

    console.log(`Password reset successfully for Admin: ${uid}`);
    return { success: true };
  } catch (err) {
    console.error("Error in resetAdminPassword:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
