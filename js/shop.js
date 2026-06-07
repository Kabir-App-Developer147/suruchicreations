/* ============================================================
   GURMIT LAMBA ART — SHOP JS
   ============================================================ */

let currentFilter = 'all';
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  loadShopProducts();
});

function loadShopProducts() {
  allProducts = JSON.parse(localStorage.getItem('gl_products') || '[]');
  renderShopGrid(allProducts);
}

function renderShopGrid(products) {
  const grid  = document.getElementById('shopGrid');
  const empty = document.getElementById('shopEmpty');
  if (!grid) return;

  // Clear previous product cards (keep empty state)
  grid.querySelectorAll('.product-card').forEach(el => el.remove());

  const filtered = currentFilter === 'all'
    ? products
    : products.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  filtered.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

function filterProducts(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderShopGrid(allProducts);
}

// ── PRODUCT CARD ─────────────────────────────────
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.onclick = () => openProductModal(product);

  const imgSrc = product.images && product.images.length > 0 ? product.images[0] : null;
  const statusClass = { available: 'status-available', sold: 'status-sold', reserved: 'status-reserved', custom: 'status-custom' }[product.stock] || 'status-available';
  const statusLabel = { available: 'Available', sold: 'Sold', reserved: 'Reserved', custom: 'Custom Order' }[product.stock] || 'Available';

  card.innerHTML = `
    <div class="product-card-img">
      ${imgSrc ? `<img src="${imgSrc}" alt="${product.name}" loading="lazy" />` : `<div class="no-img">◈</div>`}
      <span class="product-status ${statusClass}">${statusLabel}</span>
    </div>
    <div class="product-card-body">
      <div class="product-card-category">${getCategoryLabel(product.category)}</div>
      <div class="product-card-title">${product.name}</div>
      ${product.size ? `<div class="product-card-size">${product.size}</div>` : ''}
      <div class="product-card-footer">
        <div class="product-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
        <button class="add-to-cart-btn ${product.stock !== 'available' ? 'sold-out' : ''}"
          onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})"
          title="${product.stock === 'available' ? 'Add to cart' : statusLabel}">
          ${product.stock === 'available' ? '+' : '✕'}
        </button>
      </div>
    </div>`;
  return card;
}

function getCategoryLabel(cat) {
  return { resin: 'Resin Art', painting: 'Painting', other: 'Other' }[cat] || cat;
}

// ── PRODUCT MODAL ─────────────────────────────────
function openProductModal(product) {
  const overlay = document.getElementById('productOverlay');
  const inner   = document.getElementById('productModalInner');
  if (!overlay || !inner) return;

  const imgSrc = product.images && product.images.length > 0 ? product.images[0] : null;

  inner.innerHTML = `
    <div class="product-modal-gallery">
      ${imgSrc
        ? `<img src="${imgSrc}" alt="${product.name}" />`
        : `<div style="aspect-ratio:4/5;background:var(--cream-dark);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:4rem;color:var(--amber-light)">◈</div>`}
    </div>
    <div class="product-modal-info">
      <span class="section-tag">${getCategoryLabel(product.category)}</span>
      <h2>${product.name}</h2>
      <div class="product-modal-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
      <p>${product.description || ''}</p>
      <div class="product-meta">
        ${product.size   ? `<div class="product-meta-row"><span>Size</span><span>${product.size}</span></div>` : ''}
        ${product.medium ? `<div class="product-meta-row"><span>Medium</span><span>${product.medium}</span></div>` : ''}
        <div class="product-meta-row"><span>Availability</span><span>${{ available:'Available', sold:'Sold', reserved:'Reserved', custom:'Custom Order' }[product.stock] || 'Available'}</span></div>
      </div>
      ${product.stock === 'available'
        ? `<button class="btn-primary full-width" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); closeProductModal()">Add to Cart</button>
           <div style="margin-top:1rem;text-align:center">
             <a href="contact.html" style="font-size:0.82rem;color:var(--text-muted);border-bottom:1px solid var(--border)">Have a question? Contact the artist</a>
           </div>`
        : `<button class="btn-outline full-width" style="cursor:default;opacity:0.6" disabled>Currently Unavailable</button>
           <div style="margin-top:1rem;text-align:center">
             <a href="contact.html" class="btn-outline" style="font-size:0.82rem">Request Custom Commission</a>
           </div>`}
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('productOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}