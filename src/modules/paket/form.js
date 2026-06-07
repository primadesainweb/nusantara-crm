/**
 * Paket Form View (T-18) - Create/Edit Paket
 */
import api from '../../api/api.js'
import { showToast, formatRupiah } from '../../utils/helpers.js'
import { generateId } from '../../utils/helpers.js'

const DEFAULT_FASILITAS = [
  'Tiket Pesawat',
  'Hotel',
  'Makan 3x Sehari',
  'Visa',
  'Ziarah',
  'Pendamping Ibadah',
  'Transportasi',
  'City Tour',
  "Mabit di Tan'im",
  'Armuzna',
]

export default class PaketFormView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.isEdit = !!params?.id
    this.paketId = params?.id
    this.data = {}
    this.errors = {}
    this.selectedFasilitas = new Set()
    this.customFasilitas = []
  }

  async mount(el) {
    this.el = el
    if (this.isEdit) {
      await this.loadData()
    }
    this.render()
  }

  async loadData() {
    try {
      const paket = await api.getPaketById(this.paketId)
      this.data = { ...paket }
      this.selectedFasilitas = new Set(paket.fasilitas || [])
      // Extract custom fasilitas (not in defaults)
      this.customFasilitas = (paket.fasilitas || []).filter(f => !DEFAULT_FASILITAS.includes(f))
    } catch (e) {
      showToast('Gagal memuat data paket', 'error')
    }
  }

  render() {
    this.el.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="flex items-center gap-4">
          <a href="#/paket" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">${this.isEdit ? 'Edit Paket' : 'Paket Baru'}</h2>
            <p class="text-gray-500 text-sm">${this.isEdit ? 'Edit detail paket perjalanan' : 'Tambah paket perjalanan umroh/haji'}</p>
          </div>
        </div>

        <form id="paket-form" class="space-y-6">
          <!-- Basic Info -->
          <div class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Informasi Dasar</h3>

            <div>
              <label class="form-label">Nama Paket *</label>
              <input type="text" id="nama" class="form-input ${this.errors.nama ? 'border-red-500' : ''}" placeholder="Contoh: Umroh Reguler 2024" value="${this.data.nama || ''}" required />
              ${this.errors.nama ? `<p class="text-red-500 text-xs mt-1">${this.errors.nama}</p>` : ''}
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Jenis *</label>
                <select id="jenis" class="form-select ${this.errors.jenis ? 'border-red-500' : ''}" required>
                  <option value="">Pilih Jenis</option>
                  <option value="Umroh" ${this.data.jenis === 'Umroh' ? 'selected' : ''}>Umroh</option>
                  <option value="Haji" ${this.data.jenis === 'Haji' ? 'selected' : ''}>Haji</option>
                </select>
                ${this.errors.jenis ? `<p class="text-red-500 text-xs mt-1">${this.errors.jenis}</p>` : ''}
              </div>
              <div>
                <label class="form-label">Status</label>
                <select id="status" class="form-select">
                  <option value="aktif" ${this.data.status === 'aktif' || !this.data.status ? 'selected' : ''}>Aktif</option>
                  <option value="hampir-penuh" ${this.data.status === 'hampir-penuh' ? 'selected' : ''}>Hampir Penuh</option>
                  <option value="berangkat" ${this.data.status === 'berangkat' ? 'selected' : ''}>Berangkat</option>
                  <option value="selesai" ${this.data.status === 'selesai' ? 'selected' : ''}>Selesai</option>
                  <option value="batal" ${this.data.status === 'batal' ? 'selected' : ''}>Batal</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Tanggal Berangkat *</label>
                <input type="date" id="tanggalBerangkat" class="form-input ${this.errors.tanggalBerangkat ? 'border-red-500' : ''}" value="${this.data.tanggalBerangkat || ''}" required />
                ${this.errors.tanggalBerangkat ? `<p class="text-red-500 text-xs mt-1">${this.errors.tanggalBerangkat}</p>` : ''}
              </div>
              <div>
                <label class="form-label">Tanggal Kembali *</label>
                <input type="date" id="tanggalKembali" class="form-input ${this.errors.tanggalKembali ? 'border-red-500' : ''}" value="${this.data.tanggalKembali || ''}" required />
                ${this.errors.tanggalKembali ? `<p class="text-red-500 text-xs mt-1">${this.errors.tanggalKembali}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Kuota & Harga -->
          <div class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Kuota & Harga</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Kuota *</label>
                <input type="number" id="kuota" class="form-input ${this.errors.kuota ? 'border-red-500' : ''}" placeholder="40" min="1" value="${this.data.kuota || ''}" required />
                ${this.errors.kuota ? `<p class="text-red-500 text-xs mt-1">${this.errors.kuota}</p>` : ''}
              </div>
              <div>
                <label class="form-label">Harga per Jamaah (Rp) *</label>
                <input type="number" id="harga" class="form-input ${this.errors.harga ? 'border-red-500' : ''}" placeholder="26500000" min="0" step="1000" value="${this.data.harga || ''}" required />
                ${this.errors.harga ? `<p class="text-red-500 text-xs mt-1">${this.errors.harga}</p>` : ''}
              </div>
            </div>

            <div class="bg-primary-50 rounded-lg p-3">
              <p class="text-sm text-primary-700">Total Target: <strong>${formatRupiah((parseInt(this.data.kuota) || 0) * (parseInt(this.data.harga) || 0))}</strong></p>
            </div>
          </div>

          <!-- Hotel & Maskapai -->
          <div class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Hotel & Maskapai</h3>

            <div>
              <label class="form-label">Nama Hotel *</label>
              <input type="text" id="hotel" class="form-input" placeholder="Al Masadion Hotel" value="${this.data.hotel || ''}" required />
            </div>

            <div>
              <label class="form-label">Bintang Hotel *</label>
              <div class="flex items-center gap-3 mt-2">
                ${[1, 2, 3, 4, 5].map(n => `
                  <label class="cursor-pointer">
                    <input type="radio" name="bintangHotel" value="${n}" class="sr-only peer" ${(this.data.bintangHotel || 3) === n ? 'checked' : ''} />
                    <div class="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                      ${'★'.repeat(n)}
                    </div>
                  </label>
                `).join('')}
                <span class="text-xs text-gray-400 ml-2">${this.data.bintangHotel || 3} Bintang</span>
              </div>
            </div>

            <div>
              <label class="form-label">Maskapai *</label>
              <input type="text" id="maskapai" class="form-input" placeholder="Garuda Indonesia" value="${this.data.maskapai || ''}" required />
            </div>
          </div>

          <!-- Fasilitas -->
          <div class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Fasilitas</h3>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              ${DEFAULT_FASILITAS.map(f => `
                <label class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" class="fasilitas-checkbox rounded" value="${f}" ${this.selectedFasilitas.has(f) ? 'checked' : ''} />
                  <span class="text-sm">${f}</span>
                </label>
              `).join('')}
            </div>

            <div>
              <label class="form-label">Fasilitas Tambahan (Custom)</label>
              <div class="flex gap-2 mb-2">
                <input type="text" id="custom-fasilitas" class="form-input flex-1" placeholder="Ketik fasilitas tambahan..." />
                <button type="button" id="btn-add-fasilitas" class="btn-secondary">Tambah</button>
              </div>
              <div id="custom-fasilitas-list" class="flex flex-wrap gap-2">
                ${this.customFasilitas.map(f => `
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                    ${f}
                    <button type="button" class="remove-custom-fasilitas text-red-500 hover:text-red-700" data-value="${f}">×</button>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Deskripsi -->
          <div class="card p-6 space-y-4">
            <h3 class="font-semibold text-gray-800 border-b pb-2">Deskripsi</h3>
            <div>
              <label class="form-label">Deskripsi Paket</label>
              <textarea id="deskripsi" class="form-textarea" rows="4" placeholder="Jelaskan detail paket perjalanan...">${this.data.deskripsi || ''}</textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <a href="#/paket" class="btn-secondary">Batal</a>
            <button type="submit" class="btn-primary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              ${this.isEdit ? 'Simpan Perubahan' : 'Buat Paket'}
            </button>
          </div>
        </form>
      </div>
    `

    this.attachEvents()
  }

  attachEvents() {
    // Form submit
    document.getElementById('paket-form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.submit()
    })

    // Custom fasilitas
    document.getElementById('btn-add-fasilitas')?.addEventListener('click', () => {
      const input = document.getElementById('custom-fasilitas')
      const value = input?.value.trim()
      if (value && !this.customFasilitas.includes(value)) {
        this.customFasilitas.push(value)
        this.selectedFasilitas.add(value)
        const list = document.getElementById('custom-fasilitas-list')
        if (list) {
          list.innerHTML += `
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
              ${value}
              <button type="button" class="remove-custom-fasilitas text-red-500 hover:text-red-700" data-value="${value}">×</button>
            </span>
          `
          // Add event listener to new remove button
          list.querySelector(`[data-value="${value}"]`)?.addEventListener('click', () => this.removeCustomFasilitas(value))
        }
        input.value = ''
      }
    })

    // Remove custom fasilitas
    document.querySelectorAll('.remove-custom-fasilitas').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value
        this.removeCustomFasilitas(value)
      })
    })

    // Star rating click
    document.querySelectorAll('input[name="bintangHotel"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('input[name="bintangHotel"] + div').forEach(el => {
          el.classList.remove('border-primary-500', 'bg-primary-50')
        })
        radio.nextElementSibling?.classList.add('border-primary-500', 'bg-primary-50')
      })
    })
  }

  removeCustomFasilitas(value) {
    this.customFasilitas = this.customFasilitas.filter(f => f !== value)
    this.selectedFasilitas.delete(value)
    document.querySelector(`[data-value="${value}"]`)?.parentElement?.remove()
  }

  collectData() {
    // Collect fasilitas
    const checkedFasilitas = [...document.querySelectorAll('.fasilitas-checkbox:checked')].map(cb => cb.value)
    const allFasilitas = [...new Set([...checkedFasilitas, ...this.customFasilitas])]

    // Get bintang hotel
    const bintangRadio = document.querySelector('input[name="bintangHotel"]:checked')
    const bintang = bintangRadio ? parseInt(bintangRadio.value) : 3

    return {
      nama: document.getElementById('nama')?.value.trim() || '',
      jenis: document.getElementById('jenis')?.value || '',
      tanggalBerangkat: document.getElementById('tanggalBerangkat')?.value || '',
      tanggalKembali: document.getElementById('tanggalKembali')?.value || '',
      kuota: parseInt(document.getElementById('kuota')?.value) || 0,
      harga: parseInt(document.getElementById('harga')?.value) || 0,
      hotel: document.getElementById('hotel')?.value.trim() || '',
      bintangHotel: bintang,
      maskapai: document.getElementById('maskapai')?.value.trim() || '',
      fasilitas: allFasilitas,
      deskripsi: document.getElementById('deskripsi')?.value.trim() || '',
      status: document.getElementById('status')?.value || 'aktif',
      terisi: this.data.terisi || 0,
    }
  }

  validate(data) {
    this.errors = {}

    if (!data.nama) this.errors.nama = 'Nama paket wajib diisi'
    if (!data.jenis) this.errors.jenis = 'Jenis wajib dipilih'
    if (!data.tanggalBerangkat) this.errors.tanggalBerangkat = 'Tanggal berangkat wajib diisi'
    if (!data.tanggalKembali) this.errors.tanggalKembali = 'Tanggal kembali wajib diisi'

    if (data.tanggalBerangkat && data.tanggalKembali) {
      const start = new Date(data.tanggalBerangkat)
      const end = new Date(data.tanggalKembali)
      if (end <= start) {
        this.errors.tanggalKembali = 'Tanggal kembali harus setelah tanggal berangkat'
      }
    }

    if (!data.kuota || data.kuota <= 0) this.errors.kuota = 'Kuota harus lebih dari 0'
    if (!data.harga || data.harga <= 0) this.errors.harga = 'Harga harus lebih dari 0'

    return Object.keys(this.errors).length === 0
  }

  async submit() {
    const data = this.collectData()

    if (!this.validate(data)) {
      showToast('Mohon perbaiki error pada form', 'warning')
      this.render()
      return
    }

    const btn = document.querySelector('button[type="submit"]')
    if (!btn) return
    btn.disabled = true
    btn.innerHTML = `<svg class="w-4 h-4 inline animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...`

    try {
      if (this.isEdit) {
        await api.updatePaket(this.paketId, data)
        showToast('Paket berhasil diperbarui!', 'success')
      } else {
        await api.createPaket({ ...data, id: `PK${String(Date.now()).slice(-4)}` })
        showToast('Paket berhasil dibuat!', 'success')
      }
      window.location.hash = '#/paket'
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
      btn.disabled = false
      btn.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${this.isEdit ? 'Simpan Perubahan' : 'Buat Paket'}`
    }
  }
}
