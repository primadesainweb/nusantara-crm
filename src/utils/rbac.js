/**
 * Nusantara CRM — Role-Based Access Control (T-42)
 * Middleware-like function for feature access based on user role
 */
import { state } from '../state.js'

// ─── Role Definitions ────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
}

// ─── Feature Permissions ─────────────────────────────────────
// Each feature maps to allowed roles
const FEATURE_PERMISSIONS = {
  // Jamaah
  'jamaah.read':       [ROLES.ADMIN, ROLES.STAFF],
  'jamaah.create':     [ROLES.ADMIN, ROLES.STAFF],
  'jamaah.update':     [ROLES.ADMIN, ROLES.STAFF],
  'jamaah.delete':     [ROLES.ADMIN],

  // Paket
  'paket.read':        [ROLES.ADMIN, ROLES.STAFF],
  'paket.create':     [ROLES.ADMIN],
  'paket.update':      [ROLES.ADMIN],
  'paket.delete':      [ROLES.ADMIN],

  // Pembayaran
  'pembayaran.read':   [ROLES.ADMIN, ROLES.STAFF],
  'pembayaran.create': [ROLES.ADMIN, ROLES.STAFF],
  'pembayaran.update': [ROLES.ADMIN],

  // Dokumen
  'dokumen.read':      [ROLES.ADMIN, ROLES.STAFF],
  'dokumen.upload':    [ROLES.ADMIN, ROLES.STAFF],
  'dokumen.delete':    [ROLES.ADMIN],

  // Promo
  'promo.read':        [ROLES.ADMIN],
  'promo.create':      [ROLES.ADMIN],
  'promo.update':      [ROLES.ADMIN],
  'promo.delete':      [ROLES.ADMIN],

  // Laporan
  'laporan.read':       [ROLES.ADMIN, ROLES.STAFF],
  'laporan.keuangan':  [ROLES.ADMIN],

  // Pengaturan
  'pengaturan.read':    [ROLES.ADMIN],
  'pengaturan.update': [ROLES.ADMIN],

  // User Management
  'users.read':        [ROLES.ADMIN],
  'users.create':      [ROLES.ADMIN],
  'users.update':      [ROLES.ADMIN],
  'users.delete':      [ROLES.ADMIN],
}

// ─── Admin-only routes ────────────────────────────────────────
export const ADMIN_ONLY_ROUTES = [
  '/pengaturan',
  '/promo',
  '/laporan/keuangan',
]

// ─── Main Access Check ──────────────────────────────────────
/**
 * Check if current user can access a feature
 * @param {string} feature - Feature key (e.g., 'jamaah.delete')
 * @param {string} [role] - Role to check (defaults to current user's role)
 * @returns {boolean}
 */
export function canAccess(feature, role = null) {
  const userRole = role || state.user?.role

  if (!userRole) return false

  const allowedRoles = FEATURE_PERMISSIONS[feature]

  if (!allowedRoles) {
    // Unknown feature - deny by default
    console.warn(`Unknown feature: ${feature}`)
    return false
  }

  return allowedRoles.includes(userRole)
}

/**
 * Check if current user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  return state.user?.role === ROLES.ADMIN
}

/**
 * Check if current user is staff
 * @returns {boolean}
 */
export function isStaff() {
  return state.user?.role === ROLES.STAFF
}

/**
 * Get current user role
 * @returns {string|null}
 */
export function getUserRole() {
  return state.user?.role || null
}

/**
 * Hide UI element if user doesn't have permission
 * @param {string|Element} selectorOrElement - CSS selector or DOM element
 * @param {string} feature - Feature key
 */
export function hideIfNoAccess(selectorOrElement, feature) {
  const el = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement

  if (!el) return

  if (!canAccess(feature)) {
    el.classList.add('hidden')
    el.disabled = true
  }
}

/**
 * Disable UI element if user doesn't have permission
 * @param {string|Element} selectorOrElement - CSS selector or DOM element
 * @param {string} feature - Feature key
 */
export function disableIfNoAccess(selectorOrElement, feature) {
  const el = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement

  if (!el) return

  if (!canAccess(feature)) {
    el.disabled = true
    el.classList.add('opacity-50', 'cursor-not-allowed')
  }
}

/**
 * Check if route is admin-only
 * @param {string} path - Route path
 * @returns {boolean}
 */
export function isAdminRoute(path) {
  return ADMIN_ONLY_ROUTES.some(route => path.startsWith(route))
}

/**
 * Wrapper for route guard - returns true if access is allowed
 * @param {string} feature - Required feature
 * @returns {boolean}
 */
export function requireFeature(feature) {
  return canAccess(feature)
}

/**
 * Get all features for current user role
 * @returns {string[]}
 */
export function getAllowedFeatures() {
  const userRole = state.user?.role

  if (!userRole) return []

  return Object.entries(FEATURE_PERMISSIONS)
    .filter(([, roles]) => roles.includes(userRole))
    .map(([feature]) => feature)
}

// ─── UI Helper: Conditional Render ───────────────────────────
/**
 * Conditionally render element based on role
 * @param {string} feature - Feature key
 * @param {Function} renderFn - Function that returns HTML string
 * @param {string} [fallback=''] - Fallback HTML if no access
 * @returns {string}
 */
export function renderIfAccess(feature, renderFn, fallback = '') {
  return canAccess(feature) ? renderFn() : fallback
}
