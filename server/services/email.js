const nodemailer = require('nodemailer');

const DEMO = !process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your');

const transporter = DEMO ? null : nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function orderTable(order) {
  const rows = (order.items || []).map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f0ddb0">${i.name}</td>
     <td style="padding:8px;border-bottom:1px solid #f0ddb0;text-align:center">${i.qty}</td>
     <td style="padding:8px;border-bottom:1px solid #f0ddb0;text-align:right">CA$${(i.price*i.qty).toFixed(2)}</td></tr>`
  ).join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#f0ddb0">
      <th style="padding:10px;text-align:left">Item</th>
      <th style="padding:10px;text-align:center">Qty</th>
      <th style="padding:10px;text-align:right">Price</th>
    </tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2" style="padding:10px;font-weight:bold">Total</td>
      <td style="padding:10px;text-align:right;font-weight:bold">CA$${order.total || '0.00'}</td>
    </tr></tfoot></table>`;
}

async function sendOrderConfirmation(order) {
  if (DEMO) { console.log('📧 [DEMO] Order confirmation →', order.customerData?.email); return; }
  await transporter.sendMail({
    from: `"CapitalSweets" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to:   order.customerData?.email,
    subject: `Order Confirmed — ${order.ref} | CapitalSweets`,
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2e1a08">
  <div style="background:#3d1f08;padding:32px;text-align:center">
    <h1 style="color:#f5e8c8;font-size:28px;letter-spacing:4px;margin:0">CapitalSweets</h1>
    <p style="color:#c8922a;font-size:12px;letter-spacing:2px;margin:4px 0 0">AUTHENTIC ALGERIAN PASTRIES</p>
  </div>
  <div style="padding:32px;background:#fdf7ed">
    <h2 style="color:#3d1f08">Order Confirmed ✦</h2>
    <p>Thank you, <strong>${order.customerData?.firstName}</strong>! Your pastries are being prepared fresh.</p>
    <p style="background:#f0ddb0;padding:12px;border-radius:6px;font-weight:600">Order Reference: ${order.ref}</p>
    ${orderTable(order)}
    <p style="margin-top:24px;color:#9a7a58;font-size:13px">
      We'll notify you when your order ships. Questions? Reply to this email or WhatsApp us.<br/>
      <a href="mailto:hello@capitalsweets.ca" style="color:#c8922a">hello@capitalsweets.ca</a>
    </p>
  </div>
  <div style="background:#3d1f08;padding:16px;text-align:center">
    <p style="color:rgba(255,255,255,.5);font-size:12px;margin:0">© 2026 CapitalSweets · Ottawa, Canada</p>
  </div>
</div>`
  });
}

async function sendShippingNotification(order) {
  if (DEMO) { console.log('📧 [DEMO] Shipping notification →', order.customerData?.email); return; }
  await transporter.sendMail({
    from: `"CapitalSweets" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to:   order.customerData?.email,
    subject: `Your order is on its way! — ${order.ref}`,
    html: `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2e1a08">
  <div style="background:#3d1f08;padding:32px;text-align:center">
    <h1 style="color:#f5e8c8;font-size:28px;letter-spacing:4px;margin:0">CapitalSweets</h1>
  </div>
  <div style="padding:32px;background:#fdf7ed">
    <h2>Your pastries are on their way! 🚀</h2>
    <p>Order <strong>${order.ref}</strong> has been shipped.</p>
    <p>Enjoy your sweets, <strong>${order.customerData?.firstName}</strong>!</p>
  </div>
</div>`
  });
}

module.exports = { sendOrderConfirmation, sendShippingNotification };
