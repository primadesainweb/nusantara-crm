#!/usr/bin/env node
/**
 * Nusantara CRM — JSON Server Runner
 * Run: node server.js
 * API base: http://localhost:3001
 */
import jsonServer from 'json-server'
const { create, router, rewriter } = jsonServer
const bodyParser = jsonServer.bodyParser

const server = create()

// Middleware
server.use(bodyParser)
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Import db
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const db = JSON.parse(readFileSync(join(__dirname, 'src/data/db.json'), 'utf-8'))

// Routes rewriter - put BEFORE custom endpoints so they take priority
const routes = {
  '/api/jamaah': '/jamaah',
  '/api/paket': '/paket',
  '/api/pembayaran': '/pembayaran',
  '/api/transaksi': '/transaksi',
  '/api/dokumen': '/dokumen',
  '/api/promo': '/promo',
  '/api/settings': '/settings',
  '/api/stats': '/stats',
}
server.use(rewriter(routes))

// Custom stats endpoint - register AFTER rewriter so /api/stats matches here
server.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 7)
  const bulanIni = db.transaksi.filter(t => t.tanggal && t.tanggal.startsWith(today) && t.status === 'lunas')
  const totalPendapatan = bulanIni.reduce((s, t) => s + (t.nominal || 0), 0)

  res.jsonp({
    jamaat: db.jamaah.filter(j => !j.deletedAt),
    pakets: db.paket,
    transaksis: db.transaksi,
    pembayarans: db.pembayaran,
    bulanIniPendapatan: totalPendapatan,
  })
})

// Also support /api/stats directly for JSON Server
server.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 7)
  const bulanIni = db.transaksi.filter(t => t.tanggal && t.tanggal.startsWith(today) && t.status === 'lunas')
  const totalPendapatan = bulanIni.reduce((s, t) => s + (t.nominal || 0), 0)

  res.jsonp({
    jamaat: db.jamaah.filter(j => !j.deletedAt),
    pakets: db.paket,
    transaksis: db.transaksi,
    pembayarans: db.pembayaran,
    bulanIniPendapatan: totalPendapatan,
  })
})

// Start
const routerInstance = router(db, { foreignKeySuffix: 'Id' })
server.use(routerInstance)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`\n🚀 Nusantara CRM API Server`)
  console.log(`   Local:  http://localhost:${PORT}`)
  console.log(`   API:    http://localhost:${PORT}/api`)
  console.log(`   Health: http://localhost:${PORT}/api/stats\n`)
})
