// ═══════════════════════════════════════════════════════════
// CapitalSweets — Checkout · Stripe Canada + PayPal
// ═══════════════════════════════════════════════════════════

const STRIPE_KEY   = 'pk_test_YOUR_STRIPE_KEY';
const BACKEND_URL  = window.location.port === '3000' ? '' : 'http://localhost:3000';
const DEMO_MODE    = STRIPE_KEY.includes('YOUR');
const CURRENCY     = 'CAD';
const CURRENCY_SYM = 'CA$';
const TAX_RATE     = 0.13; // Ontario HST — adjust per province
const FREE_SHIP_AT = 65;
const SHIP_COST    = 9.99;

let stripeInstance = null;
let cardElement    = null;

// ── OPEN / CLOSE ────────────────────────────────────────────
function openCheckout() {
  if (!cart.length) return;
  toggleCart();
  populateSummary();
  showStep(1);
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!DEMO_MODE && !stripeInstance) initStripe();
}

function closeCheckout(e) {
  if (e && e.target !== document.getElementById('checkoutOverlay')) return;
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── STEPS ───────────────────────────────────────────────────
function showStep(n) {
  document.querySelectorAll('.co-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('co-step' + n).classList.remove('hidden');
}

function goStep2(e) {
  e.preventDefault();
  populateSummary();
  showStep(2);
  initPayPalButton();
}

// ── SUMMARY ─────────────────────────────────────────────────
function populateSummary() {
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
  const tax       = subtotal * TAX_RATE;
  const grandTotal = subtotal + shipping + tax;

  const html = cart.map(i => `
    <div class="co-summary-item">
      <span>${i.name} <span style="color:#9a7a58">×${i.qty}</span></span>
      <span>${CURRENCY_SYM}${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join('');

  ['coSummary', 'coSummary2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });

  ['coTotal', 'coTotal2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `
      <div style="font-size:.82rem;color:#9a7a58;margin-bottom:4px;">
        <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${CURRENCY_SYM}${subtotal.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Shipping</span><span>${shipping === 0 ? 'Free' : CURRENCY_SYM + shipping.toFixed(2)}</span></div>
        <div style="display:flex;justify-content:space-between"><span>Tax (HST 13%)</span><span>${CURRENCY_SYM}${tax.toFixed(2)}</span></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;border-top:1px solid #e0cba8;padding-top:10px;margin-top:6px">
        <span>Total (${CURRENCY})</span><span>${CURRENCY_SYM}${grandTotal.toFixed(2)}</span>
      </div>`;
  });

  const pa = document.getElementById('payAmount');
  if (pa) pa.textContent = grandTotal.toFixed(2);
}

// ── STRIPE ──────────────────────────────────────────────────
function initStripe() {
  if (DEMO_MODE || stripeInstance) return;
  try {
    stripeInstance = Stripe(STRIPE_KEY);
    const elements = stripeInstance.elements({ locale: 'en-CA' });
    cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: '"Jost", sans-serif',
          fontSize: '15px',
          color: '#2e1a08',
          '::placeholder': { color: '#c8aa88' }
        }
      },
      hidePostalCode: false
    });
    const mount = document.getElementById('stripe-card-mount');
    if (mount) {
      document.getElementById('demo-card-fields').style.display = 'none';
      cardElement.mount('#stripe-card-mount');
    }
  } catch (err) {
    console.warn('Stripe init:', err);
  }
}

// ── PAYMENT METHODS ─────────────────────────────────────────
function switchPM(tab, btn) {
  document.querySelectorAll('.pm-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pm-card').classList.toggle('hidden', tab !== 'card');
  document.getElementById('pm-paypal').classList.toggle('hidden', tab !== 'paypal');
  document.getElementById('pm-interac').classList.toggle('hidden', tab !== 'interac');
}

// ── CARD PAYMENT ────────────────────────────────────────────
async function processPayment() {
  const btn = event?.currentTarget || document.querySelector('.btn-co');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 2000));
    showSuccess();
    if (btn) btn.disabled = false;
    return;
  }

  try {
    const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping  = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
    const tax       = subtotal * TAX_RATE;
    const grand     = Math.round((subtotal + shipping + tax) * 100);

    const res = await fetch(`${BACKEND_URL}/create-payment-intent`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount: grand, currency: 'cad', items: cart })
    });
    const { clientSecret } = await res.json();

    const result = await stripeInstance.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name:  document.getElementById('cName')?.value,
          email: document.getElementById('em')?.value,
          address: {
            city:        document.getElementById('city')?.value,
            postal_code: document.getElementById('zip')?.value,
            country:     'CA'
          }
        }
      }
    });

    if (result.error) {
      showToast('❌ ' + result.error.message);
      if (btn) { btn.disabled = false; btn.textContent = `Pay ${CURRENCY_SYM}${(grand/100).toFixed(2)}`; }
    } else {
      await saveOrder('Card');
      showSuccess();
    }
  } catch (err) {
    showToast('Connection error. Please try again.');
    if (btn) btn.disabled = false;
  }
}

// ── PAYPAL ──────────────────────────────────────────────────
let paypalRendered = false;

function initPayPalButton() {
  const container = document.getElementById('paypal-button-container');
  if (!container || paypalRendered) return;

  if (DEMO_MODE || typeof paypal_sdk === 'undefined') {
    container.innerHTML = `
      <button class="btn-paypal" onclick="demoPayPal()">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/100px-PayPal.svg.png"
          alt="PayPal" style="height:18px;vertical-align:middle;filter:brightness(0) invert(1);margin-right:8px"/>
        Pay with PayPal
      </button>`;
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
  const tax      = subtotal * TAX_RATE;
  const grand    = (subtotal + shipping + tax).toFixed(2);

  paypal_sdk.Buttons({
    style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' },
    createOrder: async () => {
      const r = await fetch(`${BACKEND_URL}/paypal/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: grand, currency: 'CAD', items: cart })
      });
      return (await r.json()).orderID;
    },
    onApprove: async (data) => {
      const r = await fetch(`${BACKEND_URL}/paypal/capture-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderID: data.orderID })
      });
      const cap = await r.json();
      if (cap.status === 'COMPLETED') { await saveOrder('PayPal'); showSuccess(); }
    },
    onError: () => showToast('PayPal error. Please try again.')
  }).render('#paypal-button-container');
  paypalRendered = true;
}

async function demoPayPal() {
  await new Promise(r => setTimeout(r, 1800));
  showSuccess();
}

// ── INTERAC ─────────────────────────────────────────────────
async function processInterac() {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 1800));
    showSuccess();
    return;
  }
  showToast('Interac order confirmed. Please send e-Transfer to hello@capitalsweets.ca');
  await saveOrder('Interac');
  setTimeout(showSuccess, 2000);
}

// ── SAVE ORDER ──────────────────────────────────────────────
async function saveOrder(method) {
  try {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
    const tax      = subtotal * TAX_RATE;
    await fetch(`${BACKEND_URL}/confirm-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        customerData: {
          firstName: document.getElementById('fn')?.value,
          lastName:  document.getElementById('ln')?.value,
          email:     document.getElementById('em')?.value,
          phone:     document.getElementById('ph')?.value,
          address:   document.getElementById('addr')?.value,
          city:      document.getElementById('city')?.value,
          zip:       document.getElementById('zip')?.value,
          province:  document.getElementById('country')?.value || 'ON',
          giftMessage: document.getElementById('giftMsg')?.value
        },
        items: cart,
        paymentMethod: method,
        currency: CURRENCY,
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax:      tax.toFixed(2),
        total:    (subtotal + shipping + tax).toFixed(2)
      })
    });
  } catch (e) { console.warn('Order save failed:', e); }
}

// ── SUCCESS ─────────────────────────────────────────────────
function showSuccess() {
  const ref = 'CS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const el  = document.getElementById('successEmail');
  const rel = document.getElementById('successRef');
  if (el)  el.textContent  = document.getElementById('em')?.value || 'your email';
  if (rel) rel.textContent = ref;
  showStep(3);
}

function resetCart() {
  cart = [];
  updateCartUI();
}

// ── FORMATTERS ──────────────────────────────────────────────
function fmtCard(i)   { let v = i.value.replace(/\D/g,'').substring(0,16); i.value = v.match(/.{1,4}/g)?.join(' ') || v; }
function fmtExpiry(i) { let v = i.value.replace(/\D/g,'').substring(0,4); if(v.length>=2) v=v.substring(0,2)+' / '+v.substring(2); i.value=v; }
