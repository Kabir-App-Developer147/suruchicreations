/* ============================================================
   GURMIT LAMBA ART — ADMIN DASHBOARD LOGIC
   ============================================================ */

// ── STORAGE & STATE KEYS ──────────────────────────────────
const KEYS = {
  products: 'gl_products',
  orders: 'gl_orders',
  videos: 'gl_videos',
  auth: 'gl_admin_logged_in'
};

// Global variables for tracking current form mutations
let uploadedImagesBase64 = [];
let currentEditingImages = []; 
let sessionVideoObjectURL = null; // Temp holder for uploaded local videos

// ── LIFE CYCLE INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Setup drag and drop / click listeners for upload areas if visible
  const imageZone = document.getElementById('imageUploadArea');
  if (imageZone) {
    imageZone.addEventListener('dragover', (e) => { e.preventDefault(); imageZone.style.borderColor = 'var(--primary)'; });
    imageZone.addEventListener('dragleave', () => { imageZone.style.borderColor = 'var(--border)'; });
    imageZone.addEventListener('drop', (e) => {
      e.preventDefault();
      imageZone.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files.length) {
        processImageFiles(e.dataTransfer.files);
      }
    });
  }
});

// ── AUTHENTICATION MECHANISMS ──────────────────────────────
function checkAuth() {
  const loginScreen = document.getElementById('adminLogin');
  const dashboardPanel = document.getElementById('adminDashboard');
  
  if (sessionStorage.getItem(KEYS.auth) === 'true') {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardPanel) dashboardPanel.style.display = 'flex';
    // Initialize Dashboard views with updated storage arrays
    renderProducts();
    renderVideos();
    renderOrders();
    renderStats();
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboardPanel) dashboardPanel.style.display = 'none';
  }
}

function adminLogin() {
  const passwordInput = document.getElementById('adminPassword');
  if (!passwordInput) return;

  // Match default password signature defined in admin.html template
  if (passwordInput.value === 'gurmit2025') {
    sessionStorage.setItem(KEYS.auth, 'true');
    passwordInput.value = '';
    checkAuth();
    showAdminNotification('Welcome back, Gurmit!');
  } else {
    showAdminNotification('Invalid admin password security key.', true);
  }
}

function adminLogout() {
  if (confirm('Are you sure you want to sign out of the dashboard?')) {
    sessionStorage.removeItem(KEYS.auth);
    checkAuth();
  }
}

// ── SIDEBAR SYSTEM & WORKSPACE TOGGLE ──────────────────────
function showTab(tabName, element) {
  // Hide all workspaces
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Deactivate all navbar elements
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });

  // Mount target layout
  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.add('active');
  if (element) element.classList.add('active');

  // Trigger content sync updates when pivoting views
  if (tabName === 'products') renderProducts();
  if (tabName === 'videos') renderVideos();
  if (tabName === 'orders') renderOrders();
  if (tabName === 'stats') renderStats();
}

// ── PRODUCT CRUD OPERATIONS ────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;

  const products = JSON.parse(localStorage.getItem(KEYS.products) || '[]');
  
  if (products.length === 0) {
    grid.innerHTML = '<div class="admin-empty">No products yet. Add your first piece!</div>';
    return;
  }

  grid.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'admin-product-card';
    card.style.cssText = 'background: var(--white); border-radius: var(--radius); padding: 1.25rem; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 0.75rem;';
    
    const thumbnail = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/300x200?text=No+Image';
    const featuredBadge = product.featured ? '<span style="background: #eef2f7; color: #3b82f6; font-size:0.7rem; padding:2px 6px; border-radius:4px;">Featured</span>' : '';
    const galleryBadge = product.inGallery ? '<span style="background: #f0fdf4; color: #16a34a; font-size:0.7rem; padding:2px 6px; border-radius:4px;">Gallery</span>' : '';

    card.innerHTML = `
      <div style="height: 160px; overflow: hidden; border-radius: var(--radius); background: var(--cream);">
        <img src="${thumbnail}" style="width:100%; height:100%; object-fit:cover;" alt="${product.name}">
      </div>
      <div>
        <h4 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 0.25rem;">${product.name}</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">Category: ${product.category.toUpperCase()}</p>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:500; color: var(--primary);">₹${Number(product.price).toLocaleString('en-IN')}</span>
          <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing:0.05em; font-weight:600; color: ${product.stock === 'available' ? '#16a34a' : '#dc2626'}">${product.stock}</span>
        </div>
        <div style="display:flex; gap:0.25rem; margin-top:0.5rem;">${featuredBadge} ${galleryBadge}</div>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--border);">
        <button class="btn-outline" style="padding: 0.5rem; flex: 1; font-size: 0.85rem;" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn-outline" style="padding: 0.5rem; flex: 1; font-size: 0.85rem; color:#dc2626; border-color:#fca5a5;" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function previewImages(event) {
  if (event.target.files.length) {
    processImageFiles(event.target.files);
  }
}

function processImageFiles(files) {
  const container = document.getElementById('imagePreviews');
  if (!container) return;

  Array.from(files).forEach(file => {
    // Structural Safeguard against LocalStorage crash (max 2MB per raw item suggested)
    if (file.size > 2 * 1024 * 1024) {
      alert(`"${file.name}" is larger than 2MB. Please use compressed web-optimized images to prevent database memory limit errors.`);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      uploadedImagesBase64.push(base64String);
      
      const thumb = document.createElement('div');
      thumb.className = 'preview-thumb';
      thumb.style.cssText = 'position:relative; width:80px; height:80px; border-radius:4px; overflow:hidden; border:1px solid var(--border);';
      thumb.innerHTML = `
        <img src="${base64String}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;" onclick="removeLoadedPreview(this, '${base64String}')">✕</button>
      `;
      container.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

function removeLoadedPreview(btnElement, targetString) {
  btnElement.parentElement.remove();
  uploadedImagesBase64 = uploadedImagesBase64.filter(str => str !== targetString);
  currentEditingImages = currentEditingImages.filter(str => str !== targetString);
}

function saveProduct() {
  const id = document.getElementById('editProductId').value.trim();
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price = document.getElementById('productPrice').value.trim();
  const costPrice = document.getElementById('productCostPrice').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const medium = document.getElementById('productMedium').value.trim();
  const stock = document.getElementById('productStock').value;
  const description = document.getElementById('productDescription').value.trim();
  const inGallery = document.getElementById('productInGallery').checked;
  const featured = document.getElementById('productFeatured').checked;

  if (!name || !price || !description) {
    showAdminNotification('Please fill in all required (*) core structural inputs.', true);
    return;
  }

  let products = JSON.parse(localStorage.getItem(KEYS.products) || '[]');
  
  // Consolidate array combinations (keep current structural data assets if no replacement uploaded)
  const finalImages = uploadedImagesBase64.length > 0 ? uploadedImagesBase64 : currentEditingImages;

  const productData = {
    id: id || 'prod_' + Date.now(),
    name,
    category,
    price: Number(price),
    costPrice: costPrice ? Number(costPrice) : 0,
    size,
    medium,
    stock,
    description,
    images: finalImages,
    inGallery,
    featured
  };

  try {
    if (id) {
      // Modify existing data asset array reference
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) products[idx] = productData;
      showAdminNotification('Artwork record modified successfully.');
    } else {
      // Create new instance payload entries
      products.unshift(productData);
      showAdminNotification('New Artwork cataloged successfully.');
    }

    localStorage.setItem(KEYS.products, JSON.stringify(products));
    cancelEdit(); // Clears layout forms
    showTab('products', document.getElementById('tabLink-products'));
  } catch (error) {
    console.error(error);
    showAdminNotification('Storage Quota Exhausted! Please reduce product image file sizes.', true);
  }
}

function editProduct(productId) {
  let products = JSON.parse(localStorage.getItem(KEYS.products) || '[]');
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Switch context labels to editor configurations
  document.getElementById('addProductTitle').innerText = 'Modify Artwork Details';
  document.getElementById('editProductId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCostPrice').value = product.costPrice || '';
  document.getElementById('productSize').value = product.size || '';
  document.getElementById('productMedium').value = product.medium || '';
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productDescription').value = product.description;
  document.getElementById('productInGallery').checked = product.inGallery;
  document.getElementById('productFeatured').checked = product.featured;

  // Mount existing data image configurations to UI elements
  currentEditingImages = product.images || [];
  uploadedImagesBase64 = []; // Reset newly loaded arrays
  
  const container = document.getElementById('imagePreviews');
  if (container) {
    container.innerHTML = '';
    currentEditingImages.forEach(str => {
      const thumb = document.createElement('div');
      thumb.style.cssText = 'position:relative; width:80px; height:80px; border-radius:4px; overflow:hidden; border:1px solid var(--border);';
      thumb.innerHTML = `
        <img src="${str}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;" onclick="removeLoadedPreview(this, '${str}')">✕</button>
      `;
      container.appendChild(thumb);
    });
  }

  showTab('add-product', document.getElementById('tabLink-addProduct'));
}

function deleteProduct(productId) {
  if (confirm('Are you certain you want to permanently purge this entry from your catalog?')) {
    let products = JSON.parse(localStorage.getItem(KEYS.products) || '[]');
    products = products.filter(p => p.id !== productId);
    localStorage.setItem(KEYS.products, JSON.stringify(products));
    renderProducts();
    showAdminNotification('Product deleted cleanly.');
  }
}

function cancelEdit() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productCostPrice').value = '';
  document.getElementById('productSize').value = '';
  document.getElementById('productMedium').value = '';
  document.getElementById('productDescription').value = '';
  document.getElementById('productStock').value = 'available';
  document.getElementById('productCategory').value = 'resin';
  document.getElementById('productInGallery').checked = true;
  document.getElementById('productFeatured').checked = false;
  document.getElementById('imagePreviews').innerHTML = '';
  uploadedImagesBase64 = [];
  currentEditingImages = [];
  document.getElementById('addProductTitle').innerText = 'Add New Product';
}

// ── PROCESS VIDEOS SYSTEM ──────────────────────────────────
function previewVideo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const container = document.getElementById('videoPreviewContainer');
  const videoEl = document.getElementById('videoPreview');

  // Hard limits alert warning context execution rules
  alert("Notice: Browser storage filters cannot house 500MB video payloads across device reloads. We'll show a session preview, but using a YouTube or Vimeo Embed link below is highly recommended for persistent data.");

  if (sessionVideoObjectURL) URL.revokeObjectURL(sessionVideoObjectURL);
  
  sessionVideoObjectURL = URL.createObjectURL(file);
  if (videoEl && container) {
    videoEl.src = sessionVideoObjectURL;
    container.style.display = 'block';
  }
}

function saveVideo() {
  const title = document.getElementById('videoTitle').value.trim();
  const embedUrl = document.getElementById('videoUrl').value.trim();
  const description = document.getElementById('videoDescription').value.trim();

  if (!title || (!embedUrl && !sessionVideoObjectURL)) {
    showAdminNotification('Please supply a video title and an explicit resource route or upload.', true);
    return;
  }

  let videos = JSON.parse(localStorage.getItem(KEYS.videos) || '[]');
  
  videos.unshift({
    id: 'vid_' + Date.now(),
    title,
    // Store local pointer reference placeholder fallback if no raw remote URL provided
    url: embedUrl || sessionVideoObjectURL,
    description,
    isLocalSessionAsset: !embedUrl
  });

  localStorage.setItem(KEYS.videos, JSON.stringify(videos));
  
  // Reset form inputs
  document.getElementById('videoTitle').value = '';
  document.getElementById('videoUrl').value = '';
  document.getElementById('videoDescription').value = '';
  const container = document.getElementById('videoPreviewContainer');
  if (container) container.style.display = 'none';

  renderVideos();
  showAdminNotification('Process Video entry added to storage pipeline.');
}

function renderVideos() {
  const grid = document.getElementById('adminVideosGrid');
  if (!grid) return;

  const videos = JSON.parse(localStorage.getItem(KEYS.videos) || '[]');
  if (videos.length === 0) {
    grid.innerHTML = '<div class="admin-empty">No videos yet.</div>';
    return;
  }

  grid.innerHTML = '';
  videos.forEach(video => {
    const item = document.createElement('div');
    item.style.cssText = 'background:var(--white); padding:1rem; border-radius:var(--radius); box-shadow:var(--shadow); display:flex; flex-direction:column; gap:0.5rem;';
    
    let previewMarkup = `<div style="background:#000; display:flex; align-items:center; justify-content:center; height:150px; border-radius:4px; color:#fff; font-size:0.8rem;">Cloud/External Stream Embed Linked</div>`;
    if (video.url && (video.url.includes('youtube') || video.url.includes('youtu.be') || video.url.includes('vimeo'))) {
      previewMarkup = `<div style="background:#1e293b; display:flex; align-items:center; justify-content:center; height:150px; border-radius:4px; color:#94a3b8; font-size:0.85rem;">🎥 Remote Video Resource Stream</div>`;
    } else if (video.isLocalSessionAsset) {
      previewMarkup = `<video src="${video.url}" controls style="width:100%; height:150px; object-fit:cover; border-radius:4px; background:#000;"></video>`;
    }

    item.innerHTML = `
      ${previewMarkup}
      <h4 style="font-family:var(--font-display); font-size:1.1rem; margin-top:0.25rem;">${video.title}</h4>
      <p style="font-size:0.8rem; color:var(--text-muted); flex-grow:1;">${video.description || 'No descriptive summary text provided.'}</p>
      <button class="btn-outline" style="color:#dc2626; border-color:#fca5a5; padding:0.4rem; font-size:0.8rem; margin-top:0.5rem;" onclick="deleteVideo('${video.id}')">Remove Video</button>
    `;
    grid.appendChild(item);
  });
}

function deleteVideo(id) {
  if (confirm('Delete this video post allocation?')) {
    let videos = JSON.parse(localStorage.getItem(KEYS.videos) || '[]');
    videos = videos.filter(v => v.id !== id);
    localStorage.setItem(KEYS.videos, JSON.stringify(videos));
    renderVideos();
    showAdminNotification('Video component disconnected.');
  }
}

// ── CLIENT ORDER INTAKE DISPATCH ──────────────────────────
function renderOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;

  // Interfacing directly with order payload configurations instantiated inside cart.js
  const orders = JSON.parse(localStorage.getItem(KEYS.orders) || '[]');

  if (orders.length === 0) {
    list.innerHTML = '<div class="admin-empty">No consumer orders recorded yet.</div>';
    return;
  }

  list.innerHTML = '';
  orders.forEach(order => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--white); border-radius:var(--radius-lg); padding:1.75rem; margin-bottom:1.5rem; box-shadow:var(--shadow); border-left: 4px solid ${order.status === "shipped" ? "#3a7d44" : "#ddb89a"};';
    
    const itemsLines = order.items.map(i => `
      <div style="display:flex; justify-content:space-between; font-size:0.9rem; padding: 0.35rem 0; border-bottom:1px dashed var(--border);">
        <span>${i.name} (×1)</span>
        <span>₹${Number(i.price).toLocaleString('en-IN')}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <span style="font-weight:600; font-size:1.05rem; color:var(--primary);">${order.id}</span>
          <div style="font-size:0.8rem; color:var(--text-muted);">${order.date}</div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding:4px 8px; font-size:0.8rem; border-radius:4px; border:1px solid var(--border)">
            <option value="pending" ${order.status !== 'shipped' ? 'selected' : ''}>Pending / Processing</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped / Complete</option>
          </select>
          <button style="background:none; border:none; color:#dc2626; cursor:pointer; font-size:0.85rem; padding:4px;" onclick="deleteOrder('${order.id}')">✕ Purge</button>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1.5rem; margin-top:1rem;">
        <div>
          <h5 style="text-transform:uppercase; font-size:0.75rem; letter-spacing:0.05em; color:var(--text-muted); margin-bottom:0.5rem;">Customer Dossier</h5>
          <p style="font-size:0.9rem; font-weight:500; margin-bottom:0.25rem;">${order.customer.name}</p>
          <p style="font-size:0.85rem; margin-bottom:0.15rem;">✉ ${order.customer.email}</p>
          <p style="font-size:0.85rem; margin-bottom:0.25rem;">📞 ${order.customer.phone || 'N/A'}</p>
          <p style="font-size:0.85rem; color:var(--text-muted); background:var(--cream); padding:6px; border-radius:4px; margin-top:0.5rem;">📍 ${order.customer.address}</p>
          ${order.customer.note ? `<p style="font-size:0.8rem; font-style:italic; margin-top:0.5rem; color:#b45309">Note: "${order.customer.note}"</p>` : ''}
        </div>
        <div>
          <h5 style="text-transform:uppercase; font-size:0.75rem; letter-spacing:0.05em; color:var(--text-muted); margin-bottom:0.5rem;">Manifest Summary</h5>
          <div>${itemsLines}</div>
          <div style="display:flex; justify-content:space-between; font-weight:600; margin-top:0.75rem; font-size:1rem; color:var(--primary)">
            <span>Invoice Total:</span>
            <span>₹${Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function updateOrderStatus(orderId, newStatus) {
  let orders = JSON.parse(localStorage.getItem(KEYS.orders) || '[]');
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    showAdminNotification(`Order status tracking updated to: ${newStatus}`);
    renderOrders();
  }
}

function deleteOrder(orderId) {
  if (confirm('Permanently wipe this order artifact from log storage?')) {
    let orders = JSON.parse(localStorage.getItem(KEYS.orders) || '[]');
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    renderOrders();
    showAdminNotification('Order record removed.');
  }
}

// ── BUSINESS ANALYTICS & MONITORING ────────────────────────
function renderStats() {
  const products = JSON.parse(localStorage.getItem(KEYS.products) || '[]');
  const orders = JSON.parse(localStorage.getItem(KEYS.orders) || '[]');

  // Component Metric Aggregations
  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.stock === 'available').length;
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  // Set DOM text nodes
  const elTotal = document.getElementById('statTotalProducts');
  const elAvail = document.getElementById('statAvailable');
  const elOrders = document.getElementById('statTotalOrders');
  const elRev = document.getElementById('statRevenue');

  if (elTotal) elTotal.innerText = totalProducts;
  if (elAvail) elAvail.innerText = availableProducts;
  if (elOrders) elOrders.innerText = totalOrdersCount;
  if (elRev) elRev.innerText = '₹' + totalRevenue.toLocaleString('en-IN');

  // Profitability Table Compilations
  const tableBody = document.getElementById('profitTableBody');
  if (!tableBody) return;

  if (products.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem">No products yet</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  products.forEach(p => {
    const cost = Number(p.costPrice || 0);
    const retail = Number(p.price || 0);
    const margin = retail - cost;
    const marginClass = margin >= 0 ? 'margin-positive' : 'margin-negative';
    const indicatorSign = margin >= 0 ? '+' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:500;">${p.name}</td>
      <td>₹${retail.toLocaleString('en-IN')}</td>
      <td style="color:var(--text-muted)">₹${cost.toLocaleString('en-IN')}</td>
      <td class="${marginClass}">${indicatorSign}₹${margin.toLocaleString('en-IN')}</td>
      <td><span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:${p.stock === 'available' ? '#16a34a' : '#dc2626'}">${p.stock}</span></td>
    `;
    tableBody.appendChild(tr);
  });
}

// ── UTILITY TOAST NOTIFICATIONS ────────────────────────────
function showAdminNotification(message, isError = false) {
  // Gracefully reference root application layout alerts if they exist, else fallback safely
  if (typeof showToast === 'function') {
    showToast(message);
  } else {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; 
      background: ${isError ? '#dc2626' : '#2c3e2d'}; color: #ffffff; 
      font-family: var(--font-body, sans-serif); font-size: 0.9rem; 
      border-radius: 4px; box-shadow: var(--shadow-lg); z-index: 99999;
      transition: opacity 0.3s ease;
    `;
    banner.innerText = message;
    document.body.appendChild(banner);
    setTimeout(() => { banner.style.opacity = '0'; setTimeout(() => banner.remove(), 300); }, 3500);
  }
}