/**
 * Badge Component (T-16)
 * Reusable badge with status variants
 */
export function Badge({ label, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    gold: 'bg-gold-100 text-gold-700',
  }

  const cls = variants[variant] || variants.default
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}">${label}</span>`
}

// Quick helper for status badges
export function StatusBadge(status) {
  const map = {
    pending:     { variant: 'warning', label: 'Pending' },
    aktif:       { variant: 'info', label: 'Aktif' },
    cicilan:     { variant: 'info', label: 'Cicilan' },
    lunas:       { variant: 'success', label: 'Lunas' },
    berangkat:   { variant: 'primary', label: 'Berangkat' },
    batal:       { variant: 'danger', label: 'Batal' },
    'belum-bayar': { variant: 'warning', label: 'Belum Bayar' },
  }
  const config = map[status?.toLowerCase()] || { variant: 'default', label: status || '—' }
  return Badge(config)
}

export default Badge
