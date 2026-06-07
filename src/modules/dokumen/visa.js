/**
 * Visa Status Tracking (T-31)
 * Status flow: Belum diproses -> Dokumen dikirim -> Proses di Kedubes -> Approved / Rejected
 */
import api from '../../api/api.js'
import { showToast, formatDate, lsGet, lsSet } from '../../utils/helpers.js'
import { daysFromNow } from '../../utils/date.js'

const VISA_STATUSES = ['belum-diproses', 'dokumen-dikirim', 'proses-kedubes', 'approved', 'rejected']
const VISA_STATUS_LABELS = {
  'belum-diproses': 'Belum Diproses',
  'dokumen-dikirim': 'Dokumen Dikirim',
  'proses-kedubes': 'Proses di Kedubes',
  'approved': 'Approved',
  'rejected': 'Rejected'
}

export default class VisaView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaahs = []
    this.pakets = []
    this.visaData = lsGet('visa_tracking', {})
  }

  async mount(el) {
    this.el = el
    await this.loadData()
    this.render()
  }

  async loadData() {
    try {
      const [jamaahs, pakets] = await Promise.all([
        api.getJamaah(),
        api.getPaket()
      ])
      this.jamaahs = jamaahs.filter(j => !j.deletedAt)
      this.pakets = pakets
    } catch (err) {
      console.error('Failed to load data:', err)
      showToast('Gagal memuat data', 'error')
    }
  }

  getVisaData(jamaahId) {
    return this.visaData[jamaahId] || {
      status: 'belum-diproses',
      tanggalSubmit: null,
      nomorTracking: null,
      tanggalUpdate: null,
      notes: ''
    }
  }

  async updateVisaStatus(jamaahId, data) {
    const visa = this.getVisaData(jamaahId)
    const updated = { ...visa, ...data, tanggalUpdate: new Date().toISOString() }
    this.visaData[jamaahId] = updated
    lsSet('visa_tracking', this.visaData)
    
    // Create notification for status changes
    if (data.status === 'approved' || data.status === 'rejected') {
      this.createVisaNotification(jamaahId, data.status)
    }
    
    // Check for expiring visas (within 30 days)
    if (updated.kadaluarsa && daysFromNow(updated.kadaluarsa) <= 30 && daysFromNow(updated.kadaluarsa) > 0) {
      this.createExpiryNotification(jamaahId, updated.kadaluarsa)
    }
    
    this.render()
    showToast('Status visa diupdate!', 'success')
  }

  createVisaNotification(jamaahId, status) {
    const jamaat = this.jamaahs.find(j => j.id === jamaahId)
    if (!jamaat) return

    const notifs = lsGet('notifications', [])
    notifs.unshift({
      id: 'VSN_' + Date.now(),
      type: status === 'approved' ? 'visa-approved' : 'visa-rejected',
      title: status === 'approved' ? '✅ Visa Disetujui' : '❌ Visa Ditolak',
      message: `Visa ${jamaat.nama} telah ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
      jamaatId: jamaahId,
      timestamp: new Date().toISOString(),
      read: false
    })
    lsSet('notifications', notifs)
  }

  createExpiryNotification(jamaahId, kadaluarsa) {
    const jamaat = this.jamaahs.find(j => j.id === jamaahId)
    if (!jamaat) return

    const notifs = lsGet('notifications', [])
    notifs.unshift({
      id: 'VEX_' + Date.now(),
      type: 'visa-expiry',
      title: '⚠️ Visa Akan Kadaluarsa',
      message: `Visa ${jamaat.nama} akan kadaluarsa dalam ${daysFromNow(kadaluarsa)} hari`,
      jamaatId: jamaahId,
      timestamp: new Date().toISOString(),
      read: false
    })
    lsSet('notifications', notifs)
  }

  render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Status Visa</h2>
            <p class="text-gray-500 text-sm mt-1">Tracking proses visa jamaah</p>
          </div>
        </div>

        <!-- Legend -->
        <div class="card p-4">
          <div class="flex flex-wrap gap-4 text-xs">
            ${VISA_STATUSES.map(s => `
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full ${this.getStatusColor(s)}"></span>
                <span class="text-gray-600">${VISA_STATUS_LABELS[s]}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Visa List -->
        <div class="space-y-3" id="visa-list">
          ${this.renderVisaList()}
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderVisaList() {
    if (!this.jamaahs.length) {
      return `
        <div class="card p-12 text-center">
          <div class="text-5xl mb-4">📋</div>
          <h3 class="font-semibold text-gray-800 mb-2">Belum ada data</h3>
        </div>
      `
    }

    return this.jamaahs.map(jamaah => this.renderVisaCard(jamaah)).join('')
  }

  renderVisaCard(jamaah) {
    const visa = this.getVisaData(jamaah.id)
    const paket = this.pakets.find(p => p.id === jamaah.paketId)
    const isExpiring = visa.kadaluarsa && daysFromNow(visa.kadaluarsa) <= 30 && daysFromNow(visa.kadaluarsa) > 0
    const isExpired = visa.kadaluarsa && daysFromNow(visa.kadaluarsa) <= 0

    return `
      <div class="card">
        <div class="p-4">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <a href="#/jamaah/${jamaah.id}" class="font-semibold text-gray-900 hover:text-primary-600">${jamaah.nama}</a>
                ${isExpiring ? '<span class="badge badge-warning">Akan Kadaluarsa</span>' : ''}
                ${isExpired ? '<span class="badge badge-danger">Kadaluarsa</span>' : ''}
              </div>
              <p class="text-xs text-gray-400">${jamaah.noJamaah} • ${paket?.nama || '-'}</p>
            </div>
            <select class="visa-status-select form-select text-sm w-40" data-jamaah="${jamaah.id}">
              ${VISA_STATUSES.map(s => `
                <option value="${s}" ${visa.status === s ? 'selected' : ''}>${VISA_STATUS_LABELS[s]}</option>
              `).join('')}
            </select>
          </div>

          <!-- Timeline -->
          <div class="mb-4">
            ${this.renderTimeline(visa.status)}
          </div>

          <!-- Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs text-gray-500">Tanggal Submit</label>
              <input type="date" class="form-input text-sm w-full visa-date" data-jamaah="${jamaah.id}" data-field="tanggalSubmit" value="${visa.tanggalSubmit || ''}" />
            </div>
            <div>
              <label class="text-xs text-gray-500">Nomor Tracking</label>
              <input type="text" class="form-input text-sm w-full visa-tracking" data-jamaah="${jamaah.id}" data-field="nomorTracking" value="${visa.nomorTracking || ''}" placeholder="Opsional" />
            </div>
            <div>
              <label class="text-xs text-gray-500">Tanggal Kadaluarsa</label>
              <input type="date" class="form-input text-sm w-full visa-expire" data-jamaah="${jamaah.id}" data-field="kadaluarsa" value="${visa.kadaluarsa || ''}" />
            </div>
          </div>

          <div class="mt-3">
            <label class="text-xs text-gray-500">Catatan</label>
            <textarea class="form-input text-sm w-full visa-notes" data-jamaah="${jamaah.id}" data-field="notes" rows="2" placeholder="Catatan tambahan...">${visa.notes || ''}</textarea>
          </div>
        </div>
      </div>
    `
  }

  renderTimeline(currentStatus) {
    const currentIdx = VISA_STATUSES.indexOf(currentStatus)
    
    return `
      <div class="flex items-center gap-2">
        ${VISA_STATUSES.slice(0, -2).map((s, i) => { // Exclude approved/rejected from flow
          const isPast = i < currentIdx
          const isCurrent = i === currentIdx
          return `
            <div class="flex items-center">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isPast ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-400'}">
                  ${isPast ? '✓' : i + 1}
                </div>
                <span class="text-xs mt-1 ${isCurrent ? 'text-primary-600 font-medium' : 'text-gray-400'}">${VISA_STATUS_LABELS[s]}</span>
              </div>
              ${i < 2 ? '<div class="w-8 h-0.5 ' + (isPast ? 'bg-primary-500' : 'bg-gray-200') + '"></div>' : ''}
            </div>
          `
        }).join('')}
        
        ${currentStatus === 'approved' ? `
          <div class="flex items-center ml-4">
            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">✓</div>
            <span class="text-xs ml-1 text-green-600 font-medium">Approved</span>
          </div>
        ` : ''}
        
        ${currentStatus === 'rejected' ? `
          <div class="flex items-center ml-4">
            <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">✗</div>
            <span class="text-xs ml-1 text-red-600 font-medium">Rejected</span>
          </div>
        ` : ''}
      </div>
    `
  }

  getStatusColor(status) {
    const colors = {
      'belum-diproses': 'bg-gray-300',
      'dokumen-dikirim': 'bg-blue-400',
      'proses-kedubes': 'bg-yellow-400',
      'approved': 'bg-green-500',
      'rejected': 'bg-red-500'
    }
    return colors[status] || 'bg-gray-300'
  }

  attachEvents() {
    // Status change
    document.querySelectorAll('.visa-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        await this.updateVisaStatus(e.target.dataset.jamaah, { status: e.target.value })
      })
    })

    // Date/tracking/notes change
    document.querySelectorAll('.visa-date, .visa-tracking, .visa-expire, .visa-notes').forEach(input => {
      input.addEventListener('change', () => {
        const jamaahId = input.dataset.jamaah
        const field = input.dataset.field
        const value = input.type === 'checkbox' ? input.checked : input.value
        
        const visa = this.getVisaData(jamaahId)
        visa[field] = value
        this.visaData[jamaahId] = visa
        lsSet('visa_tracking', this.visaData)
      })
    })
  }
}
