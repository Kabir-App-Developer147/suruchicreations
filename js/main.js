/* ============================================================
   GURMIT LAMBA ART — MAIN JS
   ============================================================ */

// ── NAVBAR SCROLL ──────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── MOBILE MENU ────────────────────────────────────
function toggleMenu() {
  const links = document.getElementById('navLinks');
  if (links) links.classList.toggle('open');
}

// ── FEATURED PRODUCTS (HOMEPAGE) ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('featuredGrid');
  const empty = document.getElementById('featuredEmpty');
  if (!grid) return;

  const products = getProducts().filter(p => p.featured && p.stock === 'available');
  if (products.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  products.slice(0, 6).forEach(product => {
    grid.appendChild(createProductCard(product));
  });
});

// ── SHARED: CREATE PRODUCT CARD ─────────────────────
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.onclick = () => openProductModal(product);

  const imgSrc = product.images && product.images.length > 0 ? product.images[0] : null;
  const statusClass = {
    available: 'status-available',
    sold: 'status-sold',
    reserved: 'status-reserved',
    custom: 'status-custom'
  }[product.stock] || 'status-available';

  const statusLabel = {
    available: 'Available',
    sold: 'Sold',
    reserved: 'Reserved',
    custom: 'Custom Order'
  }[product.stock] || 'Available';

  card.innerHTML = `
    <div class="product-card-img">
      ${imgSrc
        ? `<img src="${imgSrc}" alt="${product.name}" loading="lazy" />`
        : `<div class="no-img">◈</div>`}
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

// ── PRODUCT MODAL ──────────────────────────────────
function openProductModal(product) {
  const overlay = document.getElementById('productOverlay');
  const inner   = document.getElementById('productModalInner');
  if (!overlay || !inner) {
    // On homepage, redirect to shop
    window.location.href = 'shop.html';
    return;
  }

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
        <div class="product-meta-row"><span>Status</span><span>${{ available:'Available', sold:'Sold', reserved:'Reserved', custom:'Custom Order' }[product.stock]}</span></div>
      </div>
      ${product.stock === 'available'
        ? `<button class="btn-primary full-width" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); closeProductModal()">Add to Cart</button>`
        : `<button class="btn-outline full-width" disabled>Currently Unavailable</button>`}
    </div>`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('productOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── CHECKOUT MODAL ─────────────────────────────────
function openCheckout() {
  closeCart();
  const cart = getCart();
  const summary = document.getElementById('checkoutSummary');
  if (summary) {
    let html = '';
    cart.forEach(item => {
      html += `<div class="checkout-summary-row"><span>${item.name}</span><span>₹${Number(item.price).toLocaleString('en-IN')}</span></div>`;
    });
    const total = cart.reduce((s, i) => s + Number(i.price), 0);
    html += `<div class="checkout-summary-row checkout-summary-total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>`;
    summary.innerHTML = html;
  }
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeCheckoutModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── PLACE ORDER ────────────────────────────────────
function placeOrder() {
  const name    = document.getElementById('buyerName')?.value.trim();
  const email   = document.getElementById('buyerEmail')?.value.trim();
  const address = document.getElementById('buyerAddress')?.value.trim();
  const phone   = document.getElementById('buyerPhone')?.value.trim();
  const note    = document.getElementById('buyerNote')?.value.trim();

  if (!name || !email || !address) {
    showToast('Please fill in your name, email, and address.');
    return;
  }
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address.');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty.');
    return;
  }

  const orderId   = 'GL-' + Date.now();
  const total     = cart.reduce((s, i) => s + Number(i.price), 0);
  const orderDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Build email body for artist via mailto
  const itemLines = cart.map(i => `  • ${i.name} — ₹${Number(i.price).toLocaleString('en-IN')}`).join('\n');
  const emailBody = `ORDER RECEIVED — ${orderId}
Date: ${orderDate}

CUSTOMER DETAILS
Name:    ${name}
Email:   ${email}
Phone:   ${phone || 'Not provided'}
Address: ${address}
Note:    ${note || 'None'}

ORDER ITEMS
${itemLines}

TOTAL: ₹${total.toLocaleString('en-IN')}

Please contact the customer to arrange payment and shipping.
`;

  // Save order to localStorage
  const orders = JSON.parse(localStorage.getItem('gl_orders') || '[]');
  orders.unshift({
    id: orderId,
    date: orderDate,
    customer: { name, email, phone, address, note },
    items: cart,
    total,
    status: 'new'
  });
  localStorage.setItem('gl_orders', JSON.stringify(orders));

  // Open email client (artist receives invoice)
  const artistMailto = `mailto:gurmitlamba3@gmail.com?subject=New Order ${orderId} — ₹${total.toLocaleString('en-IN')}&body=${encodeURIComponent(emailBody)}`;
  window.open(artistMailto, '_blank');

  // Also open customer copy
  const customerBody = `Dear ${name},

Thank you for your order from Gurmit Lamba Art!

ORDER CONFIRMATION — ${orderId}
Date: ${orderDate}

${itemLines}

TOTAL: ₹${total.toLocaleString('en-IN')}

Gurmit will contact you soon at ${email}${phone ? ' / ' + phone : ''} to arrange payment and shipping.

Warm regards,
Gurmit Lamba
📞 +91 91407 42898
✉ gurmitlamba3@gmail.com
`;
  setTimeout(() => {
    const customerMailto = `mailto:${email}?subject=Your Order Confirmation — ${orderId}&body=${encodeURIComponent(customerBody)}`;
    window.open(customerMailto, '_blank');
  }, 800);

  // Clear cart and close modal
  clearCart();
  closeCheckoutModal();
  showToast(`Order placed! Invoice sent. Order ID: ${orderId}`);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── DATA HELPERS ───────────────────────────────────
function getProducts() {
  return JSON.parse(localStorage.getItem('gl_products') || '[]');
}

// ── TOAST ──────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}