// ═══════════════════════════════════════════════
// CapitalSweets — Mobile Navigation + UX enhancements
// ═══════════════════════════════════════════════

(function () {
  const NAV_HTML = `
    <button class="hamburger-btn" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <div class="mobile-nav" id="mobileNav" role="dialog" aria-label="Mobile navigation" aria-modal="true">
      <button class="mobile-nav-close" id="mobileNavClose" aria-label="Close menu">✕</button>
      <a href="#shop"     onclick="closeMobileNav()">All Pastries</a>
      <a href="#shop"     onclick="filterAndScroll('cookies');closeMobileNav()">Cookies & Biscuits</a>
      <a href="#shop"     onclick="filterAndScroll('baklava');closeMobileNav()">Baklava</a>
      <a href="#shop"     onclick="filterAndScroll('cakes');closeMobileNav()">Cakes</a>
      <a href="#shop"     onclick="filterAndScroll('fried');closeMobileNav()">Fried & Honey</a>
      <a href="#shop"     onclick="filterAndScroll('gift');closeMobileNav()">Gift Boxes</a>
      <a href="#story"    onclick="closeMobileNav()">Our Story</a>
      <a href="#contact"  onclick="closeMobileNav()">Contact</a>
      <a href="#" style="margin-top:16px;font-size:.9rem;letter-spacing:.1em;opacity:.6;color:var(--gold)" onclick="event.preventDefault();closeMobileNav();toggleCart()">🍯 View Bag</a>
    </div>`;

  document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('.header-nav');
    if (nav) nav.insertAdjacentHTML('afterbegin', NAV_HTML);

    document.getElementById('hamburgerBtn')?.addEventListener('click', openMobileNav);
    document.getElementById('mobileNavClose')?.addEventListener('click', closeMobileNav);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileNav(); });

    // ── Lazy image load ──────────────────────────
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.complete) img.classList.add('loaded');
      else img.addEventListener('load', () => img.classList.add('loaded'));
    });

    // ── Cart badge bump ──────────────────────────
    const origAdd = window.addToCart;
    if (origAdd) {
      window.addToCart = function (id) {
        origAdd(id);
        ['cartBadge', 'cartBadge2'].forEach(bId => {
          const b = document.getElementById(bId);
          if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 350); }
        });
      };
    }
  });

  window.openMobileNav = function () {
    document.getElementById('hamburgerBtn')?.classList.add('open');
    document.getElementById('hamburgerBtn')?.setAttribute('aria-expanded', 'true');
    document.getElementById('mobileNav')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeMobileNav = function () {
    document.getElementById('hamburgerBtn')?.classList.remove('open');
    document.getElementById('hamburgerBtn')?.setAttribute('aria-expanded', 'false');
    document.getElementById('mobileNav')?.classList.remove('open');
    document.body.style.overflow = '';
  };
})();
