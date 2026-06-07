/**
 * Nusantara CRM — API Client (T-06)
 * Wrapper around fetch with loading states, error handling, and toast notifications
 */
import { state } from '../state.js'

const BASE_URL = 'http://103.49.238.10:3001'  // JSON Server Production

// ─── Core Fetch ─────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new ApiError(res.status, err.message || 'Request failed', err)
    }

    // Handle 204 No Content
    if (res.status === 204) return null

    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new ApiError(0, 'Request timeout')
    }
    throw err
  }
}

// ─── CRUD Helpers ────────────────────────────────────────────
const api = {
  // ── Jamaah ──────────────────────────────────────────────
  async getJamaah(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/jamaah?${qs}`)
  },

  async getJamaahById(id) {
    return apiFetch(`/jamaah/${id}`)
  },

  async createJamaah(data) {
    return apiFetch('/jamaah', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateJamaah(id, data) {
    return apiFetch(`/jamaah/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteJamaah(id) {
    // Soft delete
    return apiFetch(`/jamaah/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
    })
  },

  // ── Paket ───────────────────────────────────────────────
  async getPaket(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/paket?${qs}`)
  },

  async getPaketById(id) {
    return apiFetch(`/paket/${id}`)
  },

  async createPaket(data) {
    return apiFetch('/paket', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePaket(id, data) {
    return apiFetch(`/paket/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deletePaket(id) {
    return apiFetch(`/paket/${id}`, { method: 'DELETE' })
  },

  // ── Pembayaran ───────────────────────────────────────────
  async getPembayaran(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/pembayaran?${qs}`)
  },

  async createPembayaran(data) {
    return apiFetch('/pembayaran', { method: 'POST', body: JSON.stringify(data) })
  },

  async updatePembayaran(id, data) {
    return apiFetch(`/pembayaran/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  // ── Transaksi ───────────────────────────────────────────
  async getTransaksi(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/transaksi?${qs}`)
  },

  async createTransaksi(data) {
    return apiFetch('/transaksi', { method: 'POST', body: JSON.stringify(data) })
  },

  // ── Dokumen ─────────────────────────────────────────────
  async getDokumen(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/dokumen?${qs}`)
  },

  async createDokumen(data) {
    return apiFetch('/dokumen', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateDokumen(id, data) {
    return apiFetch(`/dokumen/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  // ── Promo ────────────────────────────────────────────────
  async getPromo(params = {}) {
    const qs = buildQuery(params)
    return apiFetch(`/promo?${qs}`)
  },

  async validatePromo(kode) {
    return apiFetch(`/promo?kode=${encodeURIComponent(kode)}&valid=true`)
  },

  // ── Auth ─────────────────────────────────────────────────
  async login(email, password) {
    // Mock auth — in production, call real backend
    const users = await apiFetch(`/users?email=${encodeURIComponent(email)}`)
    if (!users.length) throw new ApiError(401, 'Email tidak ditemukan')
    const user = users[0]
    if (user.password !== password) throw new ApiError(401, 'Password salah')
    return { user, token: 'mock-jwt-token-' + user.id }
  },

  // ── Stats / Dashboard ───────────────────────────────────
  async getStats() {
    const [jamaah, paket, pembayaran, transaksi] = await Promise.all([
      apiFetch('/jamaah?deletedAt=null'),
      apiFetch('/paket'),
      apiFetch('/pembayaran'),
      apiFetch('/transaksi'),
    ])
    return { jamaat: jamaah, pakets: paket, pembayarans: pembayaran, transaksis: transaksi }
  },
}

// ─── Helpers ────────────────────────────────────────────────
function buildQuery(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

// ─── Error Class ────────────────────────────────────────────
export class ApiError extends Error {
  constructor(status, message, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// ─── Loading State Helper ───────────────────────────────────
export function withLoading(promise) {
  document.body.classList.add('cursor-wait')
  return promise.finally(() => document.body.classList.remove('cursor-wait'))
}

export default api
