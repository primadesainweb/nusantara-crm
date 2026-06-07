/**
 * Dashboard Overview (T-32) - Improved with KPIs, quick links, activity feed
 */
import { state } from '../../state.js'
import { showToast, formatRupiah, formatDate, statusBadge, lsGet } from '../../utils/helpers.js'
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
            <p class="text-gray-500 text-sm mt-1">Ringkasan bisnis travel umroh & haji</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-sm text-gray-400" id="dashboard-date"></div>
            <button id="btn-refresh" class="btn-secondary" title="Refresh">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-24 rounded-xl"></div>
        </div>

        <!-- Quick Links -->
        <div class="card p-4">
          <h3 class="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
          <div class="flex flex-wrap gap-3">
            <a href="#/jamaah/new" class="btn-primary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Tambah Jamaah
            </a>
            <a href="#/pembayaran/form" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Input Pembayaran
            </a>
            <a href="#/dokumen/checklist" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Cek Jatuh Tempo
            </a>
            <a href="#/komunikasi/reminder" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Reminder WA
            </a>
          </div>
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

        <!-- Activity Feed -->
        <div class="card p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Aktivitas Terbaru</h3>
            <button id="btn-clear-activity" class="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          </div>
          <div id="activity-feed" class="space-y-3 max-h-64 overflow-y-auto">
            <div class="text-center text-gray-400 py-8">Memuat...</div>
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
    this.loadActivityFeed()
    this.attachEvents()
  }

  async loadData() {
    try {
      const data = await api.getStats()
      this.renderKPIs(data)
      this.renderUpcomingDepartures(data.pakets)
      this.renderRecentJamaah(data.jamaat)
      
      // Load charts
      if (window.DashboardCharts) {
        window.DashboardCharts.renderCharts(data)
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
  }

  renderKPIs(data) {
    const container = document.getElementById('kpi-cards')
    if (!container) return

    const totalJamaah = data.jamaat?.filter(j => !j.deletedAt).length || 0
    const bulanIni = new Date().toISOString().slice(0, 7)
    const pendapatanBulanIni = data.transaksis
      ?.filter(t => t.tanggal?.startsWith(bulanIni) && t.status === 'lunas')
      ?.reduce((sum, t) => sum + (t.nominal || 0), 0) || 0
    
    // Countdown to nearest departure
    const now = new Date()
    const aktifPakets = (data.pakets || []).filter(p => p.status === 'aktif' && new Date(p.tanggalBerangkat) > now)
    const terdekat = aktifPakets.sort((a, b) => new Date(a.tanggalBerangkat) - new Date(b.tanggalBerangkat))[0]
    const countdown = terdekat ? Math.ceil((new Date(terdekat.tanggalBerangkat) - now) / (1000 * 60 * 60 * 24)) : null

    // Count incomplete docs
    const dokumens = data.transaksis || [] // We'll need separate docs data
    
    const kpis = [
      { label: 'Total Jamaah Aktif', value: totalJamaah, icon: '👥', color: 'bg-primary-50 border-primary-100' },
      { label: 'Pendapatan Bulan Ini', value: formatRupiah(pendapatanBulanIni), icon: '💰', color: 'bg-gold-50 border-gold-100' },
      { label: 'Keberangkatan Terdekat', value: countdown !== null ? `${countdown} hari` : '-', icon: '📅', color: 'bg-blue-50 border-blue-100' },
      { label: 'Dokumen Incomplete', value: '-', icon: '📋', color: 'bg-red-50 border-red-100' },
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

    const now = new Date()
    const upcoming = pakets
      .filter(p => p.status === 'aktif' && new Date(p.tanggalBerangkat) > now)
      .sort((a, b) => new Date(a.tanggalBerangkat) - new Date(b.tanggalBerangkat))
      .slice(0, 5)

    if (!upcoming.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Tidak ada keberangkatan terdekat</p>'
      return
    }

    container.innerHTML = upcoming.map(p => {
      const tgl = formatDate(p.tanggalBerangkat, 'DD Mon YYYY')
      const daysUntil = Math.ceil((new Date(p.tanggalBerangkat) - now) / (1000 * 60 * 60 * 24))
      const pct = Math.round((p.terisi / p.kuota) * 100)
      return `
        <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 text-sm truncate">${p.nama}</p>
            <p class="text-xs text-gray-400">${tgl} - ${p.terisi}/${p.kuota} kursi</p>
          </div>
          <div class="flex items-center gap-2">
            ${daysUntil <= 7 ? `<span class="badge badge-warning">${daysUntil} hari</span>` : ''}
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

    const recent = jamaahs
      .filter(j => !j.deletedAt)
      .sort((a, b) => new Date(b.tanggalDaftar) - new Date(a.tanggalDaftar))
      .slice(0, 5)

    container.innerHTML = recent.map(j => {
      const initials = (j.nama || '?').split(' ').map(w => w[0]).slice(0, 2).join('')
      return `
        <div class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span class="text-primary-600 text-xs font-semibold">${initials}</span>
          </div>
          <div class="flex-1 min-w-0">
            <a href="#/jamaah/${j.id}" class="font-medium text-gray-800 text-sm truncate hover:text-primary-600">${j.nama}</a>
            <p class="text-xs text-gray-400">${formatDate(j.tanggalDaftar)}</p>
          </div>
          ${statusBadge(j.status)}
        </div>
      `
    }).join('')
  }

  loadActivityFeed() {
    const container = document.getElementById('activity-feed')
    if (!container) return

    const activities = lsGet('activity_log', []).slice(0, 10)

    if (!activities.length) {
      container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">Belum ada aktivitas</p>'
      return
    }

    container.innerHTML = activities.map(act => `
      <div class="flex items-start gap-3 text-sm">
        <div class="w-8 h-8 rounded-full ${this.getActivityColor(act.type)} flex items-center justify-center shrink-0 text-xs">
          ${this.getActivityIcon(act.type)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-gray-800">${act.message}</p>
          <p class="text-xs text-gray-400">${formatDate(act.timestamp, 'DD MMM YYYY HH:mm')}</p>
        </div>
      </div>
    `).join('')
  }

  getActivityIcon(type) {
    const icons = {
      'payment': '💰',
      'document': '📄',
      'status': '🏷️',
      'jamaah': '👤',
      'paket': '📅'
    }
    return icons[type] || '📌'
  }

  getActivityColor(type) {
    const colors = {
      'payment': 'bg-green-100 text-green-600',
      'document': 'bg-blue-100 text-blue-600',
      'status': 'bg-purple-100 text-purple-600',
      'jamaah': 'bg-primary-100 text-primary-600',
      'paket': 'bg-gold-100 text-gold-600'
    }
    return colors[type] || 'bg-gray-100 text-gray-600'
  }

  attachEvents() {
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
      this.loadData()
      this.loadActivityFeed()
      showToast('Dashboard di-refresh', 'info')
    })

    document.getElementById('btn-clear-activity')?.addEventListener('click', () => {
      if (confirm('Hapus semua aktivitas?')) {
        lsSet('activity_log', [])
        this.loadActivityFeed()
      }
    })
  }
}
