/**
 * Dokumen Module Index (T-29, T-30)
 */
import api from '../../api/api.js'
import { showToast } from '../../utils/helpers.js'

export default class DokumenView {
  async mount(el) {
    this.el = el
    this.el.innerHTML = `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-heading font-bold text-gray-900">Dokumen Jamaah</h2>
          <p class="text-gray-500 text-sm">Upload dan tracking kelengkapan dokumen</p>
        </div>
        <div class="card p-8 text-center text-gray-400">
          <p class="text-4xl mb-2">📄</p>
          <p>Modul dokumen dalam pengembangan</p>
        </div>
      </div>
    `
  }
}
