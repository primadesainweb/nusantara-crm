/**
 * Date utilities
 */

/**
 * Format date to Indonesian locale
 * @param {string|Date} date
 * @param {string} format - DD/MM/YYYY, DD Mon YYYY, etc.
 */
export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'

  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('Mon', months[d.getMonth()])
    .replace('MMMM', monthsFull[d.getMonth()])
}

export function formatTanggal(date) {
  return formatDate(date, 'DD/MM/YYYY')
}

export function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

export function daysFromNow(date) {
  if (!date) return null
  const now = new Date()
  const target = new Date(date)
  const diff = target - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date) {
  return daysFromNow(date) < 0
}

export function relativeTime(date) {
  const days = daysFromNow(date)
  if (days === null) return ''
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  if (days === -1) return 'Kemarin'
  if (days > 0) return `${days} hari lagi`
  return `${Math.abs(days)} hari lalu`
}
