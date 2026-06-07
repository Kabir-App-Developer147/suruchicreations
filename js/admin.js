/* ============================================================
   GURMIT LAMBA ART — ADMIN DASHBOARD (ASYNC LIVE SYSTEM)
   ============================================================ */

const KEYS = { auth: 'gl_admin_logged_in' };
let uploadedImagesBase64 = [];
let currentEditingImages = []; 
let sessionVideoObjectURL = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  const imageZone = document.getElementById('imageUploadArea');
  if (imageZone) {
    imageZone.addEventListener('dragover', (e) => { e.preventDefault(); imageZone.style.borderColor = 'var(--primary)'; });
    imageZone.addEventListener('dragleave', () => { imageZone.style.borderColor = 'var(--border)'; });
    imageZone.addEventListener('drop', (e) => {
      e.preventDefault();
      imageZone.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files.length) processImageFiles(e.dataTransfer.files);
    });
  }
});

async function checkAuth() {
  const loginScreen = document.getElementById('adminLogin');
  const dashboardPanel = document.getElementById('adminDashboard');
  
  if (sessionStorage.getItem(KEYS.auth) === 'true') {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardPanel) dashboardPanel.style.display = 'flex';
    await renderProducts();
    await renderVideos();
    await renderOrders();
    await renderStats();
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboardPanel) dashboardPanel.style.display = 'none';
  }
}

function adminLogin() {
  const passwordInput = document.getElementById('adminPassword');
  if (passwordInput?.value === 'gurmit2025') {
    sessionStorage.setItem(KEYS.auth, 'true');
    passwordInput.value = '';
    checkAuth();
  } else {
    alert('Invalid admin password key.');
  }
}

function adminLogout() {
  if (confirm('Sign out of dashboard?')) { sessionStorage.removeItem(KEYS.auth); checkAuth(); }
}

async function showTab(tabName, element) {
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabName}`);
  if (targetTab) targetTab.classList.add('active');
  if (element) element.classList.add('active');

  if (tabName === 'products') await renderProducts();
  if (tabName === 'videos') await renderVideos();
  if (tabName === 'orders') await renderOrders();
  if (tabName === 'stats') await renderStats();
}

// ── PRODUCT CRUD ───────────────────────────────────────────
async function renderProducts() {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;

  const products = await getProducts();
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
    card.innerHTML = `
      <div style="height: 140px; overflow: hidden; border-radius: var(--radius);"><img src="${thumbnail}" style="width:100%; height:100%; object-fit:cover;"></div>
      <div>
        <h4 style="font-family: var(--font-display); font-size: 1.1rem;">${product.name}</h4>
        <p style="color: var(--text-muted); font-size: 0.8rem;">₹${Number(product.price).toLocaleString('en-IN')}</p>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: auto;">
        <button class="btn-outline" style="padding:0.4rem; flex:1; font-size:0.8rem;" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn-outline" style="padding:0.4rem; flex:1; font-size:0.8rem; color:#dc2626;" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>`;
    grid.appendChild(card);
  });
}

function previewImages(event) { if (event.target.files.length) processImageFiles(event.target.files); }

function processImageFiles(files) {
  const container = document.getElementById('imagePreviews');
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImagesBase64.push(e.target.result);
      const thumb = document.createElement('div');
      thumb.style.cssText = 'position:relative; width:60px; height:60px; border:1px solid var(--border);';
      thumb.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
      container.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

async function saveProduct() {
  const id = document.getElementById('editProductId').value.trim();
  const name = document.getElementById('productName').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  if (!name || !price) { alert('Fill out core attributes.'); return; }

  const finalImages = uploadedImagesBase64.length > 0 ? uploadedImagesBase64 : currentEditingImages;
  
  const productData = {
    id: id || 'prod_' + Date.now(),
    name,
    category: document.getElementById('productCategory').value,
    price: Number(price),
    costPrice: Number(document.getElementById('productCostPrice').value || 0),
    size: document.getElementById('productSize').value,
    medium: document.getElementById('productMedium').value,
    stock: document.getElementById('productStock').value,
    description: document.getElementById('productDescription').value,
    images: finalImages,
    inGallery: document.getElementById('productInGallery').checked,
    featured: document.getElementById('productFeatured').checked
  };

  await saveProductToDB(productData);
  cancelEdit();
  await showTab('products', document.getElementById('tabLink-products'));
}

async function editProduct(productId) {
  const products = await getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('editProductId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCostPrice').value = product.costPrice || '';
  document.getElementById('productSize').value = product.size || '';
  document.getElementById('productMedium').value = product.medium || '';
  document.getElementById('productDescription').value = product.description || '';
  
  currentEditingImages = product.images || [];
  uploadedImagesBase64 = [];
  showTab('add-product', document.getElementById('tabLink-addProduct'));
}

async function deleteProduct(productId) {
  if (confirm('Delete permanently from database?')) {
    await deleteProductFromDB(productId);
    await renderProducts();
  }
}

function cancelEdit() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('imagePreviews').innerHTML = '';
  uploadedImagesBase64 = []; currentEditingImages = [];
}

// ── VIDEOS & ORDERS SYSTEMS ────────────────────────────────
async function saveVideo() {
  const title = document.getElementById('videoTitle').value.trim();
  const url = document.getElementById('videoUrl').value.trim();
  if (!title || !url) return;

  await saveVideoToDB({ id: 'vid_' + Date.now(), title, url, description: document.getElementById('videoDescription').value, isLocalSessionAsset: false });
  await renderVideos();
}

async function renderVideos() {
  const grid = document.getElementById('adminVideosGrid');
  if (!grid) return;
  const videos = await getVideos();
  grid.innerHTML = videos.length ? '' : '<div class="admin-empty">No videos linked yet.</div>';
  videos.forEach(v => {
    const d = document.createElement('div');
    d.innerHTML = `<h5>${v.title}</h5><button onclick="deleteVideo('${v.id}')" style="color:red;background:none;border:none;cursor:pointer;">Remove</button>`;
    grid.appendChild(d);
  });
}

async function deleteVideo(id) { if (confirm('Remove video?')) { await deleteVideoFromDB(id); await renderVideos(); } }

async function renderOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;
  const orders = await getOrders();
  list.innerHTML = orders.length ? '' : '<div class="admin-empty">No consumer records logged.</div>';
  orders.forEach(o => {
    const item = document.createElement('div');
    item.style.cssText = 'background:#fff; padding:1rem; border-bottom:1px solid #eee; margin-bottom:1rem;';
    item.innerHTML = `<h6>ID: ${o.id} - Total: ₹${o.total}</h6><p>Customer: ${o.customer?.name} (${o.customer?.email})</p>
    <button onclick="deleteOrder('${o.id}')" style="color:red">Purge Order</button>`;
    list.appendChild(item);
  });
}

async function deleteOrder(id) { if (confirm('Delete track instance?')) { await deleteOrderFromDB(id); await renderOrders(); } }

async function renderStats() {
  const products = await getProducts();
  const orders = await getOrders();
  document.getElementById('statTotalProducts').innerText = products.length;
  document.getElementById('statAvailable').innerText = products.filter(p => p.stock === 'available').length;
  document.getElementById('statTotalOrders').innerText = orders.length;
  document.getElementById('statRevenue').innerText = '₹' + orders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString('en-IN');
}