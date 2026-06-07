/**
 * Laporan Module (T-32, T-40)
 */
import api from '../../api/api.js'
import { showToast, formatRupiah } from '../../utils/helpers.js'

export default class LaporanView {
  async mount(el) {
    this.el = el
    this.el.innerHTML = `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-heading font-bold text-gray-900">Laporan</h2>
          <p class="text-gray-500 text-sm">Laporan keuangan dan operasional</p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-6 text-center text-gray-400">
            <p class="text-4xl mb-2">📊</p>
            <p class="font-medium">Laporan Keuangan</p>
            <p class="text-sm mt-1">dalam pengembangan</p>
          </div>
          <div class="card p-6 text-center text-gray-400">
            <p class="text-4xl mb-2">📋</p>
            <p class="font-medium">Laporan Jamaah</p>
            <p class="text-sm mt-1">dalam pengembangan</p>
          </div>
        </div>
      </div>
    `
  }
}
