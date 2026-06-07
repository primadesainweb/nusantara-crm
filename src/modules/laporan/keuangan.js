/**
 * Laporan Keuangan View (T-28) - Export financial report per period to Excel
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'
import { daysFromNow } from '../../utils/date.js'

export default class LaporanKeuanganView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.filters = {
      startDate: '',
      endDate: '',
      paketId: '',
      metode: '',
    }
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [transaksis, pembayarans, pakets, jamaahs] = await Promise.all([
        api.getTransaksi(),
        api.getPembayaran(),
        api.getPaket(),
        api.getJamaah(),
      ])

      this.allTransaksis = transaksis
      this.allPembayarans = pembayarans
      this.allPakets = pakets
      this.allJamaahs = jamaahs.filter(j => !j.deletedAt)

      // Create lookup maps
      this.jamaahMap = Object.fromEntries(this.allJamaahs.map(j => [j.id, j]))
      this.paketMap = Object.fromEntries(this.allPakets.map(p => [p.id, p]))

      this.applyFilters()
      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  applyFilters() {
    let filtered = [...this.allTransaksis].filter(t => t.status === 'lunas')

    if (this.filters.startDate) {
      filtered = filtered.filter(t => t.tanggal >= this.filters.startDate)
    }
    if (this.filters.endDate) {
      filtered = filtered.filter(t => t.tanggal <= this.filters.endDate)
    }
    if (this.filters.paketId) {
      filtered = filtered.filter(t => t.paketId === this.filters.paketId)
    }
    if (this.filters.metode) {
      filtered = filtered.filter(t => t.metode === this.filters.metode)
    }

    this.filteredTransaksis = filtered
    this.calculateSummary()
  }

  calculateSummary() {
    const trans = this.filteredTransaksis

    // Total per metode
    this.summaryByMetode = {}
    trans.forEach(t => {
      if (!this.summaryByMetode[t.metode]) {
        this.summaryByMetode[t.metode] = 0
      }
      this.summaryByMetode[t.metode] += t.nominal
    })

    // Total
    this.totalPendapatan = trans.reduce((s, t) => s + (t.nominal || 0), 0)
    this.totalTransaksi = trans.length

    // Per paket
    this.summaryByPaket = {}
    trans.forEach(t => {
      if (!this.summaryByPaket[t.paketId]) {
        this.summaryByPaket[t.paketId] = { count: 0, total: 0 }
      }
      this.summaryByPaket[t.paketId].count++
      this.summaryByPaket[t.paketId].total += t.nominal || 0
    })
  }

  render() {
    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Laporan Keuangan</h2>
            <p class="text-gray-500 text-sm">Export laporan keuangan per periode ke Excel</p>
          </div>
          <button id="btn-export" class="btn-primary">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export Excel
          </button>
        </div>

        <!-- Filters -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Filter Laporan</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="form-label text-xs">Tanggal Mulai</label>
              <input type="date" id="filter-start" class="form-select text-sm" value="${this.filters.startDate || firstDayOfMonth}" />
            </div>
            <div>
              <label class="form-label text-xs">Tanggal Akhir</label>
              <input type="date" id="filter-end" class="form-select text-sm" value="${this.filters.endDate || today}" />
            </div>
            <div>
              <label class="form-label text-xs">Paket</label>
              <select id="filter-paket" class="form-select text-sm">
                <option value="">Semua Paket</option>
                ${this.allPakets.map(p => `
                  <option value="${p.id}" ${this.filters.paketId === p.id ? 'selected' : ''}>${p.nama}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="form-label text-xs">Metode Bayar</label>
              <select id="filter-metode" class="form-select text-sm">
                <option value="">Semua</option>
                <option value="transfer" ${this.filters.metode === 'transfer' ? 'selected' : ''}>Transfer</option>
                <option value="tunai" ${this.filters.metode === 'tunai' ? 'selected' : ''}>Tunai</option>
                <option value="qris" ${this.filters.metode === 'qris' ? 'selected' : ''}>QRIS</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button id="btn-apply" class="btn-primary">Terapkan Filter</button>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4 text-center">
            <p class="text-xs text-gray-500 mb-1">Total Pendapatan</p>
            <p class="text-2xl font-bold text-green-600">${formatRupiah(this.totalPendapatan)}</p>
            <p class="text-xs text-gray-400">${this.totalTransaksi} transaksi</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-2">Per Metode</p>
            <div class="space-y-1">
              ${Object.entries(this.summaryByMetode).map(([m, total]) => `
                <div class="flex justify-between text-sm">
                  <span class="capitalize">${m}</span>
                  <span class="font-medium">${formatRupiah(total)}</span>
                </div>
              `).join('') || '<p class="text-xs text-gray-400">-</p>'}
            </div>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-2">Per Paket</p>
            <div class="space-y-1">
              ${Object.entries(this.summaryByPaket).slice(0, 4).map(([pid, data]) => `
                <div class="flex justify-between text-sm">
                  <span class="truncate flex-1">${this.paketMap[pid]?.nama?.substring(0, 20) || pid}</span>
                  <span class="font-medium">${formatRupiah(data.total)}</span>
                </div>
              `).join('') || '<p class="text-xs text-gray-400">-</p>'}
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Detail Transaksi</h3>
            <span class="text-sm text-gray-500">${this.filteredTransaksis.length} transaksi</span>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Jamaah</th>
                <th>Paket</th>
                <th>Metode</th>
                <th>Nominal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredTransaksis.slice(0, 100).map(t => {
                const j = this.jamaahMap[t.jamaahId]
                const p = this.paketMap[t.paketId]
                return `
                  <tr>
                    <td class="font-mono text-xs">${t.id}</td>
                    <td>${formatDate(t.tanggal, 'DD MMM YYYY')}</td>
                    <td>${j?.nama || '-'}</td>
                    <td>${p?.nama || '-'}</td>
                    <td class="capitalize">${t.metode || '-'}</td>
                    <td class="font-medium text-right">${formatRupiah(t.nominal)}</td>
                    <td><span class="badge ${t.status === 'lunas' ? 'badge-success' : 'badge-gray'}">${t.status}</span></td>
                  </tr>
                `
              }).join('')}
            </tbody>
            ${this.filteredTransaksis.length > 100 ? `
              <tfoot>
                <tr class="bg-gray-50">
                  <td colspan="5" class="text-center text-sm text-gray-500">... dan ${this.filteredTransaksis.length - 100} transaksi lainnya</td>
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      </div>
    `

    this.attachEvents()
  }

  attachEvents() {
    document.getElementById('btn-apply')?.addEventListener('click', () => {
      this.filters.startDate = document.getElementById('filter-start')?.value || ''
      this.filters.endDate = document.getElementById('filter-end')?.value || ''
      this.filters.paketId = document.getElementById('filter-paket')?.value || ''
      this.filters.metode = document.getElementById('filter-metode')?.value || ''
      this.applyFilters()
      this.render()
    })

    document.getElementById('btn-export')?.addEventListener('click', () => this.exportExcel())
  }

  async exportExcel() {
    const XLSX = await import('xlsx')

    // Summary Sheet
    const summaryData = [
      ['LAPORAN KEUANGAN'],
      [`Periode: ${this.filters.startDate || '-'} s/d ${this.filters.endDate || '-'}`],
      [`Dicetak: ${formatDate(new Date(), 'DD MMMM YYYY HH:mm')}`],
      [],
      ['RINGKASAN'],
      ['Total Pendapatan', this.totalPendapatan],
      ['Total Transaksi', this.totalTransaksi],
      [],
      ['PER METODE'],
      ['Metode', 'Total'],
      ...Object.entries(this.summaryByMetode).map(([m, total]) => [m, total]),
      [],
      ['PER PAKET'],
      ['Paket', 'Jumlah Transaksi', 'Total'],
      ...Object.entries(this.summaryByPaket).map(([pid, data]) => [this.paketMap[pid]?.nama || pid, data.count, data.total]),
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

    // Detail Sheet
    const detailHeader = ['ID', 'Tanggal', 'Jamaah', 'NIK', 'Paket', 'Metode', 'Referensi', 'Nominal', 'Status', 'Catatan']
    const detailData = [
      detailHeader,
      ...this.filteredTransaksis.map(t => {
        const j = this.jamaahMap[t.jamaahId]
        const p = this.paketMap[t.paketId]
        return [
          t.id,
          t.tanggal,
          j?.nama || '-',
          j?.nik || '-',
          p?.nama || '-',
          t.metode || '-',
          t.referensi || '-',
          t.nominal || 0,
          t.status || '-',
          t.catatan || '-',
        ]
      }),
    ]

    const detailSheet = XLSX.utils.aoa_to_sheet(detailData)

    // Set column widths for detail sheet
    detailSheet['!cols'] = [
      { wch: 12 }, // ID
      { wch: 12 }, // Tanggal
      { wch: 25 }, // Jamaah
      { wch: 18 }, // NIK
      { wch: 30 }, // Paket
      { wch: 10 }, // Metode
      { wch: 20 }, // Referensi
      { wch: 15 }, // Nominal
      { wch: 10 }, // Status
      { wch: 30 }, // Catatan
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')
    XLSX.utils.book_append_sheet(wb, detailSheet, 'Detail Transaksi')

    // Generate filename
    const startStr = this.filters.startDate?.replace(/-/g, '') || 'start'
    const endStr = this.filters.endDate?.replace(/-/g, '') || 'end'
    const filename = `Laporan_Keuangan_${startStr}_${endStr}.xlsx`

    // Download
    XLSX.writeFile(wb, filename)
    showToast('Laporan berhasil diunduh!', 'success')
  }
}
