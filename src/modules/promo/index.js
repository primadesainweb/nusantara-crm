/**
 * Promo Module Index (T-26) - CRUD for promo codes
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PromoView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.isModalOpen = false
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      this.promos = await api.getPromo()
      this.render()
    } catch (e) {
      showToast('Gagal memuat data promo', 'error')
    }
  }

  render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Kode Promo</h2>
            <p class="text-gray-500 text-sm">Kelola kode promo dan diskon</p>
          </div>
          <button id="btn-add-promo" class="btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Tambah Promo
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-primary-600">${this.promos.filter(p => p.status === 'aktif').length}</p>
            <p class="text-xs text-gray-500">Promo Aktif</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-green-600">${this.promos.reduce((s, p) => s + (p.terpakai || 0), 0)}</p>
            <p class="text-xs text-gray-500">Total Terpakai</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-yellow-600">${this.promos.length}</p>
            <p class="text-xs text-gray-500">Total Promo</p>
          </div>
        </div>

        <!-- Table -->
        <div class="card overflow-hidden">
          <table class="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Tipe</th>
                <th>Nilai</th>
                <th>Max Diskon</th>
                <th>Expried</th>
                <th>Penggunaan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="promo-tbody">
              ${this.promos.map(p => this.renderPromoRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div id="promo-modal" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-black bg-opacity-50" id="modal-backdrop"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-md" id="modal-content">
            <form id="promo-form">
              <div class="p-6 border-b border-gray-100">
                <h3 class="text-lg font-semibold text-gray-900" id="modal-title">Tambah Promo</h3>
              </div>
              <div class="p-6 space-y-4">
                <input type="hidden" id="promo-id" />

                <div>
                  <label class="form-label">Kode Promo *</label>
                  <input type="text" id="promo-kode" class="form-input uppercase" placeholder="UMROH10" required />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Tipe *</label>
                    <select id="promo-tipe" class="form-select" required>
                      <option value="persen">Persen (%)</option>
                      <option value="nominal">Nominal (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">Nilai *</label>
                    <input type="number" id="promo-nilai" class="form-input" placeholder="10" min="0" required />
                  </div>
                </div>

                <div>
                  <label class="form-label">Max Diskon (Rp)</label>
                  <input type="number" id="promo-maxdiskon" class="form-input" placeholder="3000000" min="0" />
                  <p class="text-xs text-gray-400 mt-1">Kosongkan jika tidak ada batas</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Batas Penggunaan</label>
                    <input type="number" id="promo-batas" class="form-input" placeholder="50" min="1" />
                  </div>
                  <div>
                    <label class="form-label">Berlaku Until</label>
                    <input type="date" id="promo-expired" class="form-input" required />
                  </div>
                </div>

                <div>
                  <label class="form-label">Status</label>
                  <select id="promo-status" class="form-select">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" id="btn-cancel" class="btn-secondary">Batal</button>
                <button type="submit" class="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderPromoRow(p) {
    const isExpired = new Date(p.expiredAt) < new Date()
    const isUsedUp = p.terpakai >= p.batasPenggunaan
    const statusClass = p.status === 'aktif' && !isExpired && !isUsedUp ? 'badge-success' : 'badge-gray'
    const statusLabel = p.status === 'aktif' && !isExpired && !isUsedUp ? 'Aktif' : 'Nonaktif'

    const nilaiDisplay = p.tipe === 'persen' ? `${p.nilai}%` : formatRupiah(p.nilai)
    const maxDisplay = p.maxDiskon ? formatRupiah(p.maxDiskon) : '-'

    return `
      <tr>
        <td class="font-mono font-semibold">${p.kode}</td>
        <td class="capitalize">${p.tipe}</td>
        <td>${nilaiDisplay}</td>
        <td>${maxDisplay}</td>
        <td class="${isExpired ? 'text-red-600' : ''}">${formatDate(p.expiredAt, 'DD MMM YYYY')}</td>
        <td>
          <div class="flex items-center gap-2">
            <span>${p.terpakai || 0}/${p.batasPenggunaan || '∞'}</span>
            <div class="w-12 bg-gray-100 rounded-full h-1.5">
              <div class="h-1.5 rounded-full ${isUsedUp ? 'bg-red-500' : 'bg-primary-500'}" style="width:${Math.min(100, (p.terpakai / p.batasPenggunaan) * 100)}%"></div>
            </div>
          </div>
        </td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <div class="flex gap-2">
            <button class="btn-secondary text-xs py-1 edit-promo" data-id="${p.id}">Edit</button>
            <button class="btn-secondary text-xs py-1 text-red-600 delete-promo" data-id="${p.id}">Hapus</button>
          </div>
        </td>
      </tr>
    `
  }

  attachEvents() {
    // Add button
    document.getElementById('btn-add-promo')?.addEventListener('click', () => this.openModal())

    // Edit buttons
    document.querySelectorAll('.edit-promo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id
        const promo = this.promos.find(p => p.id === id)
        this.openModal(promo)
      })
    })

    // Delete buttons
    document.querySelectorAll('.delete-promo').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        if (confirm('Yakin hapus promo ini?')) {
          await this.deletePromo(id)
        }
      })
    })

    // Modal events
    document.getElementById('modal-backdrop')?.addEventListener('click', () => this.closeModal())
    document.getElementById('btn-cancel')?.addEventListener('click', () => this.closeModal())

    // Form submit
    document.getElementById('promo-form')?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.savePromo()
    })

    // Promo kode uppercase
    document.getElementById('promo-kode')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase()
    })
  }

  openModal(promo = null) {
    const modal = document.getElementById('promo-modal')
    const title = document.getElementById('modal-title')

    if (promo) {
      title.textContent = 'Edit Promo'
      document.getElementById('promo-id').value = promo.id
      document.getElementById('promo-kode').value = promo.kode
      document.getElementById('promo-tipe').value = promo.tipe
      document.getElementById('promo-nilai').value = promo.nilai
      document.getElementById('promo-maxdiskon').value = promo.maxDiskon || ''
      document.getElementById('promo-batas').value = promo.batasPenggunaan || ''
      document.getElementById('promo-expired').value = promo.expiredAt
      document.getElementById('promo-status').value = promo.status
    } else {
      title.textContent = 'Tambah Promo'
      document.getElementById('promo-form').reset()
      document.getElementById('promo-id').value = ''
    }

    modal?.classList.remove('hidden')
  }

  closeModal() {
    document.getElementById('promo-modal')?.classList.add('hidden')
  }

  async savePromo() {
    const id = document.getElementById('promo-id').value
    const data = {
      kode: document.getElementById('promo-kode').value.trim().toUpperCase(),
      tipe: document.getElementById('promo-tipe').value,
      nilai: parseInt(document.getElementById('promo-nilai').value) || 0,
      maxDiskon: parseInt(document.getElementById('promo-maxdiskon').value) || null,
      batasPenggunaan: parseInt(document.getElementById('promo-batas').value) || 100,
      expiredAt: document.getElementById('promo-expired').value,
      status: document.getElementById('promo-status').value,
      terpakai: 0,
    }

    if (!data.kode || !data.expiredAt) {
      showToast('Mohon lengkapi form', 'warning')
      return
    }

    try {
      // Use direct fetch to avoid api wrapper issues with promo
      const BASE_URL = '/api'
      if (id) {
        await fetch(`${BASE_URL}/promo/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        showToast('Promo berhasil diperbarui!', 'success')
      } else {
        data.id = `PR${Date.now()}`
        await fetch(`${BASE_URL}/promo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        showToast('Promo berhasil dibuat!', 'success')
      }
      this.closeModal()
      await this.loadData()
    } catch (err) {
      showToast('Gagal menyimpan promo', 'error')
    }
  }

  async deletePromo(id) {
    try {
      const BASE_URL = '/api'
      await fetch(`${BASE_URL}/promo/${id}`, { method: 'DELETE' })
      showToast('Promo berhasil dihapus!', 'success')
      await this.loadData()
    } catch (err) {
      showToast('Gagal menghapus promo', 'error')
    }
  }
}
