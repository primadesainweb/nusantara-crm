/**
 * Activity Log per Jamaah (T-37)
 * Track events: data changed, payment received, document uploaded, status changed
 * Store in localStorage with jamaatId
 */
import { formatDate, lsGet, lsSet } from '../../utils/helpers.js'

// Activity types
const ACTIVITY_TYPES = {
  DATA_CHANGED: 'data_changed',
  PAYMENT_RECEIVED: 'payment',
  DOCUMENT_UPLOADED: 'document',
  STATUS_CHANGED: 'status',
  JADWAL_CICILAN: 'jadwal_cicilan',
  VISA_UPDATE: 'visa'
}

// Global activity log (all activities)
let globalActivityLog = lsGet('activity_log', [])

/**
 * Log an activity for a specific jamaat
 */
export function logActivity(jamaatId, type, message, metadata = {}) {
  const activity = {
    id: 'ACT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    jamaatId,
    type,
    message,
    metadata,
    timestamp: new Date().toISOString()
  }

  // Get existing activities for this jamaat
  const activities = lsGet(`activity_${jamaatId}`, [])
  activities.unshift(activity) // Add to beginning (newest first)
  
  // Keep only last 100 activities per jamaat
  lsSet(`activity_${jamaatId}`, activities.slice(0, 100))

  // Also add to global log
  globalActivityLog.unshift(activity)
  globalActivityLog = globalActivityLog.slice(0, 200) // Keep last 200 globally
  lsSet('activity_log', globalActivityLog)

  return activity
}

/**
 * Get activities for a specific jamaat
 */
export function getJamaahActivities(jamaatId, limit = 50) {
  const activities = lsGet(`activity_${jamaatId}`, [])
  return activities.slice(0, limit)
}

/**
 * Get recent activities (all jamaahs)
 */
export function getRecentActivities(limit = 20) {
  return globalActivityLog.slice(0, limit)
}

/**
 * Get activity icon
 */
export function getActivityIcon(type) {
  const icons = {
    [ACTIVITY_TYPES.DATA_CHANGED]: '📝',
    [ACTIVITY_TYPES.PAYMENT_RECEIVED]: '💰',
    [ACTIVITY_TYPES.DOCUMENT_UPLOADED]: '📄',
    [ACTIVITY_TYPES.STATUS_CHANGED]: '🏷️',
    [ACTIVITY_TYPES.JADWAL_CICILAN]: '📅',
    [ACTIVITY_TYPES.VISA_UPDATE]: '✈️'
  }
  return icons[type] || '📌'
}

/**
 * Get activity color
 */
export function getActivityColor(type) {
  const colors = {
    [ACTIVITY_TYPES.DATA_CHANGED]: 'bg-blue-100 text-blue-600',
    [ACTIVITY_TYPES.PAYMENT_RECEIVED]: 'bg-green-100 text-green-600',
    [ACTIVITY_TYPES.DOCUMENT_UPLOADED]: 'bg-purple-100 text-purple-600',
    [ACTIVITY_TYPES.STATUS_CHANGED]: 'bg-yellow-100 text-yellow-600',
    [ACTIVITY_TYPES.JADWAL_CICILAN]: 'bg-orange-100 text-orange-600',
    [ACTIVITY_TYPES.VISA_UPDATE]: 'bg-primary-100 text-primary-600'
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

// Activity Log View Component (for displaying in jamaah detail)
export default class ActivityLogView {
  constructor({ params, query } = {}) {
    this.params = params
    this.jamaahId = params?.id
  }

  mount(el) {
    this.el = el
    this.render()
  }

  render() {
    const activities = getJamaahActivities(this.jamaahId)

    if (!activities.length) {
      this.el.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <div class="text-4xl mb-2">📋</div>
          <p>Belum ada aktivitas tercatat</p>
        </div>
      `
      return
    }

    this.el.innerHTML = `
      <div class="space-y-3 max-h-96 overflow-y-auto">
        ${activities.map(act => this.renderActivityItem(act)).join('')}
      </div>
    `
  }

  renderActivityItem(activity) {
    return `
      <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <div class="w-8 h-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center shrink-0 text-sm">
          ${getActivityIcon(activity.type)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800">${activity.message}</p>
          <p class="text-xs text-gray-400 mt-1">${formatDate(activity.timestamp, 'DD MMM YYYY HH:mm')}</p>
        </div>
      </div>
    `
  }
}

// Helper to render inline activity indicator in other modules
export function renderActivityBadge(jamaahId) {
  const activities = getJamaahActivities(jamaahId, 1)
  if (!activities.length) return ''
  
  const latest = activities[0]
  const hoursAgo = Math.floor((Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60))
  
  if (hoursAgo < 24) {
    return `
      <span class="inline-flex items-center gap-1 text-xs text-gray-400" title="Aktivitas terakhir: ${latest.message}">
        ${getActivityIcon(latest.type)}
        ${hoursAgo === 0 ? 'Baru saja' : hoursAgo + ' jam lalu'}
      </span>
    `
  }
  return ''
}
