/**
 * Paket Detail View (T-19) - Detail with slot tracker
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PaketDetailView {
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
      const [paket, jamaahs, pembayaran] = await Promise.all([
        api.getPaketById(this.paketId),
        api.getJamaah(),
        api.getPembayaran(),
      ])

      this.paket = paket
      // Filter jamaahs by this paket
      this.jamaahs = jamaahs.filter(j => j.paketId === this.paketId && !j.deletedAt)
      // Get pembayaran records for jamaahs in this paket
      const jamaatIds = this.jamaahs.map(j => j.id)
      this.pembayarans = pembayaran.filter(p => jamaatIds.includes(p.jamaahId))

      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  getDuration() {
    if (!this.paket.tanggalBerangkat || !this.paket.tanggalKembali) return '-'
    const start = new Date(this.paket.tanggalBerangkat)
    const end = new Date(this.paket.tanggalKembali)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return `${days} Hari ${days - 1} Malam`
  }

  getKuotaStats() {
    const { kuota, terisi } = this.paket
    const sisa = kuota - terisi
    const pct = Math.round((terisi / kuota) * 100)
    return { kuota, terisi, sisa, pct }
  }

  getJamaahByTipeKamar() {
    const groups = { sharing: [], single: [], mahram: [] }
    this.jamaahs.forEach(j => {
      const tipe = j.tipeKamar || 'sharing'
      if (groups[tipe]) groups[tipe].push(j)
    })
    return groups
  }

  render() {
    const p = this.paket
    const { kuota, terisi, sisa, pct } = this.getKuotaStats()
    const duration = this.getDuration()
    const stars = '★'.repeat(p.bintangHotel || 3)
    const byTipe = this.getJamaahByTipeKamar()
    const daysUntilDeparture = Math.ceil((new Date(p.tanggalBerangkat) - new Date()) / (1000 * 60 * 60 * 24))

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#/paket" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </a>
              <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${p.jenis === 'Haji' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'}">${p.jenis}</span>
              ${p.status === 'aktif' ? '<span class="badge badge-success">Aktif</span>' : ''}
              ${p.status === 'hampir-penuh' || pct >= 85 ? '<span class="badge badge-danger">Hampir Penuh</span>' : ''}
              ${p.status === 'berangkat' ? '<span class="badge badge-info">Berangkat</span>' : ''}
            </div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">${p.nama}</h2>
            <p class="text-gray-500 text-sm">${formatDate(p.tanggalBerangkat, 'DD MMMM YYYY')} - ${formatDate(p.tanggalKembali, 'DD MMMM YYYY')} (${duration})</p>
          </div>
          <div class="flex gap-2">
            <a href="#/paket/${p.id}/edit" class="btn-secondary">Edit</a>
            <a href="#/paket/${p.id}/laporan" class="btn-primary">Laporan</a>
          </div>
        </div>

        <!-- Alert for low quota -->
        ${sisa <= 5 ? `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <p class="font-medium text-red-800">Kuota Terbatas!</p>
              <p class="text-sm text-red-600">Hanya tersisa <strong>${sisa} slot</strong> untuk paket ini. Segera lakukan pendaftaran.</p>
            </div>
          </div>
        ` : ''}

        <!-- Info Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Harga per Jamaah</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(p.harga)}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Kuota</p>
            <p class="text-xl font-bold text-gray-900">${kuota} Orang</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Terisi / Sisa</p>
            <p class="text-xl font-bold ${sisa <= 5 ? 'text-red-600' : 'text-gray-900'}">${terisi} / ${sisa}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Target Pendapatan</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(kuota * p.harga)}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Kuota Progress -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Kuota Jamaah</h3>
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">Terisi: <strong>${terisi}</strong></span>
                  <span class="text-gray-600">Sisa: <strong class="${sisa <= 5 ? 'text-red-600' : ''}">${sisa}</strong></span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div class="h-full rounded-full transition-all ${pct >= 85 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
                </div>
                <p class="text-center text-sm text-gray-500 mt-1">${pct}% Terisi</p>
              </div>

              <!-- Breakdown by tipe kamar -->
              <div class="grid grid-cols-3 gap-4 mt-6">
                ${[
                  { label: 'Sharing', count: byTipe.sharing.length, color: 'bg-primary-500' },
                  { label: 'Single', count: byTipe.single.length, color: 'bg-gold-500' },
                  { label: 'Mahram', count: byTipe.mahram.length, color: 'bg-green-500' },
                ].map(t => `
                  <div class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="w-10 h-10 mx-auto mb-2 rounded-full ${t.color} bg-opacity-20 flex items-center justify-center">
                      <span class="text-lg font-bold ${t.color.replace('bg-', 'text-')}">${t.count}</span>
                    </div>
                    <p class="text-xs text-gray-500">${t.label}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Hotel & Transport -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Hotel & Transportasi</h3>
              <div class="space-y-4">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-xl">🏨</div>
                  <div>
                    <p class="font-medium text-gray-900">${p.hotel}</p>
                    <div class="flex items-center gap-1 text-gold-500 text-sm mt-1">${stars}</div>
                    <p class="text-xs text-gray-500 mt-1">Hotel</p>
                  </div>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl">✈️</div>
                  <div>
                    <p class="font-medium text-gray-900">${p.maskapai}</p>
                    <p class="text-xs text-gray-500 mt-1">Maskapai</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fasilitas -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Fasilitas</h3>
              <div class="flex flex-wrap gap-2">
                ${(p.fasilitas || []).map(f => `
                  <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    ${f}
                  </span>
                `).join('')}
              </div>
              ${p.deskripsi ? `
                <div class="mt-4 pt-4 border-t border-gray-100">
                  <p class="text-sm text-gray-600">${p.deskripsi}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Right: Jamaah List -->
          <div class="space-y-6">
            <div class="card p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-800">Daftar Jamaah</h3>
                <span class="badge badge-primary">${this.jamaahs.length} Jamaah</span>
              </div>

              ${this.jamaahs.length === 0 ? `
                <div class="text-center py-8 text-gray-400">
                  <div class="text-4xl mb-2">👤</div>
                  <p class="text-sm">Belum ada jama'ah</p>
                </div>
              ` : `
                <div class="space-y-3 max-h-96 overflow-y-auto">
                  ${this.jamaahs.map(j => {
                    const byr = this.pembayarans.find(b => b.jamaahId === j.id)
                    const statusBadge = {
                      lunas: '<span class="badge badge-success">Lunas</span>',
                      cicilan: '<span class="badge badge-info">Cicilan</span>',
                      pending: '<span class="badge badge-warning">Pending</span>',
                    }[byr?.status] || '<span class="badge badge-gray">—</span>'

                    return `
                      <a href="#/jamaah/${j.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p class="font-medium text-gray-900 text-sm">${j.nama}</p>
                          <p class="text-xs text-gray-400">${j.noJamaah || ''} • ${j.tipeKamar || 'sharing'}</p>
                        </div>
                        ${statusBadge}
                      </a>
                    `
                  }).join('')}
                </div>
              `}

              <div class="mt-4 pt-4 border-t border-gray-100">
                <a href="#/paket/${p.id}/manifest" class="btn-secondary w-full text-center block text-sm">
                  Lihat Manifest
                </a>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 mb-4">Statistik</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-500 text-sm">Lunas</span>
                  <span class="font-medium text-green-600">${this.pembayarans.filter(b => b.status === 'lunas').length} jama'ah</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 text-sm">Cicilan</span>
                  <span class="font-medium text-blue-600">${this.pembayarans.filter(b => b.status === 'cicilan').length} jama'ah</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 text-sm">Belum Bayar</span>
                  <span class="font-medium text-yellow-600">${this.pembayarans.filter(b => b.status === 'pending').length} jama'ah</span>
                </div>
                <div class="flex justify-between pt-3 border-t border-gray-100">
                  <span class="text-gray-500 text-sm">Total Sudah Bayar</span>
                  <span class="font-bold text-gray-900">${formatRupiah(this.pembayarans.reduce((s, b) => s + (b.totalBayar || 0), 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
