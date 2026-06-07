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
| `npm run preview` | Preview production build (port 4173) |
| `npm run server` | JSON Server (port 3001) |
| `npm run test:e2e` | Run E2E tests |
| `npm run deploy` | Deploy to VPS |

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
GET    /api/users        → Users (auth)
GET    /api/settings     → Settings
```

## Login

- **Admin**: `admin@nusantara.crm` / `admin123`
- **Staff**: `staff@nusantara.crm` / `staff123`

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
│   ├── emitter.js       # Event emitter
│   └── rbac.js          # Role-based access control
├── modules/
│   ├── auth/
│   │   └── login.js     # Login module
│   ├── dashboard/       # Dashboard view
│   ├── jamaaah/         # Jamaah CRUD
│   ├── paket/           # Paket management
│   ├── pembayaran/       # Pembayaran & cicilan
│   ├── dokumen/          # Dokumen management
│   ├── promo/           # Promo codes
│   ├── laporan/          # Laporan
│   └── pengaturan/      # Settings
└── data/
    └── db.json          # JSON Server seed data
```

## Deployment to VPS

### Prerequisites

1. VPS with Ubuntu/Debian
2. SSH access to VPS
3. Domain pointed to VPS IP (optional)
4. PM2 installed globally: `npm install -g pm2`
5. Nginx installed: `apt install nginx`

### Step 1: Prepare VPS

```bash
# SSH to your VPS
ssh root@your-vps-ip

# Create directory
mkdir -p /var/www/nusantara-crm
mkdir -p /var/log/nusantara-crm

# Install PM2 globally
npm install -g pm2

# Clone your repository
cd /var/www/nusantara-crm
git clone your-repo-url .
```

### Step 2: Configure Deployment

Edit these files on your local machine:

1. `deploy.sh` - Set `VPS_HOST`, `VPS_USER` to your VPS credentials
2. `deploy-nginx.conf` - Replace `your-domain.com` with your domain
3. `ecosystem.config.js` - Ensure paths are correct

### Step 3: Upload Files

```bash
# From local machine
chmod +x deploy.sh
./deploy.sh

# Or manually:
rsync -avz dist/ user@vps:/var/www/nusantara-crm/dist/
rsync -avz src/data/db.json user@vps:/var/www/nusantara-crm/src/data/db.json
```

### Step 4: Setup PM2

```bash
# On VPS
cd /var/www/nusantara-crm
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # For auto-start on reboot
```

### Step 5: Configure Nginx

```bash
# On VPS
sudo cp /path/to/deploy-nginx.conf /etc/nginx/sites-available/nusantara-crm
sudo ln -s /etc/nginx/sites-available/nusantara-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Setup SSL (Optional but recommended)

```bash
# On VPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Step 7: Verify Deployment

```
http://your-vps-ip        → App
http://your-vps-ip/api    → JSON Server API
```

### PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs nusantara-json-server # View logs
pm2 restart all                # Restart all
pm2 stop all                   # Stop all
pm2 delete all                 # Remove all
```

## E2E Testing

```bash
# Ensure JSON Server is running
npm run server

# In another terminal, run tests
npm run test:e2e
```

## Features

- ✅ JWT-based authentication
- ✅ Role-based access control (Admin/Staff)
- ✅ Dark mode toggle
- ✅ Mobile responsive
- ✅ CRUD Jamaah, Paket, Pembayaran
- ✅ Document management
- ✅ Payment tracking & installments
- ✅ Promo codes
- ✅ Reports
- ✅ Export to PDF/Excel
- ✅ Kuitansi generation

## Roadmap

See [PROJECT.md](./PROJECT.md) untuk detail 47 task breakdown.
