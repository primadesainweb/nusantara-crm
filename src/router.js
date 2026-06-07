/**
 * Nusantara CRM — Hash-based SPA Router (T-04)
 * Routes: /, /jamaah, /jamaah/:id, /paket, /pembayaran,
 *         /dokumen, /laporan, /pengaturan
 */
import { state } from './state.js'

// ─── Route Map ──────────────────────────────────────────────
const ROUTES = {
  '/':              { title: 'Dashboard',    module: () => import('./modules/dashboard/index.js') },
  '/jamaah':        { title: 'Jamaah',     module: () => import('./modules/jamaah/index.js') },
  '/jamaah/new':    { title: 'Jamaah Baru', module: () => import('./modules/jamaah/form.js') },
  '/jamaah/:id':    { title: 'Detail Jamaah', module: () => import('./modules/jamaah/detail.js') },
  '/paket':         { title: 'Paket',       module: () => import('./modules/paket/index.js') },
  '/pembayaran':    { title: 'Pembayaran',  module: () => import('./modules/pembayaran/index.js') },
  '/dokumen':       { title: 'Dokumen',     module: () => import('./modules/dokumen/index.js') },
  '/laporan':       { title: 'Laporan',     module: () => import('./modules/laporan/index.js') },
  '/pengaturan':    { title: 'Pengaturan',  module: () => import('./modules/pengaturan/index.js') },
}

// ─── Init ──────────────────────────────────────────────────
export function initRouter() {
  // Initial load
  handleRoute()

  // Listen for hash changes
  window.addEventListener('hashchange', handleRoute)

  // Listen for popstate (browser back/forward)
  window.addEventListener('popstate', handleRoute)
}

// ─── Route Handler ─────────────────────────────────────────
let currentRoute = null

async function handleRoute() {
  const hash = window.location.hash.slice(1) || '/'
  const [path, queryString] = hash.split('?')
  const params = new URLSearchParams(queryString || '')

  // Parse route (e.g. /jamaah/123 → { id: '123' })
  const matched = matchRoute(path)

  if (!matched) {
    render404()
    return
  }

  const { route, args } = matched

  // Guard: require auth for all routes (skip for /login)
  if (!state.isAuthenticated && path !== '/login') {
    window.location.hash = '#/login'
    return
  }

  // Same route? skip
  if (currentRoute === path) return
  currentRoute = path

  // Update page title
  document.title = `${route.title} — Nusantara CRM`
  const titleEl = document.getElementById('page-title')
  if (titleEl) titleEl.textContent = route.title

  // Update active nav
  updateActiveNav(path)

  // Show loading
  const outlet = document.getElementById('router-view')
  if (outlet) {
    outlet.innerHTML = `<div class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="skeleton w-8 h-8 rounded-full mx-auto mb-3"></div>
        <p class="text-gray-400 text-sm">Memuat...</p>
      </div>
    </div>`
  }

  try {
    // Lazy-load module
    const mod = await route.module()
    const View = mod.default || mod

    // Instantiate view
    const view = new View({ params: args, query: Object.fromEntries(params) })
    await view.mount(outlet)
  } catch (err) {
    console.error('Route error:', err)
    renderError(err)
  }
}

// ─── Route Matcher ──────────────────────────────────────────
function matchRoute(path) {
  // Exact match
  if (ROUTES[path]) return { route: ROUTES[path], args: {} }

  // Pattern match: /jamaah/:id
  for (const [pattern, route] of Object.entries(ROUTES)) {
    const patternParts = pattern.split('/')
    const pathParts    = path.split('/')

    if (patternParts.length !== pathParts.length) continue

    const args = {}
    let matched = true

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        args[patternParts[i].slice(1)] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false
        break
      }
    }

    if (matched) return { route, args }
  }

  return null
}

// ─── Active Nav State ──────────────────────────────────────
function updateActiveNav(path) {
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
    const route = el.getAttribute('data-route')
    const isActive = route === path || (route !== '#/' && path.startsWith(route.replace('#', '')))
    el.classList.toggle('bg-primary-50', isActive)
    el.classList.toggle('text-primary-700', isActive)
    el.classList.toggle('font-semibold', isActive)
    if (!isActive) {
      el.classList.remove('bg-primary-50', 'text-primary-700', 'font-semibold')
    }
  })
}

// ─── Error States ──────────────────────────────────────────
function render404() {
  const outlet = document.getElementById('router-view')
  if (!outlet) return
  outlet.innerHTML = `
    <div class="flex flex-col items-center justify-center h-96 text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h2 class="text-2xl font-heading font-bold text-gray-800 mb-2">Halaman tidak ditemukan</h2>
      <p class="text-gray-500 mb-6">URL yang kamu tuju tidak valid.</p>
      <a href="#/" class="btn-primary">Kembali ke Dashboard</a>
    </div>
  `
}

function renderError(err) {
  const outlet = document.getElementById('router-view')
  if (!outlet) return
  outlet.innerHTML = `
    <div class="flex flex-col items-center justify-center h-96 text-center">
      <div class="text-6xl mb-4">⚠️</div>
      <h2 class="text-2xl font-heading font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
      <p class="text-gray-500 mb-2">${err.message || 'Unknown error'}</p>
      <pre class="text-xs text-red-400 bg-red-50 p-2 rounded mt-2 max-w-md overflow-x-auto">${err.stack?.slice(0, 300)}</pre>
      <a href="#/" class="btn-primary mt-4">Kembali ke Dashboard</a>
    </div>
  `
}

export { handleRoute }
