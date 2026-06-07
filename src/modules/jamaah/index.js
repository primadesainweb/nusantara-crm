/**
 * Jamaah Module - Main List View (T-07)
 * Tabel + filter + search + pagination + sorting
 */
import api from '../../api/api.js'
import { showToast, formatDate, formatRupiah, statusBadge, debounce, getInitials, getAvatarColor, emptyState, skeletonRows, confirm } from '../../utils/helpers.js'

export default class JamaahIndexView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaah = []
    this.filtered = []
    this.pakets = []
    this.page = 1
    this.perPage = 25
    this.sortBy = 'tanggalDaftar'
    this.sortOrder = 'desc'
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
          <div class="flex gap-2 flex-wrap">
            <button id="btn-print-card" class="btn-secondary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Cetak Kartu
            </button>
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
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="form-label text-xs">Pencarian</label>
              <input type="text" id="search-input" placeholder="Nama, NIK, No. HP, No. Jamaah..."
                     class="form-input w-full" />
            </div>
            <div class="w-40">
              <label class="form-label text-xs">Status</label>
              <select id="filter-status" class="form-select w-full">
                <option value="">Semua</option>
                <option value="pending">Pending</option>
                <option value="aktif">Aktif</option>
                <option value="cicilan">Cicilan</option>
                <option value="lunas">Lunas</option>
                <option value="berangkat">Berangkat</option>
                <option value="batal">Batal</option>
              </select>
            </div>
            <div class="w-48">
              <label class="form-label text-xs">Paket</label>
              <select id="filter-paket" class="form-select w-full">
                <option value="">Semua Paket</option>
              </select>
            </div>
            <div class="w-36">
              <label class="form-label text-xs">Jenis Kelamin</label>
              <select id="filter-jenis" class="form-select w-full">
                <option value="">Semua</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <button id="btn-reset-filter" class="btn-ghost text-gray-500" title="Reset Filter">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table class="table" id="jamaah-table">
            <thead>
              <tr>
                <th class="w-12 cursor-pointer select-none" data-sort="noJamaah">
                  <span class="flex items-center gap-1">#</span>
                </th>
                <th class="cursor-pointer select-none" data-sort="nama">
                  <span class="flex items-center gap-1">
                    Nama Lengkap
                    <svg class="w-3 h-3 sort-icon" data-sort="nama" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </span>
                </th>
                <th class="cursor-pointer select-none" data-sort="noJamaah">
                  <span class="flex items-center gap-1">
                    No. Jamaah
                    <svg class="w-3 h-3 sort-icon" data-sort="noJamaah" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </span>
                </th>
                <th class="cursor-pointer select-none" data-sort="paketId">
                  <span class="flex items-center gap-1">
                    Paket
                    <svg class="w-3 h-3 sort-icon" data-sort="paketId" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </span>
                </th>
                <th class="cursor-pointer select-none" data-sort="status">
                  <span class="flex items-center gap-1">
                    Status
                    <svg class="w-3 h-3 sort-icon" data-sort="status" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </span>
                </th>
                <th class="cursor-pointer select-none" data-sort="tanggalDaftar">
                  <span class="flex items-center gap-1">
                    Tgl Daftar
                    <svg class="w-3 h-3 sort-icon" data-sort="tanggalDaftar" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                  </span>
                </th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="jamaah-tbody">
              ${skeletonRows(8, 7)}
            </tbody>
          </table>
        </div>

        <!-- Pagination + Per Page -->
        <div class="flex items-center justify-between flex-wrap gap-3" id="pagination-info">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">Tampilkan</span>
            <select id="per-page" class="form-select w-20 py-1">
              <option value="10">10</option>
              <option value="25" selected>25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span class="text-sm text-gray-500">data</span>
          </div>
          <div class="flex items-center gap-3">
            <p class="text-sm text-gray-500" id="page-info">Menampilkan 0 - 0 dari 0</p>
            <div class="flex gap-1" id="pagination-buttons"></div>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div id="import-modal" class="modal-backdrop hidden">
        <div class="modal max-w-2xl">
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
            <div id="preview-container" class="mt-4 hidden">
              <p class="text-sm font-medium mb-2">Preview (5 baris pertama):</p>
              <div id="preview-table" class="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto"></div>
              <p id="preview-stats" class="text-sm text-gray-500 mt-2"></p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Batal</button>
            <button class="btn-primary" id="btn-do-import" disabled>Import <span id="import-count"></span></button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="modal-backdrop hidden">
        <div class="modal max-w-sm">
          <div class="modal-header">
            <h3 class="font-heading font-semibold text-red-600">Hapus Jamaah</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 text-xl">x</button>
          </div>
          <div class="modal-body">
            <p class="text-gray-600" id="delete-message">Apakah Anda yakin ingin menghapus jamaah ini?</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Batal</button>
            <button class="btn-danger" id="btn-confirm-delete">Ya, Hapus</button>
          </div>
        </div>
      </div>

      <!-- Export Modal -->
      <div id="export-modal" class="modal-backdrop hidden">
        <div class="modal max-w-sm">
          <div class="modal-header">
            <h3 class="font-heading font-semibold">Export Data Jamaah</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 text-xl">x</button>
          </div>
          <div class="modal-body space-y-4">
            <p class="text-sm text-gray-500">Pilih format export:</p>
            <div class="space-y-2">
              <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export-format" value="csv" checked class="form-radio" />
                <div>
                  <p class="font-medium">CSV</p>
                  <p class="text-xs text-gray-400">Cocok untuk Excel, Google Sheets</p>
                </div>
              </label>
              <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="export-format" value="xlsx" class="form-radio" />
                <div>
                  <p class="font-medium">Excel (XLSX)</p>
                  <p class="text-xs text-gray-400">Format Microsoft Excel</p>
                </div>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Batal</button>
            <button class="btn-primary" id="btn-do-export">Download</button>
          </div>
        </div>
      </div>

      <!-- Print Card Modal -->
      <div id="print-card-modal" class="modal-backdrop hidden">
        <div class="modal max-w-2xl">
          <div class="modal-header">
            <h3 class="font-heading font-semibold">Cetak Kartu Jamaah</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 text-xl">x</button>
          </div>
          <div class="modal-body">
            <p class="text-sm text-gray-500 mb-4">Pilih jamaah yang akan dicetak kartunya:</p>
            <div id="card-preview-container" class="max-h-96 overflow-y-auto space-y-3" id="jamaah-card-list"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary modal-close">Batal</button>
            <button class="btn-primary" id="btn-do-print">Cetak Terpilih</button>
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
      this.page = 1
      this.applyFilters()
    }, 300))

    // Filter change
    ;['filter-status', 'filter-paket', 'filter-jenis'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.page = 1
        this.applyFilters()
      })
    })

    // Reset filter
    document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
      document.getElementById('search-input').value = ''
      document.getElementById('filter-status').value = ''
      document.getElementById('filter-paket').value = ''
      document.getElementById('filter-jenis').value = ''
      this.query = ''
      this.page = 1
      this.applyFilters()
    })

    // Per page change
    document.getElementById('per-page')?.addEventListener('change', (e) => {
      this.perPage = parseInt(e.target.value)
      this.page = 1
      this.renderTable()
    })

    // Column sorting
    document.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort
        if (this.sortBy === field) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          this.sortBy = field
          this.sortOrder = 'asc'
        }
        this.applyFilters()
        this.updateSortIcons()
      })
    })

    // Table row click -> detail (except action buttons)
    document.getElementById('jamaah-tbody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]')
      if (!row) return
      const id = row.dataset.id

      // Edit button
      if (e.target.closest('[data-action="edit"]')) {
        window.location.hash = `#/jamaah/${id}/edit`
        return
      }

      // Delete button
      if (e.target.closest('[data-action="delete"]')) {
        this.showDeleteModal(id, row.dataset.name)
        return
      }

      // Print card
      if (e.target.closest('[data-action="print-card"]')) {
        this.showPrintCardModal(id)
        return
      }

      // Default: go to detail
      if (!e.target.closest('button')) {
        window.location.hash = `#/jamaah/${id}`
      }
    })

    // Pagination buttons
    document.getElementById('pagination-buttons')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]')
      if (btn) {
        this.page = parseInt(btn.dataset.page)
        this.renderTable()
        document.getElementById('jamaah-table')?.scrollIntoView({ behavior: 'smooth' })
      }
    })

    // Import modal
    this.attachImportEvents()

    // Export modal
    document.getElementById('btn-export')?.addEventListener('click', () => {
      document.getElementById('export-modal')?.classList.remove('hidden')
    })
    document.getElementById('btn-do-export')?.addEventListener('click', () => this.doExport())

    // Print card modal
    document.getElementById('btn-print-card')?.addEventListener('click', () => {
      this.showPrintCardModal()
    })
    document.getElementById('btn-do-print')?.addEventListener('click', () => this.doPrintCards())

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop')?.classList.add('hidden')
      })
    })
  }

  attachImportEvents() {
    const dropZone = document.getElementById('drop-zone')
    const csvInput = document.getElementById('csv-input')
    const btnBrowse = document.getElementById('btn-browse')
    const btnDoImport = document.getElementById('btn-do-import')

    btnBrowse?.addEventListener('click', () => csvInput?.click())

    csvInput?.addEventListener('change', (e) => {
      if (e.target.files[0]) this.handleCSVFile(e.target.files[0])
    })

    // Drag and drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('border-primary-400', 'bg-primary-50')
    })
    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-primary-400', 'bg-primary-50')
    })
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('border-primary-400', 'bg-primary-50')
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith('.csv')) this.handleCSVFile(file)
    })

    // Download template
    document.getElementById('download-template')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.downloadTemplate()
    })

    // Do import
    btnDoImport?.addEventListener('click', () => this.doImport())
  }

  async loadData() {
    try {
      this.jamaah = await api.getJamaah({ _sort: 'tanggalDaftar', _order: 'desc' })
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

    // Sort
    this.filtered.sort((a, b) => {
      let aVal = a[this.sortBy] || ''
      let bVal = b[this.sortBy] || ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    this.renderTable()
    this.updateSortIcons()
  }

  updateSortIcons() {
    document.querySelectorAll('.sort-icon').forEach(icon => {
      const field = icon.dataset.sort
      if (field === this.sortBy) {
        icon.innerHTML = this.sortOrder === 'asc'
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>'
        icon.classList.add('text-primary-500')
      } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>'
        icon.classList.remove('text-primary-500')
      }
    })
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
      document.getElementById('pagination-info')?.classList.add('hidden')
      return
    }

    document.getElementById('pagination-info')?.classList.remove('hidden')

    // Paginate
    const start = (this.page - 1) * this.perPage
    const end   = start + this.perPage
    const pageItems = this.filtered.slice(start, end)

    // Get paket names
    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))

    tbody.innerHTML = pageItems.map((j, i) => {
      const initials = getInitials(j.nama)
      const avatarCls = getAvatarColor(j.nama)
      const rowNum = start + i + 1
      return `
        <tr class="hover:bg-gray-50" data-id="${j.id}" data-name="${j.nama}">
          <td class="text-gray-400 text-xs">${rowNum}</td>
          <td>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full ${avatarCls} flex items-center justify-center shrink-0 text-xs font-semibold">
                ${initials}
              </div>
              <div>
                <p class="font-medium text-gray-900">${j.nama}</p>
                <p class="text-xs text-gray-400">${j.noHp || '-'}</p>
              </div>
            </div>
          </td>
          <td class="font-mono text-xs">${j.noJamaah}</td>
          <td class="text-sm">${paketMap[j.paketId] || '-'}</td>
          <td>${statusBadge(j.status)}</td>
          <td class="text-sm">${formatDate(j.tanggalDaftar)}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-1">
              <button class="p-1.5 rounded hover:bg-gray-100 text-gray-500" data-action="print-card" title="Cetak Kartu">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              </button>
              <a href="#/jamaah/${j.id}" class="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Detail">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </a>
              <a href="#/jamaah/${j.id}/edit" class="p-1.5 rounded hover:bg-gray-100 text-gray-500" data-action="edit" title="Edit">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </a>
              <button class="p-1.5 rounded hover:bg-gray-100 text-red-500" data-action="delete" title="Hapus">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
    const info = document.getElementById('page-info')
    const buttons = document.getElementById('pagination-buttons')
    if (!info || !buttons) return

    const start = (this.page - 1) * this.perPage + 1
    const end = Math.min(this.page * this.perPage, this.filtered.length)
    info.textContent = totalPages > 0
      ? `Menampilkan ${start}-${end} dari ${this.filtered.length}`
      : 'Tidak ada data'

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
  }

  // Delete modal
  showDeleteModal(id, name) {
    const modal = document.getElementById('delete-modal')
    const message = document.getElementById('delete-message')
    if (!modal) return

    message.textContent = `Apakah Anda yakin ingin menghapus "${name}"? Data yang dihapus tidak dapat dikembalikan.`
    modal.classList.remove('hidden')

    const confirmBtn = document.getElementById('btn-confirm-delete')
    const handler = async () => {
      try {
        await api.deleteJamaah(id)
        showToast('Jamaah berhasil dihapus', 'success')
        modal.classList.add('hidden')
        confirmBtn.removeEventListener('click', handler)
        // Remove from local data
        this.jamaah = this.jamaah.filter(j => j.id !== id)
        this.applyFilters()
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, 'error')
      }
    }
    confirmBtn.addEventListener('click', handler)
  }

  // CSV Import
  handleCSVFile(file) {
    import('../../utils/csvParser.js').then(({ parseCSV, validateCSVData }) => {
      parseCSV(file, (results) => {
        const preview = document.getElementById('preview-container')
        const previewTable = document.getElementById('preview-table')
        const previewStats = document.getElementById('preview-stats')
        const btnDoImport = document.getElementById('btn-do-import')
        const importCount = document.getElementById('import-count')

        // Validate
        const { valid, errors } = validateCSVData(results.data)

        if (errors.length > 0) {
          previewTable.innerHTML = `
            <div class="p-4 text-red-500">
              <p class="font-medium">Ditemukan ${errors.length} error:</p>
              <ul class="text-sm mt-2 list-disc pl-4">
                ${errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}
                ${errors.length > 5 ? `<li>...dan ${errors.length - 5} error lainnya</li>` : ''}
              </ul>
            </div>
          `
          btnDoImport.disabled = true
        } else {
          // Show preview
          const rows = results.data.slice(0, 5)
          previewTable.innerHTML = `
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
                <tr>${Object.keys(rows[0] || {}).map(k => `<th class="px-3 py-2 text-left">${k}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows.map(row => `<tr class="border-t">${Object.values(row).map(v => `<td class="px-3 py-2">${v || '-'}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          `
          previewStats.textContent = `${results.data.length} data siap diimport`
          btnDoImport.disabled = false
          this.csvData = results.data
        }

        preview.classList.remove('hidden')
      })
    }).catch(() => {
      // Fallback: use PapaParse directly
      if (typeof Papa === 'undefined') {
        showToast('PapaParse library not loaded', 'error')
        return
      }
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const preview = document.getElementById('preview-container')
          const previewTable = document.getElementById('preview-table')
          const previewStats = document.getElementById('preview-stats')
          const btnDoImport = document.getElementById('btn-do-import')
          const importCount = document.getElementById('import-count')

          const { valid, errors } = this.validateCSVDataLocal(results.data)

          if (errors.length > 0) {
            previewTable.innerHTML = `
              <div class="p-4 text-red-500">
                <p class="font-medium">Ditemukan ${errors.length} error:</p>
                <ul class="text-sm mt-2 list-disc pl-4">
                  ${errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}
                  ${errors.length > 5 ? `<li>...dan ${errors.length - 5} error lainnya</li>` : ''}
                </ul>
              </div>
            `
            btnDoImport.disabled = true
          } else {
            const rows = results.data.slice(0, 5)
            previewTable.innerHTML = `
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>${Object.keys(rows[0] || {}).map(k => `<th class="px-3 py-2 text-left">${k}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows.map(row => `<tr class="border-t">${Object.values(row).map(v => `<td class="px-3 py-2">${v || '-'}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
            `
            previewStats.textContent = `${results.data.length} data siap diimport`
            btnDoImport.disabled = false
            this.csvData = results.data
          }

          preview.classList.remove('hidden')
        }
      })
    })
  }

  validateCSVDataLocal(data) {
    const errors = []
    const required = ['nama', 'nik', 'tanggalLahir', 'jenisKelamin', 'noHp', 'alamat']

    data.forEach((row, idx) => {
      required.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push(`Baris ${idx + 2}: ${field} wajib diisi`)
        }
      })
      if (row.nik && row.nik.length !== 16) {
        errors.push(`Baris ${idx + 2}: NIK harus 16 digit`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  downloadTemplate() {
    const headers = ['nama', 'nik', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'alamat', 'noHp', 'whatsapp', 'email', 'kontakDarurat', 'hpDarurat', 'paketId']
    const sample = [
      ['Siti Nurhaliza', '3201234567890001', 'Bandung', '1985-03-15', 'Perempuan', 'Jl. Contoh No. 1', '081234567890', '081234567890', 'siti@email.com', 'Ahmad', '081234567891', 'P001']
    ]

    const csv = [headers, ...sample].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_jamaah.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Template berhasil didownload', 'success')
  }

  async doImport() {
    if (!this.csvData || !this.csvData.length) return

    const btn = document.getElementById('btn-do-import')
    btn.disabled = true
    btn.textContent = 'Mengimport...'

    try {
      let success = 0
      let failed = 0

      for (const row of this.csvData) {
        try {
          const payload = {
            nama: row.nama,
            nik: row.nik,
            tempatLahir: row.tempatLahir || '',
            tanggalLahir: row.tanggalLahir || '',
            jenisKelamin: row.jenisKelamin,
            alamat: row.alamat,
            noHp: row.noHp,
            whatsapp: row.whatsapp || row.noHp,
            email: row.email || '',
            kontakDarurat: row.kontakDarurat || '',
            hpDarurat: row.hpDarurat || '',
            paketId: row.paketId || 'P001',
            tipeKamar: row.tipeKamar || 'sharing',
            noJamaah: `NJ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
            status: 'pending',
            tanggalDaftar: new Date().toISOString().split('T')[0],
            deletedAt: null,
          }
          await api.createJamaah(payload)
          success++
        } catch (e) {
          failed++
        }
      }

      showToast(`Berhasil import ${success} data${failed > 0 ? `, ${failed} gagal` : ''}`, failed > 0 ? 'warning' : 'success')
      document.getElementById('import-modal')?.classList.add('hidden')
      this.loadData()
    } catch (err) {
      showToast('Gagal import: ' + err.message, 'error')
    } finally {
      btn.disabled = false
      btn.textContent = 'Import'
    }
  }

  // Export
  async doExport() {
    const format = document.querySelector('input[name="export-format"]:checked')?.value || 'csv'
    const data = this.filtered

    if (format === 'csv') {
      this.exportCSV(data)
    } else {
      await this.exportXLSX(data)
    }

    document.getElementById('export-modal')?.classList.add('hidden')
  }

  exportCSV(data) {
    const headers = ['No. Jamaah', 'Nama', 'NIK', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Alamat', 'No. HP', 'WhatsApp', 'Email', 'Paket', 'Status', 'Tanggal Daftar']
    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))

    const rows = data.map(j => [
      j.noJamaah,
      j.nama,
      j.nik,
      j.tempatLahir || '',
      j.tanggalLahir || '',
      j.jenisKelamin || '',
      j.alamat || '',
      j.noHp || '',
      j.whatsapp || '',
      j.email || '',
      paketMap[j.paketId] || '',
      j.status || '',
      j.tanggalDaftar || '',
    ])

    const csv = [headers, ...rows].map(row => row.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jamaah_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export CSV berhasil', 'success')
  }

  async exportXLSX(data) {
    if (typeof XLSX === 'undefined') {
      showToast('SheetJS library not loaded', 'error')
      return
    }

    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))

    const wsData = data.map(j => ({
      'No. Jamaah': j.noJamaah,
      'Nama': j.nama,
      'NIK': j.nik,
      'Tempat Lahir': j.tempatLahir || '',
      'Tanggal Lahir': j.tanggalLahir || '',
      'Jenis Kelamin': j.jenisKelamin || '',
      'Alamat': j.alamat || '',
      'No. HP': j.noHp || '',
      'WhatsApp': j.whatsapp || '',
      'Email': j.email || '',
      'Paket': paketMap[j.paketId] || '',
      'Status': j.status || '',
      'Tanggal Daftar': j.tanggalDaftar || '',
    }))

    const ws = XLSX.utils.json_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jamaah')

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 20 }, { wch: 12 }, { wch: 12 },
    ]

    XLSX.writeFile(wb, `jamaah_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast('Export Excel berhasil', 'success')
  }

  // Print Card
  showPrintCardModal(jamaahId = null) {
    const modal = document.getElementById('print-card-modal')
    const container = document.getElementById('card-preview-container')
    if (!modal) return

    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))

    let items = []
    if (jamaahId) {
      const j = this.jamaah.find(x => x.id === jamaahId)
      if (j) items = [j]
    } else {
      items = [...this.filtered]
    }

    container.innerHTML = items.map(j => `
      <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
        <input type="checkbox" class="form-checkbox card-checkbox" value="${j.id}" checked />
        <div class="flex-1">
          <p class="font-medium">${j.nama}</p>
          <p class="text-xs text-gray-400">${j.noJamaah} - ${paketMap[j.paketId] || '-'}</p>
        </div>
      </label>
    `).join('')

    // Select all by default for non-specific
    if (!jamaahId) {
      container.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = true)
    }

    modal.classList.remove('hidden')
  }

  async doPrintCards() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      showToast('jsPDF library not loaded', 'error')
      return
    }

    const { jsPDF } = window.jspdf || {}
    if (!jsPDF) {
      showToast('jsPDF not available', 'error')
      return
    }

    const selectedIds = [...document.querySelectorAll('.card-checkbox:checked')].map(cb => cb.value)
    if (selectedIds.length === 0) {
      showToast('Pilih至少 satu jamaah', 'warning')
      return
    }

    const paketMap = Object.fromEntries((this.pakets || []).map(p => [p.id, p.nama]))
    const selected = this.jamaah.filter(j => selectedIds.includes(j.id))

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [86, 54] // CR80 card size
    })

    for (const j of selected) {
      doc.addPage()
      this.renderIDCard(doc, j, paketMap)
    }

    doc.save(`kartu_jamaah_${new Date().toISOString().split('T')[0]}.pdf`)
    showToast(`${selected.length} kartu berhasil dicetak`, 'success')
    document.getElementById('print-card-modal')?.classList.add('hidden')
  }

  renderIDCard(doc, j, paketMap) {
    const W = 86
    const H = 54

    // Background
    doc.setFillColor(13, 124, 102) // primary
    doc.rect(0, 0, W, H, 'F')

    // Gold accent bar
    doc.setFillColor(212, 175, 55)
    doc.rect(0, H - 8, W, 8, 'F')

    // White inner card
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(3, 3, W - 6, H - 14, 2, 2, 'F')

    // Logo area (Islamic geometric pattern placeholder)
    doc.setFillColor(13, 124, 102)
    doc.circle(12, 12, 5, 'F')

    // Organization name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(13, 124, 102)
    doc.text('NUSANTARA', 19, 11)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.text('TRAVEL & TOUR', 19, 14)

    // Photo placeholder
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(5, 18, 18, 22, 1, 1, 'F')
    doc.setFontSize(5)
    doc.setTextColor(150)
    doc.text('FOTO', 14, 30, { align: 'center' })

    // Name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text(j.nama || '-', 26, 22)

    // NIK
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.setTextColor(100)
    doc.text('NIK', 26, 27)
    doc.setFontSize(6)
    doc.text(j.nik || '-', 26, 30)

    // No. Jamaah
    doc.setFontSize(5)
    doc.setTextColor(100)
    doc.text('NO. JAMAAH', 26, 34)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(13, 124, 102)
    doc.text(j.noJamaah || '-', 26, 38)

    // Paket
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5)
    doc.setTextColor(100)
    doc.text('PAKET', 5, 44)
    doc.setFontSize(6)
    doc.setTextColor(50)
    doc.text(paketMap[j.paketId] || '-', 5, 47)

    // QR placeholder
    doc.setFillColor(240, 240, 240)
    doc.roundedRect(70, 18, 12, 12, 1, 1, 'F')
    doc.setFontSize(4)
    doc.setTextColor(150)
    doc.text('QR', 76, 25, { align: 'center' })

    // Bottom gold bar text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(4)
    doc.setTextColor(30, 30, 30)
    doc.text('NUSANTARA TRAVEL & TOUR', W / 2, H - 4, { align: 'center' })
  }
}
