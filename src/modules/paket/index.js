/**
 * Paket Module Index (T-17)
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PaketView {
  async mount(el) {
    this.el = el
    await this.render()
    this.loadData()
  }

  async render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Paket Perjalanan</h2>
            <p class="text-gray-500 text-sm" id="paket-count">Memuat...</p>
          </div>
          <a href="#/paket/new" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Paket Baru
          </a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="paket-grid">
          ${Array(6).fill('<div class="skeleton h-64 rounded-xl"></div>').join('')}
        </div>
      </div>
    `
  }

  async loadData() {
    try {
      this.pakets = await api.getPaket()
      this.renderCards()
    } catch (e) {
      showToast('Gagal memuat paket', 'error')
    }
  }

  renderCards() {
    const grid = document.getElementById('paket-grid')
    const count = document.getElementById('paket-count')
    if (!grid) return

    count.textContent = `${this.pakets.length} paket`

    grid.innerHTML = this.pakets.map(p => {
      const pct = Math.round((p.terisi / p.kuota) * 100)
      const isAlmostFull = pct >= 85
      const stars = '★'.repeat(p.bintangHotel || 3)
      return `
        <div class="card overflow-hidden hover:shadow-md transition-shadow">
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${p.jenis === 'Haji' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'}">${p.jenis}</span>
                ${isAlmostFull ? '<span class="inline-block ml-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Hampir Penuh</span>' : ''}
              </div>
            </div>
            <h3 class="font-semibold text-gray-900 mt-2">${p.nama}</h3>
            <p class="text-xs text-gray-400 mt-1">${formatDate(p.tanggalBerangkat, 'DD MMM YYYY')} - ${formatDate(p.tanggalKembali, 'DD MMM YYYY')}</p>
          </div>
          <div class="p-4">
            <div class="flex items-center gap-1 text-gold-500 text-sm mb-2">${stars}</div>
            <p class="text-xs text-gray-500 mb-3">${p.hotel} - ${p.maskapai}</p>
            <div class="mb-3">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Kuota</span>
                <span>${p.terisi}/${p.kuota} orang</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="h-2 rounded-full ${pct >= 85 ? 'bg-red-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <p class="text-lg font-bold text-gray-900">${formatRupiah(p.harga)}</p>
              <a href="#/paket/${p.id}" class="btn-secondary text-xs py-1.5">Detail</a>
            </div>
          </div>
        </div>
      `
    }).join('')
  }
}
