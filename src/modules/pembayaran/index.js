/**
 * Pembayaran Module Index (T-20)
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PembayaranView {
  async mount(el) {
    this.el = el
    await this.render()
    this.loadData()
  }

  async render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Pembayaran</h2>
            <p class="text-gray-500 text-sm">Kelola transaksi dan cicilan jamaah</p>
          </div>
        </div>
        <div id="payment-table" class="card overflow-hidden">
          <table class="table">
            <thead>
              <tr>
                <th>Jamaah</th>
                <th>Paket</th>
                <th class="text-right">Total Tagihan</th>
                <th class="text-right">Sudah Bayar</th>
                <th class="text-right">Sisa</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="payment-tbody">
              ${Array(5).fill('<tr><td colspan="7"><div class="skeleton h-12 rounded"></div></td></tr>').join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  async loadData() {
    try {
      const [pembayarans, jamaahs, pakets] = await Promise.all([
        api.getPembayaran(),
        api.getJamaah(),
        api.getPaket(),
      ])
      this.pembayarans = pembayarans
      this.jamaahMap = Object.fromEntries(jamaahs.map(j => [j.id, j]))
      this.paketMap = Object.fromEntries(pakets.map(p => [p.id, p]))
      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  render() {
    const tbody = document.getElementById('payment-tbody')
    if (!tbody || !this.pembayarans?.length) {
      tbody && (tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">Belum ada data</td></tr>')
      return
    }

    tbody.innerHTML = this.pembayarans.map(p => {
      const j = this.jamaahMap[p.jamaahId]
      const pk = this.paketMap[p.paketId]
      const pct = p.totalTagihan ? Math.round((p.totalBayar / p.totalTagihan) * 100) : 0
      const statusCls = { lunas: 'badge-success', cicilan: 'badge-info', pending: 'badge-warning' }[p.status] || 'badge-gray'

      return `
        <tr>
          <td class="font-medium">${j?.nama || '-'}</td>
          <td class="text-sm">${pk?.nama || '-'}</td>
          <td class="text-right font-medium">${formatRupiah(p.totalTagihan)}</td>
          <td class="text-right text-green-700">${formatRupiah(p.totalBayar)}</td>
          <td class="text-right text-red-700">${formatRupiah(p.sisa)}</td>
          <td><span class="badge ${statusCls}">${p.status}</span></td>
          <td>
            <button class="btn-secondary text-xs py-1" data-jamaah="${p.jamaahId}">Bayar</button>
          </td>
        </tr>
      `
    }).join('')
  }
}
