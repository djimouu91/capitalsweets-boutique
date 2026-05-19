const fs   = require('fs').promises;
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'orders.json');
const sseClients = new Set();

async function read() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); }
  catch { return []; }
}

async function write(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(c => { try { c.write(payload); } catch {} });
}

async function createOrder(order) {
  const orders = await read();
  orders.unshift(order);
  await write(orders);
  broadcast('new-order', order);
  broadcast('stats', await computeStats(orders));
  return order;
}

async function updateOrderStatus(ref, status) {
  const orders = await read();
  const order  = orders.find(o => o.ref === ref);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await write(orders);
  broadcast('order-updated', order);
  broadcast('stats', await computeStats(orders));
  return order;
}

async function getOrders() { return read(); }

async function getStats() {
  return computeStats(await read());
}

async function computeStats(orders) {
  const total    = orders.length;
  const revenue  = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const pending  = orders.filter(o => o.status === 'confirmed').length;
  const shipped  = orders.filter(o => o.status === 'shipped').length;
  return { total, revenue: revenue.toFixed(2), pending, shipped };
}

module.exports = { createOrder, updateOrderStatus, getOrders, getStats, sseClients };
