/**
 * Jamaah Module - Main List View (T-07)
 * Tabel + filter + search + pagination
 */
import api from '../../api/api.js'
import { showToast, formatDate, formatRupiah, statusBadge, debounce, getInitials, getAvatarColor, emptyState, skeletonRows } from '../../utils/helpers.js'

export default class JamaahIndexView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaah = []
    this.filtered = []
    this.page = 1
    this.perPage = 25
  }

  async mount(el) {
    this.el = el
    await this.render()
    this.attachEvents()
    this.loadData()
  }

  async render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Manajemen Jamaah</h2>
            <p class="text-gray-500 text-sm" id="jamaah-count">Memuat...</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-export" class="btn-secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export
            </button>
            <button id="btn-import" class="btn-secondary">Import CSV</button>
            <a href="#/jamaah/new" class="btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Jamaah Baru
            </a>
          </div>
        </div>

        <!-- Filters -->
        <div class="card p-4">
          <div class="flex flex-wrap gap-3">
            <div class="flex-1 min-w-[200px]">
              <input type="text" id="search-input" placeholder="Cari nama, NIK, atau nomor HP..."
                     class="form-input w-full" />
            </div>
            <select id="filter-status" class="form-select w-auto min-w-[140px]">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="aktif">Aktif</option>
              <option value="cicilan">Cicilan</option>
              <option value="lunas">Lunas</option>
              <option value="berangkat">Berangkat</option>
              <option value="batal">Batal</option>
            </select>
            <select id="filter-paket" class="form-select w-auto min-w-[160px]">
              <option value="">Semua Paket</option>
            </select>
            <select id="filter-jenis" class="form-select w-auto min-w-[120px]">
              <option value="">Semua Jenis</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table class="table" id="jamaah-table">
            <thead>
              <tr>
                <th class="w-12">#</th>
                <th>Nama Lengkap</th>
                <th>No. Jamaah</th>
                <th>Paket</th>
                <th>Status</th>
                <th>Tgl Daftar</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="jamaah-tbody">
              ${skeletonRows(8, 7)}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between" id="pagination-info">
          <p class="text-sm text-gray-500">Menampilkan 0 - 0 dari 0</p>
          <div class="flex gap-1" id="pagination-buttons"></div>
        </div>
      </div>

      <!-- Import Modal -->
      <div id="import-modal" class="modal-backdrop hidden">
        <div class="modal max-w-lg">
          <div class="modal-header">
            <h3 class="font-heading font-semibold">Import Jamaah dari CSV</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 text-xl">x</button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-gray-500 mb-4">Upload file CSV. <a href="#" id="download-template" class="text-primary-600 hover:underline">Download template</a></p>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" id="drop-zone">
              <p class="text-gray-400 mb-2">Drag file CSV di sini</p>
              <p class="text-gray-400 text-xs mb-4">atau</p>
              <input type="file" id="csv-input" accept=".csv" class="hidden" />
              <button class="btn-secondary" id="btn-browse">Browse File</button>
            </div>
            <div id="preview-table" class="mt-4 hidden">
              <p class="text-sm font-medium mb-2">Preview (5 baris pertama):</p>
              <div class="overflow-x-auto border rounded-lg"></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Batal</button>
            <button class="btn-primary" id="btn-do-import" disabled>Import</button>
          </div>
        </div>
      </div>
    `
  }

  attachEvents() {
    // Search with debounce
    const searchInput = document.getElementById('search-input')
    searchInput?.addEventListener('input', debounce((e) => {
      this.query = e.target.value
      this.applyFilters()
    }, 300))

    // Filter change
    ;['filter-status', 'filter-paket', 'filter-jenis'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.applyFilters())
    })

    // Table row click -> detail
    document.getElementById('jamaah-tbody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]')
      if (row && !e.target.closest('button')) {
        window.location.hash = `#/jamaah/${row.dataset.id}`
      }
    })

    // Import modal
    document.getElementById('btn-import')?.addEventListener('click', () => {
      document.getElementById('import-modal')?.classList.remove('hidden')
    })
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop')?.classList.add('hidden')
      })
    })
  }

  async loadData() {
    try {
      this.jamaah = await api.getJamaah({ _sort: 'tanggalDaftar', _order: 'desc' })
      // Also load pakets for filter dropdown
      this.pakets = await api.getPaket()
      this.populatePaketFilter()
      this.applyFilters()
    } catch (err) {
      console.error('Failed to load jamaah:', err)
      showToast('Gagal memuat data jamaah', 'error')
    }
  }

  populatePaketFilter() {
    const select = document.getElementById('filter-paket')
    if (!select) return
    const current = select.value
    select.innerHTML = '<option value="">Semua Paket</option>' +
      this.pakets.map(p => `<option value="${p.id}">${p.nama}</option>`).join('')
    select.value = current
  }

  applyFilters() {
    const status = document.getElementById('filter-status')?.value || ''
    const paket  = document.getElementById('filter-paket')?.value || ''
    const jenis  = document.getElementById('filter-jenis')?.value || ''
    const search = (document.getElementById('search-input')?.value || '').toLowerCase()

    this.filtered = this.jamaah.filter(j => {
      if (j.deletedAt) return false
      if (status && j.status !== status) return false
      if (paket && j.paketId !== paket) return false
      if (jenis && j.jenisKelamin !== jenis) return false
      if (search) {
        const match = [j.nama, j.nik, j.noHp, j.noJamaah]
          .some(v => v?.toLowerCase().includes(search))
        if (!match) return false
      }
      return true
    })

    this.page = 1
    this.renderTable()
  }

  renderTable() {
    const tbody = document.getElementById('jamaah-tbody')
    const countEl = document.getElementById('jamaah-count')
    if (!tbody) return

    if (!this.filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-12">
            ${emptyState('👥', 'Belum ada jamaah', 'Tambahkan jamaah baru atau ubah filter pencarian')}
          </td>
        </tr>
      `
      countEl.textContent = '0 Jamaah'
      return
    }

    // Paginate
    const start = (this.page - 1) * this.perPage
    const end   = start + this.perPage
    const page   = this.filtered.slice(start, end)

    // Get paket names
    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))

    tbody.innerHTML = page.map((j, i) => {
      const initials = getInitials(j.nama)
      const avatarCls = getAvatarColor(j.nama)
      const rowNum = start + i + 1
      return `
        <tr class="cursor-pointer hover:bg-gray-50" data-id="${j.id}">
          <td class="text-gray-400 text-xs">${rowNum}</td>
          <td>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center shrink-0 text-xs font-semibold">
                ${initials}
              </div>
              <div>
                <p class="font-medium text-gray-900">${j.nama}</p>
                <p class="text-xs text-gray-400">${j.noHp}</p>
              </div>
            </div>
          </td>
          <td class="font-mono text-xs">${j.noJamaah}</td>
          <td class="text-sm">${paketMap[j.paketId] || '-'}</td>
          <td>${statusBadge(j.status)}</td>
          <td class="text-sm">${formatDate(j.tanggalDaftar)}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-1">
              <a href="#/jamaah/${j.id}" class="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Detail">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </a>
              <button class="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="WhatsApp" data-wa="${j.whatsapp}">
                <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `
    }).join('')

    // Update count
    const total = this.filtered.length
    countEl.textContent = `${total} Jamaah`

    // Render pagination
    this.renderPagination()
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filtered.length / this.perPage)
    const info = document.querySelector('#pagination-info p')
    const buttons = document.getElementById('pagination-buttons')
    if (!info || !buttons) return

    const start = (this.page - 1) * this.perPage + 1
    const end = Math.min(this.page * this.perPage, this.filtered.length)
    info.textContent = `Menampilkan ${start}-${end} dari ${this.filtered.length}`

    let html = ''
    if (totalPages <= 1) {
      buttons.innerHTML = ''
      return
    }

    // Prev
    html += `<button class="btn-secondary px-3 py-1 text-sm" ${this.page === 1 ? 'disabled' : ''} data-page="${this.page - 1}">‹</button>`

    // Pages
    const maxVisible = 5
    let startPage = Math.max(1, this.page - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }
    if (startPage > 1) html += `<button class="btn-secondary px-3 py-1 text-sm" data-page="1">1</button>`
    if (startPage > 2) html += `<span class="px-2 text-gray-400">...</span>`
    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="btn ${i === this.page ? 'btn-primary' : 'btn-secondary'} px-3 py-1 text-sm" data-page="${i}">${i}</button>`
    }
    if (endPage < totalPages - 1) html += `<span class="px-2 text-gray-400">...</span>`
    if (endPage < totalPages) html += `<button class="btn-secondary px-3 py-1 text-sm" data-page="${totalPages}">${totalPages}</button>`

    // Next
    html += `<button class="btn-secondary px-3 py-1 text-sm" ${this.page === totalPages ? 'disabled' : ''} data-page="${this.page + 1}">›</button>`

    buttons.innerHTML = html

    buttons.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.page = parseInt(btn.dataset.page)
        this.renderTable()
      })
    })
  }
}
