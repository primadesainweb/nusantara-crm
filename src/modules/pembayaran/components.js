/**
 * Payment Components (T-27) - Reusable payment UI components
 */

// Payment Progress Widget
export class PaymentProgressWidget {
  constructor({ total, paid, label = 'Pembayaran', showPercent = true }) {
    this.total = total
    this.paid = paid
    this.label = label
    this.showPercent = showPercent
  }

  render() {
    const pct = this.total > 0 ? Math.round((this.paid / this.total) * 100) : 0
    const remaining = Math.max(0, this.total - this.paid)

    return `
      <div class="payment-progress-widget bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600">${this.label}</span>
          ${this.showPercent ? `<span class="text-lg font-bold ${pct >= 100 ? 'text-green-600' : 'text-primary-600'}">${pct}%</span>` : ''}
        </div>
        <div class="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div class="h-3 rounded-full transition-all duration-500 ease-out ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-green-600 font-medium">${formatRupiah(this.paid)} terbayar</span>
          ${pct < 100 ? `<span class="text-gray-400">${formatRupiah(remaining)} sisa</span>` : '<span class="text-green-600 font-medium">Lunas!</span>'}
        </div>
      </div>
    `
  }
}

// Mini Transaction Table
export class MiniTransactionTable {
  constructor(transactions = [], options = {}) {
    this.transactions = transactions
    this.limit = options.limit || 5
    this.showPaket = options.showPaket !== false
    this.onRowClick = options.onRowClick
  }

  render() {
    const sorted = [...this.transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    const displayed = sorted.slice(0, this.limit)

    if (displayed.length === 0) {
      return `
        <div class="text-center py-8 text-gray-400">
          <div class="text-3xl mb-2">📝</div>
          <p class="text-sm">Belum ada transaksi</p>
        </div>
      `
    }

    return `
      <div class="mini-transaction-table">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2 px-2 text-gray-500 font-medium">Tanggal</th>
              <th class="text-right py-2 px-2 text-gray-500 font-medium">Nominal</th>
              <th class="text-right py-2 px-2 text-gray-500 font-medium">Metode</th>
              <th class="text-right py-2 px-2 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            ${displayed.map(t => `
              <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${this.onRowClick ? 'transaction-row' : ''}" ${this.onRowClick ? `data-id="${t.id}"` : ''}>
                <td class="py-2 px-2">${formatDate(t.tanggal, 'DD MMM')}</td>
                <td class="py-2 px-2 text-right font-medium">${formatRupiah(t.nominal)}</td>
                <td class="py-2 px-2 text-right capitalize">${t.metode || '-'}</td>
                <td class="py-2 px-2 text-right">
                  <span class="badge ${t.status === 'lunas' ? 'badge-success' : t.status === 'pending' ? 'badge-warning' : 'badge-info'} text-xs">
                    ${t.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${this.transactions.length > this.limit ? `
          <p class="text-center text-xs text-gray-400 mt-2">+${this.transactions.length - this.limit} transaksi lainnya</p>
        ` : ''}
      </div>
    `
  }

  attachEvents() {
    document.querySelectorAll('.transaction-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id
        if (this.onRowClick) this.onRowClick(id)
      })
    })
  }
}

// Payment Summary Card
export class PaymentSummaryCard {
  constructor(pembayaran, options = {}) {
    this.pembayaran = pembayaran
    this.variant = options.variant || 'default' // default, compact, detailed
    this.showActions = options.showActions !== false
    this.jamaah = options.jamaah
    this.paket = options.paket
  }

  render() {
    const p = this.pembayaran
    const pct = p.totalTagihan > 0 ? Math.round((p.totalBayar / p.totalTagihan) * 100) : 0

    const statusConfig = {
      lunas: { label: 'Lunas', class: 'bg-green-100 text-green-800', icon: '✓' },
      cicilan: { label: 'Cicilan', class: 'bg-blue-100 text-blue-800', icon: '⟳' },
      pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800', icon: '○' },
    }

    const status = statusConfig[p.status] || statusConfig.pending

    if (this.variant === 'compact') {
      return `
        <div class="payment-summary-card-compact bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
              ${(this.jamaah?.nama || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">${this.jamaah?.nama || '-'}</p>
              <p class="text-xs text-gray-400">${this.paket?.nama || '-'}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold ${p.sisa === 0 ? 'text-green-600' : 'text-gray-900'}">${formatRupiah(p.sisa === 0 ? p.totalBayar : p.sisa)}</p>
            <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${status.class}">${status.label}</span>
          </div>
        </div>
      `
    }

    if (this.variant === 'detailed') {
      return `
        <div class="payment-summary-card-detailed bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs opacity-80">Total Tagihan</p>
                <p class="text-2xl font-bold">${formatRupiah(p.totalTagihan)}</p>
              </div>
              <div class="text-right">
                <p class="text-xs opacity-80">${p.status === 'lunas' ? 'LUNAS!' : 'Sisa'}</p>
                <p class="text-2xl font-bold">${formatRupiah(p.sisa)}</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="w-full bg-white bg-opacity-30 rounded-full h-2">
                <div class="h-2 rounded-full bg-white transition-all" style="width:${pct}%"></div>
              </div>
              <p class="text-xs mt-1 opacity-80">${pct}% terbayar</p>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600">
                ${(this.jamaah?.nama || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-semibold text-gray-900">${this.jamaah?.nama || '-'}</p>
                <p class="text-sm text-gray-500">${this.jamaah?.noJamaah || ''} • ${this.paket?.nama || '-'}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">Terbayar</p>
                <p class="font-bold text-green-600">${formatRupiah(p.totalBayar)}</p>
              </div>
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">Sisa</p>
                <p class="font-bold text-red-600">${formatRupiah(p.sisa)}</p>
              </div>
              <div class="text-center p-2 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">Status</p>
                <span class="badge ${status.class}">${status.label}</span>
              </div>
            </div>

            ${this.showActions ? `
              <div class="flex gap-2">
                <a href="#/pembayaran/${p.id}" class="btn-secondary flex-1 text-center text-sm">Detail</a>
                <a href="#/pembayaran/form?jamaahId=${p.jamaahId}" class="btn-primary flex-1 text-center text-sm">Bayar</a>
              </div>
            ` : ''}
          </div>
        </div>
      `
    }

    // Default variant
    return `
      <div class="payment-summary-card bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700">
              ${(this.jamaah?.nama || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium text-gray-900">${this.jamaah?.nama || '-'}</p>
              <p class="text-xs text-gray-400">${this.paket?.nama || '-'}</p>
            </div>
          </div>
          <span class="badge ${status.class}">${status.label}</span>
        </div>

        <div class="mb-3">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-500">Progress</span>
            <span class="font-medium">${pct}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2">
            <div class="h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p class="text-xs text-gray-500">Total</p>
            <p class="font-semibold">${formatRupiah(p.totalTagihan)}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Sisa</p>
            <p class="font-semibold ${p.sisa > 0 ? 'text-red-600' : 'text-green-600'}">${formatRupiah(p.sisa)}</p>
          </div>
        </div>

        ${this.showActions ? `
          <div class="flex gap-2">
            <a href="#/pembayaran/${p.id}" class="btn-secondary flex-1 text-center text-sm py-1.5">Detail</a>
            <a href="#/pembayaran/form?jamaahId=${p.jamaahId}" class="btn-primary flex-1 text-center text-sm py-1.5">Bayar</a>
          </div>
        ` : ''}
      </div>
    `
  }
}

// Helper function for formatting currency
function formatRupiah(num) {
  if (num == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Helper function for formatting dates
function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('Mon', months[d.getMonth()])
}

// Export all components
export default {
  PaymentProgressWidget,
  MiniTransactionTable,
  PaymentSummaryCard,
}
