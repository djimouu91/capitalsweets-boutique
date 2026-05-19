// ═══════════════════════════════════════════════════════════
// CapitalSweets — server.js
// ═══════════════════════════════════════════════════════════
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const ordersService   = require('./services/orders');
const productsService = require('./services/products');
const emailService    = require('./services/email');
const waService       = require('./services/whatsapp');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── STRIPE ────────────────────────────────────────────────
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET';
const DEMO_STRIPE   = STRIPE_SECRET.includes('YOUR');
const stripe        = DEMO_STRIPE ? null : require('stripe')(STRIPE_SECRET);

// ── PAYPAL ────────────────────────────────────────────────
const PAYPAL_ID     = process.env.PAYPAL_CLIENT_ID     || 'YOUR_PAYPAL_CLIENT_ID';
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'YOUR_PAYPAL_SECRET';
const DEMO_PAYPAL   = PAYPAL_ID.includes('YOUR');

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── STATIC FILES ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// ══════════════════════════════════════
//  PRODUCTS API
// ══════════════════════════════════════
app.get('/api/products', async (req, res) => {
  const products = await productsService.getActive();
  res.json(products);
});

app.get('/api/products/all', async (req, res) => {
  const products = await productsService.getAll();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = await productsService.create(req.body);
  res.json(product);
});

app.put('/api/products/:id', async (req, res) => {
  const product = await productsService.update(req.params.id, req.body);
  res.json(product);
});

app.delete('/api/products/:id', async (req, res) => {
  await productsService.remove(req.params.id);
  res.json({ ok: true });
});

// ══════════════════════════════════════
//  STRIPE
// ══════════════════════════════════════
app.post('/create-payment-intent', async (req, res) => {
  if (DEMO_STRIPE) return res.json({ clientSecret: 'demo_secret' });
  try {
    const { amount, currency = 'cad' } = req.body;
    const intent = await stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } });
    res.json({ clientSecret: intent.client_secret });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════
//  PAYPAL
// ══════════════════════════════════════
async function getPayPalToken() {
  const res = await fetch(`https://api-m.${process.env.PAYPAL_MODE === 'live' ? '' : 'sandbox.'}paypal.com/v1/oauth2/token`, {
    method:  'POST',
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_ID}:${PAYPAL_SECRET}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

app.post('/paypal/create-order', async (req, res) => {
  if (DEMO_PAYPAL) return res.json({ orderID: 'DEMO-' + Date.now() });
  try {
    const token = await getPayPalToken();
    const base  = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const r = await fetch(`${base}/v2/checkout/orders`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'CAD', value: req.body.amount } }] })
    });
    const order = await r.json();
    res.json({ orderID: order.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/paypal/capture-order', async (req, res) => {
  if (DEMO_PAYPAL) return res.json({ status: 'COMPLETED' });
  try {
    const token = await getPayPalToken();
    const base  = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const r = await fetch(`${base}/v2/checkout/orders/${req.body.orderID}/capture`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════
//  CONFIRM ORDER
// ══════════════════════════════════════
app.post('/confirm-order', async (req, res) => {
  try {
    const { customerData, items, paymentMethod, currency, subtotal, shipping, tax, total } = req.body;
    const ref = 'CS-' + uuidv4().substring(0, 6).toUpperCase();

    const order = await ordersService.createOrder({
      ref, customerData, items, paymentMethod,
      currency: currency || 'CAD',
      subtotal, shipping, tax, total,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    });

    // Notifications (non-blocking)
    emailService.sendOrderConfirmation(order).catch(e => console.warn('Email:', e.message));
    waService.notifyOwnerNewOrder(order).catch(e => console.warn('WA:', e.message));
    if (customerData?.phone) {
      waService.confirmOrderToCustomer(order, customerData.phone).catch(() => {});
    }

    res.json({ success: true, ref });
  } catch (e) {
    console.error('Confirm order:', e);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════
//  ORDERS API (CRM)
// ══════════════════════════════════════
app.get('/api/orders', async (req, res) => {
  const orders = await ordersService.getOrders();
  res.json(orders);
});

app.get('/api/orders/stats', async (req, res) => {
  const stats = await ordersService.getStats();
  res.json(stats);
});

app.patch('/api/orders/:ref/status', async (req, res) => {
  const order = await ordersService.updateOrderStatus(req.params.ref, req.body.status);
  if (order) {
    emailService.sendShippingNotification(order).catch(() => {});
    waService.notifyOwnerStatusChange(order, req.body.status).catch(() => {});
  }
  res.json({ ok: true });
});

// ══════════════════════════════════════
//  SSE — Real-time CRM
// ══════════════════════════════════════
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');

  ordersService.sseClients.add(res);
  req.on('close', () => ordersService.sseClients.delete(res));
});

// ══════════════════════════════════════
//  STRIPE WEBHOOK
// ══════════════════════════════════════
app.post('/webhook', (req, res) => {
  if (DEMO_STRIPE) return res.json({ received: true });
  try {
    const sig   = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    console.log('Stripe webhook:', event.type);
    res.json({ received: true });
  } catch (e) {
    res.status(400).send(`Webhook Error: ${e.message}`);
  }
});

// ── STATUS ────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', shop: 'CapitalSweets', mode: DEMO_STRIPE ? 'demo' : 'live' });
});

// ── SPA FALLBACK ─────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/dashboard')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🍯 CapitalSweets server running → http://localhost:${PORT}`);
  console.log(`📊 CRM Dashboard → http://localhost:${PORT}/dashboard`);
  console.log(`Mode: ${DEMO_STRIPE ? 'DEMO (no real payments)' : 'LIVE'}\n`);
});
