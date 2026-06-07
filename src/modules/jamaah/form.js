/**
 * Jamaah Form View (T-08) - Multi-step wizard
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
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 1: Data Pribadi</h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">Nama Lengkap *</label>
          <input type="text" id="nama" class="form-input" placeholder="Nama sesuai KTP" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">NIK / No. KTP *</label>
            <input type="text" id="nik" class="form-input" placeholder="16 digit NIK" maxlength="16" required />
          </div>
          <div>
            <label class="form-label">Tempat Lahir *</label>
            <input type="text" id="tempatLahir" class="form-input" placeholder="Kota kelahiran" required />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Tanggal Lahir *</label>
            <input type="date" id="tanggalLahir" class="form-input" required />
          </div>
          <div>
            <label class="form-label">Jenis Kelamin *</label>
            <select id="jenisKelamin" class="form-select" required>
              <option value="">Pilih</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">Alamat Lengkap *</label>
          <textarea id="alamat" class="form-textarea" rows="2" placeholder="Alamat sesuai KTP"></textarea>
        </div>
      </div>
    `
  }

  step2HTML() {
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 2: Kontak</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">No. HP *</label>
            <input type="tel" id="noHp" class="form-input" placeholder="08xxxxxxxxxx" required />
          </div>
          <div>
            <label class="form-label">WhatsApp</label>
            <input type="tel" id="whatsapp" class="form-input" placeholder="Sama dengan HP jika sama" />
          </div>
        </div>
        <div>
          <label class="form-label">Email</label>
          <input type="email" id="email" class="form-input" placeholder="email@example.com" />
        </div>
        <div class="border-t border-gray-100 pt-4 mt-4">
          <p class="text-sm font-medium text-gray-700 mb-3">Kontak Darurat</p>
          <div class="space-y-3">
            <div>
              <label class="form-label">Nama</label>
              <input type="text" id="kontakDarurat" class="form-input" placeholder="Nama kontak darurat" />
            </div>
            <div>
              <label class="form-label">No. HP</label>
              <input type="tel" id="hpDarurat" class="form-input" placeholder="08xxxxxxxxxx" />
            </div>
          </div>
        </div>
      </div>
    `
  }

  step3HTML() {
    const paketOptions = this.pakets.map(p =>
      `<option value="${p.id}" data-harga="${p.harga}">${p.nama} - ${new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(p.harga)}</option>`
    ).join('')
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 3: Paket</h3>
      <div class="space-y-4">
        <div>
          <label class="form-label">Paket *</label>
          <select id="paketId" class="form-select" required>
            <option value="">Pilih Paket</option>
            ${paketOptions}
          </select>
        </div>
        <div>
          <label class="form-label">Tipe Kamar *</label>
          <select id="tipeKamar" class="form-select" required>
            <option value="">Pilih</option>
            <option value="sharing">Sharing (berdua)</option>
            <option value="single">Single (1 orang)</option>
            <option value="mahram">Mahram</option>
          </select>
        </div>
      </div>
    `
  }

  step4HTML() {
    return `
      <h3 class="font-semibold text-gray-800 mb-4">Step 4: Review & Submit</h3>
      <div class="space-y-3" id="review-content">
        <p class="text-gray-500 text-sm">Klik "Daftarkan" untuk menyimpan.</p>
      </div>
    `
  }

  attachFormEvents() {
    const nextBtn = document.getElementById('btn-next')
    const prevBtn = document.getElementById('btn-prev')

    nextBtn?.addEventListener('click', () => this.nextStep())
    prevBtn?.addEventListener('click', () => this.prevStep())
  }

  nextStep() {
    if (this.step < 4) {
      this.step++
      this.render()
    } else {
      this.submit()
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--
      this.render()
    }
  }

  async submit() {
    const btn = document.getElementById('btn-next')
    btn.disabled = true
    btn.textContent = 'Menyimpan...'

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
      btn.textContent = 'Daftarkan'
    }
  }
}
