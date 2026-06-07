/**
 * In-app Notification Center (T-39)
 * Dropdown notification bell in header
 * Notif types: jatuh tempo cicilan, dokumen incomplete, paket almost full, visa approved/rejected
 */
import { showToast, formatDate, lsGet, lsSet } from '../utils/helpers.js'

const NOTIF_TYPES = {
  CICILAN_DUE: 'cicilan_due',
  DOCUMENT_INCOMPLETE: 'document_incomplete',
  PAKET_ALMOST_FULL: 'paket_almost_full',
  VISA_APPROVED: 'visa_approved',
  VISA_REJECTED: 'visa_rejected',
  VISA_EXPIRY: 'visa_expiry'
}

export default class NotificationCenter {
  constructor() {
    this.notifications = lsGet('notifications', [])
    this.isOpen = false
  }

  render() {
    const unreadCount = this.notifications.filter(n => !n.read).length
    
    return `
      <div class="relative">
        <button id="notif-btn" class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          ${unreadCount > 0 ? `<span id="notif-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
        </button>
        
        <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div class="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 class="font-semibold text-gray-800">Notifikasi</h3>
            ${unreadCount > 0 ? `<button id="mark-all-read" class="text-xs text-primary-600 hover:underline">Tandai semua dibaca</button>` : ''}
          </div>
          
          <div id="notif-list" class="max-h-96 overflow-y-auto">
            ${this.renderNotificationList()}
          </div>
          
          ${this.notifications.length > 0 ? `
            <div class="p-2 border-t bg-gray-50">
              <button id="clear-all-notif" class="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                Hapus semua notifikasi
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  renderNotificationList() {
    if (!this.notifications.length) {
      return `
        <div class="p-8 text-center text-gray-400">
          <div class="text-4xl mb-2">🔔</div>
          <p class="text-sm">Belum ada notifikasi</p>
        </div>
      `
    }

    return this.notifications.map(notif => `
      <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${notif.read ? 'opacity-60' : ''} notif-item" data-notif-id="${notif.id}">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full ${this.getNotifBgColor(notif.type)} flex items-center justify-center shrink-0">
            ${this.getNotifIcon(notif.type)}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800">${notif.title}</p>
            <p class="text-xs text-gray-500 mt-0.5">${notif.message}</p>
            <p class="text-xs text-gray-400 mt-1">${formatDate(notif.timestamp, 'DD MMM HH:mm')}</p>
          </div>
          ${!notif.read ? '<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>' : ''}
        </div>
      </div>
    `).join('')
  }

  getNotifIcon(type) {
    const icons = {
      [NOTIF_TYPES.CICILAN_DUE]: '💰',
      [NOTIF_TYPES.DOCUMENT_INCOMPLETE]: '📄',
      [NOTIF_TYPES.PAKET_ALMOST_FULL]: '👥',
      [NOTIF_TYPES.VISA_APPROVED]: '✅',
      [NOTIF_TYPES.VISA_REJECTED]: '❌',
      [NOTIF_TYPES.VISA_EXPIRY]: '⚠️'
    }
    return icons[type] || '📌'
  }

  getNotifBgColor(type) {
    const colors = {
      [NOTIF_TYPES.CICILAN_DUE]: 'bg-green-100',
      [NOTIF_TYPES.DOCUMENT_INCOMPLETE]: 'bg-red-100',
      [NOTIF_TYPES.PAKET_ALMOST_FULL]: 'bg-orange-100',
      [NOTIF_TYPES.VISA_APPROVED]: 'bg-green-100',
      [NOTIF_TYPES.VISA_REJECTED]: 'bg-red-100',
      [NOTIF_TYPES.VISA_EXPIRY]: 'bg-yellow-100'
    }
    return colors[type] || 'bg-gray-100'
  }

  toggleDropdown() {
    const dropdown = document.getElementById('notif-dropdown')
    if (dropdown) {
      dropdown.classList.toggle('hidden')
      this.isOpen = !dropdown.classList.contains('hidden')
    }
  }

  markAsRead(notifId) {
    const notif = this.notifications.find(n => n.id === notifId)
    if (notif) {
      notif.read = true
      lsSet('notifications', this.notifications)
      this.updateBadge()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    lsSet('notifications', this.notifications)
    this.updateBadge()
    showToast('Semua notifikasi ditandai dibaca', 'success')
  }

  clearAll() {
    if (confirm('Hapus semua notifikasi?')) {
      this.notifications = []
      lsSet('notifications', [])
      this.updateBadge()
      showToast('Notifikasi dihapus', 'info')
    }
  }

  updateBadge() {
    const badge = document.getElementById('notif-badge')
    const unreadCount = this.notifications.filter(n => !n.read).length
    
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount
        badge.classList.remove('hidden')
      } else {
        badge.classList.add('hidden')
      }
    }
  }

  navigateToNotif(notif) {
    this.markAsRead(notif.id)
    
    // Navigate based on type
    if (notif.jamaatId) {
      window.location.hash = `#/jamaah/${notif.jamaatId}`
    } else if (notif.paketId) {
      window.location.hash = `#/paket/${notif.paketId}`
    }
    
    this.toggleDropdown()
  }

  attachEvents() {
    const btn = document.getElementById('notif-btn')
    btn?.addEventListener('click', () => this.toggleDropdown())

    document.getElementById('mark-all-read')?.addEventListener('click', () => {
      this.markAllAsRead()
      document.getElementById('notif-list').innerHTML = this.renderNotificationList()
      this.attachNotifEvents()
    })

    document.getElementById('clear-all-notif')?.addEventListener('click', () => {
      this.clearAll()
      document.getElementById('notif-list').innerHTML = this.renderNotificationList()
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !e.target.closest('#notif-dropdown') && !e.target.closest('#notif-btn')) {
        document.getElementById('notif-dropdown')?.classList.add('hidden')
        this.isOpen = false
      }
    })

    this.attachNotifEvents()
  }

  attachNotifEvents() {
    document.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const notifId = item.dataset.notifId
        const notif = this.notifications.find(n => n.id === notifId)
        if (notif) {
          this.navigateToNotif(notif)
        }
      })
    })
  }
}

// Helper function to add notifications from other modules
export function addNotification(type, title, message, metadata = {}) {
  const notifications = lsGet('notifications', [])
  notifications.unshift({
    id: 'NOTIF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type,
    title,
    message,
    ...metadata,
    timestamp: new Date().toISOString(),
    read: false
  })
  
  // Keep only last 50 notifications
  lsSet('notifications', notifications.slice(0, 50))
  
  // Update badge if exists
  updateNotificationBadge()
  
  return notifications[0]
}

export function updateNotificationBadge() {
  const notifications = lsGet('notifications', [])
  const unreadCount = notifications.filter(n => !n.read).length
  const badge = document.getElementById('notif-badge')
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
  }
}

// Initialize notification center on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNotificationBadge()
})

// Export for use in other modules
window.NotificationCenter = NotificationCenter
window.addNotification = addNotification
