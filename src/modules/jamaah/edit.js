/**
 * Jamaah Edit View (T-10)
 * Pre-fill form with existing data, PATCH to API
 */
import api from '../../api/api.js'
import { showToast, formatDate } from '../../utils/helpers.js'

export default class JamaahEditView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.id = params.id
    this.jamaah = null
    this.pakets = []
    this.errors = {}
    this.isSubmitting = false
  }

  async mount(el) {
    this.el = el
    try {
      await Promise.all([this.loadJamaah(), this.loadPakets()])
      await this.render()
      this.attachEvents()
    } catch (err) {
      showToast('Gagal memuat data jamaah', 'error')
      this.el.innerHTML = '<p class="text-red-500">Gagal memuat data.</p>'
    }
  }

  async loadJamaah() {
    this.jamaah = await api.getJamaahById(this.id)
  }

  async loadPakets() {
    try {
      this.pakets = await api.getPaket({ status: 'aktif' })
    } catch (e) {
      this.pakets = []
    }
  }

  async render() {
    const j = this.jamaah
    const e = this.errors

    this.el.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center gap-4">
          <a href="#/jamaah/${this.id}" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Edit Jamaah</h2>
            <p class="text-gray-500 text-sm">${j.noJamaah} - ${j.nama}</p>
          </div>
        </div>

        <form id="edit-form" class="card p-6 space-y-6">
          <!-- Tab Navigation -->
          <div class="border-b border-gray-100">
            <nav class="flex gap-4 -mb-px">
              <button type="button" class="tab-btn py-2 px-1 text-sm font-medium border-b-2 border-primary-500 text-primary-600" data-tab="personal">Data Pribadi</button>
              <button type="button" class="tab-btn py-2 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="contact">Kontak</button>
              <button type="button" class="tab-btn py-2 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="package">Paket</button>
              <button type="button" class="tab-btn py-2 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="admin">Admin</button>
            </nav>
          </div>

          <!-- Tab: Personal -->
          <div class="tab-content" id="tab-personal">
            <h3 class="font-semibold text-gray-800 mb-4">Data Pribadi</h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Nama Lengkap *</label>
                <input type="text" id="nama" class="form-input ${e.nama ? 'border-red-500' : ''}" value="${j.nama || ''}" required />
                ${e.nama ? `<p class="text-red-500 text-xs mt-1">${e.nama}</p>` : ''}
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">NIK / No. KTP *</label>
                  <input type="text" id="nik" class="form-input ${e.nik ? 'border-red-500' : ''}" maxlength="16" value="${j.nik || ''}" required />
                  ${e.nik ? `<p class="text-red-500 text-xs mt-1">${e.nik}</p>` : ''}
                </div>
                <div>
                  <label class="form-label">Tempat Lahir *</label>
                  <input type="text" id="tempatLahir" class="form-input ${e.tempatLahir ? 'border-red-500' : ''}" value="${j.tempatLahir || ''}" required />
                  ${e.tempatLahir ? `<p class="text-red-500 text-xs mt-1">${e.tempatLahir}</p>` : ''}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Tanggal Lahir *</label>
                  <input type="date" id="tanggalLahir" class="form-input ${e.tanggalLahir ? 'border-red-500' : ''}" value="${j.tanggalLahir || ''}" required />
                  ${e.tanggalLahir ? `<p class="text-red-500 text-xs mt-1">${e.tanggalLahir}</p>` : ''}
                </div>
                <div>
                  <label class="form-label">Jenis Kelamin *</label>
                  <select id="jenisKelamin" class="form-select ${e.jenisKelamin ? 'border-red-500' : ''}" required>
                    <option value="">Pilih</option>
                    <option value="Laki-laki" ${j.jenisKelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                    <option value="Perempuan" ${j.jenisKelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                  </select>
                  ${e.jenisKelamin ? `<p class="text-red-500 text-xs mt-1">${e.jenisKelamin}</p>` : ''}
                </div>
              </div>
              <div>
                <label class="form-label">Alamat Lengkap *</label>
                <textarea id="alamat" class="form-textarea ${e.alamat ? 'border-red-500' : ''}" rows="2">${j.alamat || ''}</textarea>
                ${e.alamat ? `<p class="text-red-500 text-xs mt-1">${e.alamat}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Tab: Contact -->
          <div class="tab-content hidden" id="tab-contact">
            <h3 class="font-semibold text-gray-800 mb-4">Kontak</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">No. HP *</label>
                  <input type="tel" id="noHp" class="form-input ${e.noHp ? 'border-red-500' : ''}" value="${j.noHp || ''}" required />
                  ${e.noHp ? `<p class="text-red-500 text-xs mt-1">${e.noHp}</p>` : ''}
                </div>
                <div>
                  <label class="form-label">WhatsApp</label>
                  <input type="tel" id="whatsapp" class="form-input" value="${j.whatsapp || ''}" />
                </div>
              </div>
              <div>
                <label class="form-label">Email</label>
                <input type="email" id="email" class="form-input" value="${j.email || ''}" />
              </div>
              <div class="border-t border-gray-100 pt-4 mt-4">
                <p class="text-sm font-medium text-gray-700 mb-3">Kontak Darurat</p>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Nama</label>
                    <input type="text" id="kontakDarurat" class="form-input" value="${j.kontakDarurat || ''}" />
                  </div>
                  <div>
                    <label class="form-label">No. HP</label>
                    <input type="tel" id="hpDarurat" class="form-input" value="${j.hpDarurat || ''}" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Package -->
          <div class="tab-content hidden" id="tab-package">
            <h3 class="font-semibold text-gray-800 mb-4">Paket</h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Paket *</label>
                <select id="paketId" class="form-select ${e.paketId ? 'border-red-500' : ''}" required>
                  <option value="">Pilih Paket</option>
                  ${this.pakets.map(p => `<option value="${p.id}" ${j.paketId === p.id ? 'selected' : ''}>${p.nama} - ${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p.harga)}</option>`).join('')}
                </select>
                ${e.paketId ? `<p class="text-red-500 text-xs mt-1">${e.paketId}</p>` : ''}
              </div>
              <div>
                <label class="form-label">Tipe Kamar *</label>
                <select id="tipeKamar" class="form-select ${e.tipeKamar ? 'border-red-500' : ''}" required>
                  <option value="">Pilih</option>
                  <option value="sharing" ${j.tipeKamar === 'sharing' ? 'selected' : ''}>Sharing (berdua)</option>
                  <option value="single" ${j.tipeKamar === 'single' ? 'selected' : ''}>Single (1 orang)</option>
                  <option value="mahram" ${j.tipeKamar === 'mahram' ? 'selected' : ''}>Mahram</option>
                </select>
                ${e.tipeKamar ? `<p class="text-red-500 text-xs mt-1">${e.tipeKamar}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Tab: Admin -->
          <div class="tab-content hidden" id="tab-admin">
            <h3 class="font-semibold text-gray-800 mb-4">Data Admin</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">No. Jamaah</label>
                  <input type="text" id="noJamaah" class="form-input bg-gray-100" value="${j.noJamaah || ''}" readonly />
                  <p class="text-xs text-gray-400 mt-1">Nomor jamaah tidak dapat diubah</p>
                </div>
                <div>
                  <label class="form-label">Status</label>
                  <select id="status" class="form-select">
                    <option value="pending" ${j.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="aktif" ${j.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                    <option value="cicilan" ${j.status === 'cicilan' ? 'selected' : ''}>Cicilan</option>
                    <option value="lunas" ${j.status === 'lunas' ? 'selected' : ''}>Lunas</option>
                    <option value="berangkat" ${j.status === 'berangkat' ? 'selected' : ''}>Berangkat</option>
                    <option value="batal" ${j.status === 'batal' ? 'selected' : ''}>Batal</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Tanggal Daftar</label>
                  <input type="text" class="form-input bg-gray-100" value="${formatDate(j.tanggalDaftar) || '-'}" readonly />
                </div>
                <div>
                  <label class="form-label">斋菊</label>
                  <input type="text" class="form-input bg-gray-100" value="${j.deletedAt ? formatDate(j.deletedAt) : 'Aktif'}" readonly />
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-between pt-4 border-t">
            <a href="#/jamaah/${this.id}" class="btn-secondary">Batal</a>
            <button type="submit" id="btn-submit" class="btn-primary" ${this.isSubmitting ? 'disabled' : ''}>
              ${this.isSubmitting ? '<svg class="w-4 h-4 inline animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    `
  }

  attachEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('border-primary-500', 'text-primary-600')
          b.classList.add('border-transparent', 'text-gray-500')
        })
        btn.classList.add('border-primary-500', 'text-primary-600')
        btn.classList.remove('border-transparent', 'text-gray-500')

        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'))
        document.getElementById(`tab-${tab}`)?.classList.remove('hidden')
      })
    })

    // Auto-fill WhatsApp
    const noHp = document.getElementById('noHp')
    const whatsapp = document.getElementById('whatsapp')
    noHp?.addEventListener('blur', () => {
      if (noHp.value && !whatsapp?.value) {
        whatsapp.value = noHp.value
      }
    })

    // Form submit
    document.getElementById('edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.submit()
    })
  }

  collectFormData() {
    return {
      nama: document.getElementById('nama')?.value.trim() || '',
      nik: document.getElementById('nik')?.value.trim() || '',
      tempatLahir: document.getElementById('tempatLahir')?.value.trim() || '',
      tanggalLahir: document.getElementById('tanggalLahir')?.value || '',
      jenisKelamin: document.getElementById('jenisKelamin')?.value || '',
      alamat: document.getElementById('alamat')?.value.trim() || '',
      noHp: document.getElementById('noHp')?.value.trim() || '',
      whatsapp: document.getElementById('whatsapp')?.value.trim() || '',
      email: document.getElementById('email')?.value.trim() || '',
      kontakDarurat: document.getElementById('kontakDarurat')?.value.trim() || '',
      hpDarurat: document.getElementById('hpDarurat')?.value.trim() || '',
      paketId: document.getElementById('paketId')?.value || '',
      tipeKamar: document.getElementById('tipeKamar')?.value || '',
      status: document.getElementById('status')?.value || 'pending',
    }
  }

  validate(data) {
    this.errors = {}

    if (!data.nama) this.errors.nama = 'Nama wajib diisi'
    else if (data.nama.length < 3) this.errors.nama = 'Nama minimal 3 karakter'

    if (!data.nik) this.errors.nik = 'NIK wajib diisi'
    else if (!/^\d{16}$/.test(data.nik)) this.errors.nik = 'NIK harus 16 digit angka'

    if (!data.tempatLahir) this.errors.tempatLahir = 'Tempat lahir wajib diisi'

    if (!data.tanggalLahir) this.errors.tanggalLahir = 'Tanggal lahir wajib diisi'

    if (!data.jenisKelamin) this.errors.jenisKelamin = 'Jenis kelamin wajib dipilih'

    if (!data.alamat) this.errors.alamat = 'Alamat wajib diisi'
    else if (data.alamat.length < 10) this.errors.alamat = 'Alamat minimal 10 karakter'

    if (!data.noHp) this.errors.noHp = 'No. HP wajib diisi'
    else if (!/^[\d\s+()-]{10,15}$/.test(data.noHp)) this.errors.noHp = 'Format no. HP tidak valid'

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      this.errors.email = 'Format email tidak valid'
    }

    if (!data.paketId) this.errors.paketId = 'Paket wajib dipilih'
    if (!data.tipeKamar) this.errors.tipeKamar = 'Tipe kamar wajib dipilih'

    return Object.keys(this.errors).length === 0
  }

  async submit() {
    const data = this.collectFormData()

    if (!this.validate(data)) {
      showToast('Mohon perbaiki error pada form', 'warning')
      this.render()
      return
    }

    this.isSubmitting = true
    const btn = document.getElementById('btn-submit')
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<svg class="w-4 h-4 inline animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...'
    }

    try {
      await api.updateJamaah(this.id, data)
      showToast('Perubahan berhasil disimpan!', 'success')
      window.location.hash = `#/jamaah/${this.id}`
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
      this.isSubmitting = false
      if (btn) {
        btn.disabled = false
        btn.textContent = 'Simpan Perubahan'
      }
    }
  }
}
