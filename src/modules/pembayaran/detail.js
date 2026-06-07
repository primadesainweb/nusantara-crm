/**
 * Pembayaran Detail View (T-21) - Transaction timeline per jamaat
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PembayaranDetailView {
  constructor({ params, query } = {}) {
    this.params = params
    this.pembayaranId = params?.id
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [pembayarans, transaksis, jamaahs, pakets] = await Promise.all([
        api.getPembayaran(),
        api.getTransaksi(),
        api.getJamaah(),
        api.getPaket(),
      ])

      this.pembayaran = pembayarans.find(p => p.id === this.pembayaranId)
      this.transaksis = transaksis.filter(t => t.jamaahId === this.pembayaran?.jamaahId)
      this.jamaah = jamaahs.find(j => j.id === this.pembayaran?.jamaahId)
      this.paket = pakets.find(p => p.id === this.pembayaran?.paketId)

      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  render() {
    const p = this.pembayaran
    const j = this.jamaah
    const pk = this.paket

    if (!p) {
      this.el.innerHTML = `<div class="text-center py-12 text-gray-400">Data tidak ditemukan</div>`
      return
    }

    const pctLunas = p.totalTagihan > 0 ? Math.round((p.totalBayar / p.totalTagihan) * 100) : 0
    const sortedTransaksis = [...this.transaksis].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#/pembayaran" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </a>
            </div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Riwayat Pembayaran</h2>
            <p class="text-gray-500 text-sm">${j?.nama || '-'} - ${pk?.nama || '-'}</p>
          </div>
          <div class="flex gap-2">
            <a href="#/pembayaran/${p.id}/cicilan" class="btn-secondary">Atur Cicilan</a>
            <a href="#/pembayaran/form?jamaahId=${p.jamaahId}" class="btn-primary">Bayar</a>
          </div>
        </div>

        <!-- Summary Bar -->
        <div class="card p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-1">Total Tagihan</p>
              <p class="text-xl font-bold text-gray-900">${formatRupiah(p.totalTagihan)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-1">Total Bayar</p>
              <p class="text-xl font-bold text-green-600">${formatRupiah(p.totalBayar)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-1">Sisa</p>
              <p class="text-xl font-bold text-red-600">${formatRupiah(p.sisa)}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-1">% Lunas</p>
              <p class="text-xl font-bold ${pctLunas >= 100 ? 'text-green-600' : 'text-yellow-600'}">${pctLunas}%</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-100 rounded-full h-3">
            <div class="h-3 rounded-full transition-all ${pctLunas >= 100 ? 'bg-green-500' : 'bg-primary-500'}" style="width:${Math.min(pctLunas, 100)}%"></div>
          </div>

          ${pctLunas < 100 ? `
            <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>${formatRupiah(p.totalTagihan - p.totalBayar)} remaining</span>
              <span>${formatRupiah(p.totalBayar)} paid</span>
            </div>
          ` : ''}
        </div>

        <!-- Timeline -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Riwayat Transaksi</h3>

          ${sortedTransaksis.length === 0 ? `
            <div class="text-center py-8 text-gray-400">
              <div class="text-4xl mb-2">📝</div>
              <p>Belum ada transaksi</p>
            </div>
          ` : `
            <div class="relative">
              <!-- Timeline line -->
              <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div class="space-y-4">
                ${sortedTransaksis.map((t, i) => {
                  const isLatest = i === 0
                  return `
                    <div class="relative flex gap-4">
                      <!-- Dot -->
                      <div class="relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${isLatest ? 'bg-primary-500' : 'bg-gray-200'} flex items-center justify-center">
                        ${isLatest ? `
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ` : `
                          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        `}
                      </div>

                      <!-- Content -->
                      <div class="flex-1 card p-4 ${isLatest ? 'border-primary-200 bg-primary-50' : ''}">
                        <div class="flex items-start justify-between">
                          <div>
                            <div class="flex items-center gap-2 mb-1">
                              <span class="font-semibold text-gray-900">${formatRupiah(t.nominal)}</span>
                              <span class="badge ${t.status === 'lunas' ? 'badge-success' : t.status === 'pending' ? 'badge-warning' : 'badge-info'}">${t.status}</span>
                            </div>
                            <p class="text-sm text-gray-500">
                              ${formatDate(t.tanggal, 'DD MMMM YYYY')} • ${this.getMetodeLabel(t.metode)}
                            </p>
                            ${t.referensi ? `<p class="text-xs text-gray-400 mt-1">Ref: ${t.referensi}</p>` : ''}
                            ${t.catatan ? `<p class="text-sm text-gray-600 mt-2 italic">"${t.catatan}"</p>` : ''}
                          </div>
                          <div class="flex gap-2">
                            <button class="btn-secondary text-xs py-1" onclick="window.printReceipt && window.printReceipt('${t.id}')">Cetak</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          `}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <a href="#/pembayaran/form?jamaahId=${p.jamaahId}" class="btn-primary">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Bayar Sekarang
          </a>
        </div>
      </div>
    `
  }

  getMetodeLabel(metode) {
    const labels = { transfer: 'Transfer Bank', tunai: 'Tunai', qris: 'QRIS' }
    return labels[metode] || metode
  }
}
