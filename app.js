// ═══════════════════════════════════════
// CapitalSweets — app.js
// ═══════════════════════════════════════

const API = (window.location.port === '3000' || window.location.port === '')
  ? '' : 'http://localhost:3000';

let products = [];
let cart = [];
let currentFilter = 'all';

// ── PRODUCTS ──────────────────────────
const FALLBACK_PRODUCTS = [
  // ── COOKIES & BISCUITS ────────────────────────────────────────────────────
  {
    id: '1', category: 'cookies',
    name: 'Makroud el Asser',
    desc: 'Classic semolina diamond cookies filled with Medjool dates & orange blossom water. Family recipe from Constantine.',
    price: 28, orig: null, badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80',
    angle: 'The #1 Algerian cookie — "tastes exactly like my grandmother made them"'
  },
  {
    id: '2', category: 'cookies',
    name: 'Ghribia aux Amandes',
    desc: 'Melt-in-your-mouth almond crescent shortbread, dusted with powdered sugar. Delicate and buttery.',
    price: 24, orig: 32, badge: 'Sale',
    img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80',
    angle: '"Literally melts in your mouth" — top seller for Eid gifting'
  },
  {
    id: '3', category: 'cookies',
    name: 'Chrik Dorés',
    desc: 'Golden orange blossom shortbread rings, gently crispy, lightly sweet. Perfect with mint tea.',
    price: 22, orig: null, badge: 'New',
    img: 'https://images.unsplash.com/photo-1548369937-47519962c11a?w=600&q=80',
    angle: 'Tea-time essential — pairs perfectly with Moroccan mint tea'
  },
  {
    id: '4', category: 'cookies',
    name: 'Petits Fours aux Pistaches',
    desc: 'Elegant pistachio financiers dipped in white chocolate. Sophisticated flavour, beautiful presentation.',
    price: 32, orig: null, badge: 'New',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    angle: 'Premium gift cookie — "I felt like I was in a Parisian patisserie"'
  },

  // ── BAKLAVA & LAYERED ─────────────────────────────────────────────────────
  {
    id: '5', category: 'baklava',
    name: 'Baklava Algérienne au Miel',
    desc: 'Layers of crispy phyllo dough, filled with crushed walnuts & almonds, soaked in pure wildflower honey.',
    price: 38, orig: 52, badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80',
    angle: 'Authentic Algerian recipe — not too sweet, perfectly balanced'
  },
  {
    id: '6', category: 'baklava',
    name: 'Cornes de Gazelle',
    desc: 'Delicate crescent pastries filled with almond paste and orange blossom, lightly fried and honey-glazed.',
    price: 30, orig: null, badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80',
    angle: 'North African icon — "looks like art, tastes even better"'
  },

  // ── CAKES & SLICES ────────────────────────────────────────────────────────
  {
    id: '7', category: 'cakes',
    name: 'Kalb el Louz',
    desc: 'Signature Algerian almond semolina cake soaked in honey syrup, garnished with whole almonds. Moist and rich.',
    price: 42, orig: 58, badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80',
    angle: '"Heart of almonds" — the iconic Algerian celebration cake'
  },
  {
    id: '8', category: 'cakes',
    name: 'Sellou (Sfouf) Box',
    desc: 'Traditional energy-rich mix of toasted flour, almonds, sesame seeds & honey. Festive Ramadan favourite.',
    price: 26, orig: null, badge: 'New',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    angle: 'Ramadan & new mother tradition — "nostalgic taste of home"'
  },

  // ── FRIED & HONEY ─────────────────────────────────────────────────────────
  {
    id: '9', category: 'fried',
    name: 'Zlabia de Constantine',
    desc: 'Crispy golden spirals of fried batter soaked in honey syrup. Crunchy on the outside, syrupy inside.',
    price: 20, orig: 28, badge: 'Sale',
    img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
    angle: 'Ramadan staple — "these are dangerously addictive"'
  },
  {
    id: '10', category: 'fried',
    name: 'Griwech au Sésame & Miel',
    desc: 'Flower-shaped fried pastry coated with honey and sprinkled with toasted sesame seeds. Crispy & fragrant.',
    price: 24, orig: null, badge: 'New',
    img: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80',
    angle: 'Visual showstopper — viral on Algerian TikTok, beautiful plating'
  },

  // ── GIFT BOXES ────────────────────────────────────────────────────────────
  {
    id: '11', category: 'gift',
    name: 'Box Prestige — 24 pièces',
    desc: 'Our signature gift box: 6 Makroud + 6 Ghribia + 6 Baklava + 6 Cornes de Gazelle. Beautifully wrapped.',
    price: 85, orig: 110, badge: 'Best Seller',
    img: 'https://images.unsplash.com/photo-1607920592519-7b2d615d8c3e?w=600&q=80',
    angle: 'The perfect Eid, wedding & celebration gift — "she cried when she opened it"'
  },
  {
    id: '12', category: 'gift',
    name: 'Box Eid Premium — 36 pièces',
    desc: 'Our largest celebration box with 6 varieties of pastries in a luxury gold-ribbon presentation box.',
    price: 125, orig: 160, badge: 'New',
    img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80',
    angle: 'Luxury Eid gifting — custom ribbon, personalized card included'
  }
];

// ── LOAD ──────────────────────────────
async function loadProducts() {
  try {
    const r = await fetch(`${API}/api/products`);
    if (r.ok) {
      const data = await r.json();
      products = data.length ? data : FALLBACK_PRODUCTS;
    } else throw new Error();
  } catch { products = FALLBACK_PRODUCTS; }
  renderProducts();
}

// ── RENDER ────────────────────────────
function badgeClass(badge) {
  if (!badge) return '';
  if (badge.toLowerCase().includes('sale')) return 'sale';
  if (badge.toLowerCase().includes('new'))  return 'new';
  return 'best';
}

function discount(p) {
  if (!p.orig || p.orig <= p.price) return null;
  return Math.round((1 - p.price / p.orig) * 100);
}

function catLabel(cat) {
  const map = {
    cookies: 'Cookies & Biscuits',
    baklava: 'Baklava & Layered',
    cakes:   'Cakes & Slices',
    fried:   'Fried & Honey',
    gift:    'Gift Box'
  };
  return map[cat] || cat;
}

function renderProducts(filter) {
  if (filter !== undefined) currentFilter = filter;
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let list = products;
  if (currentFilter !== 'all') {
    list = products.filter(p => p.category === currentFilter);
  }

  if (!list.length) {
    grid.innerHTML = '<p style="padding:60px;color:#9a7a58;text-align:center;grid-column:1/-1;">No products found.</p>';
    return;
  }

  grid.innerHTML = list.map(p => {
    const disc = discount(p);
    return `
    <div class="product-card" onclick="openProductQuick('${p.id}')">
      <div class="pc-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy"/>
        ${disc ? `<div class="pc-badge sale">${disc}% off</div>` : p.badge ? `<div class="pc-badge ${badgeClass(p.badge)}">${p.badge}</div>` : ''}
      </div>
      <div class="pc-info">
        <p class="pc-cat">${catLabel(p.category)}</p>
        <h3 class="pc-name">${p.name}</h3>
        <div class="pc-price-row">
          <div>
            <span class="pc-price">CA$${parseFloat(p.price).toFixed(2)}</span>
            ${p.orig ? `<span class="pc-orig">CA$${parseFloat(p.orig).toFixed(2)}</span>` : ''}
          </div>
          <button class="pc-add" onclick="event.stopPropagation();addToCart('${p.id}')">Add to bag</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── FILTER ────────────────────────────
function filterProducts(cat, e, btn) {
  if (e) e.preventDefault();
  currentFilter = cat;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    const match = document.querySelector(`.ftab[data-cat="${cat}"]`);
    if (match) match.classList.add('active');
  }
  renderProducts();
}

function filterAndScroll(cat) {
  filterProducts(cat, null, null);
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

// ── CART ──────────────────────────────
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const ex = cart.find(i => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ ...p, qty: 1 });
  updateCartUI();
  showToast(`"${p.name}" added to your bag`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const total  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count  = cart.reduce((s, i) => s + i.qty, 0);
  const badge  = document.getElementById('cartBadge');
  const badge2 = document.getElementById('cartBadge2');
  const countEl  = document.getElementById('cartItemCount');
  const totalEl  = document.getElementById('cartTotal');
  const footer   = document.getElementById('cartFooter');
  const items    = document.getElementById('cartItems');
  const shipNote = document.getElementById('cartShippingNote');

  if (badge)  { badge.textContent = count; badge.style.display = count ? 'flex' : 'none'; }
  if (badge2) badge2.textContent = count;
  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = total.toFixed(2);

  if (shipNote) {
    const remaining = 65 - total;
    shipNote.textContent = remaining > 0
      ? `Add CA$${remaining.toFixed(2)} more for free shipping`
      : '✓ You qualify for free shipping!';
    shipNote.style.color = remaining <= 0 ? '#2d6a2d' : '#9a7a58';
  }

  if (!cart.length) {
    items.innerHTML = `<div class="empty-bag">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <p>Your bag is empty</p>
      <a href="#shop" class="btn-outline-sm" onclick="toggleCart()">Browse Pastries</a>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  items.innerHTML = cart.map(i => `
    <div class="cart-item-row">
      <img src="${i.img}" alt="${i.name}"/>
      <div class="ci-info">
        <p class="ci-name">${i.name}</p>
        <p class="ci-price">CA$${(i.price * i.qty).toFixed(2)}${i.qty > 1 ? ` × ${i.qty}` : ''}</p>
      </div>
      <button class="ci-remove" onclick="removeFromCart('${i.id}')">✕</button>
    </div>`).join('');

  if (footer) footer.style.display = 'block';
}

function toggleCart() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('drawerOverlay').classList.toggle('open');
  document.body.style.overflow = document.getElementById('cartDrawer').classList.contains('open') ? 'hidden' : '';
}

function openProductQuick(id) { /* extend for quick-view modal if desired */ }

// ── FORMS ─────────────────────────────
function subscribeNewsletter(e) {
  e.preventDefault();
  showToast('Welcome to the CapitalSweets circle!');
  e.target.reset();
}

function submitContact(e) {
  e.preventDefault();
  showToast('Message sent! We\'ll be in touch soon.');
  e.target.reset();
}

// ── NAVBAR SCROLL ─────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 60);
});

// ── TOAST ─────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── INIT ──────────────────────────────
loadProducts();
