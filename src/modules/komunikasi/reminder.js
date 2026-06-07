/**
 * Bulk Cicilan Reminder (T-36)
 * List jamaats with cicilan due in next 7 days / this month
 * Send WA reminder one by one, mark as "sudah dihubungi"
 */
import api from '../../api/api.js'
import { showToast, formatRupiah, formatDate, lsGet, lsSet } from '../../utils/helpers.js'
import { daysFromNow } from '../../utils/date.js'

export default class ReminderView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaahs = []
    this.pakets = []
    this.pembayarans = []
    this.reminders = lsGet('cicilan_reminders', {}) // { jamaatId: { contacted: bool, date: ... } }
    this.filter = 'upcoming' // upcoming, overdue, all
  }

  async mount(el) {
    this.el = el
    await this.loadData()
    this.render()
  }

  async loadData() {
    try {
      const [jamaahs, pakets, pembayarans] = await Promise.all([
        api.getJamaah(),
        api.getPaket(),
        api.getPembayaran()
      ])
      this.jamaahs = jamaahs.filter(j => !j.deletedAt)
      this.pakets = pakets
      this.pembayarans = pembayarans
    } catch (err) {
      console.error('Failed to load data:', err)
      showToast('Gagal memuat data', 'error')
    }
  }

  getCicilanDueList() {
    // Get all cicilan records from localStorage (simulate jadwal cicilan)
    const jadwalCicilan = lsGet('jadwal_cicilan', [])
    
    // Filter based on due date
    const now = new Date()
    const dueList = []

    this.jamaahs.forEach(jamaah => {
      const pembayaran = this.pembayarans.find(p => p.jamaahId === jamaah.id)
      if (!pembayaran || pembayaran.status === 'lunas') return
      
      // Check if there's a scheduled cicilan
      const jadwalList = jadwalCicilan.filter(j => j.jamaahId === jamaah.id && !j.isLunas)
      
      if (jadwalList.length) {
        jadwalList.forEach(j => {
          const dueDate = new Date(j.tanggalJatuhTempo)
          const days = daysFromNow(j.tanggalJatuhTempo)
          
          if (this.filter === 'overdue' && days < 0) {
            dueList.push({ ...j, jamaat: jamaah, daysUntil: days, isOverdue: true })
          } else if (this.filter === 'upcoming' && days >= 0 && days <= 7) {
            dueList.push({ ...j, jamaat: jamaah, daysUntil: days, isOverdue: false })
          } else if (this.filter === 'all') {
            dueList.push({ ...j, jamaat: jamaah, daysUntil: days, isOverdue: days < 0 })
          }
        })
      } else {
        // Fallback: show if payment is cicilan and has remaining balance
        const paket = this.pakets.find(p => p.id === jamaah.paketId)
        const remainingDays = 7 // Default 7 days for payments with remaining balance
        
        if (this.filter === 'upcoming') {
          dueList.push({
            id: 'fallback_' + pembayaran.id,
            jamaatId: jamaah.id,
            jamaat: jamaat,
            nominal: pembayaran.sisa || 0,
            tanggalJatuhTempo: new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            daysUntil: remainingDays,
            isOverdue: false,
            paket: paket
          })
        } else if (this.filter === 'all') {
          dueList.push({
            id: 'fallback_' + pembayaran.id,
            jamaatId: jamaah.id,
            jamaat: jamaat,
            nominal: pembayaran.sisa || 0,
            tanggalJatuhTempo: null,
            daysUntil: null,
            isOverdue: false,
            paket: paket
          })
        }
      }
    })

    // Sort: overdue first, then by days until due
    dueList.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      return (a.daysUntil || 999) - (b.daysUntil || 999)
    })

    return dueList
  }

  render() {
    const overdue = this.getCicilanDueList().filter(d => d.isOverdue)
    const upcoming = this.getCicilanDueList().filter(d => !d.isOverdue)

    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Reminder Cicilan</h2>
            <p class="text-gray-500 text-sm mt-1">Kirim pengingat pembayaran cicilan via WhatsApp</p>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4 text-center border-l-4 border-red-400">
            <p class="text-3xl font-bold text-red-500">${overdue.length}</p>
            <p class="text-xs text-gray-500">Jatuh Tempo Terlewat</p>
          </div>
          <div class="card p-4 text-center border-l-4 border-yellow-400">
            <p class="text-3xl font-bold text-yellow-500">${upcoming.length}</p>
            <p class="text-xs text-gray-500">Akan Jatuh Tempo (7 hari)</p>
          </div>
          <div class="card p-4 text-center border-l-4 border-primary-400">
            <p class="text-3xl font-bold text-primary-500">${this.getContactedCount()}</p>
            <p class="text-xs text-gray-500">Sudah Dihubungi</p>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="card p-1 inline-flex">
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'upcoming' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="upcoming">
            Akan Jatuh Tempo
          </button>
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'overdue' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="overdue">
            Terlambat
          </button>
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="all">
            Semua
          </button>
        </div>

        <!-- Reminder List -->
        <div class="card">
          <div class="p-4 border-b flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Daftar Reminder</h3>
            <span class="text-sm text-gray-400" id="reminder-count">${this.getCicilanDueList().length} item</span>
          </div>
          <div class="divide-y" id="reminder-list">
            ${this.renderReminderList()}
          </div>
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderReminderList() {
    const list = this.getCicilanDueList()
    
    if (!list.length) {
      return `
        <div class="p-12 text-center text-gray-400">
          <div class="text-5xl mb-4">✅</div>
          <p>Tidak ada data cicilan yang perlu di reminder</p>
        </div>
      `
    }

    return list.map(item => {
      const contacted = this.reminders[item.jamaahId]?.contacted
      const paket = this.pakets.find(p => p.id === item.jamaat.paketId)
      
      return `
        <div class="p-4 hover:bg-gray-50 ${contacted ? 'opacity-60' : ''}" data-jamaah-id="${item.jamaahId}">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-gray-900">${item.jamaat.nama}</span>
                ${contacted ? '<span class="badge badge-success">✓ Dihubungi</span>' : ''}
                ${item.isOverdue ? '<span class="badge badge-danger">Terlambat</span>' : ''}
              </div>
              <p class="text-xs text-gray-400 mb-2">${item.jamaat.noJamaah} • ${paket?.nama || '-'}</p>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span class="text-gray-500">Nominal:</span>
                  <span class="font-medium text-red-600">${formatRupiah(item.nominal)}</span>
                </div>
                <div>
                  <span class="text-gray-500">Jatuh Tempo:</span>
                  <span class="font-medium ${item.isOverdue ? 'text-red-500' : 'text-gray-800'}">${item.tanggalJatuhTempo ? formatDate(item.tanggalJatuhTempo, 'DD MMM YYYY') : '-'}</span>
                </div>
                <div>
                  <span class="text-gray-500">Sisa:</span>
                  <span class="font-medium">${formatRupiah(item.jamaat.pembayaran?.sisa || 0)}</span>
                </div>
                <div>
                  <span class="text-gray-500">HP:</span>
                  <span class="font-medium">${item.jamaat.noHp || '-'}</span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col gap-2">
              ${!contacted ? `
                <button class="btn-primary text-sm btn-send-wa" data-jamaah-id="${item.jamaahId}">
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Kirim WA
                </button>
              ` : `
                <button class="btn-secondary text-sm btn-mark-uncontacted" data-jamaah-id="${item.jamaahId}">
                  Batalkan
                </button>
              `}
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  getContactedCount() {
    return Object.values(this.reminders).filter(r => r.contacted).length
  }

  sendWhatsApp(jamaahId) {
    const jamaat = this.jamaahs.find(j => j.id === jamaahId)
    if (!jamaat) return

    const paket = this.pakets.find(p => p.id === jamaat.paketId)
    const cicilanItem = this.getCicilanDueList().find(d => d.jamaahId === jamaahId)

    const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. ${jamaat.nama},

Berikut kami informasikan jadwal pembayaran cicilan Anda:

💰 Rincian:
• Paket: ${paket?.nama || '-'}
• Nominal: ${formatRupiah(cicilanItem?.nominal || 0)}
• Jatuh Tempo: ${cicilanItem?.tanggalJatuhTempo ? formatDate(cicilanItem.tanggalJatuhTempo, 'DD MMMM YYYY') : 'Segera'}

Mohon untuk melakukan pembayaran sebelum jatuh tempo. Pembayaran dapat dilakukan melalui transfer ke rekening yang tertera di surat komitmen.

Jazakumullahu khairan,
Nusantara Travel`

    const phone = jamaat.whatsapp || jamaat.noHp
    const cleanPhone = phone?.replace(/^0/, '') || '08xxxxxxxxxx'
    const waUrl = `https://wa.me/62${cleanPhone}?text=${encodeURIComponent(message)}`
    
    window.open(waUrl, '_blank')

    // Mark as contacted
    this.markAsContacted(jamaahId)
  }

  markAsContacted(jamaahId) {
    this.reminders[jamaahId] = {
      contacted: true,
      date: new Date().toISOString()
    }
    lsSet('cicilan_reminders', this.reminders)
    showToast('Tandai sudah dihubungi', 'success')
    this.render()
  }

  markAsUncontacted(jamaahId) {
    if (this.reminders[jamaahId]) {
      delete this.reminders[jamaahId]
      lsSet('cicilan_reminders', this.reminders)
    }
    this.render()
  }

  attachEvents() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('bg-primary-500', 'text-white')
          b.classList.add('text-gray-600', 'hover:bg-gray-100')
        })
        btn.classList.add('bg-primary-500', 'text-white')
        btn.classList.remove('text-gray-600', 'hover:bg-gray-100')
        document.getElementById('reminder-list').innerHTML = this.renderReminderList()
        this.attachReminderEvents()
      })
    })

    this.attachReminderEvents()
  }

  attachReminderEvents() {
    // Send WA buttons
    document.querySelectorAll('.btn-send-wa').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendWhatsApp(btn.dataset.jamaahId)
      })
    })

    // Mark uncontacted buttons
    document.querySelectorAll('.btn-mark-uncontacted').forEach(btn => {
      btn.addEventListener('click', () => {
        this.markAsUncontacted(btn.dataset.jamaahId)
      })
    })
  }
}
