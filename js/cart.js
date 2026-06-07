/* ============================================================
   GURMIT LAMBA ART — CART JS
   Shared across all pages
   ============================================================ */

// ── CART STATE ─────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem('gl_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('gl_cart', JSON.stringify(cart));
  updateCartUI();
}
function clearCart() {
  localStorage.removeItem('gl_cart');
  updateCartUI();
}

// ── ADD TO CART ────────────────────────────────────
function addToCart(product) {
  const cart = getCart();
  // Each artwork is unique — only allow 1 per product
  if (cart.find(i => i.id === product.id)) {
    showToast('This piece is already in your cart.');
    return;
  }
  if (product.stock !== 'available') {
    showToast('This piece is not available.');
    return;
  }
  cart.push({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || null, category: product.category });
  saveCart(cart);
  openCart();
  showToast(`"${product.name}" added to cart`);
}

// ── REMOVE FROM CART ───────────────────────────────
function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

// ── OPEN / CLOSE CART ──────────────────────────────
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}
function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ── RENDER CART ITEMS ──────────────────────────────
function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer    = document.getElementById('cartFooter');
  const totalEl   = document.getElementById('cartTotal');
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div style="font-size:2.5rem;margin-bottom:1rem;color:var(--amber-light)">◈</div><p>Your cart is empty</p><p style="font-size:0.85rem;margin-top:0.5rem">Browse the shop to find your piece</p></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  container.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += Number(item.price);
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      ${item.image
        ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}" />`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:var(--amber-light)">◈</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${Number(item.price).toLocaleString('en-IN')}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}'); renderCartItems();" title="Remove">✕</button>`;
    container.appendChild(el);
  });

  if (footer) footer.style.display = 'block';
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
}

// ── UPDATE CART COUNT BADGE ────────────────────────
function updateCartUI() {
  const count = getCart().length;
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
  renderCartItems();
}

// ── TOAST (fallback if main.js not loaded) ─────────
if (typeof showToast === 'undefined') {
  window.showToast = function(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3100);
  };
}

// ── NAVBAR SCROLL (fallback) ──────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});

function toggleMenu() {
  document.getElementById('navLinks')?.classList.toggle('open');
}

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', updateCartUI);

// Checkout helpers (re-declared for pages that don't load main.js)
if (typeof openCheckout === 'undefined') {
  window.openCheckout = function() {
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
  };
}

if (typeof closeCheckoutModal === 'undefined') {
  window.closeCheckoutModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('checkoutOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };
}

if (typeof placeOrder === 'undefined') {
  window.placeOrder = function() {
    const name    = document.getElementById('buyerName')?.value.trim();
    const email   = document.getElementById('buyerEmail')?.value.trim();
    const address = document.getElementById('buyerAddress')?.value.trim();
    const phone   = document.getElementById('buyerPhone')?.value.trim();
    const note    = document.getElementById('buyerNote')?.value.trim();
    if (!name || !email || !address) { showToast('Please fill in required fields.'); return; }

    const cart = getCart();
    if (!cart.length) { showToast('Cart is empty.'); return; }

    const orderId   = 'GL-' + Date.now();
    const total     = cart.reduce((s, i) => s + Number(i.price), 0);
    const orderDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const itemLines = cart.map(i => `• ${i.name} — ₹${Number(i.price).toLocaleString('en-IN')}`).join('\n');

    const emailBody = `ORDER RECEIVED — ${orderId}\nDate: ${orderDate}\n\nCUSTOMER\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nAddress: ${address}\nNote: ${note || 'None'}\n\nITEMS\n${itemLines}\n\nTOTAL: ₹${total.toLocaleString('en-IN')}`;

    const orders = JSON.parse(localStorage.getItem('gl_orders') || '[]');
    orders.unshift({ id: orderId, date: orderDate, customer: { name, email, phone, address, note }, items: cart, total, status: 'new' });
    localStorage.setItem('gl_orders', JSON.stringify(orders));

    window.open(`mailto:gurmitlamba3@gmail.com?subject=New Order ${orderId}&body=${encodeURIComponent(emailBody)}`, '_blank');
    clearCart();
    closeCheckoutModal();
    showToast(`Order placed! ID: ${orderId}`);
  };
}