# DealSpot - Nederlandse Deals Platform

Een moderne web applicatie voor het ontdekken en kopen van lokale deals in Nederland.

## 🚀 Snelle Start

### Vereisten
- Node.js 18+ 
- npm of yarn
- PostgreSQL database

### Installatie

```bash
# 1. Installeer dependencies
npm install

# 2. Environment variables instellen
# Kopieer .env.example naar .env en vul in:
DATABASE_URL="postgresql://user:password@localhost:5432/dealspot"

# 3. Database setup
npm run db:push

# 4. Start de applicatie
npm run dev
```

De app draait nu op `http://localhost:5000`

## 📁 Project Structuur

```
dealspotapp/
├── client/          # React frontend (Vite)
├── server/          # Express.js backend
├── shared/          # TypeScript schemas
├── package.json     # Dependencies
└── README.md       # Deze instructies
```

## 🔑 Features

- **Interactieve Kaart**: Vind deals op locatie
- **Business Dashboard**: Voor ondernemers
- **QR Voucher Scanner**: Automatische voucher verificatie
- **Mobiel Geoptimaliseerd**: Responsive design
- **Real-time Notificaties**: Toast berichten

## 🏢 Business Login (Demo)

```
Email: demo@restaurant.com
Wachtwoord: demo123
```

## 🛠️ Development

```bash
# Frontend development
cd client && npm run dev

# Backend development  
cd server && npm run dev

# Database migratie
npm run db:push

# Build voor productie
npm run build
```

## 🚀 Hosting

### Vercel/Netlify
1. Upload project naar GitHub
2. Connect repository
3. Set environment variables
4. Deploy!

### VPS/Server
1. Install Node.js en PostgreSQL
2. Clone project
3. `npm install && npm run build`
4. Start met PM2: `pm2 start server/index.js`

---

**DealSpot © 2024 - Nederlandse Deals Platform**