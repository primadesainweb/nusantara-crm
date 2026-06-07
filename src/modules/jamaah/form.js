/**
 * Jamaah Form View (T-08) - Multi-step wizard with validation
 */
import api from '../../api/api.js'
import { showToast, formatDate } from '../../utils/helpers.js'

export default class JamaahFormView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.step = 1
    this.data = {}
    this.pakets = []
    this.errors = {}
  }

  async mount(el) {
    this.el = el
    await this.loadPakets()
    this.render()
  }

  async loadPakets() {
    try {
      this.pakets = await api.getPaket({ status: 'aktif' })
    } catch (e) {
      this.pakets = []
    }
  }

  render() {
    this.el.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center gap-4">
          <a href="#/jamaah" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Jamaah Baru</h2>
            <p class="text-gray-500 text-sm">Step ${this.step} dari 4</p>
          </div>
        </div>

        <!-- Stepper -->
        <div class="card p-4">
          <div class="flex items-center justify-between">
            ${[1,2,3,4].map(n => `
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${n < this.step ? 'bg-primary-500 text-white' : n === this.step ? 'bg-primary-100 text-primary-600 border-2 border-primary-500' : 'bg-gray-100 text-gray-400'}">
                  ${n < this.step ? '✓' : n}
                </div>
                <span class="text-xs font-medium ${n === this.step ? 'text-primary-600' : 'text-gray-400'} hidden sm:block">
                  ${['Data Pribadi','Kontak','Paket','Review'][n-1]}
                </span>
              </div>
              ${n < 4 ? '<div class="flex-1 h-0.5 mx-2 ' + (n < this.step ? 'bg-primary-500' : 'bg-gray-200') + '"></div>' : ''}
            `).join('')}
          </div>
        </div>

        <!-- Form -->
        <div class="card p-6" id="form-container">
          ${this.renderStepContent()}
        </div>
      </div>
    `

    this.attachFormEvents()
  }

  renderStepContent() {
    switch (this.step) {
      case 1: return this.step1HTML()
      case 2: return this.step2HTML()
      case 3: return this.step3HTML()
      case 4: return this.step4HTML()
      default: return ''
    }
  }

  step1HTML() {
    const e = this.errors || {}
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 1: Data Pribadi</h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">Nama Lengkap *</label>
          <input type="text" id="nama" class="form-input ${e.nama ? 'border-red-500' : ''}" placeholder="Nama sesuai KTP" value="${this.data.nama || ''}" required />
          ${e.nama ? `<p class="text-red-500 text-xs mt-1">${e.nama}</p>` : ''}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">NIK / No. KTP *</label>
            <input type="text" id="nik" class="form-input ${e.nik ? 'border-red-500' : ''}" placeholder="16 digit NIK" maxlength="16" value="${this.data.nik || ''}" required />
            ${e.nik ? `<p class="text-red-500 text-xs mt-1">${e.nik}</p>` : ''}
          </div>
          <div>
            <label class="form-label">Tempat Lahir *</label>
            <input type="text" id="tempatLahir" class="form-input ${e.tempatLahir ? 'border-red-500' : ''}" placeholder="Kota kelahiran" value="${this.data.tempatLahir || ''}" required />
            ${e.tempatLahir ? `<p class="text-red-500 text-xs mt-1">${e.tempatLahir}</p>` : ''}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Tanggal Lahir *</label>
            <input type="date" id="tanggalLahir" class="form-input ${e.tanggalLahir ? 'border-red-500' : ''}" value="${this.data.tanggalLahir || ''}" required />
            ${e.tanggalLahir ? `<p class="text-red-500 text-xs mt-1">${e.tanggalLahir}</p>` : ''}
          </div>
          <div>
            <label class="form-label">Jenis Kelamin *</label>
            <select id="jenisKelamin" class="form-select ${e.jenisKelamin ? 'border-red-500' : ''}" required>
              <option value="">Pilih</option>
              <option value="Laki-laki" ${this.data.jenisKelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
              <option value="Perempuan" ${this.data.jenisKelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
            </select>
            ${e.jenisKelamin ? `<p class="text-red-500 text-xs mt-1">${e.jenisKelamin}</p>` : ''}
          </div>
        </div>
        <div>
          <label class="form-label">Alamat Lengkap *</label>
          <textarea id="alamat" class="form-textarea ${e.alamat ? 'border-red-500' : ''}" rows="2" placeholder="Alamat sesuai KTP">${this.data.alamat || ''}</textarea>
          ${e.alamat ? `<p class="text-red-500 text-xs mt-1">${e.alamat}</p>` : ''}
        </div>
      </div>
      <div class="flex justify-between mt-6">
        <div></div>
        <button id="btn-next" class="btn-primary">
          Selanjutnya
          <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    `
  }

  step2HTML() {
    const e = this.errors || {}
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 2: Kontak</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">No. HP *</label>
            <input type="tel" id="noHp" class="form-input ${e.noHp ? 'border-red-500' : ''}" placeholder="08xxxxxxxxxx" value="${this.data.noHp || ''}" required />
            ${e.noHp ? `<p class="text-red-500 text-xs mt-1">${e.noHp}</p>` : ''}
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input type="tel" id="whatsapp" class="form-input" placeholder="Sama dengan HP jika sama" value="${this.data.whatsapp || ''}" />
          </div>
        </div>
        <div>
          <label class="form-label">Email</label>
          <input type="email" id="email" class="form-input" placeholder="email@example.com" value="${this.data.email || ''}" />
        </div>
        <div class="border-t border-gray-100 pt-4 mt-4">
          <p class="text-sm font-medium text-gray-700 mb-3">Kontak Darurat</p>
          <div class="space-y-3">
            <div>
              <label class="form-label">Nama</label>
              <input type="text" id="kontakDarurat" class="form-input" placeholder="Nama kontak darurat" value="${this.data.kontakDarurat || ''}" />
            </div>
            <div>
              <label class="form-label">No. HP</label>
              <input type="tel" id="hpDarurat" class="form-input" placeholder="08xxxxxxxxxx" value="${this.data.hpDarurat || ''}" />
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between mt-6">
        <button id="btn-prev" class="btn-secondary">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Kembali
        </button>
        <button id="btn-next" class="btn-primary">
          Selanjutnya
          <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    `
  }

  step3HTML() {
    const e = this.errors || {}
    const paketOptions = this.pakets.map(p =>
      `<option value="${p.id}" data-harga="${p.harga}" ${this.data.paketId === p.id ? 'selected' : ''}>${p.nama} - ${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p.harga)}</option>`
    ).join('')
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 3: Paket</h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">Paket *</label>
          <select id="paketId" class="form-select ${e.paketId ? 'border-red-500' : ''}" required>
            <option value="">Pilih Paket</option>
            ${paketOptions}
          </select>
          ${e.paketId ? `<p class="text-red-500 text-xs mt-1">${e.paketId}</p>` : ''}
        </div>
        <div>
          <label class="form-label">Tipe Kamar *</label>
          <select id="tipeKamar" class="form-select ${e.tipeKamar ? 'border-red-500' : ''}" required>
            <option value="">Pilih</option>
            <option value="sharing" ${this.data.tipeKamar === 'sharing' ? 'selected' : ''}>Sharing (berdua)</option>
            <option value="single" ${this.data.tipeKamar === 'single' ? 'selected' : ''}>Single (1 orang)</option>
            <option value="mahram" ${this.data.tipeKamar === 'mahram' ? 'selected' : ''}>Mahram</option>
          </select>
          ${e.tipeKamar ? `<p class="text-red-500 text-xs mt-1">${e.tipeKamar}</p>` : ''}
        </div>
      </div>
      <div class="flex justify-between mt-6">
        <button id="btn-prev" class="btn-secondary">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Kembali
        </button>
        <button id="btn-next" class="btn-primary">
          Review
          <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    `
  }

  step4HTML() {
    const paket = this.pakets.find(p => p.id === this.data.paketId)
    const paketName = paket ? paket.nama : '-'
    const paketHarga = paket ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(paket.harga) : '-'

    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 4: Review & Konfirmasi</h3>
      <div class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-600 mb-3">Data Pribadi</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">Nama:</span> ${this.data.nama || '-'}</div>
            <div><span class="text-gray-400">NIK:</span> ${this.data.nik || '-'}</div>
            <div><span class="text-gray-400">Tempat/Tgl Lahir:</span> ${this.data.tempatLahir || '-'}, ${formatDate(this.data.tanggalLahir) || '-'}</div>
            <div><span class="text-gray-400">Jenis Kelamin:</span> ${this.data.jenisKelamin || '-'}</div>
            <div class="col-span-2"><span class="text-gray-400">Alamat:</span> ${this.data.alamat || '-'}</div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-600 mb-3">Kontak</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">No. HP:</span> ${this.data.noHp || '-'}</div>
            <div><span class="text-gray-400">WhatsApp:</span> ${this.data.whatsapp || '-'}</div>
            <div><span class="text-gray-400">Email:</span> ${this.data.email || '-'}</div>
            <div><span class="text-gray-400">Kontak Darurat:</span> ${this.data.kontakDarurat || '-'}</div>
            <div><span class="text-gray-400">HP Darurat:</span> ${this.data.hpDarurat || '-'}</div>
          </div>
        </div>

        <div class="bg-primary-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-primary-700 mb-3">Paket</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-primary-400">Paket:</span> ${paketName}</div>
            <div><span class="text-primary-400">Harga:</span> ${paketHarga}</div>
            <div><span class="text-primary-400">Tipe Kamar:</span> ${this.data.tipeKamar || '-'}</div>
          </div>
        </div>

        <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p class="text-sm text-amber-800">
            <strong>Catatan:</strong> Pastikan semua data sudah benar sebelum melanjutkan.
            Jamaah akan dibuat dengan status <span class="badge badge-warning">Pending</span> dan Nomor Jamaah akan digenerate otomatis.
          </p>
        </div>
      </div>
      <div class="flex justify-between mt-6">
        <button id="btn-prev" class="btn-secondary">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Kembali
        </button>
        <button id="btn-next" class="btn-primary">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Daftarkan
        </button>
      </div>
    `
  }

  attachFormEvents() {
    const nextBtn = document.getElementById('btn-next')
    const prevBtn = document.getElementById('btn-prev')

    nextBtn?.addEventListener('click', () => this.nextStep())
    prevBtn?.addEventListener('click', () => this.prevStep())

    // Auto-fill WhatsApp from HP
    const noHp = document.getElementById('noHp')
    const whatsapp = document.getElementById('whatsapp')
    noHp?.addEventListener('blur', () => {
      if (noHp.value && !whatsapp?.value) {
        whatsapp.value = noHp.value
      }
    })
  }

  collectStepData() {
    switch (this.step) {
      case 1:
        this.data.nama = document.getElementById('nama')?.value.trim() || ''
        this.data.nik = document.getElementById('nik')?.value.trim() || ''
        this.data.tempatLahir = document.getElementById('tempatLahir')?.value.trim() || ''
        this.data.tanggalLahir = document.getElementById('tanggalLahir')?.value || ''
        this.data.jenisKelamin = document.getElementById('jenisKelamin')?.value || ''
        this.data.alamat = document.getElementById('alamat')?.value.trim() || ''
        break
      case 2:
        this.data.noHp = document.getElementById('noHp')?.value.trim() || ''
        this.data.whatsapp = document.getElementById('whatsapp')?.value.trim() || ''
        this.data.email = document.getElementById('email')?.value.trim() || ''
        this.data.kontakDarurat = document.getElementById('kontakDarurat')?.value.trim() || ''
        this.data.hpDarurat = document.getElementById('hpDarurat')?.value.trim() || ''
        break
      case 3:
        this.data.paketId = document.getElementById('paketId')?.value || ''
        this.data.tipeKamar = document.getElementById('tipeKamar')?.value || ''
        break
    }
  }

  validateStep(step) {
    this.errors = {}

    switch (step) {
      case 1: {
        if (!this.data.nama) this.errors.nama = 'Nama wajib diisi'
        else if (this.data.nama.length < 3) this.errors.nama = 'Nama minimal 3 karakter'

        if (!this.data.nik) this.errors.nik = 'NIK wajib diisi'
        else if (!/^\d{16}$/.test(this.data.nik)) this.errors.nik = 'NIK harus 16 digit angka'

        if (!this.data.tempatLahir) this.errors.tempatLahir = 'Tempat lahir wajib diisi'

        if (!this.data.tanggalLahir) this.errors.tanggalLahir = 'Tanggal lahir wajib diisi'
        else {
          const birthDate = new Date(this.data.tanggalLahir)
          const today = new Date()
          if (birthDate > today) this.errors.tanggalLahir = 'Tanggal lahir tidak valid'
          const age = today.getFullYear() - birthDate.getFullYear()
          if (age < 12) this.errors.tanggalLahir = 'Usia minimal 12 tahun'
        }

        if (!this.data.jenisKelamin) this.errors.jenisKelamin = 'Jenis kelamin wajib dipilih'

        if (!this.data.alamat) this.errors.alamat = 'Alamat wajib diisi'
        else if (this.data.alamat.length < 10) this.errors.alamat = 'Alamat minimal 10 karakter'
        break
      }

      case 2: {
        if (!this.data.noHp) this.errors.noHp = 'No. HP wajib diisi'
        else if (!/^[\d\s+()-]{10,15}$/.test(this.data.noHp)) this.errors.noHp = 'Format no. HP tidak valid'

        if (this.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.email)) {
          this.errors.email = 'Format email tidak valid'
        }
        break
      }

      case 3: {
        if (!this.data.paketId) this.errors.paketId = 'Paket wajib dipilih'
        if (!this.data.tipeKamar) this.errors.tipeKamar = 'Tipe kamar wajib dipilih'
        break
      }
    }

    return Object.keys(this.errors).length === 0
  }

  nextStep() {
    // Collect current step data first
    this.collectStepData()

    // Validate current step
    if (!this.validateStep(this.step)) {
      showToast('Mohon perbaiki error pada form', 'warning')
      this.render() // Re-render to show errors
      return
    }

    if (this.step < 4) {
      this.step++
      this.render()
    } else {
      this.submit()
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.collectStepData()
      this.step--
      this.errors = {}
      this.render()
    }
  }

  async submit() {
    const btn = document.getElementById('btn-next')
    if (!btn) return
    btn.disabled = true
    btn.innerHTML = `<svg class="w-4 h-4 inline animate-spin mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Menyimpan...`

    try {
      const payload = {
        ...this.data,
        noJamaah: `NJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        status: 'pending',
        tanggalDaftar: new Date().toISOString().split('T')[0],
        deletedAt: null,
      }
      await api.createJamaah(payload)
      showToast('Jamaah berhasil didaftarkan!', 'success')
      window.location.hash = '#/jamaah'
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error')
      btn.disabled = false
      btn.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Daftarkan`
    }
  }
}
