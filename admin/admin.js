/* admin/admin.js - Client operations for Kesariya Saree Showroom Dashboard */

document.addEventListener('DOMContentLoaded', () => {
  // --- Firebase Config (Re-verify) ---
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
  let storage = null;
  let functions = null;

  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    functions = firebase.functions();
  } else {
    console.error("Firebase SDK script loading failed in Admin Panel.");
    return;
  }

  // --- Auth state routing protection ---
  const loadingOverlay = document.getElementById('auth-loading-overlay');
  const deniedMsg = document.getElementById('auth-denied-message');
  const dashboardLayout = document.getElementById('admin-dashboard-layout');
  const sidebarAdminsTab = document.getElementById('sidebar-admins-tab');
  
  const adminInitials = document.getElementById('admin-initials');
  const adminNameDisplay = document.getElementById('admin-name-display');
  const adminRoleBadge = document.getElementById('admin-role-badge');
  const logoutBtn = document.getElementById('admin-logout-btn');

  let currentUser = null;
  let currentRole = 'customer';

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // User not logged in, show denied and redirect
      showAccessDenied();
      return;
    }

    try {
      // Force refresh token to read latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;

      if (role !== 'admin' && role !== 'owner') {
        // Not admin or owner
        showAccessDenied();
        return;
      }

      currentUser = user;
      currentRole = role;

      // Reveal dashboard UI
      loadingOverlay.classList.add('hidden');
      dashboardLayout.classList.remove('hidden');

      // Customize UI details
      adminNameDisplay.textContent = user.displayName || user.email.split('@')[0];
      adminInitials.textContent = (user.displayName || user.email)[0].toUpperCase();
      adminRoleBadge.textContent = role;

      if (role === 'owner') {
        sidebarAdminsTab.classList.remove('hidden');
      }

      // Initialize real-time listeners for all pages
      initDashboardMetrics();
      initProductsPage();
      initOrdersPage();
      initCustomersPage();
      initLogsPage();

    } catch (err) {
      console.error("Error verifying ID token claims:", err);
      showAccessDenied();
    }
  });

  function showAccessDenied() {
    deniedMsg.classList.remove('hidden');
    // Hide standard loading notch
    loadingOverlay.querySelector('.animate-spin').classList.add('hidden');
    loadingOverlay.querySelector('p').classList.add('hidden');
    
    setTimeout(() => {
      window.location.href = '../';
    }, 2500);
  }

  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = '../';
    });
  });

  // --- Navigation & Tab Toggles ---
  const sidebarItems = document.querySelectorAll('.admin-sidebar-item');
  const tabViews = document.querySelectorAll('.admin-tab-view');

  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const tabName = e.currentTarget.getAttribute('data-tab');
      
      sidebarItems.forEach(i => i.classList.remove('active'));
      e.currentTarget.classList.add('active');

      tabViews.forEach(v => {
        if (v.id === `tab-${tabName}`) {
          v.classList.remove('hidden');
        } else {
          v.classList.add('hidden');
        }
      });
    });
  });

  // --- Real-time Metrics Dashboard ---
  let productsCount = 0;
  let ordersCount = 0;
  let customersCount = 0;
  let totalSalesSum = 0;

  function initDashboardMetrics() {
    // Products count
    db.collection('products').onSnapshot(snap => {
      productsCount = snap.size;
      document.getElementById('stat-total-products').textContent = productsCount;
    });

    // Customers count
    db.collection('users').where('role', '==', 'customer').onSnapshot(snap => {
      customersCount = snap.size;
      document.getElementById('stat-total-customers').textContent = customersCount;
    });

    // Orders summary & total sales
    db.collection('orders').onSnapshot(snap => {
      ordersCount = snap.size;
      document.getElementById('stat-total-orders').textContent = ordersCount;

      totalSalesSum = 0;
      const recentOrdersList = document.getElementById('dashboard-recent-orders-list');
      recentOrdersList.innerHTML = '';

      // Sort local array by createdAt desc
      const docs = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      docs.forEach((order, idx) => {
        if (order.status === 'Confirmed' || order.status === 'Shipped' || order.status === 'Delivered') {
          totalSalesSum += (order.totalAmount || 0);
        }

        // Display top 5 recent orders on overview dashboard
        if (idx < 5) {
          const row = document.createElement('tr');
          row.className = 'border-b border-gray hover:bg-gray-light';
          
          const itemsSummary = (order.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ');
          const dateStr = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '--';
          
          row.innerHTML = `
            <td class="p-3 font-bold text-pink">${order.id}</td>
            <td class="p-3">${order.customerName}<br><span class="text-[10px] text-charcoal-light">${order.phone}</span></td>
            <td class="p-3 max-w-[200px] truncate">${itemsSummary}</td>
            <td class="p-3">${dateStr}</td>
            <td class="p-3 text-right font-bold text-charcoal">₹${order.totalAmount || 0}</td>
            <td class="p-3"><span class="px-2 py-0.5 text-[10px] rounded-full font-bold ${getStatusClass(order.status)}">${order.status}</span></td>
          `;
          recentOrdersList.appendChild(row);
        }
      });

      document.getElementById('stat-total-sales').textContent = `₹${totalSalesSum.toLocaleString()}`;
    });
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-indigo-100 text-indigo-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray text-charcoal';
    }
  }

  // --- Real-time Products Management ---
  const addProductBtn = document.getElementById('add-product-btn');
  const productModal = document.getElementById('product-modal-overlay');
  const closeProductModal = document.getElementById('close-product-modal');
  const cancelProductModal = document.getElementById('cancel-product-modal');
  const productForm = document.getElementById('product-form');
  
  const productModalTitle = document.getElementById('product-modal-title');
  const productModalError = document.getElementById('product-modal-error');
  
  const uploadImageBtn = document.getElementById('upload-image-btn');
  const imageFileInput = document.getElementById('product-image-file');
  const modalGallery = document.getElementById('modal-image-gallery');

  let currentGallery = [];
  let currentCoverImage = '';
  let activeProductId = '';

  function initProductsPage() {
    db.collection('products').onSnapshot(snap => {
      const tableBody = document.getElementById('products-table-body');
      tableBody.innerHTML = '';

      snap.forEach(doc => {
        const p = doc.data();
        const row = document.createElement('tr');
        row.className = 'border-b border-gray hover:bg-gray-light';
        row.innerHTML = `
          <td class="p-4"><img src="${p.coverImage || p.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=150'}" class="w-12 h-16 object-cover border border-gray"></td>
          <td class="p-4 font-bold text-charcoal">${p.name}</td>
          <td class="p-4">${p.category}</td>
          <td class="p-4 font-bold text-charcoal">₹${p.price}</td>
          <td class="p-4 font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-green-600'}">${p.stock} pcs</td>
          <td class="p-4 text-right space-x-2">
            <button class="edit-p-btn text-blue-600 hover:underline" data-id="${doc.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            <button class="delete-p-btn text-pink hover:underline" data-id="${doc.id}"><i class="fa-solid fa-trash"></i> Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Bind dynamic buttons
      tableBody.querySelectorAll('.edit-p-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openEditProductModal(id);
        });
      });

      tableBody.querySelectorAll('.delete-p-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          deleteProduct(id);
        });
      });
    });
  }

  // Add Product button triggers modal
  addProductBtn.addEventListener('click', () => {
    activeProductId = db.collection('products').doc().id; // generate auto-id for image uploading
    productModalTitle.textContent = "Add Product";
    productForm.reset();
    document.getElementById('edit-product-id').value = '';
    currentGallery = [];
    currentCoverImage = '';
    renderModalGallery();
    productModalError.classList.add('hidden');
    productModal.classList.remove('hidden');
  });

  closeProductModal.addEventListener('click', () => productModal.classList.add('hidden'));
  cancelProductModal.addEventListener('click', () => productModal.classList.add('hidden'));

  // Upload image to Storage
  uploadImageBtn.addEventListener('click', async () => {
    const file = imageFileInput.files[0];
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    uploadImageBtn.disabled = true;
    uploadImageBtn.textContent = "Uploading...";

    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `products/${activeProductId}/${fileName}`;
    const fileRef = storage.ref(storagePath);

    try {
      const task = await fileRef.put(file);
      const downloadURL = await task.ref.getDownloadURL();
      
      currentGallery.push(downloadURL);
      if (!currentCoverImage) {
        currentCoverImage = downloadURL; // first image becomes default cover
      }
      imageFileInput.value = ''; // clear input
      renderModalGallery();
    } catch (err) {
      console.error("Storage upload failed:", err);
      alert("Upload failed. Make sure rules permit this write and size is < 5MB.");
    } finally {
      uploadImageBtn.disabled = false;
      uploadImageBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>UPLOAD & ADD TO GALLERY</span>';
    }
  });

  function renderModalGallery() {
    modalGallery.innerHTML = '';
    
    if (currentGallery.length === 0) {
      modalGallery.innerHTML = '<p class="col-span-4 text-center text-xs text-charcoal-light py-4">No images uploaded yet.</p>';
      return;
    }

    currentGallery.forEach((url, idx) => {
      const isCover = (url === currentCoverImage);
      const imgDiv = document.createElement('div');
      imgDiv.className = 'relative group aspect-[3/4] border bg-white overflow-hidden ' + (isCover ? 'border-pink border-2' : 'border-gray');
      imgDiv.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover">
        
        <!-- Hover actions overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-1.5">
          <button type="button" class="del-gal-btn self-end text-red-500 hover:text-red-400" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button>
          
          <div class="flex justify-between space-x-1">
            <button type="button" class="set-cover-btn text-[9px] bg-pink text-white px-1 py-0.5 rounded" data-url="${url}">${isCover ? 'Cover' : 'Set Cover'}</button>
            <div class="flex space-x-0.5">
              <button type="button" class="move-left-btn bg-white/20 text-white p-0.5 rounded text-[8px]" data-idx="${idx}"><i class="fa-solid fa-arrow-left"></i></button>
              <button type="button" class="move-right-btn bg-white/20 text-white p-0.5 rounded text-[8px]" data-idx="${idx}"><i class="fa-solid fa-arrow-right"></i></button>
            </div>
          </div>
        </div>
      `;

      // Set cover trigger
      imgDiv.querySelector('.set-cover-btn').addEventListener('click', (e) => {
        currentCoverImage = e.currentTarget.getAttribute('data-url');
        renderModalGallery();
      });

      // Delete action
      imgDiv.querySelector('.del-gal-btn').addEventListener('click', async (e) => {
        const removeIdx = parseInt(e.currentTarget.getAttribute('data-idx'));
        const targetUrl = currentGallery[removeIdx];
        
        // Remove from memory
        currentGallery = currentGallery.filter((_, i) => i !== removeIdx);
        if (currentCoverImage === targetUrl) {
          currentCoverImage = currentGallery[0] || '';
        }
        
        renderModalGallery();

        // Delete file from Firebase Storage
        try {
          const fileRef = storage.refFromURL(targetUrl);
          await fileRef.delete();
          console.log("Deleted file from storage bucket:", targetUrl);
        } catch (err) {
          console.warn("Storage deletion warning (file might not exist in bucket):", err);
        }
      });

      // Shift position left/right (Reorder gallery)
      imgDiv.querySelector('.move-left-btn').addEventListener('click', () => {
        const i = idx;
        if (i > 0) {
          const temp = currentGallery[i];
          currentGallery[i] = currentGallery[i - 1];
          currentGallery[i - 1] = temp;
          renderModalGallery();
        }
      });

      imgDiv.querySelector('.move-right-btn').addEventListener('click', () => {
        const i = idx;
        if (i < currentGallery.length - 1) {
          const temp = currentGallery[i];
          currentGallery[i] = currentGallery[i + 1];
          currentGallery[i + 1] = temp;
          renderModalGallery();
        }
      });

      modalGallery.appendChild(imgDiv);
    });
  }

  // Submit product creation/edit
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    productModalError.classList.add('hidden');

    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const desc = document.getElementById('product-desc').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);

    if (currentGallery.length === 0) {
      productModalError.textContent = "Please upload at least one image.";
      productModalError.classList.remove('hidden');
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const docData = {
      name: name,
      slug: slug,
      category: category,
      description: desc,
      price: price,
      stock: stock,
      coverImage: currentCoverImage || currentGallery[0],
      images: currentGallery,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: currentUser.uid
    };

    try {
      if (editId) {
        // Edit product write
        await db.collection('products').doc(editId).update(docData);
      } else {
        // Create new product write
        docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        docData.createdBy = currentUser.uid;
        await db.collection('products').doc(activeProductId).set(docData);
      }
      productModal.classList.add('hidden');
    } catch (err) {
      productModalError.textContent = err.message;
      productModalError.classList.remove('hidden');
    }
  });

  async function openEditProductModal(id) {
    productModalTitle.textContent = "Edit Product";
    productModalError.classList.add('hidden');
    productForm.reset();
    
    try {
      const doc = await db.collection('products').doc(id).get();
      const p = doc.data();
      
      activeProductId = id;
      document.getElementById('edit-product-id').value = id;
      document.getElementById('product-name').value = p.name;
      document.getElementById('product-category').value = p.category;
      document.getElementById('product-desc').value = p.description;
      document.getElementById('product-price').value = p.price;
      document.getElementById('product-stock').value = p.stock;

      currentGallery = p.images || [];
      currentCoverImage = p.coverImage || '';

      renderModalGallery();
      productModal.classList.remove('hidden');
    } catch (err) {
      alert("Error loading product: " + err.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Are you sure you want to permanently delete this product? All catalog images will be removed.")) return;
    
    try {
      const doc = await db.collection('products').doc(id).get();
      const p = doc.data();

      // Delete images from Storage bucket
      if (p.images && p.images.length > 0) {
        for (const url of p.images) {
          try {
            const fileRef = storage.refFromURL(url);
            await fileRef.delete();
          } catch (err) {
            console.warn("Storage delete skip for url:", url);
          }
        }
      }

      // Delete document from Firestore
      await db.collection('products').doc(id).delete();
      console.log(`Deleted product document: ${id}`);
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  }

  // --- Real-time Orders Management ---
  function initOrdersPage() {
    const filterSelect = document.getElementById('orders-filter-status');
    
    const renderOrdersTable = (snapshot) => {
      const tableBody = document.getElementById('orders-table-body');
      tableBody.innerHTML = '';
      const filter = filterSelect.value;

      snapshot.forEach(doc => {
        const order = doc.data();
        
        // Apply status select filters
        if (filter !== 'all' && order.status !== filter) return;

        const row = document.createElement('tr');
        row.className = 'border-b border-gray hover:bg-gray-light';
        
        const dateStr = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : '--';
        const itemsList = (order.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ');

        row.innerHTML = `
          <td class="p-4 font-bold text-pink">${doc.id}</td>
          <td class="p-4 text-xs">
            <strong>${order.customerName}</strong><br>
            <span>Phone: ${order.phone}</span><br>
            <span>Email: ${order.email || '--'}</span>
          </td>
          <td class="p-4 max-w-[200px] truncate text-xs" title="${itemsList}">${itemsList}</td>
          <td class="p-4 text-xs">${order.address}</td>
          <td class="p-4">
            <select class="status-change-select flat-input py-1 px-2 text-[11px] w-28 bg-white" data-id="${doc.id}">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td class="p-4 text-right">
            <button class="delete-order-btn text-pink text-xs hover:underline" data-id="${doc.id}"><i class="fa-solid fa-trash"></i> Delete</button>
          </td>
        `;

        // Bind update status trigger
        row.querySelector('.status-change-select').addEventListener('change', async (e) => {
          const newStatus = e.target.value;
          const orderId = e.target.getAttribute('data-id');
          try {
            await db.collection('orders').doc(orderId).update({
              status: newStatus,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Updated status of order ${orderId} to ${newStatus}`);
          } catch (err) {
            alert("Error updating status: " + err.message);
          }
        });

        row.querySelector('.delete-order-btn').addEventListener('click', async (e) => {
          const orderId = e.currentTarget.getAttribute('data-id');
          if (confirm(`Delete order ${orderId}?`)) {
            await db.collection('orders').doc(orderId).delete();
          }
        });

        tableBody.appendChild(row);
      });
    };

    db.collection('orders').onSnapshot(snap => {
      renderOrdersTable(snap);
      filterSelect.onchange = () => renderOrdersTable(snap);
    });
  }

  // --- Customers Listing & Details ---
  const customerDetailsOverlay = document.getElementById('customer-details-overlay');
  const closeCustDetailsBtn = document.getElementById('close-customer-details');
  const searchCustInput = document.getElementById('customers-search-input');

  function initCustomersPage() {
    let allUsers = [];

    db.collection('users').where('role', '==', 'customer').onSnapshot(snap => {
      allUsers = [];
      snap.forEach(d => allUsers.push(d.data()));
      renderCustomersTable(allUsers);
    });

    searchCustInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allUsers.filter(u => 
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
      );
      renderCustomersTable(filtered);
    });
  }

  function renderCustomersTable(usersArray) {
    const tbody = document.getElementById('customers-table-body');
    tbody.innerHTML = '';

    if (usersArray.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-xs text-charcoal-light">No customers found.</td></tr>';
      return;
    }

    usersArray.forEach(u => {
      const initials = (u.name || u.email)[0].toUpperCase();
      const row = document.createElement('tr');
      row.className = 'border-b border-gray hover:bg-gray-light';
      
      const dateStr = u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '--';

      row.innerHTML = `
        <td class="p-4"><div class="w-8 h-8 rounded-full bg-pink/10 text-pink flex items-center justify-center font-bold text-xs">${initials}</div></td>
        <td class="p-4 font-bold text-charcoal">${u.name}</td>
        <td class="p-4">${u.email}</td>
        <td class="p-4">${u.phone || '--'}</td>
        <td class="p-4">${dateStr}</td>
        <td class="p-4 text-right">
          <button class="view-cust-btn text-pink hover:underline" data-uid="${u.uid}"><i class="fa-solid fa-eye"></i> View</button>
        </td>
      `;

      row.querySelector('.view-cust-btn').addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        openCustomerDetailsModal(uid);
      });

      tbody.appendChild(row);
    });
  }

  closeCustDetailsBtn.addEventListener('click', () => {
    customerDetailsOverlay.classList.add('hidden');
  });

  async function openCustomerDetailsModal(uid) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const u = userDoc.data();

      document.getElementById('cust-modal-name').textContent = u.name;
      document.getElementById('cust-modal-email').textContent = u.email;
      document.getElementById('cust-modal-phone').textContent = u.phone ? `Phone: ${u.phone}` : 'Phone: --';
      document.getElementById('cust-modal-initials').textContent = (u.name || u.email)[0].toUpperCase();

      // Fetch customer orders history
      const ordersSnap = await db.collection('orders').where('uid', '==', uid).get();
      let spent = 0;
      let count = 0;

      const orderListContainer = document.getElementById('cust-modal-orders-list');
      orderListContainer.innerHTML = '';

      ordersSnap.forEach(d => {
        const order = d.data();
        count++;
        if (order.status === 'Confirmed' || order.status === 'Shipped' || order.status === 'Delivered') {
          spent += (order.totalAmount || 0);
        }

        const dateStr = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '--';
        const itemRow = document.createElement('div');
        itemRow.className = 'p-3 bg-gray-light border border-gray text-[11px] flex justify-between items-center';
        itemRow.innerHTML = `
          <div>
            <strong class="text-pink">ID: ${d.id}</strong> <span class="text-charcoal-light">(${dateStr})</span>
            <p class="text-charcoal mt-1">₹${order.totalAmount} &bull; ${order.status}</p>
          </div>
        `;
        orderListContainer.appendChild(itemRow);
      });

      if (count === 0) {
        orderListContainer.innerHTML = '<p class="text-xs text-charcoal-light py-4 text-center">No order records found.</p>';
      }

      document.getElementById('cust-modal-orders').textContent = count;
      document.getElementById('cust-modal-spent').textContent = `₹${spent.toLocaleString()}`;

      customerDetailsOverlay.classList.remove('hidden');
    } catch (err) {
      alert("Error loading customer metadata: " + err.message);
    }
  }

  // --- Login Activity Logs ---
  const logsSearchInput = document.getElementById('logs-search-input');
  
  function initLogsPage() {
    let allLogs = [];
    
    db.collection('loginLogs').onSnapshot(snap => {
      allLogs = [];
      snap.forEach(d => allLogs.push(d.data()));
      // Sort local array descending
      allLogs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      renderLogsTable(allLogs);
    });

    logsSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allLogs.filter(l => 
        (l.email || '').toLowerCase().includes(q) ||
        (l.browser || '').toLowerCase().includes(q) ||
        (l.platform || '').toLowerCase().includes(q) ||
        (l.device || '').toLowerCase().includes(q)
      );
      renderLogsTable(filtered);
    });
  }

  function renderLogsTable(logsArray) {
    const tbody = document.getElementById('logs-table-body');
    tbody.innerHTML = '';

    if (logsArray.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-xs text-charcoal-light">No login logs found.</td></tr>';
      return;
    }

    logsArray.forEach(l => {
      const row = document.createElement('tr');
      row.className = 'border-b border-gray hover:bg-gray-light text-xs';
      
      const timeStr = l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleString() : '--';
      
      row.innerHTML = `
        <td class="p-4 font-bold text-charcoal">${l.email || 'Anonymous'}</td>
        <td class="p-4">${l.platform || '--'} (${l.device || 'PC'})</td>
        <td class="p-4">${l.browser || '--'}</td>
        <td class="p-4 text-charcoal-light">${timeStr}</td>
      `;
      tbody.appendChild(row);
    });
  }
});
