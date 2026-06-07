/**
 * Nusantara CRM — Main Entry Point
 * Initializes router, app layout, and global event bus
 */
import { initRouter } from './router.js'
import { state } from './state.js'
import { showToast } from './utils/helpers.js'
import { logout } from './modules/auth/login.js'

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  console.log('�起来了 — Nusantara CRM initializing...')

  // Hydrate state from localStorage (auth, preferences) first
  state.hydrate()

  // Render app shell (sidebar + header + router outlet)
  renderAppShell()

  // Initialize hash-based SPA router
  initRouter()

  console.log('✅ CRM ready')
})

// ─── App Shell ─────────────────────────────────────────────
function renderAppShell() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside id="sidebar" class="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        ${renderSidebar()}
      </aside>

      <!-- Main Area -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Header -->
        <header id="app-header" class="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
          ${renderHeader()}
        </header>

        <!-- Page content -->
        <main id="router-view" class="flex-1 overflow-y-auto bg-gray-50 p-6">
          <!-- route content injected here -->
        </main>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-30 hidden lg:hidden"></div>

    <!-- Mobile Bottom Nav -->
    <nav id="mobile-nav" class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 flex items-center justify-around py-2 px-4 safe-area-inset-bottom">
      ${renderMobileNav()}
    </nav>
  `

  // Attach sidebar toggle listeners
  attachSidebarListeners()
}

// ─── Sidebar ────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '#/',        label: 'Dashboard',  icon: 'home',       badge: null },
  { path: '#/jamaah', label: 'Jamaah',    icon: 'users',     badge: null },
  { path: '#/paket',  label: 'Paket',     icon: 'package',   badge: null },
  { path: '#/pembayaran', label: 'Pembayaran', icon: 'credit-card', badge: null },
  { path: '#/dokumen', label: 'Dokumen',   icon: 'file-text', badge: null },
  { path: '#/laporan', label: 'Laporan',   icon: 'bar-chart', badge: null },
  { path: '#/pengaturan', label: 'Pengaturan', icon: 'settings', badge: null },
]

const ICONS = {
  home:        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  users:       `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>`,
  package:     `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
  'credit-card': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`,
  'file-text': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  'bar-chart': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  settings:    `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  menu:        `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  x:          `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
  search:     `<svg class="w-5 h-5" shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  bell:       `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
  plus:       `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
  'user-circle': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
}

function renderSidebar() {
  const user = state.user
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Staff'

  return `
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-gray-100 shrink-0">
      <div class="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
        <span class="text-white font-bold text-sm">NC</span>
      </div>
      <div>
        <div class="font-heading font-semibold text-gray-900 text-sm leading-tight">Nusantara CRM</div>
        <div class="text-xs text-gray-400">Umroh & Haji</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      ${NAV_ITEMS.map(item => `
        <a href="${item.path}" class="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
           data-route="${item.path}">
          <span class="text-gray-400 group-hover:text-gray-600 transition-colors">${ICONS[item.icon]}</span>
          ${item.label}
          ${item.badge ? `<span class="ml-auto bg-primary-100 text-primary-700 text-xs font-semibold px-1.5 rounded-full">${item.badge}</span>` : ''}
        </a>
      `).join('')}
    </nav>

    <!-- Footer -->
    <div class="border-t border-gray-100 p-4 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span class="text-primary-600 text-xs font-semibold">${initials}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-800 truncate">${user?.name || 'Guest'}</div>
          <div class="text-xs text-gray-400 truncate">${roleLabel}</div>
        </div>
        <button id="sidebar-logout-btn" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Keluar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  `
}

function renderHeader() {
  const user = state.user
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'

  return `
    <!-- Mobile menu button -->
    <button id="sidebar-toggle" class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
      ${ICONS.menu}
    </button>

    <!-- Breadcrumb / Title -->
    <div class="flex-1">
      <h1 id="page-title" class="font-heading font-semibold text-gray-900">Dashboard</h1>
    </div>

    <!-- Global Search -->
    <div class="hidden sm:flex items-center relative">
      <span class="absolute left-3 text-gray-400 pointer-events-none">${ICONS.search}</span>
      <input type="text" id="global-search" placeholder="Cari Jamaah, Paket..."
             class="form-input pl-9 w-64 text-sm bg-gray-50 border-gray-200 focus:bg-white" />
    </div>

    <!-- Quick Add -->
    <button id="quick-add-btn" class="btn-primary hidden sm:flex">
      ${ICONS.plus}
      <span class="hidden sm:inline">Tambah Jamaah</span>
    </button>

    <!-- Notifications -->
    <button id="notif-btn" class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
      ${ICONS.bell}
      <span id="notif-badge" class="hidden absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>

    <!-- Dark Mode Toggle -->
    <button id="dark-mode-toggle" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Mode gelap">
      <svg id="sun-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
      <svg id="moon-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
      </svg>
    </button>

    <!-- User Menu -->
    <div class="relative">
      <button id="user-menu-btn" class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span class="text-primary-600 text-xs font-semibold">${initials}</span>
        </div>
        <svg class="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </button>
      <!-- Dropdown -->
      <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
        <div class="px-4 py-2 border-b border-gray-100">
          <p class="text-sm font-medium text-gray-900">${user?.name || 'Guest'}</p>
          <p class="text-xs text-gray-500">${user?.email || ''}</p>
        </div>
        <a href="#/pengaturan" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <span class="inline-flex items-center gap-2">${ICONS.settings} Pengaturan</span>
        </a>
        <button id="header-logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
          <span class="inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Keluar
          </span>
        </button>
      </div>
    </div>
  `
}

function renderMobileNav() {
  const items = NAV_ITEMS.slice(0, 5)
  return items.map(item => `
    <a href="${item.path}" class="mobile-nav-item flex flex-col items-center gap-1 p-2 text-xs text-gray-500 hover:text-primary-600" data-route="${item.path}">
      <span>${ICONS[item.icon]}</span>
      <span>${item.label}</span>
    </a>
  `).join('')
}

// ─── Sidebar Toggle Logic ───────────────────────────────────
function attachSidebarListeners() {
  const toggle  = document.getElementById('sidebar-toggle')
  const overlay = document.getElementById('sidebar-overlay')
  const sidebar = document.getElementById('sidebar')

  function openSidebar() {
    sidebar.classList.remove('hidden')
    sidebar.classList.add('fixed', 'inset-y-0', 'left-0', 'z-40', 'flex', 'flex-col', 'w-64', 'bg-white', 'shadow-xl')
    overlay.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }

  function closeSidebar() {
    sidebar.classList.add('hidden')
    sidebar.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-40', 'flex', 'flex-col', 'w-64', 'bg-white', 'shadow-xl')
    overlay.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
  }

  toggle?.addEventListener('click', openSidebar)
  overlay?.addEventListener('click', closeSidebar)

  // Quick add
  document.getElementById('quick-add-btn')?.addEventListener('click', () => {
    window.location.hash = '#/jamaah/new'
  })

  // Global search
  const searchInput = document.getElementById('global-search')
  searchInput?.addEventListener('keydown', debounce((e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim()
      if (q) window.location.hash = `#/jamaah?q=${encodeURIComponent(q)}`
    }
  }, 300))

  // User dropdown menu toggle
  const userMenuBtn = document.getElementById('user-menu-btn')
  const userDropdown = document.getElementById('user-dropdown')
  userMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    userDropdown?.classList.toggle('hidden')
  })
  document.addEventListener('click', () => {
    userDropdown?.classList.add('hidden')
  })
  userDropdown?.addEventListener('click', (e) => e.stopPropagation())

  // Header logout button
  document.getElementById('header-logout-btn')?.addEventListener('click', () => {
    userDropdown?.classList.add('hidden')
    logout()
  })

  // Sidebar logout button
  document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => {
    logout()
  })

  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle')
  const sunIcon = document.getElementById('sun-icon')
  const moonIcon = document.getElementById('moon-icon')

  function updateDarkModeIcon() {
    const isDark = document.documentElement.classList.contains('dark')
    sunIcon?.classList.toggle('hidden', !isDark)
    moonIcon?.classList.toggle('hidden', isDark)
  }

  darkModeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark')
    state.set('darkMode', isDark)
    updateDarkModeIcon()
  })

  // Initialize dark mode icon state
  updateDarkModeIcon()
}

// ─── Utilities exposed globally for modules ─────────────────
function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// Expose to window so modules can use
window.showToast = showToast
window.debounce = debounce

export { NAV_ITEMS, ICONS, debounce, renderSidebar, renderHeader }
