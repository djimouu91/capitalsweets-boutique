// ═══════════════════════════════════════════════════════════
// CapitalSweets — E-Commerce Booster
// Features: Free shipping bar, upsell, urgency, exit-intent,
//           recently viewed, bundle discount, review stars
// ═══════════════════════════════════════════════════════════

const CS_BOOSTER = {
  FREE_SHIP_THRESHOLD: 65,
  BUNDLE_DISCOUNT: 0.10,   // 10% off when 2+ items
  CURRENCY: 'CA$',

  // ── FREE SHIPPING PROGRESS BAR ────────────────────────
  initShippingBar() {
    const footer = document.getElementById('cartFooter');
    if (!footer) return;
    if (!document.getElementById('shippingBar')) {
      const bar = document.createElement('div');
      bar.id = 'shippingBar';
      bar.className = 'cs-shipping-bar';
      bar.innerHTML = `
        <div class="cs-shipping-bar-text" id="shippingBarText"></div>
        <div class="cs-shipping-bar-track">
          <div class="cs-shipping-bar-fill" id="shippingBarFill"></div>
        </div>`;
      footer.insertBefore(bar, footer.firstChild);
    }
    this.updateShippingBar();
  },

  updateShippingBar() {
    const total    = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const fill     = document.getElementById('shippingBarFill');
    const text     = document.getElementById('shippingBarText');
    if (!fill || !text) return;
    const pct      = Math.min((total / this.FREE_SHIP_THRESHOLD) * 100, 100);
    const remaining = Math.max(this.FREE_SHIP_THRESHOLD - total, 0);
    fill.style.width = pct + '%';
    if (remaining > 0) {
      text.innerHTML = `Ajoutez <strong>${this.CURRENCY}${remaining.toFixed(2)}</strong> pour la <strong>Livraison Gratuite!</strong>`;
      fill.style.background = '#a87c3a';
    } else {
      text.innerHTML = `🎉 Félicitations! <strong>Livraison Gratuite</strong> débloquée!`;
      fill.style.background = 'var(--gold)';
    }
  },

  // ── UPSELL / CROSS-SELL in cart ───────────────────────
  renderUpsell() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems || !cart.length || !products.length) return;
    const inCart = new Set(cart.map(i => i.id));
    const suggestions = products
      .filter(p => !inCart.has(p.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    if (!suggestions.length) return;

    const existing = document.getElementById('cartUpsell');
    if (existing) existing.remove();
    const upsell = document.createElement('div');
    upsell.id = 'cartUpsell';
    upsell.className = 'cs-cart-upsell';
    upsell.innerHTML = `
      <p class="cs-upsell-title">🍯 Vous aimerez aussi</p>
      ${suggestions.map(p => `
        <div class="cs-upsell-item">
          <img src="${p.img}" alt="${p.name}" loading="lazy"/>
          <div class="cs-upsell-info">
            <p>${p.name}</p>
            <span>${this.CURRENCY}${parseFloat(p.price).toFixed(2)}</span>
          </div>
          <button class="cs-upsell-add" onclick="addToCart('${p.id}')">+ Ajouter</button>
        </div>`).join('')}`;
    cartItems.appendChild(upsell);
  },

  // ── BUNDLE DISCOUNT ───────────────────────────────────
  applyBundleDiscount() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const banner   = document.getElementById('bundleBanner');
    if (totalQty >= 2) {
      if (!banner) {
        const b = document.createElement('div');
        b.id = 'bundleBanner';
        b.className = 'cs-bundle-banner';
        b.innerHTML = `🎁 Offre Groupée : <strong>10% de réduction</strong> sur votre commande!`;
        document.getElementById('cartFooter')?.prepend(b);
      }
    } else {
      banner?.remove();
    }
  },

  // ── URGENCY BADGES on products ────────────────────────
  addUrgencyBadges() {
    const urgencyMap = {
      '1':  { label: '⭐ Best Seller', class: 'cs-urgency-hot' },
      '2':  { label: '⚡ Stock Limité', class: 'cs-urgency-low' },
      '5':  { label: '🔥 Tendance',    class: 'cs-urgency-hot' },
      '7':  { label: '💛 Coup de Cœur', class: 'cs-urgency-fav' },
      '11': { label: '🎁 Idée Cadeau', class: 'cs-urgency-gift' },
      '12': { label: '🌙 Édition Eid', class: 'cs-urgency-eid' },
    };
    document.querySelectorAll('.product-card').forEach(card => {
      const btn = card.querySelector('.pc-add');
      if (!btn) return;
      const onclick = btn.getAttribute('onclick') || '';
      const idMatch = onclick.match(/'([^']+)'/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (urgencyMap[id] && !card.querySelector('.cs-urgency-badge')) {
        const badge = document.createElement('div');
        badge.className = `cs-urgency-badge ${urgencyMap[id].class}`;
        badge.textContent = urgencyMap[id].label;
        card.querySelector('.pc-img')?.appendChild(badge);
      }
    });
  },

  // ── REVIEW STARS on product cards ─────────────────────
  addReviewStars() {
    const reviews = {
      '1':  { stars: 4.9, count: 1840 },
      '2':  { stars: 4.7, count: 720  },
      '3':  { stars: 4.8, count: 560  },
      '4':  { stars: 4.6, count: 390  },
      '5':  { stars: 4.9, count: 1250 },
      '6':  { stars: 4.5, count: 280  },
      '7':  { stars: 4.8, count: 980  },
      '8':  { stars: 4.7, count: 440  },
      '9':  { stars: 4.6, count: 310  },
      '10': { stars: 4.9, count: 670  },
      '11': { stars: 5.0, count: 2100 },
      '12': { stars: 4.9, count: 1580 },
    };
    document.querySelectorAll('.product-card').forEach(card => {
      const btn = card.querySelector('.pc-add');
      if (!btn) return;
      const onclick = btn.getAttribute('onclick') || '';
      const idMatch = onclick.match(/'([^']+)'/);
      if (!idMatch) return;
      const id = idMatch[1];
      const r = reviews[id];
      if (!r || card.querySelector('.cs-pc-stars')) return;
      const info = card.querySelector('.pc-name');
      if (!info) return;
      const stars = document.createElement('div');
      stars.className = 'cs-pc-stars';
      stars.innerHTML = `
        <span class="cs-star-icons">${this.renderStars(r.stars)}</span>
        <span class="cs-star-count">${r.stars} (${r.count.toLocaleString()})</span>`;
      info.insertAdjacentElement('afterend', stars);
    });
  },

  renderStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  },

  // ── RECENTLY VIEWED ────────────────────────────────────
  trackRecentlyViewed(productId) {
    let rv = JSON.parse(localStorage.getItem('cs_rv') || '[]');
    rv = [productId, ...rv.filter(id => id !== productId)].slice(0, 6);
    localStorage.setItem('cs_rv', JSON.stringify(rv));
  },

  renderRecentlyViewed() {
    const rv = JSON.parse(localStorage.getItem('cs_rv') || '[]');
    if (rv.length < 2) return;
    const section = document.getElementById('recentlyViewed');
    if (!section) return;
    const items = rv.map(id => products.find(p => p.id === id)).filter(Boolean);
    if (!items.length) return;
    section.style.display = 'block';
    document.getElementById('rvGrid').innerHTML = items.map(p => `
      <div class="cs-rv-card" onclick="addToCart('${p.id}')">
        <img src="${p.img}" alt="${p.name}" loading="lazy"/>
        <p class="cs-rv-name">${p.name}</p>
        <p class="cs-rv-price">${this.CURRENCY}${parseFloat(p.price).toFixed(2)}</p>
      </div>`).join('');
  },

  // ── EXIT INTENT POPUP ──────────────────────────────────
  initExitIntent() {
    if (localStorage.getItem('cs_exit_seen')) return;
    let triggered = false;
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 10 && !triggered && !cart.length) {
        triggered = true;
        this.showExitPopup();
      }
    });
    // Mobile: show after 30s on page
    setTimeout(() => {
      if (!triggered && !localStorage.getItem('cs_exit_seen')) {
        triggered = true;
        this.showExitPopup();
      }
    }, 30000);
  },

  showExitPopup() {
    document.getElementById('csExitPopup')?.classList.add('open');
  },

  hideExitPopup() {
    document.getElementById('csExitPopup')?.classList.remove('open');
    localStorage.setItem('cs_exit_seen', '1');
  },

  // ── INIT ──────────────────────────────────────────────
  init() {
    // Patch updateCartUI to trigger booster updates
    const orig = window.updateCartUI;
    window.updateCartUI = () => {
      orig?.();
      this.initShippingBar();
      this.updateShippingBar();
      this.renderUpsell();
      this.applyBundleDiscount();
    };

    // Patch renderProducts to add badges + stars
    const origRender = window.renderProducts;
    window.renderProducts = (filter) => {
      origRender?.(filter);
      setTimeout(() => {
        this.addUrgencyBadges();
        this.addReviewStars();
      }, 50);
    };

    // Track recently viewed on product click
    const origOpen = window.openProductQuick;
    window.openProductQuick = (id) => {
      this.trackRecentlyViewed(id);
      origOpen?.(id);
    };

    // Render recently viewed after products load
    const origLoad = window.loadProducts;
    window.loadProducts = async () => {
      await origLoad?.();
      this.renderRecentlyViewed();
    };

    // Exit intent
    this.initExitIntent();

    // Initial call
    setTimeout(() => {
      this.addUrgencyBadges();
      this.addReviewStars();
    }, 500);
  }
};

// ── EXIT POPUP HTML (injected on load) ────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('beforeend', `
    <div id="csExitPopup" class="cs-exit-popup-overlay">
      <div class="cs-exit-popup">
        <button class="cs-exit-popup-close" onclick="CS_BOOSTER.hideExitPopup()">✕</button>
        <div class="cs-exit-popup-badge">OFFRE EXCLUSIVE</div>
        <h2>Salam! Avant de partir...</h2>
        <p>Rejoignez la famille CapitalSweets et recevez <strong>10% de réduction</strong> sur votre première commande 🍯</p>
        <form class="cs-exit-popup-form" onsubmit="CS_BOOSTER.subscribeExitPopup(event)">
          <input type="email" placeholder="votre@email.com" required/>
          <button type="submit">Obtenir 10% de Réduction</button>
        </form>
        <p class="cs-exit-popup-skip" onclick="CS_BOOSTER.hideExitPopup()">Non merci, je paierai le prix complet</p>
      </div>
    </div>

    <!-- Recently Viewed Section -->
    <section id="recentlyViewed" style="display:none;padding:60px 48px;background:var(--cream)">
      <div class="section-header"><h2>Récemment Consultés</h2></div>
      <div id="rvGrid" class="cs-rv-grid"></div>
    </section>`);

  CS_BOOSTER.init();
});

CS_BOOSTER.subscribeExitPopup = function(e) {
  e.preventDefault();
  showToast('Bienvenue! Votre code de réduction 10% : SWEETS10');
  CS_BOOSTER.hideExitPopup();
};
