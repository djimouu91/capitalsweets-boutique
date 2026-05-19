// ═══════════════════════════════════════════════════════════
// CapitalSweets — WhatsApp Service
//
// MODE AUTO-DETECT:
//   TWILIO_ACCOUNT_SID configuré → messages envoyés automatiquement
//   Non configuré             → liens wa.me générés dans le CRM
// ═══════════════════════════════════════════════════════════

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN  || '';
const FROM         = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const OWNER_PHONE  = process.env.OWNER_PHONE || '';

const TWILIO_ENABLED = TWILIO_SID.startsWith('AC') && TWILIO_SID.length > 20
                    && !TWILIO_SID.includes('xxx');

const client = TWILIO_ENABLED
  ? require('twilio')(TWILIO_SID, TWILIO_TOKEN)
  : null;

function waLink(phone, message) {
  const clean   = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

async function send(toPhone, body) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  if (TWILIO_ENABLED) {
    try {
      await client.messages.create({ from: FROM, to, body });
      console.log(`✅ WhatsApp envoyé → ${toPhone}`);
    } catch (err) {
      console.warn(`⚠️  WhatsApp Twilio erreur: ${err.message}`);
    }
  } else {
    const phone = toPhone.replace('whatsapp:', '').trim();
    console.log(`\n📱 [WhatsApp — cliquer pour envoyer]\n${waLink(phone, body)}\n`);
  }
}

function getWaLink(phone, message) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  if (!clean) return null;
  return waLink(clean, message);
}

async function notifyOwnerNewOrder(order) {
  if (!OWNER_PHONE) {
    console.log('ℹ️  OWNER_PHONE non configuré dans .env');
    return;
  }
  const items = (order.items || []).map(i => `  • ${i.name} ×${i.qty}`).join('\n');
  const c     = order.customerData || {};

  const body =
`🍯 *Nouvelle commande — CapitalSweets*
──────────────────
📋 Réf: *${order.ref}*
👤 ${c.firstName || ''} ${c.lastName || ''}
📧 ${c.email || ''}
📱 ${c.phone || 'Pas de téléphone'}
📍 ${c.city || ''}, ${c.province || 'ON'}
──────────────────
${items}
──────────────────
💰 Total: *CA$${order.total || ''}*
💳 Paiement: ${order.paymentMethod || ''}
${c.giftMessage ? `🎁 Message cadeau: "${c.giftMessage}"` : ''}
──────────────────
📊 Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

  await send(OWNER_PHONE, body);
}

async function confirmOrderToCustomer(order, customerPhone) {
  if (!customerPhone) return;
  const c = order.customerData || {};

  const body =
`✦ *Commande confirmée — CapitalSweets*

Salam ${c.firstName || ''} ! 🍯
Votre commande *${order.ref}* est bien reçue.

💰 Total: *CA$${order.total || ''}*
📍 Livraison à: ${c.city || ''}

Nous préparons vos gâteaux frais!
On vous prévient dès l'expédition 📦

— CapitalSweets · Ottawa`;

  await send(customerPhone, body);
}

async function notifyShipped(order, customerPhone) {
  if (!customerPhone) return;
  const c = order.customerData || {};

  const body =
`🚀 *Vos pâtisseries sont en route! — CapitalSweets*

Salam ${c.firstName || ''} !
Votre commande *${order.ref}* a été expédiée 📦

${order.trackingNumber ? `📬 Suivi: *${order.trackingNumber}*` : ''}
⏱️ Délai estimé: 3–7 jours

Bon appétit! ✨`;

  await send(customerPhone, body);
}

async function notifyDelivered(order, customerPhone) {
  if (!customerPhone) return;
  const c = order.customerData || {};

  const body =
`🎉 *Commande livrée — CapitalSweets*

Salam ${c.firstName || ''} !
Votre commande *${order.ref}* a été livrée 📬

Nous espérons que vous adorez vos pâtisseries! 💛
Un avis Google nous ferait vraiment plaisir 🌟

— CapitalSweets · Ottawa`;

  await send(customerPhone, body);
}

async function notifyOwnerStatusChange(order, newStatus) {
  if (!OWNER_PHONE) return;
  const emoji = { confirmed:'✅', processing:'⚙️', shipped:'🚚', delivered:'🎉', cancelled:'❌' };
  const c     = order.customerData || {};

  const body =
`${emoji[newStatus] || '📋'} *Statut mis à jour — CapitalSweets*

📋 Réf: *${order.ref}*
👤 ${c.firstName || ''} ${c.lastName || ''}
🔄 Nouveau statut: *${newStatus.toUpperCase()}*`;

  await send(OWNER_PHONE, body);
}

function getCustomerWaLink(order) {
  const c     = order.customerData || {};
  const phone = c.phone;
  if (!phone) return null;
  const msg = `Salam ${c.firstName || ''} ! Ici CapitalSweets 🍯\nConcernant votre commande *${order.ref}*:\n`;
  return getWaLink(phone, msg);
}

function getOwnerWaLink(order) {
  if (!OWNER_PHONE) return null;
  const c    = order.customerData || {};
  const items = (order.items || []).map(i => `${i.name} ×${i.qty}`).join(', ');
  const msg  = `Nouvelle commande ${order.ref} — ${c.firstName} ${c.lastName} — ${items} — CA$${order.total}`;
  return getWaLink(OWNER_PHONE, msg);
}

module.exports = {
  notifyOwnerNewOrder,
  confirmOrderToCustomer,
  notifyShipped,
  notifyDelivered,
  notifyOwnerStatusChange,
  getCustomerWaLink,
  getOwnerWaLink,
  TWILIO_ENABLED
};
