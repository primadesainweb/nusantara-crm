/**
 * Nusantara CRM — Utility Functions (T-06)
 */
import { formatDate } from './date.js'

// ─── Currency ───────────────────────────────────────────────
export function formatRupiah(num) {
  if (num == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// ─── Date ───────────────────────────────────────────────────
export { formatDate, formatTanggal, parseDate } from './date.js'

// ─── ID Generation ──────────────────────────────────────────
export function generateId(prefix = '') {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 7)
  return prefix ? `${prefix}_${ts}${rand}` : `${ts}${rand}`
}

// ─── String ─────────────────────────────────────────────────
export function truncate(str, maxLen = 60) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Number ─────────────────────────────────────────────────
export function formatNumber(num) {
  if (num == null) return '0'
  return new Intl.NumberFormat('id-ID').format(num)
}

export function parseNumber(str) {
  if (typeof str === 'number') return str
  return parseInt(str.replace(/[^\d-]/g, ''), 10) || 0
}

// ─── Debounce (already in main.js but exported here too) ────
export function debounce(fn, ms = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ─── Throttle ───────────────────────────────────────────────
export function throttle(fn, ms = 300) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }
}

// ─── DOM Helpers ────────────────────────────────────────────
export function $(selector, ctx = document) {
  return ctx.querySelector(selector)
}

export function $$(selector, ctx = document) {
  return [...ctx.querySelectorAll(selector)]
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag)
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v
    else if (k === 'dataset') Object.assign(el.dataset, v)
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else el.setAttribute(k, v)
  })
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child))
    else if (child) el.appendChild(child)
  })
  return el
}

// ─── Toast Notification ─────────────────────────────────────
const TOAST_CONTAINER = () => document.getElementById('toast-container')

export function showToast(message, type = 'info', duration = 4000) {
  const container = TOAST_CONTAINER()
  if (!container) return

  const ICONS = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  }

  const COLORS = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }

  const toast = createElement('div', {
    className: `flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${COLORS[type]} animate-slide-in`,
    style: 'animation: slideIn 0.3s ease-out',
  }, [
    createElement('span', {}, [ICONS[type] || ICONS.info]),
    createElement('span', { className: 'text-sm font-medium flex-1' }, [message]),
    createElement('button', {
      className: 'text-lg leading-none opacity-60 hover:opacity-100',
      onclick: () => removeToast(toast),
    }, ['×']),
  ])

  container.appendChild(toast)

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration)
  }

  return toast
}

function removeToast(el) {
  el.style.opacity = '0'
  el.style.transform = 'translateX(100%)'
  setTimeout(() => el.remove(), 300)
}

// ─── Confirmation Modal ─────────────────────────────────────
export async function confirm(message, title = 'Konfirmasi') {
  const modal = createModal(title, `
    <p class="text-gray-600">${message}</p>
  `, [
    { label: 'Batal', variant: 'secondary', onClick: () => closeModal(modal, false) },
    { label: 'Ya, Lanjutkan', variant: 'danger', onClick: () => closeModal(modal, true) },
  ])

  document.body.appendChild(modal)
  return new Promise(resolve => {
    modal._resolve = resolve
  })
}

// ─── Modal Helpers ──────────────────────────────────────────
export function createModal(title, bodyHTML, buttons = []) {
  const modal = createElement('div', { className: 'modal-backdrop' }, [
    createElement('div', { className: 'modal' }, [
      createElement('div', { className: 'modal-header' }, [
        createElement('h3', { className: 'font-heading font-semibold text-gray-900' }, [title]),
        createElement('button', {
          className: 'text-gray-400 hover:text-gray-600 text-xl leading-none',
          onclick: (e) => closeModal(modal, null),
        }, ['×']),
      ]),
      createElement('div', { className: 'modal-body' }, [
        typeof bodyHTML === 'string'
          ? createElement('div', { innerHTML: bodyHTML })
          : bodyHTML,
      ]),
      buttons.length ? createElement('div', { className: 'modal-footer' },
        buttons.map(btn => createElement('button', {
          className: `btn-${btn.variant || 'secondary'}`,
          onclick: btn.onClick,
        }, [btn.label]))
      ) : null,
    ].filter(Boolean)),
  ])
  return modal
}

function closeModal(modal, result) {
  modal.remove()
  if (modal._resolve) modal._resolve(result)
}

// ─── Avatar Initials ────────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function getAvatarColor(name) {
  if (!name) return 'bg-gray-200'
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-gold-100 text-gold-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

// ─── Status Badge Color ─────────────────────────────────────
export function statusBadge(status) {
  const map = {
    pending:     'badge-warning',
    aktif:       'badge-info',
    lunas:       'badge-success',
    berangkat:   'badge-primary',
    batal:       'badge-danger',
    'belum-bayar': 'badge-warning',
    'cicilan':   'badge-info',
    'lunas':     'badge-success',
  }
  const labels = {
    pending:      'Pending',
    aktif:        'Aktif',
    lunas:        'Lunas',
    berangkat:    'Berangkat',
    batal:        'Batal',
    'belum-bayar':'Belum Bayar',
    cicilan:      'Cicilan',
    'lunas':      'Lunas',
  }
  const cls = map[status?.toLowerCase()] || 'badge-gray'
  const label = labels[status?.toLowerCase()] || status || '—'
  return `<span class="badge ${cls}">${label}</span>`
}

// ─── Loading Skeleton ───────────────────────────────────────
export function skeletonRows(n = 5, cols = 4) {
  return Array(n).fill(0).map(() => `
    <tr>
      ${Array(cols).fill(0).map(() => `
        <td class="px-4 py-3"><div class="skeleton h-4 rounded w-full"></div></td>
      `).join('')}
    </tr>
  `).join('')
}

// ─── Empty State ────────────────────────────────────────────
export function emptyState(icon = '📭', title = 'Belum ada data', description = '', action = '') {
  return `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="text-5xl mb-4">${icon}</div>
      <h3 class="font-heading font-semibold text-gray-800 mb-1">${title}</h3>
      ${description ? `<p class="text-gray-400 text-sm mb-4 max-w-sm">${description}</p>` : ''}
      ${action ? action : ''}
    </div>
  `
}

// ─── Percent / Progress ─────────────────────────────────────
export function percentOf(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

// ─── Local Storage Helpers ──────────────────────────────────
export function lsGet(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── URL Params ─────────────────────────────────────────────
export function getUrlParams() {
  return new URLSearchParams(window.location.hash.split('?')[1] || '')
}

// ─── Print / Download Helpers ───────────────────────────────
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function printElement(el) {
  const win = window.open('', '_blank')
  win.document.write('<html><head><title>Print</title>')
  win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css">')
  win.document.write('</head><body>')
  win.document.write(el.outerHTML)
  win.document.write('</body></html>')
  win.document.close()
  win.print()
}
