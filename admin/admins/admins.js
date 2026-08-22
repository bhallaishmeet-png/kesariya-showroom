/* admin/admins/admins.js - Owner Admin Management Portal */

document.addEventListener('DOMContentLoaded', () => {
  // --- Firebase Config ---
  const firebaseConfig = {
    apiKey: "AIzaSyDTVaNtEa_B82yoHNAEXRjmFDiJxpUK40w",
    authDomain: "kesariya-saree.firebaseapp.com",
    projectId: "kesariya-saree",
    storageBucket: "kesariya-saree.firebasestorage.app",
    messagingSenderId: "708874732554",
    appId: "1:708874732554:web:1c2e72ba49249dbbfc4bf3",
    measurementId: "G-YQ1X1XCKGR"
  };

  let auth = null;
  let db = null;
  let functions = null;

  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    functions = firebase.functions();
  } else {
    console.error("Firebase SDK script loading failed in Admins Portal.");
    return;
  }

  // --- Auth state routing protection ---
  const loadingOverlay = document.getElementById('auth-loading-overlay');
  const deniedMsg = document.getElementById('auth-denied-message');
  const dashboardLayout = document.getElementById('admin-dashboard-layout');
  
  const ownerInitials = document.getElementById('owner-initials');
  const ownerNameDisplay = document.getElementById('owner-name-display');
  const logoutBtn = document.getElementById('owner-logout-btn');

  let currentOwner = null;

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      showAccessDenied(true); // redirect to root /
      return;
    }

    try {
      // Force refresh token to read latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;

      if (role !== 'owner') {
        // Not owner, redirect back to /admin
        showAccessDenied(false); 
        return;
      }

      currentOwner = user;

      // Reveal dashboard UI
      loadingOverlay.classList.add('hidden');
      dashboardLayout.classList.remove('hidden');

      // Customize UI details
      ownerNameDisplay.textContent = user.displayName || user.email.split('@')[0];
      ownerInitials.textContent = (user.displayName || user.email)[0].toUpperCase();

      // Load admins table list
      initAdminsPage();

    } catch (err) {
      console.error("Error verifying ID token claims:", err);
      showAccessDenied(true);
    }
  });

  function showAccessDenied(redirectToRoot) {
    deniedMsg.classList.remove('hidden');
    loadingOverlay.querySelector('.animate-spin').classList.add('hidden');
    loadingOverlay.querySelector('p').classList.add('hidden');
    
    setTimeout(() => {
      window.location.href = redirectToRoot ? '../../' : '../index.html';
    }, 2500);
  }

  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = '../../';
    });
  });

  // --- Manage Admins logic ---
  const createAdminBtn = document.getElementById('create-admin-btn');
  const createModal = document.getElementById('create-admin-modal');
  const closeCreateModal = document.getElementById('close-create-modal');
  const cancelCreateBtn = document.getElementById('cancel-create-btn');
  const createForm = document.getElementById('create-admin-form');
  const createError = document.getElementById('create-modal-error');
  const submitCreateBtn = document.getElementById('submit-create-btn');

  const resetModal = document.getElementById('reset-password-modal');
  const closeResetModal = document.getElementById('close-reset-modal');
  const cancelResetBtn = document.getElementById('cancel-reset-btn');
  const resetForm = document.getElementById('reset-password-form');
  const resetError = document.getElementById('reset-modal-error');

  function initAdminsPage() {
    db.collection('admins').onSnapshot(snap => {
      const tableBody = document.getElementById('admins-table-body');
      tableBody.innerHTML = '';

      snap.forEach(doc => {
        const admin = doc.data();
        const row = document.createElement('tr');
        row.className = 'border-b border-gray hover:bg-gray-light';
        
        const dateStr = admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString() : '--';
        const isActive = (admin.status === 'active');

        row.innerHTML = `
          <td class="p-4 font-bold text-charcoal">${admin.name}</td>
          <td class="p-4">${admin.email}</td>
          <td class="p-4">${dateStr}</td>
          <td class="p-4"><span class="px-2.5 py-0.5 text-[10px] rounded-full font-bold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${admin.status}</span></td>
          <td class="p-4 text-right space-x-2">
            <button class="toggle-status-btn text-xs text-blue-600 hover:underline" data-uid="${admin.uid}" data-status="${admin.status}">${isActive ? 'Disable' : 'Enable'}</button>
            <button class="reset-pwd-btn text-xs text-indigo-600 hover:underline" data-uid="${admin.uid}"><i class="fa-solid fa-key"></i> Key</button>
            <button class="delete-admin-btn text-xs text-pink hover:underline" data-uid="${admin.uid}"><i class="fa-solid fa-trash"></i> Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Bind actions
      tableBody.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.currentTarget.getAttribute('data-uid');
          const currentStatus = e.currentTarget.getAttribute('data-status');
          const newStatus = (currentStatus === 'active') ? 'disabled' : 'active';
          toggleAdmin(uid, newStatus);
        });
      });

      tableBody.querySelectorAll('.reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.currentTarget.getAttribute('data-uid');
          openResetModal(uid);
        });
      });

      tableBody.querySelectorAll('.delete-admin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.currentTarget.getAttribute('data-uid');
          deleteAdmin(uid);
        });
      });
    });
  }

  // Add Admin Account
  createAdminBtn.addEventListener('click', () => {
    createForm.reset();
    createError.classList.add('hidden');
    createModal.classList.remove('hidden');
  });

  closeCreateModal.addEventListener('click', () => createModal.classList.add('hidden'));
  cancelCreateBtn.addEventListener('click', () => createModal.classList.add('hidden'));

  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    createError.classList.add('hidden');

    const name = document.getElementById('admin-name').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    submitCreateBtn.disabled = true;
    submitCreateBtn.textContent = "Creating...";

    try {
      // Call secure HTTPS Callable Cloud Function
      const createAdminUser = functions.httpsCallable('createAdminUser');
      await createAdminUser({ name, email, password });
      
      createModal.classList.add('hidden');
      createForm.reset();
    } catch (err) {
      console.error(err);
      if (err.message && (err.message.includes('internal') || err.code === 'internal' || err.code === 'not-found')) {
        createError.textContent = "Error: Cloud Functions are either not deployed or the project region is mismatching. Please run 'firebase deploy --only functions' in your terminal and check your Firebase console for active triggers.";
      } else {
        createError.textContent = err.message;
      }
      createError.classList.remove('hidden');
    } finally {
      submitCreateBtn.disabled = false;
      submitCreateBtn.textContent = "Create Account";
    }
  });

  // Toggle Admin Status
  async function toggleAdmin(uid, newStatus) {
    if (!confirm(`Are you sure you want to change this admin account status to "${newStatus}"?`)) return;
    
    try {
      const toggleAdminStatus = functions.httpsCallable('toggleAdminStatus');
      await toggleAdminStatus({ uid, status: newStatus });
      console.log(`Changed Admin status of ${uid} to ${newStatus}`);
    } catch (err) {
      console.error(err);
      if (err.message && (err.message.includes('internal') || err.code === 'internal' || err.code === 'not-found')) {
        alert("Error: Cloud Functions are either not deployed or the project region is mismatching. Please run 'firebase deploy --only functions' in your terminal.");
      } else {
        alert("Error changing status: " + err.message);
      }
    }
  }

  // Reset password triggers
  function openResetModal(uid) {
    resetForm.reset();
    resetError.classList.add('hidden');
    document.getElementById('reset-admin-uid').value = uid;
    resetModal.classList.remove('hidden');
  }

  closeResetModal.addEventListener('click', () => resetModal.classList.add('hidden'));
  cancelResetBtn.addEventListener('click', () => resetModal.classList.add('hidden'));

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetError.classList.add('hidden');

    const uid = document.getElementById('reset-admin-uid').value;
    const newPassword = document.getElementById('new-password').value;

    if (newPassword.length < 6) {
      resetError.textContent = "Password must be at least 6 characters.";
      resetError.classList.remove('hidden');
      return;
    }

    try {
      const resetAdminPassword = functions.httpsCallable('resetAdminPassword');
      await resetAdminPassword({ uid, password: newPassword });
      
      resetModal.classList.add('hidden');
      resetForm.reset();
      alert("Password updated successfully.");
    } catch (err) {
      console.error(err);
      if (err.message && (err.message.includes('internal') || err.code === 'internal' || err.code === 'not-found')) {
        resetError.textContent = "Error: Cloud Functions are either not deployed or the project region is mismatching. Please run 'firebase deploy --only functions' in your terminal.";
      } else {
        resetError.textContent = err.message;
      }
      resetError.classList.remove('hidden');
    }
  });

  // Delete Admin
  async function deleteAdmin(uid) {
    if (!confirm("CRITICAL: Are you sure you want to permanently delete this Admin? All access will be revoked immediately and this action CANNOT be undone.")) return;
    
    try {
      const deleteAdminUser = functions.httpsCallable('deleteAdminUser');
      await deleteAdminUser({ uid });
      console.log(`Successfully deleted Admin ${uid}`);
    } catch (err) {
      console.error(err);
      if (err.message && (err.message.includes('internal') || err.code === 'internal' || err.code === 'not-found')) {
        alert("Error: Cloud Functions are either not deployed or the project region is mismatching. Please run 'firebase deploy --only functions' in your terminal.");
      } else {
        alert("Error deleting admin account: " + err.message);
      }
    }
  }
});
