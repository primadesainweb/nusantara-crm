/**
 * Jamaah Detail View (T-09)
 */
import api from '../../api/api.js'
import { showToast, formatDate, formatRupiah, statusBadge, getInitials, getAvatarColor } from '../../utils/helpers.js'

export default class JamaahDetailView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.id = params.id
  }

  async mount(el) {
    this.el = el
    await this.load()
  }

  async load() {
    try {
      const [jamaah, paket, pembayaran, dokumen] = await Promise.all([
        api.getJamaahById(this.id),
        api.getPaket(),
        api.getPembayaran({ jamaahId: this.id }),
        api.getDokumen({ jamaatId: this.id }),
      ])
      this.jamaah = jamaah
      this.paket = paket.find(p => p.id === jamaah.paketId)
      this.pembayaran = pembayaran[0] || {}
      this.dokumen = dokumen
      await this.render()
    } catch (err) {
      showToast('Gagal memuat data jamaah', 'error')
      this.el.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>'
    }
  }

  async render() {
    const j = this.jamaah
    const initials = getInitials(j.nama)
    const avatarCls = getAvatarColor(j.nama)

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Back + Header -->
        <div class="flex items-center gap-4">
          <a href="#/jamaah" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div class="flex-1">
            <h2 class="text-2xl font-heading font-bold text-gray-900">${j.nama}</h2>
            <p class="text-gray-500 text-sm">${j.noJamaah} - ${this.paket?.nama || '-'}</p>
          </div>
          <div class="flex gap-2">
            <a href="#/jamaah/${j.id}/edit" class="btn-secondary">Edit</a>
            <button id="btn-wa" class="btn-ghost text-green-600" data-wa="${j.whatsapp}">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
          </div>
        </div>

        <!-- Profile Card -->
        <div class="card p-6">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full ${avatarCls} flex items-center justify-center text-xl font-bold shrink-0">
              ${initials}
            </div>
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Status</p>
                <div class="mt-1">${statusBadge(j.status)}</div>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">NIK</p>
                <p class="text-sm font-medium mt-1">${j.nik}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">No. HP</p>
                <p class="text-sm font-medium mt-1">${j.noHp}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                <p class="text-sm font-medium mt-1">${j.email || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Alamat</p>
                <p class="text-sm font-medium mt-1">${j.alamat || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wide">Tanggal Lahir</p>
                <p class="text-sm font-medium mt-1">${formatDate(j.tanggalLahir, 'DD Mon YYYY')}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="card overflow-hidden">
          <div class="border-b border-gray-100 px-4">
            <nav class="flex gap-4 -mb-px">
              <button class="tab-btn py-3 px-1 text-sm font-medium border-b-2 border-primary-500 text-primary-600" data-tab="pembayaran">Pembayaran</button>
              <button class="tab-btn py-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="dokumen">Dokumen</button>
              <button class="tab-btn py-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="catatan">Catatan</button>
            </nav>
          </div>

          <!-- Tab: Pembayaran -->
          <div class="tab-content p-4" id="tab-pembayaran">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-50 rounded-lg p-4 text-center">
                <p class="text-xs text-gray-500">Total Tagihan</p>
                <p class="text-lg font-bold text-gray-900 mt-1">${formatRupiah(this.pembayaran.totalTagihan)}</p>
              </div>
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <p class="text-xs text-gray-500">Sudah Bayar</p>
                <p class="text-lg font-bold text-green-700 mt-1">${formatRupiah(this.pembayaran.totalBayar)}</p>
              </div>
              <div class="bg-red-50 rounded-lg p-4 text-center">
                <p class="text-xs text-gray-500">Sisa</p>
                <p class="text-lg font-bold text-red-700 mt-1">${formatRupiah(this.pembayaran.sisa)}</p>
              </div>
            </div>
            ${this.pembayaran.totalTagihan ? `
              <div class="mb-4">
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" style="width:${Math.round((this.pembayaran.totalBayar/this.pembayaran.totalTagihan)*100)}%"></div>
                </div>
              </div>
            ` : ''}
            <p class="text-sm text-gray-500">Riwayat cicilan dan pembayaran lihat di menu Pembayaran.</p>
          </div>

          <!-- Tab: Dokumen -->
          <div class="tab-content p-4 hidden" id="tab-dokumen">
            <p class="text-sm text-gray-500">Dokumen jamaah - dalam pengembangan.</p>
          </div>

          <!-- Tab: Catatan -->
          <div class="tab-content p-4 hidden" id="tab-catatan">
            <p class="text-sm text-gray-500">Riwayat aktivitas dan catatan - dalam pengembangan.</p>
          </div>
        </div>
      </div>
    `

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('border-primary-500', 'text-primary-600')
          b.classList.add('border-transparent', 'text-gray-500')
        })
        btn.classList.add('border-primary-500', 'text-primary-600')
        btn.classList.remove('border-transparent', 'text-gray-500')

        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
        document.getElementById(`tab-${btn.dataset.tab}`)?.classList.remove('hidden')
      })
    })

    // WhatsApp button
    document.getElementById('btn-wa')?.addEventListener('click', (e) => {
      const wa = e.currentTarget.dataset.wa
      if (wa) window.open(`https://wa.me/${wa.replace(/^0/, '62')}`, '_blank')
    })
  }
}
