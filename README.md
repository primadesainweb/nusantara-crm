# Nusantara CRM

Sistem Manajemen Jamaah Umroh & Haji — Vanilla JS + Tailwind CSS + Vite

## Tech Stack

| Layer | Teknologi |
|---|---|
| UI | Tailwind CSS 3, Vanilla JS ES2022+ |
| Build | Vite |
| Backend (dev) | JSON Server |
| Charts | Chart.js |
| Export | jsPDF, SheetJS |

## Quick Start

```bash
# Install dependencies
npm install

# Start JSON Server (terminal 1)
npm run server

# Start Vite dev server (terminal 2)
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Production build → dist/ |
| `npm run preview` | Preview production build |
| `npm run server` | JSON Server (port 3001) |

## API Endpoints (JSON Server)

```
GET    /api/jamaah       → Semua jamaah
POST   /api/jamaah       → Tambah jamaah
GET    /api/jamaah/:id   → Detail jamaah
PATCH  /api/jamaah/:id   → Update jamaah
DELETE /api/jamaah/:id   → Hapus jamaah

GET    /api/paket        → Semua paket
GET    /api/pembayaran   → Semua pembayaran
GET    /api/transaksi    → Semua transaksi
GET    /api/stats        → Stats untuk dashboard
```

## Project Structure

```
src/
├── main.js              # Entry point
├── router.js            # Hash-based SPA router
├── state.js             # Global state management
├── styles/
│   └── main.css         # Tailwind + custom styles
├── api/
│   └── api.js           # API client wrapper
├── utils/
│   ├── helpers.js       # Utility functions
│   ├── date.js          # Date formatting
│   └── emitter.js        # Event emitter
├── modules/
│   ├── dashboard/       # Dashboard view
│   ├── jamaah/          # Jamaah CRUD (index, detail, form)
│   ├── paket/           # Paket management
│   ├── pembayaran/      # Pembayaran & cicilan
│   ├── dokumen/         # Dokumen management
│   ├── laporan/         # Laporan
│   └── pengaturan/     # Settings
└── data/
    └── db.json          # JSON Server seed data
```

## Login (dev)

- Email: `admin@nusantara.crm`
- Password: `admin123`

## Roadmap

See [PROJECT.md](./PROJECT.md) untuk detail 47 task breakdown.
