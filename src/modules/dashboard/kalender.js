/**
 * Departure Calendar Widget (T-34)
 * Mini monthly calendar view with highlighted departure dates
 */
import api from '../../api/api.js'
import { formatDate } from '../../utils/helpers.js'

export default class KalenderView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.currentDate = new Date()
    this.pakets = []
    this.departureMap = {}
  }

  async mount(el) {
    this.el = el
    await this.loadData()
    this.render()
  }

  async loadData() {
    try {
      this.pakets = await api.getPaket()
    } catch (err) {
      console.error('Failed to load paket data:', err)
    }
    
    // Build departure map by date
    this.pakets.forEach(p => {
      if (p.tanggalBerangkat) {
        const key = p.tanggalBerangkat.split('T')[0]
        if (!this.departureMap[key]) {
          this.departureMap[key] = []
        }
        this.departureMap[key].push(p)
      }
    })
  }

  render() {
    const month = this.currentDate.getMonth()
    const year = this.currentDate.getFullYear()
    const monthName = this.currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Kalender Keberangkatan</h2>
            <p class="text-gray-500 text-sm mt-1">Jadwal keberangkatan paket umroh & haji</p>
          </div>
        </div>

        <!-- Calendar Card -->
        <div class="card p-4 max-w-lg">
          <!-- Navigation -->
          <div class="flex items-center justify-between mb-4">
            <button id="prev-month" class="p-2 rounded-lg hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h3 id="month-title" class="font-semibold text-gray-800">${monthName}</h3>
            <button id="next-month" class="p-2 rounded-lg hover:bg-gray-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Day Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            ${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => `
              <div class="text-center text-xs font-medium text-gray-500 py-2">${d}</div>
            `).join('')}
          </div>

          <!-- Calendar Grid -->
          <div id="calendar-grid" class="grid grid-cols-7 gap-1">
            ${this.renderCalendarDays(firstDay, daysInMonth)}
          </div>
        </div>

        <!-- Departure List for Current Month -->
        <div class="card">
          <div class="p-4 border-b">
            <h3 class="font-semibold text-gray-800">Keberangkatan Bulan Ini</h3>
          </div>
          <div id="departure-list" class="divide-y max-h-96 overflow-y-auto">
            ${this.renderDepartureList(month, year)}
          </div>
        </div>
      </div>

      <!-- Popup Modal -->
      <div id="departure-popup" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b">
            <h4 id="popup-title" class="font-semibold">Detail Keberangkatan</h4>
            <button id="close-popup" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <div id="popup-content" class="p-4 overflow-auto"></div>
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderCalendarDays(firstDay, daysInMonth) {
    let html = ''
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="aspect-square"></div>'
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const departures = this.departureMap[dateStr]
      const isToday = this.isToday(day)
      
      html += `
        <div class="aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-primary-50' : ''} ${departures ? 'bg-primary-100 hover:bg-primary-200' : ''}"
             data-date="${dateStr}" ${departures ? 'data-has-departure="true"' : ''}>
          <span class="text-sm ${isToday ? 'font-bold text-primary-600' : 'text-gray-700'}">${day}</span>
          ${departures ? `<span class="w-1.5 h-1.5 rounded-full bg-primary-500 mt-0.5"></span>` : ''}
        </div>
      `
    }
    
    return html
  }

  renderDepartureList(month, year) {
    const departures = this.pakets.filter(p => {
      if (!p.tanggalBerangkat) return false
      const d = new Date(p.tanggalBerangkat)
      return d.getMonth() === month && d.getFullYear() === year
    }).sort((a, b) => new Date(a.tanggalBerangkat) - new Date(b.tanggalBerangkat))

    if (!departures.length) {
      return `
        <div class="p-8 text-center text-gray-400">
          <p>Tidak ada keberangkatan bulan ini</p>
        </div>
      `
    }

    return departures.map(p => `
      <div class="p-4 hover:bg-gray-50 cursor-pointer" data-paket-id="${p.id}">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-800">${p.nama}</p>
            <p class="text-xs text-gray-400">${formatDate(p.tanggalBerangkat, 'DD MMMM YYYY')} - ${formatDate(p.tanggalKembali, 'DD MMMM YYYY')}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-primary-600">${p.terisi}/${p.kuota}</p>
            <p class="text-xs text-gray-400">kursi terisi</p>
          </div>
        </div>
      </div>
    `).join('')
  }

  isToday(day) {
    const today = new Date()
    return day === today.getDate() && 
           this.currentDate.getMonth() === today.getMonth() && 
           this.currentDate.getFullYear() === today.getFullYear()
  }

  showDeparturePopup(dateStr) {
    const departures = this.departureMap[dateStr]
    if (!departures?.length) return

    const popup = document.getElementById('departure-popup')
    const title = document.getElementById('popup-title')
    const content = document.getElementById('popup-content')

    title.textContent = formatDate(dateStr, 'DD MMMM YYYY')

    content.innerHTML = departures.map(p => `
      <div class="mb-4 last:mb-0 p-4 bg-gray-50 rounded-lg">
        <h5 class="font-semibold text-gray-800 mb-2">${p.nama}</h5>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Pulang:</span>
            <span class="font-medium">${formatDate(p.tanggalKembali, 'DD MMM YYYY')}</span>
          </div>
          <div>
            <span class="text-gray-500">Kuota:</span>
            <span class="font-medium">${p.terisi}/${p.kuota}</span>
          </div>
          <div>
            <span class="text-gray-500">Hotel:</span>
            <span class="font-medium">${p.hotel || '-'}</span>
          </div>
          <div>
            <span class="text-gray-500">Maskapai:</span>
            <span class="font-medium">${p.maskapai || '-'}</span>
          </div>
        </div>
        <a href="#/paket/${p.id}" class="btn-secondary text-xs mt-3 inline-block">Lihat Detail</a>
      </div>
    `).join('')

    popup.classList.remove('hidden')
  }

  attachEvents() {
    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
      this.render()
    })

    document.getElementById('next-month')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
      this.render()
    })

    // Day click
    document.querySelectorAll('[data-has-departure]').forEach(el => {
      el.addEventListener('click', () => {
        this.showDeparturePopup(el.dataset.date)
      })
    })

    // Close popup
    document.getElementById('close-popup')?.addEventListener('click', () => {
      document.getElementById('departure-popup')?.classList.add('hidden')
    })

    document.getElementById('departure-popup')?.addEventListener('click', (e) => {
      if (e.target.id === 'departure-popup') {
        e.target.classList.add('hidden')
      }
    })
  }
}
