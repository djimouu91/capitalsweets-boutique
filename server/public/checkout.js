// ═══════════════════════════════════════════════════════════
// CapitalSweets — Checkout · Stripe Canada + PayPal
// ═══════════════════════════════════════════════════════════

const STRIPE_KEY   = 'pk_live_51TZEduE1hYEQBg1wkvGbRrUWh1UJUX9SzxOxLoAbjZNTohdqvQ8FuHY2GacfLYSKt9mr4ehzjGa70LJimue6VEzD00VadggbjJ';
const BACKEND_URL  = window.location.port === '3000' ? '' : 'http://localhost:3000';
const DEMO_MODE    = STRIPE_KEY.includes('YOUR');
const CURRENCY     = 'CAD';
const CURRENCY_SYM = 'CA$';
const TAX_RATE     = 0.13;
const FREE_SHIP_AT = 65;
const SHIP_COST    = 9.99;

// ── PROVINCE / STATE DROPDOWN ──────────────────────────────
const REGIONS = {
  CA: [
    ['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],
    ['NB','New Brunswick'],['NL','Newfoundland'],['NS','Nova Scotia'],
    ['NT','Northwest Territories'],['NU','Nunavut'],['ON','Ontario'],
    ['PE','Prince Edward Island'],['QC','Québec'],['SK','Saskatchewan'],['YT','Yukon']
  ],
  US: [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
    ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
    ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
    ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
    ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
    ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
    ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
    ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
    ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
    ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
    ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
    ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
    ['WI','Wisconsin'],['WY','Wyoming'],['DC','Washington D.C.']
  ]
};

function updateProvinceDropdown(country) {
  const sel   = document.getElementById('province');
  const label = document.getElementById('provinceLabel');
  const zip   = document.getElementById('zip');
  const zipLb = document.getElementById('zipLabel');
  if (!sel) return;
  if (country === 'CA') {
    label && (label.textContent = 'Province');
    zipLb  && (zipLb.textContent = 'Postal Code');
    zip    && (zip.placeholder = 'K1A 0A9', zip.maxLength = 7);
    sel.innerHTML = '<option value="">Select province...</option>' +
      REGIONS.CA.map(([v,l]) => `<option value="${v}">${l}</option>`).join('');
    sel.required = true;
  } else if (country === 'US') {
    label && (label.textContent = 'State');
    zipLb  && (zipLb.textContent = 'ZIP Code');
    zip    && (zip.placeholder = '10001', zip.maxLength = 10);
    sel.innerHTML = '<option value="">Select state...</option>' +
      REGIONS.US.map(([v,l]) => `<option value="${v}">${l}</option>`).join('');
    sel.required = true;
  } else {
    label && (label.textContent = 'Region');
    zipLb  && (zipLb.textContent = 'Postal / ZIP');
    zip    && (zip.placeholder = '', zip.maxLength = 15);
    sel.innerHTML = '<option value="">N/A</option>';
    sel.required = false;
  }
}

document.addEventListener('DOMContentLoaded', () => updateProvinceDropdown('CA'));

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
  window.shippingData = {
    firstName : document.getElementById('fn')?.value || '',
    lastName  : document.getElementById('ln')?.value || '',
    email     : document.getElementById('em')?.value || '',
    phone     : document.getElementById('ph')?.value || '',
    address   : document.getElementById('addr')?.value || '',
    apt       : document.getElementById('apt')?.value || '',
    city      : document.getElementById('city')?.value || '',
    postal    : document.getElementById('zip')?.value || '',
    province  : document.getElementById('province')?.value || '',
    country   : document.getElementById('country')?.value || 'CA',
    giftMsg   : document.getElementById('giftMsg')?.value || '',
  };
  const shipEl = document.getElementById('shippingPreview');
  if (shipEl) {
    const d = window.shippingData;
    const aptStr = d.apt ? `, ${d.apt}` : '';
    shipEl.innerHTML = `<strong>${d.firstName} ${d.lastName}</strong><br>
      ${d.address}${aptStr}, ${d.city}<br>
      ${d.province} ${d.postal}, ${d.country}<br>
      📧 ${d.email} &nbsp; 📞 ${d.phone}`;
  }
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
  const ref = 'CS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
  const tax      = subtotal * TAX_RATE;
  const grand    = (subtotal + shipping + tax).toFixed(2);

  await saveOrder('Interac', ref);

  // Show reference number immediately so client can include it in Interac message
  const box = document.getElementById('pm-interac')?.querySelector('div');
  if (box) {
    box.innerHTML = `
      <p style="font-weight:700;color:#3d1f08;font-size:1rem;margin-bottom:10px;">✅ Commande Confirmée!</p>
      <p style="font-size:.9rem;color:#5c3d1e;line-height:1.8;margin-bottom:12px;">
        Veuillez envoyer <strong>${CURRENCY_SYM}${grand}</strong> par Interac e-Transfer à :<br/>
        <strong style="font-size:1rem;color:#3d1f08;">djimouu91@gmail.com</strong>
      </p>
      <div style="background:#fff;border:2px dashed #c8922a;border-radius:8px;padding:12px;margin:10px 0;">
        <p style="font-size:.78rem;color:#9a7a58;margin-bottom:4px;">NUMÉRO DE COMMANDE</p>
        <p style="font-size:1.3rem;font-weight:700;color:#3d1f08;letter-spacing:2px;">${ref}</p>
        <p style="font-size:.78rem;color:#9a7a58;">Inclure dans le message Interac</p>
      </div>
      <p style="font-size:.8rem;color:#9a7a58;">Un email de confirmation sera envoyé dès réception du paiement.</p>`;
  }
}

// ── SAVE ORDER ──────────────────────────────────────────────
async function saveOrder(method, ref) {
  const sd = window.shippingData || {};
  const orderRef = ref || 'CS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= FREE_SHIP_AT ? 0 : SHIP_COST;
    const tax      = subtotal * TAX_RATE;
    await fetch(`${BACKEND_URL}/confirm-order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ref: orderRef,
        customerData: {
          firstName:   sd.firstName || document.getElementById('fn')?.value,
          lastName:    sd.lastName  || document.getElementById('ln')?.value,
          email:       sd.email     || document.getElementById('em')?.value,
          phone:       sd.phone     || document.getElementById('ph')?.value,
          address:     sd.address   || document.getElementById('addr')?.value,
          apt:         sd.apt       || '',
          city:        sd.city      || document.getElementById('city')?.value,
          postal:      sd.postal    || document.getElementById('zip')?.value,
          province:    sd.province  || document.getElementById('province')?.value,
          country:     sd.country   || document.getElementById('country')?.value || 'CA',
          giftMessage: sd.giftMsg   || document.getElementById('giftMsg')?.value
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
