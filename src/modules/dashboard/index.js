import { state } from '../../state.js'
import { showToast, formatRupiah, formatDate, statusBadge } from '../../utils/helpers.js'
import api from '../../api/api.js'

export default class DashboardView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
  }

  async mount(el) {
    this.el = el
    await this.render()
  }

  async render() {
    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Dashboard</h2>
            <p class="text-gray-500 text-sm mt-1">Ringkasan bisnis travel umroh &amp; haji</p>
          </div>
          <div class="text-sm text-gray-400" id="dashboard-date"></div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 card p-4">
            <h3 class="font-semibold text-gray-800 mb-4">Pendapatan per Bulan</h3>
            <div id="chart-container" class="h-64">
              <div class="skeleton h-full w-full rounded-lg"></div>
            </div>
          </div>
          <div class="card p-4">
            <h3 class="font-semibold text-gray-800 mb-4">Status Jamaah</h3>
            <div id="status-chart" class="h-64">
              <div class="skeleton h-full w-full rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Tables Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800">Keberangkatan Terdekat</h3>
              <a href="#/paket" class="text-sm text-primary-600 hover:underline">Lihat semua</a>
            </div>
            <div id="upcoming-departures">
              <div class="skeleton h-16 rounded-lg mb-2"></div>
              <div class="skeleton h-16 rounded-lg mb-2"></div>
              <div class="skeleton h-16 rounded-lg"></div>
            </div>
          </div>
          <div class="card p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800">Jamaah Terbaru</h3>
              <a href="#/jamaah" class="text-sm text-primary-600 hover:underline">Lihat semua</a>
            </div>
            <div id="recent-jamaah">
              <div class="skeleton h-12 rounded-lg mb-2"></div>
              <div class="skeleton h-12 rounded-lg mb-2"></div>
              <div class="skeleton h-12 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    `

    const dateEl = document.getElementById('dashboard-date')
    if (dateEl) {
      const now = new Date()
      dateEl.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    }

    this.loadData()
  }

  async loadData() {
    try {
      const data = await api.getStats()
      this.renderKPIs(data)
      this.renderUpcomingDepartures(data.pakets)
      this.renderRecentJamaah(data.jamaat)
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
  }

  renderKPIs(data) {
    const container = document.getElementById('kpi-cards')
    if (!container) return

    const totalJamaah = data.jamaat?.length || 0
    const bulanIni = new Date().toISOString().slice(0, 7)
    const pendapatanBulanIni = data.transaksis
      ?.filter(t => t.tanggal?.startsWith(bulanIni) && t.status === 'lunas')
      ?.reduce((sum, t) => sum + (t.nominal || 0), 0) || 0
    const keberangkatan = data.pakets?.filter(p => p.status === 'aktif')?.length || 0
    const belumLunas = data.pembayarans?.filter(p => p.status !== 'lunas')?.length || 0

    const kpis = [
      { label: 'Total Jamaah', value: totalJamaah, icon: '👥', color: 'bg-primary-50 border-primary-100' },
      { label: 'Pendapatan Bulan Ini', value: formatRupiah(pendapatanBulanIni), icon: '💰', color: 'bg-gold-50 border-gold-100' },
      { label: 'Paket Aktif', value: keberangkatan, icon: '📅', color: 'bg-blue-50 border-blue-100' },
      { label: 'Belum Lunas', value: belumLunas, icon: '⏳', color: 'bg-red-50 border-red-100' },
    ]

    container.innerHTML = kpis.map(kpi => `
      <div class="card p-4 border ${kpi.color}">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 font-medium">${kpi.label}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">${kpi.value}</p>
          </div>
          <div class="text-2xl">${kpi.icon}</div>
        </div>
      </div>
    `).join('')
  }

  renderUpcomingDepartures(pakets) {
    const container = document.getElementById('upcoming-departures')
    if (!container || !pakets?.length) return

    const upcoming = pakets
      .filter(p => p.status === 'aktif')
      .sort((a, b) => new Date(a.tanggalBerangkat) - new Date(b.tanggalBerangkat))
      .slice(0, 3)

    container.innerHTML = upcoming.map(p => {
      const tgl = formatDate(p.tanggalBerangkat, 'DD Mon YYYY')
      const pct = Math.round((p.terisi / p.kuota) * 100)
      return `
        <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm truncate">${p.nama}</p>
            <p class="text-xs text-gray-400">${tgl} - ${p.terisi}/${p.kuota} kursi</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-20 bg-gray-100 rounded-full h-1.5">
              <div class="bg-primary-500 h-1.5 rounded-full" style="width:${pct}%"></div>
            </div>
            <span class="text-xs text-gray-500">${pct}%</span>
          </div>
        </div>
      `
    }).join('')
  }

  renderRecentJamaah(jamaahs) {
    const container = document.getElementById('recent-jamaah')
    if (!container || !jamaahs?.length) return

    const recent = jamaahs.slice(0, 5)

    container.innerHTML = recent.map(j => {
      const initials = (j.nama || '?').split(' ').map(w => w[0]).slice(0, 2).join('')
      return `
        <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span class="text-primary-600 text-xs font-semibold">${initials}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm truncate">${j.nama}</p>
            <p class="text-xs text-gray-400">${formatDate(j.tanggalDaftar)}</p>
          </div>
          ${statusBadge(j.status)}
        </div>
      `
    }).join('')
  }
}
