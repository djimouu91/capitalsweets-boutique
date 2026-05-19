const fs   = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FILE = path.join(__dirname, '..', 'data', 'products.json');

const DEFAULTS = [
  { id:'1', category:'cookies', name:'Makroud el Asser', price:28, orig:null, badge:'Best Seller', img:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80', desc:'Classic semolina diamond cookies filled with Medjool dates.', active:true },
  { id:'2', category:'baklava', name:'Baklava Algérienne au Miel', price:38, orig:52, badge:'Best Seller', img:'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80', desc:'Phyllo dough with crushed walnuts & wildflower honey.', active:true },
  { id:'3', category:'cakes',   name:'Kalb el Louz', price:42, orig:58, badge:'Best Seller', img:'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80', desc:'Almond semolina cake soaked in honey syrup.', active:true },
  { id:'4', category:'gift',    name:'Box Prestige — 24 pièces', price:85, orig:110, badge:'Best Seller', img:'https://images.unsplash.com/photo-1607920592519-7b2d615d8c3e?w=600&q=80', desc:'Signature gift box with 4 varieties of pastries.', active:true },
  { id:'5', category:'cookies', name:'Ghribia aux Amandes', price:24, orig:32, badge:'Sale', img:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80', desc:'Almond crescent shortbread, dusted with powdered sugar.', active:true },
  { id:'6', category:'fried',   name:'Zlabia de Constantine', price:20, orig:28, badge:'Sale', img:'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80', desc:'Crispy golden spirals soaked in honey syrup.', active:true },
  { id:'7', category:'gift',    name:'Box Eid Premium — 36 pièces', price:125, orig:160, badge:'New', img:'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80', desc:'Luxury celebration box with 6 varieties.', active:true },
  { id:'8', category:'baklava', name:'Cornes de Gazelle', price:30, orig:null, badge:'Best Seller', img:'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80', desc:'Almond paste crescent pastries, honey-glazed.', active:true },
];

async function read() {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); }
  catch {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(DEFAULTS, null, 2));
    return DEFAULTS;
  }
}

async function write(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

async function getAll()    { return read(); }
async function getActive() { return (await read()).filter(p => p.active !== false); }

async function create(data) {
  const products = await read();
  const product  = { ...data, id: uuidv4(), active: true, createdAt: new Date().toISOString() };
  products.push(product);
  await write(products);
  return product;
}

async function update(id, data) {
  const products = await read();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data, id };
  await write(products);
  return products[idx];
}

async function remove(id) {
  const products = await read();
  await write(products.filter(p => p.id !== id));
}

module.exports = { getAll, getActive, create, update, remove };
