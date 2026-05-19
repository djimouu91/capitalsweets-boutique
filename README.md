# CapitalSweets — Authentic Algerian Pastries

> Boutique e-commerce · Pâtisseries algériennes artisanales · Ottawa, Canada

![CapitalSweets](https://img.shields.io/badge/CapitalSweets-Ottawa-c8922a?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-v24-green?style=for-the-badge&logo=node.js)
![Stripe](https://img.shields.io/badge/Stripe-Canada-635bff?style=for-the-badge&logo=stripe)

## ✨ Features

- 🍯 **12 authentic Algerian pastry products** — Makroud, Baklava, Kalb el Louz, Gift Boxes...
- 💳 **3 payment methods** — Stripe, PayPal, Interac e-Transfer
- 📦 **Gift message field** — for Eid, weddings, celebrations
- 📊 **Real-time CRM Dashboard** — Orders, products, WhatsApp buttons
- 📱 **WhatsApp notifications** — New order alerts (Twilio or wa.me)
- 🇨🇦 **Canadian-first** — CAD, HST 13%, free shipping over CA$65
- 📱 **Mobile responsive** — Hamburger nav, touch-optimized
- ✅ **100% Halal** — Trust badges, family recipes

## 🚀 Quick Start

```bash
cd server
npm install
cp .env.example .env   # fill in your API keys
node server.js
```

Open: http://localhost:3000
CRM: http://localhost:3000/dashboard

Or double-click **restart-server.bat**

## ⚙️ Configuration

Edit `server/.env`:

| Variable | Description |
|----------|-------------|
| `OWNER_PHONE` | Your WhatsApp (e.g. +16131234567 for Ottawa) |
| `STRIPE_SECRET_KEY` | From dashboard.stripe.com |
| `PAYPAL_CLIENT_ID` | From developer.paypal.com |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password (16 chars) |

## 🍯 Products Included

| Category | Items |
|----------|-------|
| Cookies | Makroud el Asser, Ghribia, Chrik Dorés, Petits Fours Pistaches |
| Baklava | Baklava Algérienne, Cornes de Gazelle |
| Cakes | Kalb el Louz, Sellou/Sfouf |
| Fried & Honey | Zlabia, Griwech au Sésame |
| Gift Boxes | Box Prestige 24pc, Box Eid Premium 36pc |

## 📁 Project Structure

```
thecapitalsweets/
├── index.html          # Main storefront
├── style.css           # Gold/honey/cream brand styles
├── ux-improvements.css # UX audit fixes
├── app.js              # Products + cart
├── checkout.js         # Stripe CA + PayPal + Interac
├── mobile-nav.js       # Hamburger menu + UX
├── logo.svg            # Crescent + star logo
├── favicon.svg         # Browser icon
└── server/
    ├── server.js       # Express backend
    ├── services/
    │   ├── orders.js   # Orders + SSE
    │   ├── products.js # Product CRUD
    │   ├── email.js    # Email confirmations
    │   └── whatsapp.js # WhatsApp (Twilio + wa.me)
    ├── dashboard/      # CRM with WhatsApp buttons
    └── public/         # Frontend copy
```

## 💰 Money Flow

| Method | Speed | Cost |
|--------|-------|------|
| Stripe | 2 business days → bank | 2.9% + 30¢ |
| PayPal | Transfer anytime | 3.49% + fixed |
| Interac | Instant (Auto-Deposit) | Free |

---

صُنع بحبٍّ في أوتاوا · Made with love in Ottawa 🍯
