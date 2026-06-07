/**
 * Nusantara CRM — Global State Management (T-06)
 * Simple plain-object state with event emitter pattern
 * Persisted to localStorage
 */
import { EventEmitter } from './utils/emitter.js'

const STORAGE_KEY = 'nusantara_crm_state'

class Store extends EventEmitter {
  constructor() {
    super()
    this._state = {
      // Auth
      isAuthenticated: false,
      user: null,
      token: null,

      // UI
      sidebarOpen: false,
      darkMode: false,
      notifications: [],
      unreadCount: 0,

      // Data caches (loaded from API)
      Jamaah: [],
      Paket: [],
      Pembayaran: [],
      Transaksi: [],
      Dokumen: [],
      Promo: [],

      // Filters
      filters: {
        jamaah: { status: '', paket: '', search: '', page: 1, perPage: 25 },
        paket:  { jenis: '', search: '' },
        pembayaran: { status: '', search: '', dateFrom: '', dateTo: '' },
      },

      // Preferences
      settings: {
        companyName: 'Nusantara Travel',
        currency: 'IDR',
        dateFormat: 'DD/MM/YYYY',
      },
    }
  }

  get state() { return this._state }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this._state)
  }

  set(key, value) {
    const keys = key.split('.')
    const last = keys.pop()
    const target = keys.reduce((obj, k) => obj[k], this._state)
    target[last] = value
    this.emit('change', { key, value })
    this.persist()
  }

  merge(key, patch) {
    const current = this.get(key)
    this.set(key, { ...current, ...patch })
  }

  // ─── Persistence ────────────────────────────────────────
  persist() {
    try {
      const snapshot = {
        isAuthenticated: this._state.isAuthenticated,
        user: this._state.user,
        darkMode: this._state.darkMode,
        settings: this._state.settings,
        notifications: this._state.notifications,
        unreadCount: this._state.unreadCount,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.warn('State persist failed:', e)
    }
  }

  hydrate() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (saved) {
        Object.assign(this._state, saved)
        // Re-apply dark mode
        if (this._state.darkMode) {
          document.documentElement.classList.add('dark')
        }
      }
    } catch (e) {
      console.warn('State hydrate failed:', e)
    }
  }

  // ─── Auth ────────────────────────────────────────────────
  login(user, token) {
    this._state.isAuthenticated = true
    this._state.user = user
    this._state.token = token
    this.persist()
    this.emit('auth:login', { user })
  }

  logout() {
    this._state.isAuthenticated = false
    this._state.user = null
    this._state.token = null
    this.persist()
    this.emit('auth:logout')
  }

  // ─── Notifications ────────────────────────────────────────
  addNotification(notif) {
    const n = { id: Date.now(), read: false, timestamp: new Date().toISOString(), ...notif }
    this._state.notifications.unshift(n)
    this._state.unreadCount++
    this.persist()
    this.emit('notification', n)
  }

  markAllRead() {
    this._state.notifications.forEach(n => n.read = true)
    this._state.unreadCount = 0
    this.persist()
    this.emit('notification:read-all')
  }
}

export const state = new Store()
