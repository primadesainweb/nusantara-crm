/**
 * Paket Module Index (T-17) - Improved with filters
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'
import { debounce } from '../../utils/helpers.js'

export default class PaketView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.filters = { jenis: '', bulan: '', tahun: '' }
  }

  async mount(el) {
    this.el = el
    await this.render()
    this.loadData()
  }

  async render() {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1

    this.el.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Paket Perjalanan</h2>
            <p class="text-gray-500 text-sm" id="paket-count">Memuat...</p>
          </div>
          <a href="#/paket/new" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Paket Baru
          </a>
        </div>

        <!-- Filters -->
        <div class="card p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="form-label text-xs">Jenis</label>
              <select id="filter-jenis" class="form-select text-sm">
                <option value="">Semua</option>
                <option value="Umroh">Umroh</option>
                <option value="Haji">Haji</option>
              </select>
            </div>
            <div>
              <label class="form-label text-xs">Bulan</label>
              <select id="filter-bulan" class="form-select text-sm">
                <option value="">Semua</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
            <div>
              <label class="form-label text-xs">Tahun</label>
              <select id="filter-tahun" class="form-select text-sm">
                <option value="">Semua</option>
                ${[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y =>
                  `<option value="${y}">${y}</option>`
                ).join('')}
              </select>
            </div>
            <div class="flex items-end">
              <button id="btn-reset-filter" class="btn-secondary text-sm w-full">Reset Filter</button>
            </div>
          </div>
        </div>

        <!-- Card Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="paket-grid">
          ${Array(6).fill('<div class="skeleton h-64 rounded-xl"></div>').join('')}
        </div>
      </div>
    `

    // Attach filter events
    document.getElementById('filter-jenis')?.addEventListener('change', (e) => {
      this.filters.jenis = e.target.value
      this.applyFilters()
    })
    document.getElementById('filter-bulan')?.addEventListener('change', (e) => {
      this.filters.bulan = e.target.value
      this.applyFilters()
    })
    document.getElementById('filter-tahun')?.addEventListener('change', (e) => {
      this.filters.tahun = e.target.value
      this.applyFilters()
    })
    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
      this.filters = { jenis: '', bulan: '', tahun: '' }
      document.getElementById('filter-jenis').value = ''
      document.getElementById('filter-bulan').value = ''
      document.getElementById('filter-tahun').value = ''
      this.applyFilters()
    })
  }

  async loadData() {
    try {
      this.allPakets = await api.getPaket()
      this.applyFilters()
    } catch (e) {
      showToast('Gagal memuat paket', 'error')
    }
  }

  applyFilters() {
    let filtered = [...(this.allPakets || [])]

    if (this.filters.jenis) {
      filtered = filtered.filter(p => p.jenis === this.filters.jenis)
    }
    if (this.filters.bulan) {
      filtered = filtered.filter(p => {
        const d = new Date(p.tanggalBerangkat)
        return String(d.getMonth() + 1).padStart(2, '0') === this.filters.bulan
      })
    }
    if (this.filters.tahun) {
      filtered = filtered.filter(p => {
        const d = new Date(p.tanggalBerangkat)
        return String(d.getFullYear()) === this.filters.tahun
      })
    }

    this.pakets = filtered
    this.renderCards()
  }

  getDuration(paket) {
    if (!paket.tanggalBerangkat || !paket.tanggalKembali) return '-'
    const start = new Date(paket.tanggalBerangkat)
    const end = new Date(paket.tanggalKembali)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return `${days} Hari`
  }

  renderCards() {
    const grid = document.getElementById('paket-grid')
    const count = document.getElementById('paket-count')
    if (!grid) return

    const displayPakets = this.pakets || []

    count.textContent = `${displayPakets.length} paket ditemukan`

    if (displayPakets.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">📦</div>
          <p>Tidak ada paket yang sesuai filter</p>
        </div>
      `
      return
    }

    grid.innerHTML = displayPakets.map(p => {
      const pct = Math.round((p.terisi / p.kuota) * 100)
      const isAlmostFull = pct >= 85
      const sisa = p.kuota - p.terisi
      const stars = '★'.repeat(p.bintangHotel || 3)
      const duration = this.getDuration(p)

      return `
        <div class="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.hash='#/paket/${p.id}'">
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${p.jenis === 'Haji' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'}">${p.jenis}</span>
                ${p.status === 'hampir-penuh' || isAlmostFull ? '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Hampir Penuh</span>' : ''}
                ${p.status === 'aktif' ? '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Aktif</span>' : ''}
                ${p.status === 'berangkat' ? '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Berangkat</span>' : ''}
                ${p.status === 'selesai' ? '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Selesai</span>' : ''}
              </div>
            </div>
            <h3 class="font-semibold text-gray-900 mt-2">${p.nama}</h3>
            <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>${formatDate(p.tanggalBerangkat, 'DD MMM YYYY')}</span>
              <span class="text-gray-300">•</span>
              <span>${duration}</span>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center gap-1 text-gold-500 text-sm mb-1">${stars}</div>
            <p class="text-xs text-gray-500 mb-3">${p.hotel} - ${p.maskapai}</p>

            <!-- Kuota Progress -->
            <div class="mb-3">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Kuota</span>
                <span class="${sisa <= 5 ? 'text-red-600 font-medium' : ''}">${p.terisi}/${p.kuota} orang${sisa <= 5 ? ` (sisa ${sisa})` : ''}</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2.5">
                <div class="h-2.5 rounded-full transition-all ${pct >= 85 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-lg font-bold text-gray-900">${formatRupiah(p.harga)}</p>
              <div class="flex gap-2">
                <a href="#/paket/${p.id}/edit" class="btn-secondary text-xs py-1.5" onclick="event.stopPropagation()">Edit</a>
                <a href="#/paket/${p.id}" class="btn-primary text-xs py-1.5">Detail</a>
              </div>
            </div>
          </div>
        </div>
      `
    }).join('')
  }
}
