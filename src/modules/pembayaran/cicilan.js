/**
 * Cicilan View (T-22) - Auto-generate installment schedule
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'
import { daysFromNow } from '../../utils/date.js'

export default class CicilanView {
  constructor({ params, query } = {}) {
    this.params = params
    this.pembayaranId = params?.id
    this.schedule = []
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

      // Calculate paid amounts
      this.paidAmount = this.transaksis.reduce((s, t) => s + (t.status === 'lunas' ? t.nominal : 0), 0)

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

    const remaining = p.sisa
    const today = new Date().toISOString().split('T')[0]

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#/pembayaran/${p.id}" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </a>
            </div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Jadwal Cicilan</h2>
            <p class="text-gray-500 text-sm">${j?.nama || '-'} - ${pk?.nama || '-'}</p>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Total Tagihan</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(p.totalTagihan)}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Sudah Dibayar</p>
            <p class="text-xl font-bold text-green-600">${formatRupiah(p.totalBayar)}</p>
          </div>
          <div class="card p-4">
            <p class="text-xs text-gray-500 mb-1">Sisa Tagihan</p>
            <p class="text-xl font-bold text-red-600">${formatRupiah(p.sisa)}</p>
          </div>
        </div>

        <!-- Generate Form -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Buat Jadwal Cicilan</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="form-label">DP Awal (Rp)</label>
              <input type="number" id="dp-awal" class="form-input" placeholder="5000000" min="0" value="${Math.min(5000000, remaining)}" />
            </div>
            <div>
              <label class="form-label">Jumlah Termin</label>
              <select id="jumlah-termin" class="form-select">
                <option value="3">3x Cicilan</option>
                <option value="4">4x Cicilan</option>
                <option value="6" selected>6x Cicilan</option>
                <option value="8">8x Cicilan</option>
              </select>
            </div>
            <div>
              <label class="form-label">Tanggal Mulai</label>
              <input type="date" id="tanggal-mulai" class="form-input" value="${today}" />
            </div>
            <div class="flex items-end">
              <button id="btn-generate" class="btn-primary w-full">
                Generate Jadwal
              </button>
            </div>
          </div>
        </div>

        <!-- Schedule Display -->
        <div id="schedule-section" class="${this.schedule.length === 0 ? 'hidden' : ''}">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800">Jadwal Pembayaran</h3>
              <button id="btn-send-reminder" class="btn-secondary text-sm">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Kirim Pengingat WA
              </button>
            </div>

            <!-- Visual Timeline -->
            <div class="mb-6">
              <div class="flex items-center gap-1 overflow-x-auto pb-2">
                ${this.schedule.map((s, i) => {
                  const isPaid = s.nominal <= this.getPaidForTerm(i)
                  const isOverdue = !isPaid && daysFromNow(s.tanggalJatuhTempo) < 0
                  const isNext = !isPaid && !isOverdue && !this.isPreviousTermPaid(i)

                  let bgColor = 'bg-gray-200'
                  if (isPaid) bgColor = 'bg-green-500'
                  else if (isOverdue) bgColor = 'bg-red-500'
                  else if (isNext) bgColor = 'bg-primary-500'

                  return `
                    <div class="flex-shrink-0 text-center min-w-[80px]">
                      <div class="w-12 h-12 mx-auto rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-lg">
                        ${isPaid ? '✓' : i + 1}
                      </div>
                      <p class="text-xs mt-1 font-medium">${formatDate(s.tanggalJatuhTempo, 'DD MMM')}</p>
                      <p class="text-xs text-gray-500">${formatRupiah(s.nominal)}</p>
                    </div>
                  `
                }).join('')}
              </div>
            </div>

            <!-- Table -->
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal Jatuh Tempo</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${this.schedule.map((s, i) => {
                  const isPaid = s.nominal <= this.getPaidForTerm(i)
                  const isOverdue = !isPaid && daysFromNow(s.tanggalJatuhTempo) < 0
                  const daysLeft = daysFromNow(s.tanggalJatuhTempo)

                  let statusLabel = 'Belum Bayar'
                  let statusClass = 'badge-warning'
                  if (isPaid) {
                    statusLabel = 'Lunas'
                    statusClass = 'badge-success'
                  } else if (isOverdue) {
                    statusLabel = `Terlambat ${Math.abs(daysLeft)} hari`
                    statusClass = 'badge-danger'
                  } else if (daysLeft <= 7) {
                    statusLabel = `${daysLeft} hari lagi`
                    statusClass = 'badge-info'
                  }

                  return `
                    <tr class="${isOverdue ? 'bg-red-50' : isNext ? 'bg-primary-50' : ''}">
                      <td>${i + 1}</td>
                      <td>${formatDate(s.tanggalJatuhTempo, 'DD MMMM YYYY')}</td>
                      <td class="font-medium">${formatRupiah(s.nominal)}</td>
                      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                      <td>
                        ${!isPaid ? `
                          <a href="#/pembayaran/form?jamaahId=${p.jamaahId}" class="btn-secondary text-xs py-1">Bayar</a>
                        ` : `
                          <span class="text-green-600 text-sm">✓ Lunas</span>
                        `}
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- No schedule yet -->
        <div id="empty-schedule" class="${this.schedule.length > 0 ? 'hidden' : ''}">
          <div class="card p-12 text-center">
            <div class="text-5xl mb-4">📅</div>
            <h3 class="font-semibold text-gray-800 mb-2">Belum Ada Jadwal Cicilan</h3>
            <p class="text-gray-500 text-sm mb-4">Atur jadwal cicilan untuk membantu jama'ah melunasi pembayarannya tepat waktu.</p>
          </div>
        </div>
      </div>
    `

    this.attachEvents()
  }

  attachEvents() {
    document.getElementById('btn-generate')?.addEventListener('click', () => this.generateSchedule())

    document.getElementById('btn-send-reminder')?.addEventListener('click', () => {
      const overdueTerms = this.schedule.filter((s, i) => {
        const isPaid = s.nominal <= this.getPaidForTerm(i)
        return !isPaid && daysFromNow(s.tanggalJatuhTempo) < 0
      })

      if (overdueTerms.length === 0) {
        showToast('Tidak ada cicilan yang terlambat', 'info')
        return
      }

      this.sendReminder()
    })
  }

  generateSchedule() {
    const dpAwal = parseInt(document.getElementById('dp-awal')?.value) || 0
    const jumlahTermin = parseInt(document.getElementById('jumlah-termin')?.value) || 6
    const tanggalMulai = document.getElementById('tanggal-mulai')?.value || new Date().toISOString().split('T')[0]

    const remaining = this.pembayaran.sisa - dpAwal
    if (remaining <= 0) {
      showToast('Sisa tagihan sudah lunas dengan DP', 'warning')
      return
    }

    const nominalPerTermin = Math.ceil(remaining / jumlahTermin)
    const startDate = new Date(tanggalMulai)

    this.schedule = []

    // DP as first entry
    if (dpAwal > 0) {
      this.schedule.push({
        termin: 0,
        nominal: dpAwal,
        tanggalJatuhTempo: tanggalMulai,
        status: 'dp',
      })
    }

    // Generate remaining terms (monthly)
    for (let i = 0; i < jumlahTermin; i++) {
      const termDate = new Date(startDate)
      termDate.setMonth(termDate.getMonth() + i + 1)

      this.schedule.push({
        termin: i + 1,
        nominal: nominalPerTermin,
        tanggalJatuhTempo: termDate.toISOString().split('T')[0],
        status: 'pending',
      })
    }

    document.getElementById('schedule-section')?.classList.remove('hidden')
    document.getElementById('empty-schedule')?.classList.add('hidden')

    // Re-render to show schedule
    this.render()
  }

  getPaidForTerm(termIndex) {
    // Simplified: just return 0 for unpaid terms
    // In real implementation, would track payments per termin
    return 0
  }

  isPreviousTermPaid(termIndex) {
    for (let i = 0; i < termIndex; i++) {
      if (this.getPaidForTerm(i) < this.schedule[i]?.nominal) {
        return false
      }
    }
    return true
  }

  sendReminder() {
    const j = this.jamaah
    if (!j?.whatsapp && !j?.noHp) {
      showToast('Nomor WhatsApp tidak ditemukan', 'error')
      return
    }

    const phone = j.whatsapp || j.noHp
    const name = j.nama
    const paketName = this.paket?.nama || ''

    const overdueTerms = this.schedule.filter((s, i) => {
      const isPaid = s.nominal <= this.getPaidForTerm(i)
      return !isPaid && daysFromNow(s.tanggalJatuhTempo) < 0
    })

    const totalOverdue = overdueTerms.reduce((s, t) => s + t.nominal, 0)

    const message = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nYth. Bpk/Ibu *${name}*\n\nDengan hormat, kami mengingatkan bahwa terdapat pembayaran cicilan yang sudah jatuh tempo untuk:\n\n📦 Paket: *${paketName}*\n💰 Total Tunggakan: *${formatRupiah(totalOverdue)}*\n\nMohon segera melakukan pembayaran agar proses keberangkatan tidak terganggu.\n\nTerima kasih atas perhatiannya.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh`
    )

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank')
    showToast('Membuka WhatsApp...', 'success')
  }
}
