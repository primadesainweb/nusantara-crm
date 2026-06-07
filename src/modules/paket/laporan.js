/**
 * Paket Laporan View (T-23) - Financial report per paket
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast, percentOf } from '../../utils/helpers.js'

export default class PaketLaporanView {
  constructor({ params, query } = {}) {
    this.params = params
    this.paketId = params?.id
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [paket, jamaahs, pembayarans, transaksis] = await Promise.all([
        api.getPaketById(this.paketId),
        api.getJamaah(),
        api.getPembayaran(),
        api.getTransaksi(),
      ])

      this.paket = paket
      // Filter jamaahs by this paket
      this.jamaahs = jamaahs.filter(j => j.paketId === this.paketId && !j.deletedAt)
      // Get pembayaran for jamaahs in this paket
      const jamaatIds = this.jamaahs.map(j => j.id)
      this.pembayarans = pembayarans.filter(p => jamaatIds.includes(p.jamaahId))
      // Get transactions for this paket
      this.transaksis = transaksis.filter(t => jamaatIds.includes(t.jamaahId) && t.status === 'lunas')

      this.calculateStats()
      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  calculateStats() {
    const p = this.paket
    const { kuota, harga } = p

    this.totalTarget = kuota * harga
    this.totalCollected = this.pembayarans.reduce((s, b) => s + (b.totalBayar || 0), 0)
    this.totalRemaining = this.totalTarget - this.totalCollected

    // Count by payment status
    this.lunasCount = this.pembayarans.filter(b => b.status === 'lunas').length
    this.cicilanCount = this.pembayarans.filter(b => b.status === 'cicilan').length
    this.pendingCount = this.pembayarans.filter(b => b.status === 'pending').length
    this.belumBayarCount = this.pembayarans.filter(b => b.sisa === b.totalTagihan).length

    // Projection
    const departureDate = new Date(p.tanggalBerangkat)
    const today = new Date()
    this.daysToDeparture = Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24))

    // Calculate if they can pay off before departure
    const avgMonthlyPayment = this.getAverageMonthlyPayment()
    this.projectedPayoffMonths = avgMonthlyPayment > 0 ? Math.ceil(this.totalRemaining / avgMonthlyPayment) : null

    // Assuming 30 days per month
    this.projectedPayoffDays = this.projectedPayoffMonths ? this.projectedPayoffMonths * 30 : null
    this.canPayOffBeforeDeparture = this.projectedPayoffDays !== null && this.projectedPayoffDays <= this.daysToDeparture
  }

  getAverageMonthlyPayment() {
    if (this.transaksis.length === 0) return 0

    // Group by month
    const byMonth = {}
    this.transaksis.forEach(t => {
      const month = t.tanggal?.substring(0, 7) // YYYY-MM
      if (!byMonth[month]) byMonth[month] = 0
      byMonth[month] += t.nominal || 0
    })

    const months = Object.keys(byMonth).length
    if (months === 0) return 0

    const total = Object.values(byMonth).reduce((s, v) => s + v, 0)
    return Math.round(total / months)
  }

  render() {
    const p = this.paket
    const pctCollected = percentOf(this.totalCollected, this.totalTarget)
    const pctLunas = percentOf(this.lunasCount, this.jamaahs.length)

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#/paket/${p.id}" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </a>
            </div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Laporan Keuangan</h2>
            <p class="text-gray-500 text-sm">${p.nama}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="window.printReport && window.printReport()" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Cetak
            </button>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-4 border-l-4 border-primary-500">
            <p class="text-xs text-gray-500 mb-1">Target Pendapatan</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(this.totalTarget)}</p>
          </div>
          <div class="card p-4 border-l-4 border-green-500">
            <p class="text-xs text-gray-500 mb-1">Sudah Terkumpul</p>
            <p class="text-xl font-bold text-green-600">${formatRupiah(this.totalCollected)}</p>
            <p class="text-xs text-gray-400 mt-1">${pctCollected}% dari target</p>
          </div>
          <div class="card p-4 border-l-4 border-yellow-500">
            <p class="text-xs text-gray-500 mb-1">Piutang Tertagih</p>
            <p class="text-xl font-bold text-yellow-600">${formatRupiah(this.totalRemaining)}</p>
          </div>
          <div class="card p-4 border-l-4 border-red-500">
            <p class="text-xs text-gray-500 mb-1">Rata-rata Bulanan</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(this.getAverageMonthlyPayment())}</p>
          </div>
        </div>

        <!-- Progress -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Progress Pembayaran</h3>
            <span class="text-2xl font-bold text-primary-600">${pctCollected}%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div class="h-4 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all" style="width:${pctCollected}%"></div>
          </div>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-green-600">${this.totalCollected}</p>
              <p class="text-xs text-gray-500">Terkumpul</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-yellow-600">${this.totalRemaining}</p>
              <p class="text-xs text-gray-500">Sisa</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-600">${this.totalTarget}</p>
              <p class="text-xs text-gray-500">Target</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Breakdown -->
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Rincian Status Pembayaran</h3>

            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="text-sm text-gray-600">Lunas</span>
                  </div>
                  <span class="font-semibold">${this.lunasCount} jama'ah</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-green-500" style="width:${percentOf(this.lunasCount, this.jamaahs.length)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span class="text-sm text-gray-600">Cicilan</span>
                  </div>
                  <span class="font-semibold">${this.cicilanCount} jama'ah</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-blue-500" style="width:${percentOf(this.cicilanCount, this.jamaahs.length)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span class="text-sm text-gray-600">Pending</span>
                  </div>
                  <span class="font-semibold">${this.pendingCount} jama'ah</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-yellow-500" style="width:${percentOf(this.pendingCount, this.jamaahs.length)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span class="text-sm text-gray-600">Belum Bayar</span>
                  </div>
                  <span class="font-semibold">${this.belumBayarCount} jama'ah</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full bg-gray-300" style="width:${percentOf(this.belumBayarCount, this.jamaahs.length)}%"></div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Total Jama'ah</span>
                <span class="font-bold">${this.jamaahs.length} / ${p.kuota}</span>
              </div>
            </div>
          </div>

          <!-- Projection -->
          <div class="card p-6">
            <h3 class="font-semibold text-gray-800 mb-4">Proyeksi Pelunasan</h3>

            <div class="text-center py-6 ${this.canPayOffBeforeDeparture === false ? 'bg-red-50 rounded-lg' : this.canPayOffBeforeDeparture === true ? 'bg-green-50 rounded-lg' : ''}">
              ${this.daysToDeparture > 0 ? `
                <p class="text-sm text-gray-500 mb-2">Hari menuju keberangkatan</p>
                <p class="text-4xl font-bold text-gray-900">${this.daysToDeparture}</p>
                <p class="text-sm text-gray-400 mt-1">${formatDate(p.tanggalBerangkat, 'DD MMMM YYYY')}</p>
              ` : `
                <p class="text-2xl font-bold text-red-600">Sudah Berangkat</p>
              `}
            </div>

            ${this.projectedPayoffDays !== null && this.daysToDeparture > 0 ? `
              <div class="mt-4 space-y-3">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Proyeksi lunas</span>
                  <span class="font-semibold">${Math.ceil(this.projectedPayoffDays / 30)} bulan</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span class="text-sm text-gray-600">Estimasi tanggal</span>
                  <span class="font-semibold">${formatDate(new Date(Date.now() + this.projectedPayoffDays * 24 * 60 * 60 * 1000), 'DD MMM YYYY')}</span>
                </div>

                ${this.canPayOffBeforeDeparture ? `
                  <div class="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <div>
                      <p class="font-medium text-green-800">Proyeksi On Track</p>
                      <p class="text-sm text-green-600">Jama'ah diproyeksikan lunas sebelum keberangkatan.</p>
                    </div>
                  </div>
                ` : `
                  <div class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    <div>
                      <p class="font-medium text-red-800">Risiko Terlambat</p>
                      <p class="text-sm text-red-600">Jama'ah diproyeksikan belum lunas saat keberangkatan. Tingkatkan pengumpulan.</p>
                    </div>
                  </div>
                `}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Jamaah Table -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800">Detail Jama'ah</h3>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Jama'ah</th>
                <th>Tipe Kamar</th>
                <th class="text-right">Tagihan</th>
                <th class="text-right">Bayar</th>
                <th class="text-right">Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.pembayarans.map(b => {
                const j = this.jamaahs.find(jj => jj.id === b.jamaahId)
                const statusBadge = {
                  lunas: '<span class="badge badge-success">Lunas</span>',
                  cicilan: '<span class="badge badge-info">Cicilan</span>',
                  pending: '<span class="badge badge-warning">Pending</span>',
                }[b.status] || '<span class="badge badge-gray">—</span>'

                return `
                  <tr>
                    <td>
                      <div>
                        <p class="font-medium">${j?.nama || '-'}</p>
                        <p class="text-xs text-gray-400">${j?.noJamaah || ''}</p>
                      </div>
                    </td>
                    <td class="capitalize">${j?.tipeKamar || '-'}</td>
                    <td class="text-right">${formatRupiah(b.totalTagihan)}</td>
                    <td class="text-right text-green-600">${formatRupiah(b.totalBayar)}</td>
                    <td class="text-right text-red-600">${formatRupiah(b.sisa)}</td>
                    <td>${statusBadge}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }
}
