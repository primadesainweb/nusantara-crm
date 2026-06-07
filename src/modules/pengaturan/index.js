/**
 * Nusantara CRM — Settings Module (T-43)
 * Company profile, logo upload, change password
 */
import { state } from '../../state.js'
import api from '../../api/api.js'
import { showToast } from '../../utils/helpers.js'
import { canAccess } from '../../utils/rbac.js'

const API_BASE = 'http://localhost:3001'

export default class PengaturanView {
  constructor() {
    this.settings = null
    this.loading = false
  }

  async mount(el) {
    this.el = el
    await this.loadSettings()
    this.render()
    this.attachEvents()
  }

  async loadSettings() {
    try {
      const data = await fetch(`${API_BASE}/settings`).then(r => r.json())
      this.settings = data
    } catch (err) {
      console.error('Failed to load settings:', err)
      this.settings = state.settings || {}
    }
  }

  async saveSettings(data) {
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save')
      this.settings = data
      state.merge('settings', data)
      return true
    } catch (err) {
      console.error('Save settings failed:', err)
      return false
    }
  }

  render() {
    const s = this.settings || {}

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Page Header -->
        <div>
          <h2 class="text-2xl font-heading font-bold text-gray-900 dark:text-gray-100">Pengaturan</h2>
          <p class="text-gray-500 text-sm dark:text-gray-400">Profil perusahaan dan konfigurasi aplikasi</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Settings -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Company Info Card -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Informasi Perusahaan
              </h3>

              <form id="company-form" class="space-y-4">
                <!-- Logo Upload -->
                <div class="mb-6">
                  <label class="form-label">Logo Perusahaan</label>
                  <div class="flex items-start gap-4">
                    <div id="logo-preview" class="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                      ${s.logo ? `<img src="${s.logo}" alt="Logo" class="w-full h-full object-contain"/>` : `
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      `}
                    </div>
                    <div class="flex-1">
                      <input type="file" id="logo-input" accept="image/*" class="hidden"/>
                      <button type="button" id="upload-logo-btn" class="btn-secondary text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Upload Logo
                      </button>
                      <p class="text-xs text-gray-400 mt-1">Format: JPG, PNG, WebP. Maks 2MB.</p>
                      ${s.logo ? `
                        <button type="button" id="remove-logo-btn" class="text-xs text-red-600 hover:underline mt-1">Hapus logo</button>
                      ` : ''}
                    </div>
                  </div>
                </div>

                <!-- Company Name -->
                <div>
                  <label for="company-name" class="form-label">Nama Perusahaan</label>
                  <input type="text" id="company-name" class="form-input" value="${this.escapeHtml(s.companyName || '')}" placeholder="PT Nusantara Travel Indonesia"/>
                </div>

                <!-- Address -->
                <div>
                  <label for="company-address" class="form-label">Alamat</label>
                  <textarea id="company-address" class="form-textarea" rows="2" placeholder="Jl. Sudirman No. 123, Jakarta Selatan">${this.escapeHtml(s.address || '')}</textarea>
                </div>

                <!-- Contact Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="company-phone" class="form-label">Telepon</label>
                    <input type="text" id="company-phone" class="form-input" value="${this.escapeHtml(s.phone || '')}" placeholder="021-1234567"/>
                  </div>
                  <div>
                    <label for="company-email" class="form-label">Email</label>
                    <input type="email" id="company-email" class="form-input" value="${this.escapeHtml(s.email || '')}" placeholder="info@nusantara.crm"/>
                  </div>
                </div>

                <!-- Website -->
                <div>
                  <label for="company-website" class="form-label">Website</label>
                  <input type="url" id="company-website" class="form-input" value="${this.escapeHtml(s.website || '')}" placeholder="https://nusantara.crm"/>
                </div>

                <hr class="dark:border-gray-700"/>

                <!-- Additional Settings -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="company-currency" class="form-label">Mata Uang</label>
                    <select id="company-currency" class="form-select">
                      <option value="IDR" ${s.currency === 'IDR' ? 'selected' : ''}>IDR - Rupiah Indonesia</option>
                      <option value="USD" ${s.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                      <option value="SAR" ${s.currency === 'SAR' ? 'selected' : ''}>SAR - Saudi Riyal</option>
                    </select>
                  </div>
                  <div>
                    <label for="company-dateformat" class="form-label">Format Tanggal</label>
                    <select id="company-dateformat" class="form-select">
                      <option value="DD/MM/YYYY" ${s.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY" ${s.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD" ${s.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <button type="submit" id="save-company-btn" class="btn-primary" ${this.loading ? 'disabled' : ''}>
                  ${this.loading ? `
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Menyimpan...
                  ` : `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Simpan Perubahan
                  `}
                </button>
              </form>
            </div>

            <!-- Change Password Card -->
            ${canAccess('users.update') ? `
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                Ubah Password
              </h3>

              <form id="password-form" class="space-y-4">
                <div>
                  <label for="current-password" class="form-label">Password Saat Ini</label>
                  <input type="password" id="current-password" class="form-input" autocomplete="current-password"/>
                </div>
                <div>
                  <label for="new-password" class="form-label">Password Baru</label>
                  <input type="password" id="new-password" class="form-input" autocomplete="new-password" minlength="6"/>
                  <p class="text-xs text-gray-400 mt-1">Minimal 6 karakter</p>
                </div>
                <div>
                  <label for="confirm-password" class="form-label">Konfirmasi Password Baru</label>
                  <input type="password" id="confirm-password" class="form-input" autocomplete="new-password"/>
                </div>
                <div id="password-error" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"></div>
                <button type="submit" id="save-password-btn" class="btn-secondary">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                  Ubah Password
                </button>
              </form>
            </div>
            ` : ''}
          </div>

          <!-- Sidebar Info -->
          <div class="space-y-6">
            <!-- App Info -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-4">Tentang Aplikasi</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Versi</span>
                  <span class="font-medium text-gray-900 dark:text-gray-200">1.0.0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Build</span>
                  <span class="font-medium text-gray-900 dark:text-gray-200">Phase 5</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">User</span>
                  <span class="font-medium text-gray-900 dark:text-gray-200">${state.user?.name || 'Unknown'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Role</span>
                  <span class="badge ${state.user?.role === 'admin' ? 'badge-primary' : 'badge-info'}">${state.user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
                </div>
              </div>
            </div>

            <!-- Quick Help -->
            <div class="card p-6">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-4">Tips</h3>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li class="flex items-start gap-2">
                  <span class="text-primary-600">•</span>
                  Logo akan muncul di semua dokumen cetak
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary-600">•</span>
                  Format tanggal mempengaruhi kuitansi
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-primary-600">•</span>
                  Password min. 6 karakter
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
  }

  attachEvents() {
    // Logo upload
    const uploadBtn = document.getElementById('upload-logo-btn')
    const logoInput = document.getElementById('logo-input')
    const logoPreview = document.getElementById('logo-preview')
    const removeLogoBtn = document.getElementById('remove-logo-btn')

    uploadBtn?.addEventListener('click', () => logoInput?.click())
    logoInput?.addEventListener('change', (e) => this.handleLogoUpload(e))
    removeLogoBtn?.addEventListener('click', () => this.removeLogo())

    // Company form
    document.getElementById('company-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.saveCompanySettings()
    })

    // Password form
    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.changePassword()
    })
  }

  async handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error')
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const logoPreview = document.getElementById('logo-preview')
      if (logoPreview) {
        logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo" class="w-full h-full object-contain"/>`
      }
      this.newLogo = e.target.result
    }
    reader.readAsDataURL(file)
  }

  removeLogo() {
    const logoPreview = document.getElementById('logo-preview')
    if (logoPreview) {
      logoPreview.innerHTML = `
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      `
    }
    this.newLogo = null
    document.getElementById('remove-logo-btn')?.remove()
  }

  async saveCompanySettings() {
    const btn = document.getElementById('save-company-btn')
    btn.disabled = true
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      Menyimpan...
    `

    const data = {
      companyName: document.getElementById('company-name')?.value || '',
      address: document.getElementById('company-address')?.value || '',
      phone: document.getElementById('company-phone')?.value || '',
      email: document.getElementById('company-email')?.value || '',
      website: document.getElementById('company-website')?.value || '',
      currency: document.getElementById('company-currency')?.value || 'IDR',
      dateFormat: document.getElementById('company-dateformat')?.value || 'DD/MM/YYYY',
      logo: this.newLogo !== undefined ? this.newLogo : this.settings?.logo,
    }

    const success = await this.saveSettings(data)

    if (success) {
      showToast('Pengaturan berhasil disimpan', 'success')
    } else {
      showToast('Gagal menyimpan pengaturan', 'error')
    }

    btn.disabled = false
    btn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Simpan Perubahan
    `
  }

  async changePassword() {
    const currentPw = document.getElementById('current-password')?.value
    const newPw = document.getElementById('new-password')?.value
    const confirmPw = document.getElementById('confirm-password')?.value
    const errorDiv = document.getElementById('password-error')

    errorDiv?.classList.add('hidden')

    // Validate
    if (!currentPw || !newPw || !confirmPw) {
      errorDiv.textContent = 'Semua field wajib diisi'
      errorDiv?.classList.remove('hidden')
      return
    }

    if (newPw.length < 6) {
      errorDiv.textContent = 'Password baru minimal 6 karakter'
      errorDiv?.classList.remove('hidden')
      return
    }

    if (newPw !== confirmPw) {
      errorDiv.textContent = 'Konfirmasi password tidak cocok'
      errorDiv?.classList.remove('hidden')
      return
    }

    // In real app, this would call API to change password
    // For demo, we'll just show success
    showToast('Password berhasil diubah', 'success')

    // Clear form
    document.getElementById('current-password').value = ''
    document.getElementById('new-password').value = ''
    document.getElementById('confirm-password').value = ''
  }

  escapeHtml(str) {
    if (!str) return ''
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]))
  }
}
