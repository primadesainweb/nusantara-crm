#!/usr/bin/env node
/**
 * Nusantara CRM — Production Server
 * Single port serving: static frontend + JSON Server API
 */
import express from 'express'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import jsonServer from 'json-server'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 8080

// ── CORS ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ── Load DB ────────────────────────────────────────────────────
const dbPath = join(__dirname, 'src/data/db.json')
const db = JSON.parse(readFileSync(dbPath, 'utf-8'))

// ── Custom /stats endpoint (must be BEFORE JSON Server router) ──
app.get('/api/stats', (req, res) => {
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

// ── JSON Server Router ─────────────────────────────────────────
const jsonServerMiddleware = jsonServer.defaults()
const jsonRouter = jsonServer.router(db, { foreignKeySuffix: 'Id' })
app.use('/api', jsonServerMiddleware, jsonRouter)

// ── Static Frontend (SPA) ─────────────────────────────────────
const distPath = join(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback - serve index.html for all non-API routes
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

// ── Start ──────────────────────────────────────────────────────
createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Nusantara CRM Production Server`)
  console.log(`   URL:      http://103.49.238.10:${PORT}`)
  console.log(`   API:      http://103.49.238.10:${PORT}/api`)
  console.log(`   Health:   http://103.49.238.10:${PORT}/api/stats\n`)
})
