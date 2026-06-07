/**
 * Dokumen Module Index (T-29, T-30) - Document upload & management
 */
import api from '../../api/api.js'
import { showToast, formatDate, lsGet, lsSet } from '../../utils/helpers.js'

const DOKUMEN_JENIS = ['KTP', 'KK', 'Passport', 'Foto 3x4', 'Buku Nikah', 'Sertifikat Vaksin', 'Kartu Keluarga']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export default class DokumenView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaah = null
    this.dokumens = []
    this.selectedJamaahId = null
    this.uploadProgress = 0
    this.isUploading = false
  }

  async mount(el) {
    this.el = el
    await this.loadData()
    this.render()
  }

  async loadData() {
    try {
      const [jamaahs, dokumens] = await Promise.all([
        api.getJamaah(),
        api.getDokumen()
      ])
      this.jamaahs = jamaahs.filter(j => !j.deletedAt)
      this.dokumens = dokumens
    } catch (err) {
      console.error('Failed to load data:', err)
      showToast('Gagal memuat data dokumen', 'error')
    }
  }

  render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Dokumen Jamaah</h2>
            <p class="text-gray-500 text-sm mt-1">Upload dan tracking kelengkapan dokumen</p>
          </div>
          <div class="flex gap-2">
            <a href="#/dokumen/checklist" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Checklist
            </a>
            <a href="#/dokumen/visa" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              Visa Status
            </a>
          </div>
        </div>

        <!-- Jamaah Selector -->
        <div class="card p-4">
          <label class="form-label">Pilih Jamaah</label>
          <select id="jamaah-select" class="form-select w-full md:w-1/3">
            <option value="">-- Pilih Jamaah --</option>
            ${this.jamaahs.map(j => `
              <option value="${j.id}">${j.noJamaah} - ${j.nama}</option>
            `).join('')}
          </select>
        </div>

        <!-- Document Upload Area -->
        <div id="upload-section" class="card p-6 hidden">
          <h3 class="font-semibold text-gray-800 mb-4">Upload Dokumen</h3>
          
          <!-- Drop Zone -->
          <div id="drop-zone" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
            <div class="text-4xl mb-2">📄</div>
            <p class="text-gray-600 font-medium">Drag & drop file di sini</p>
            <p class="text-gray-400 text-sm mt-1">atau klik untuk pilih file</p>
            <p class="text-gray-400 text-xs mt-2">Format: JPG, PNG, PDF (max 5MB)</p>
            <input type="file" id="file-input" class="hidden" accept=".jpg,.jpeg,.png,.pdf" />
          </div>

          <!-- Upload Progress -->
          <div id="upload-progress" class="hidden mt-4">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div id="progress-bar" class="bg-primary-500 h-2 rounded-full transition-all" style="width: 0%"></div>
              </div>
              <span id="progress-text" class="text-sm text-gray-500">0%</span>
            </div>
          </div>

          <!-- Preview Modal -->
          <div id="preview-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div class="flex items-center justify-between p-4 border-b">
                <h4 id="preview-title" class="font-semibold">Preview</h4>
                <button id="close-preview" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div id="preview-content" class="p-4 overflow-auto max-h-[70vh]"></div>
              <div class="p-4 border-t flex justify-end gap-2">
                <button id="cancel-upload" class="btn-secondary">Batal</button>
                <button id="confirm-upload" class="btn-primary">Upload</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Document List -->
        <div id="document-list" class="card hidden">
          <div class="p-4 border-b">
            <h3 class="font-semibold text-gray-800">Daftar Dokumen</h3>
          </div>
          <div class="divide-y" id="documents-container">
            <!-- Documents rendered here -->
          </div>
        </div>

        <!-- Empty State -->
        <div id="empty-state" class="card p-12 text-center hidden">
          <div class="text-5xl mb-4">📋</div>
          <h3 class="font-semibold text-gray-800 mb-2">Pilih Jamaah</h3>
          <p class="text-gray-400 text-sm">Pilih jamaah di atas untuk melihat dan upload dokumen.</p>
        </div>
      </div>
    `

    this.attachEvents()
    
    // Show empty state initially
    document.getElementById('empty-state').classList.remove('hidden')
  }

  attachEvents() {
    const select = document.getElementById('jamaah-select')
    select?.addEventListener('change', (e) => {
      this.selectedJamaahId = e.target.value
      this.showJamaahDocuments()
    })

    const dropZone = document.getElementById('drop-zone')
    const fileInput = document.getElementById('file-input')

    dropZone?.addEventListener('click', () => fileInput?.click())
    
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
      const files = e.dataTransfer?.files
      if (files?.length) this.handleFileSelect(files[0])
    })

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) this.handleFileSelect(e.target.files[0])
    })

    document.getElementById('close-preview')?.addEventListener('click', () => this.closePreview())
    document.getElementById('cancel-upload')?.addEventListener('click', () => this.closePreview())
    document.getElementById('confirm-upload')?.addEventListener('click', () => this.uploadFile())
  }

  showJamaahDocuments() {
    const uploadSection = document.getElementById('upload-section')
    const documentList = document.getElementById('document-list')
    const emptyState = document.getElementById('empty-state')

    if (!this.selectedJamaahId) {
      uploadSection?.classList.add('hidden')
      documentList?.classList.add('hidden')
      emptyState?.classList.remove('hidden')
      return
    }

    emptyState?.classList.add('hidden')
    uploadSection?.classList.remove('hidden')
    documentList?.classList.remove('hidden')

    const jamaatDocs = this.dokumens.filter(d => d.jamaahId === this.selectedJamaahId)
    const container = document.getElementById('documents-container')

    if (!jamaatDocs.length) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>Belum ada dokumen diupload</p>
        </div>
      `
      return
    }

    container.innerHTML = jamaatDocs.map(doc => this.renderDocumentRow(doc)).join('')
    this.attachDocumentEvents()
  }

  renderDocumentRow(doc) {
    const isExpired = doc.kadaluarsa && new Date(doc.kadaluarsa) < new Date()
    const statusColor = doc.status === 'approved' ? 'bg-green-100 text-green-700' 
      : isExpired ? 'bg-orange-100 text-orange-700' 
      : 'bg-gray-100 text-gray-700'
    const statusIcon = doc.status === 'approved' ? '✅' : isExpired ? '⚠️' : '📄'

    const isImage = doc.data?.startsWith('data:image')
    const isPDF = doc.data?.startsWith('data:application/pdf')

    return `
      <div class="flex items-center gap-4 p-4 hover:bg-gray-50" data-doc-id="${doc.id}">
        <div class="text-2xl">${statusIcon}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-800">${doc.jenis}</p>
            <span class="text-xs px-2 py-0.5 rounded-full ${statusColor}">${isExpired ? 'Kedaluarsa' : doc.status}</span>
          </div>
          <p class="text-xs text-gray-400">${doc.namaFile} • Upload: ${formatDate(doc.tanggalUpload)}</p>
          ${doc.kadaluarsa ? `<p class="text-xs text-gray-400">Kadaluarsa: ${formatDate(doc.kadaluarsa)}</p>` : ''}
        </div>
        <div class="flex gap-2">
          ${(isImage || isPDF) ? `
            <button class="btn-view-doc btn-icon" data-doc='${JSON.stringify(doc).replace(/'/g, "&#39;")}' title="Lihat">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
          ` : ''}
          <button class="btn-delete-doc btn-icon text-red-500 hover:bg-red-50" data-doc-id="${doc.id}" title="Hapus">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `
  }

  attachDocumentEvents() {
    document.querySelectorAll('.btn-view-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const doc = JSON.parse(btn.dataset.doc.replace(/&#39;/g, "'"))
        this.viewDocument(doc)
      })
    })

    document.querySelectorAll('.btn-delete-doc').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Hapus dokumen ini?')) {
          await this.deleteDocument(btn.dataset.docId)
        }
      })
    })
  }

  viewDocument(doc) {
    const isImage = doc.data?.startsWith('data:image')
    const isPDF = doc.data?.startsWith('data:application/pdf')

    const previewContent = document.getElementById('preview-content')
    const previewTitle = document.getElementById('preview-title')
    const previewModal = document.getElementById('preview-modal')

    previewTitle.textContent = `${doc.jenis} - ${doc.namaFile}`

    if (isImage) {
      previewContent.innerHTML = `<img src="${doc.data}" alt="${doc.jenis}" class="max-w-full h-auto rounded-lg" />`
    } else if (isPDF) {
      previewContent.innerHTML = `<iframe src="${doc.data}" class="w-full h-96 rounded-lg"></iframe>`
    } else {
      previewContent.innerHTML = `<div class="text-center text-gray-400 py-12">Preview tidak tersedia</div>`
    }

    previewModal.classList.remove('hidden')
  }

  closePreview() {
    document.getElementById('preview-modal')?.classList.add('hidden')
    this.selectedFile = null
    this.selectedDocType = null
  }

  async handleFileSelect(file) {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Format file tidak valid. Gunakan JPG, PNG, atau PDF', 'error')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showToast('File terlalu besar. Maksimal 5MB', 'error')
      return
    }

    this.selectedFile = file

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      this.selectedFileData = e.target.result
      this.showFilePreview(file, e.target.result)
    }
    reader.readAsDataURL(file)
  }

  showFilePreview(file, dataUrl) {
    const previewContent = document.getElementById('preview-content')
    const previewTitle = document.getElementById('preview-title')
    const previewModal = document.getElementById('preview-modal')
    const progressSection = document.getElementById('upload-progress')

    previewModal.classList.remove('hidden')
    progressSection.classList.add('hidden')

    const isImage = file.type.startsWith('image')
    const isPDF = file.type === 'application/pdf'

    previewTitle.textContent = `Preview: ${file.name}`

    if (isImage) {
      previewContent.innerHTML = `<img src="${dataUrl}" alt="Preview" class="max-w-full h-auto rounded-lg max-h-96" />`
    } else if (isPDF) {
      previewContent.innerHTML = `<iframe src="${dataUrl}" class="w-full h-96 rounded-lg"></iframe>`
    }

    // Show document type selector
    previewContent.innerHTML += `
      <div class="mt-4">
        <label class="form-label">Jenis Dokumen</label>
        <select id="doc-type-select" class="form-select w-full">
          ${DOKUMEN_JENIS.map(j => `<option value="${j}">${j}</option>`).join('')}
        </select>
      </div>
      <div class="mt-4">
        <label class="form-label">Tanggal Kadaluarsa (opsional)</label>
        <input type="date" id="doc-expire-date" class="form-input w-full" />
      </div>
    `
  }

  async uploadFile() {
    const typeSelect = document.getElementById('doc-type-select')
    const expireDate = document.getElementById('doc-expire-date')

    if (!typeSelect?.value) {
      showToast('Pilih jenis dokumen', 'error')
      return
    }

    if (this.isUploading) return
    this.isUploading = true

    const progressSection = document.getElementById('upload-progress')
    const progressBar = document.getElementById('progress-bar')
    const progressText = document.getElementById('progress-text')
    
    progressSection.classList.remove('hidden')

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress > 100) progress = 100
      progressBar.style.width = `${progress}%`
      progressText.textContent = `${Math.round(progress)}%`
    }, 200)

    try {
      const docData = {
        id: 'D' + Date.now(),
        jamaahId: this.selectedJamaahId,
        jenis: typeSelect.value,
        namaFile: this.selectedFile.name,
        tanggalUpload: new Date().toISOString().split('T')[0],
        status: 'approved',
        kadaluarsa: expireDate?.value || null,
        data: this.selectedFileData // base64
      }

      // Save to API
      await api.createDokumen(docData)
      
      // Also save to localStorage for backup
      const localDocs = lsGet('dokumen_local', [])
      localDocs.push(docData)
      lsSet('dokumen_local', localDocs)

      // Update local state
      this.dokumens.push(docData)

      clearInterval(interval)
      progressBar.style.width = '100%'
      progressText.textContent = '100%'

      showToast('Dokumen berhasil diupload!', 'success')
      this.closePreview()
      this.showJamaahDocuments()
    } catch (err) {
      clearInterval(interval)
      console.error('Upload error:', err)
      showToast('Gagal upload dokumen', 'error')
    } finally {
      this.isUploading = false
      setTimeout(() => {
        progressSection.classList.add('hidden')
        progressBar.style.width = '0%'
        progressText.textContent = '0%'
      }, 1000)
    }
  }

  async deleteDocument(docId) {
    try {
      await api.updateDokumen(docId, { deletedAt: new Date().toISOString() })
      this.dokumens = this.dokumens.filter(d => d.id !== docId)
      showToast('Dokumen dihapus', 'success')
      this.showJamaahDocuments()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Gagal menghapus dokumen', 'error')
    }
  }
}
