/**
 * Pengaturan Module (T-43)
 */
import { state } from '../../state.js'
import { showToast } from '../../utils/helpers.js'

export default class PengaturanView {
  async mount(el) {
    this.el = el
    this.el.innerHTML = `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-heading font-bold text-gray-900">Pengaturan</h2>
          <p class="text-gray-500 text-sm">Profil perusahaan dan konfigurasi aplikasi</p>
        </div>
        <div class="card p-6 max-w-lg">
          <h3 class="font-semibold text-gray-800 mb-4">Profil Perusahaan</h3>
          <div class="space-y-4">
            <div>
              <label class="form-label">Nama Perusahaan</label>
              <input type="text" class="form-input" id="company-name" value="${state.settings?.companyName || ''}" />
            </div>
            <div>
              <label class="form-label">Alamat</label>
              <textarea class="form-textarea" id="company-address" rows="2">${state.settings?.address || ''}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Telepon</label>
                <input type="text" class="form-input" id="company-phone" value="${state.settings?.phone || ''}" />
              </div>
              <div>
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="company-email" value="${state.settings?.email || ''}" />
              </div>
            </div>
            <button id="btn-save-settings" class="btn-primary">Simpan Perubahan</button>
          </div>
        </div>
      </div>
    `

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      showToast('Pengaturan disimpan', 'success')
    })
  }
}
