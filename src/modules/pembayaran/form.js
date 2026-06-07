/**
 * Pembayaran Form View (T-20) - Input payment
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PembayaranFormView {
  constructor({ params, query } = {}) {
    this.params = params
    this.jamaahId = params?.id || query?.jamaahId
    this.promoCode = query?.promo || ''
    this.data = {}
    this.selectedJamaah = null
    this.selectedPaket = null
    this.promoDiskon = 0
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [jamaahs, pakets, pembayarans, promos] = await Promise.all([
        api.getJamaah(),
        api.getPaket(),
        api.getPembayaran(),
        api.getPromo(),
      ])

      this.allJamaahs = jamaahs.filter(j => !j.deletedAt)
      this.allPakets = pakets
      this.allPembayarans = pembayarans
      this.allPromos = promos

      // Pre-select if passed via params
      if (this.jamaahId) {
        this.selectedJamaah = this.allJamaahs.find(j => j.id === this.jamaahId)
        if (this.selectedJamaah) {
          this.selectedPaket = this.allPakets.find(p => p.id === this.selectedJamaah.paketId)
          this.data.pembayaran = this.allPembayarans.find(b => b.jamaahId === this.jamaahId)
        }
      }

      this.render()
      this.attachEvents()

      // Apply promo if passed
      if (this.promoCode) {
        this.applyPromo(this.promoCode)
      }
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  render() {
    const today = new Date().toISOString().split('T')[0]

    this.el.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center gap-4">
          <a href="#/pembayaran" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Input Pembayaran</h2>
            <p class="text-gray-500 text-sm">Catat pembayaran jama'ah</p>
          </div>
        </div>

        <!-- Jamaah Selection -->
        <div class="card p-6 space-y-4">
          <h3 class="font-semibold text-gray-800 border-b pb-2">Pilih Jamaah</h3>

          <div>
            <label class="form-label">Cari Jamaah *</label>
            <div class="relative">
              <input type="text" id="jamaah-search" class="form-input" placeholder="Ketik nama atau nomor jama'ah..." value="${this.selectedJamaah?.nama || ''}" autocomplete="off" />
              <input type="hidden" id="jamaah-id" value="${this.selectedJamaah?.id || ''}" />
              <div id="jamaah-dropdown" class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto">
                ${this.allJamaahs.map(j => {
                  const byr = this.allPembayarans.find(b => b.jamaahId === j.id)
                  return `
                    <div class="jamaah-option px-4 py-3 hover:bg-primary-50 cursor-pointer ${this.selectedJamaah?.id === j.id ? 'bg-primary-50' : ''}" data-id="${j.id}">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="font-medium text-gray-900">${j.nama}</p>
                          <p class="text-xs text-gray-400">${j.noJamaah || ''} - ${j.paketId || ''}</p>
                        </div>
                        ${byr ? `<span class="badge ${byr.status === 'lunas' ? 'badge-success' : byr.status === 'cicilan' ? 'badge-info' : 'badge-warning'}">${byr.status}</span>` : ''}
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info (shown after selection) -->
        <div id="payment-info-section" class="${!this.selectedJamaah ? 'hidden' : ''}">
          <!-- Summary Card -->
          <div class="card p-6 mb-4">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                ${(this.selectedJamaah?.nama || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="font-semibold text-gray-900">${this.selectedJamaah?.nama || '-'}</p>
                <p class="text-sm text-gray-500">${this.selectedJamaah?.noJamaah || ''} - ${this.selectedPaket?.nama || ''}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500">Harga Paket</p>
                <p class="font-bold text-gray-900" id="harga-paket">${formatRupiah(this.selectedPaket?.harga || 0)}</p>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <p class="text-xs text-gray-500">Sudah Bayar</p>
                <p class="font-bold text-green-600" id="sudah-bayar">${formatRupiah(this.data.pembayaran?.totalBayar || 0)}</p>
              </div>
              <div class="text-center p-3 bg-red-50 rounded-lg">
                <p class="text-xs text-gray-500">Sisa Tagihan</p>
                <p class="font-bold text-red-600" id="sisa-tagihan">${formatRupiah(this.data.pembayaran?.sisa || this.selectedPaket?.harga || 0)}</p>
              </div>
            </div>
          </div>

          <!-- Promo Code -->
          <div class="card p-6 mb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-800">Kode Promo</h3>
              <button type="button" id="btn-apply-promo" class="btn-secondary text-sm">Gunakan Promo</button>
            </div>
            <div id="promo-applied" class="${this.promoDiskon > 0 ? '' : 'hidden'}">
              <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p class="font-medium text-green-800" id="promo-code-display">${this.promoCode || ''}</p>
                  <p class="text-xs text-green-600">Diskon: ${formatRupiah(this.promoDiskon)}</p>
                </div>
                <button type="button" id="btn-remove-promo" class="text-red-500 hover:text-red-700">×</button>
              </div>
            </div>
          </div>

          <!-- Payment Form -->
          <form id="payment-form" class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Detail Pembayaran</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Nominal *</label>
                <input type="number" id="nominal" class="form-input ${this.errors?.nominal ? 'border-red-500' : ''}" placeholder="5000000" min="1000" required />
                ${this.errors?.nominal ? `<p class="text-red-500 text-xs mt-1">${this.errors.nominal}</p>` : ''}
              </div>
              <div>
                <label class="form-label">Tanggal Bayar *</label>
                <input type="date" id="tanggalBayar" class="form-input" value="${today}" required />
              </div>
            </div>

            <div>
              <label class="form-label">Metode Pembayaran *</label>
              <select id="metode" class="form-select" required>
                <option value="transfer">Transfer Bank</option>
                <option value="tunai">Tunai</option>
                <option value="qris">QRIS</option>
              </select>
            </div>

            <div>
              <label class="form-label">Nomor Referensi</label>
              <input type="text" id="referensi" class="form-input" placeholder="TRF-XXX-BCA" />
            </div>

            <div>
              <label class="form-label">Catatan</label>
              <textarea id="catatan" class="form-textarea" rows="2" placeholder="Catatan tambahan..."></textarea>
            </div>

            <div class="bg-primary-50 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Sisa Tagihan:</span>
                <span class="font-bold text-gray-900" id="final-sisa">${formatRupiah(this.getSisaTagihan())}</span>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span class="text-gray-600">Diskon:</span>
                <span class="font-bold text-green-600">-${formatRupiah(this.promoDiskon)}</span>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <a href="#/pembayaran" class="btn-secondary">Batal</a>
              <button type="submit" class="btn-primary">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Simpan Pembayaran
              </button>
            </div>
          </form>
        </div>
      </div>
    `
  }

  getSisaTagihan() {
    const harga = this.selectedPaket?.harga || 0
    const sudahBayar = this.data.pembayaran?.totalBayar || 0
    const afterDiscount = Math.max(0, harga - sudahBayar - this.promoDiskon)
    return afterDiscount
  }

  attachEvents() {
    // Jamaah search dropdown
    const searchInput = document.getElementById('jamaah-search')
    const dropdown = document.getElementById('jamaah-dropdown')

    searchInput?.addEventListener('focus', () => {
      dropdown?.classList.remove('hidden')
    })

    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase()
      document.querySelectorAll('.jamaah-option').forEach(opt => {
        const name = opt.querySelector('p.font-medium')?.textContent.toLowerCase() || ''
        const noJamaah = opt.querySelector('p.text-xs')?.textContent.toLowerCase() || ''
        opt.classList.toggle('hidden', !name.includes(query) && !noJamaah.includes(query))
      })
      dropdown?.classList.remove('hidden')
    })

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#jamaah-search') && !e.target.closest('#jamaah-dropdown')) {
        dropdown?.classList.add('hidden')
      }
    })

    document.querySelectorAll('.jamaah-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const id = opt.dataset.id
        this.selectJamaah(id)
      })
    })

    // Payment form
    document.getElementById('payment-form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.submit()
    })

    // Promo buttons
    document.getElementById('btn-apply-promo')?.addEventListener('click', () => {
      const code = prompt('Masukkan kode promo:')
      if (code) this.applyPromo(code)
    })

    document.getElementById('btn-remove-promo')?.addEventListener('click', () => {
      this.promoDiskon = 0
      this.promoCode = ''
      this.updateSisaTagihan()
      document.getElementById('promo-applied')?.classList.add('hidden')
    })
  }

  selectJamaah(jamaahId) {
    this.selectedJamaah = this.allJamaahs.find(j => j.id === jamaahId)
    this.selectedPaket = this.allPakets.find(p => p.id === this.selectedJamaah?.paketId)
    this.data.pembayaran = this.allPembayarans.find(b => b.jamaahId === jamaahId)

    // Update UI
    document.getElementById('jamaah-search').value = this.selectedJamaah?.nama || ''
    document.getElementById('jamaah-id').value = jamaahId
    document.getElementById('jamaah-dropdown')?.classList.add('hidden')
    document.getElementById('payment-info-section')?.classList.remove('hidden')

    // Update summary
    document.getElementById('harga-paket').textContent = formatRupiah(this.selectedPaket?.harga || 0)
    document.getElementById('sudah-bayar').textContent = formatRupiah(this.data.pembayaran?.totalBayar || 0)
    document.getElementById('sisa-tagihan').textContent = formatRupiah(this.getSisaTagihan())
    document.getElementById('final-sisa').textContent = formatRupiah(this.getSisaTagihan())
  }

  applyPromo(code) {
    const promo = this.allPromos?.find(p => p.kode.toUpperCase() === code.toUpperCase() && p.status === 'aktif')
    if (!promo) {
      showToast('Kode promo tidak valid atau sudah kadaluarsa', 'error')
      return
    }

    if (promo.terpakai >= promo.batasPenggunaan) {
      showToast('Kode promo sudah habis digunakan', 'error')
      return
    }

    if (new Date(promo.expiredAt) < new Date()) {
      showToast('Kode promo sudah kadaluarsa', 'error')
      return
    }

    this.promoCode = promo.kode

    if (promo.tipe === 'persen') {
      this.promoDiskon = Math.min(
        (promo.nilai / 100) * this.selectedPaket.harga,
        promo.maxDiskon || Infinity
      )
    } else {
      this.promoDiskon = promo.nilai
    }

    this.updateSisaTagihan()
    document.getElementById('promo-applied')?.classList.remove('hidden')
    document.getElementById('promo-code-display').textContent = promo.kode
    document.querySelector('#promo-applied .text-green-600').textContent = `Diskon: ${formatRupiah(this.promoDiskon)}`
    showToast(`Promo "${promo.kode}" diterapkan!`, 'success')
  }

  updateSisaTagihan() {
    const sisa = this.getSisaTagihan()
    document.getElementById('sisa-tagihan').textContent = formatRupiah(sisa)
    document.getElementById('final-sisa').textContent = formatRupiah(sisa)
  }

  async submit() {
    const nominal = parseInt(document.getElementById('nominal')?.value) || 0
    const sisa = this.getSisaTagihan()

    this.errors = {}

    if (!nominal || nominal <= 0) {
      this.errors.nominal = 'Nominal harus lebih dari 0'
    }
    if (nominal > sisa) {
      this.errors.nominal = `Nominal tidak boleh melebihi sisa tagihan (${formatRupiah(sisa)})`
    }

    if (Object.keys(this.errors).length > 0) {
      showToast('Mohon perbaiki error pada form', 'warning')
      this.render()
      this.attachEvents()
      return
    }

    const btn = document.querySelector('button[type="submit"]')
    if (!btn) return
    btn.disabled = true
    btn.innerHTML = `<svg class="w-4 h-4 inline animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...`

    try {
      // Create transaksi
      const transaksi = {
        id: `T${Date.now()}`,
        jamaahId: this.selectedJamaah.id,
        paketId: this.selectedPaket.id,
        tanggal: document.getElementById('tanggalBayar').value,
        nominal,
        metode: document.getElementById('metode').value,
        referensi: document.getElementById('referensi').value || '',
        catatan: document.getElementById('catatan').value || '',
        status: 'lunas',
      }
      await api.createTransaksi(transaksi)

      // Update pembayaran
      const newBayar = (this.data.pembayaran?.totalBayar || 0) + nominal
      const newSisa = Math.max(0, this.selectedPaket.harga - newBayar - this.promoDiskon)
      const newStatus = newSisa === 0 ? 'lunas' : 'cicilan'

      if (this.data.pembayaran) {
        await api.updatePembayaran(this.data.pembayaran.id, {
          totalBayar: newBayar,
          sisa: newSisa,
          status: newStatus,
        })
      } else {
        await api.createPembayaran({
          id: `BYR${Date.now()}`,
          jamaahId: this.selectedJamaah.id,
          paketId: this.selectedPaket.id,
          totalTagihan: this.selectedPaket.harga,
          totalBayar: newBayar,
          sisa: newSisa,
          status: newStatus,
        })
      }

      showToast('Pembayaran berhasil dicatat!', 'success')
      window.location.hash = '#/pembayaran'
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
      btn.disabled = false
      btn.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Simpan Pembayaran`
    }
  }
}
