/**
 * Dokumen Checklist per Jamaah (T-30)
 * Visual checklist per jamaat: uploaded (green) / missing (red) / expired (orange)
 */
import api from '../../api/api.js'
import { showToast, formatDate, percentOf } from '../../utils/helpers.js'

const REQUIRED_DOCS = ['KTP', 'Passport', 'Foto 3x4', 'KK', 'Vaksin']
const MARRIED_ONLY_DOCS = ['Buku Nikah']

export default class DokumenChecklistView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.jamaahs = []
    this.dokumens = []
    this.filter = 'all' // all, incomplete, complete
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
      this.dokumens = dokumens.filter(d => !d.deletedAt)
    } catch (err) {
      console.error('Failed to load data:', err)
      showToast('Gagal memuat data', 'error')
    }
  }

  getKelengkapanDocs(jamaahId) {
    const docs = this.dokumens.filter(d => d.jamaahId === jamaahId)
    const jamaat = this.jamaahs.find(j => j.id === jamaahId)
    const isMarried = jamaat?.statusMenikah === 'menikah' || jamaat?.statusKeluarga?.includes('Suami') || jamaat?.statusKeluarga?.includes('Istri')

    // Calculate required docs
    let required = [...REQUIRED_DOCS]
    if (isMarried) {
      required = required.concat(MARRIED_ONLY_DOCS)
    }

    const result = {
      total: required.length,
      uploaded: 0,
      expired: 0,
      missing: 0,
      details: []
    }

    required.forEach(jenis => {
      const doc = docs.find(d => d.jenis === jenis)
      if (!doc) {
        result.missing++
        result.details.push({ jenis, status: 'missing', doc: null })
      } else if (doc.kadaluarsa && new Date(doc.kadaluarsa) < new Date()) {
        result.expired++
        result.details.push({ jenis, status: 'expired', doc })
      } else {
        result.uploaded++
        result.details.push({ jenis, status: 'uploaded', doc })
      }
    })

    result.percent = percentOf(result.uploaded, result.total)
    result.isComplete = result.missing === 0 && result.expired === 0

    return result
  }

  render() {
    const incompleteCount = this.jamaahs.filter(j => !this.getKelengkapanDocs(j.id).isComplete).length

    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Checklist Dokumen</h2>
            <p class="text-gray-500 text-sm mt-1">Kelengkapan dokumen seluruh jamaah</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-500">
              <span class="font-semibold text-red-500">${incompleteCount}</span> jamaat belum lengkap
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="card p-1 inline-flex">
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="all">
            Semua (${this.jamaahs.length})
          </button>
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'incomplete' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="incomplete">
            Belum Lengkap (${incompleteCount})
          </button>
          <button class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors ${this.filter === 'complete' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}" data-filter="complete">
            Lengkap (${this.jamaahs.length - incompleteCount})
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-gray-900">${this.jamaahs.length}</p>
            <p class="text-xs text-gray-500">Total Jamaah</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-green-600">${this.jamaahs.length - incompleteCount}</p>
            <p class="text-xs text-gray-500">Dokumen Lengkap</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-red-600">${incompleteCount}</p>
            <p class="text-xs text-gray-500">Belum Lengkap</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-orange-600">${this.jamaahs.filter(j => this.getKelengkapanDocs(j.id).expired > 0).length}</p>
            <p class="text-xs text-gray-500">Dokumen Kadaluarsa</p>
          </div>
        </div>

        <!-- Jamaah List -->
        <div class="space-y-3" id="jamaah-list">
          ${this.renderJamaahList()}
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderJamaahList() {
    let filteredJamaahs = [...this.jamaahs]

    if (this.filter === 'incomplete') {
      filteredJamaahs = filteredJamaahs.filter(j => !this.getKelengkapanDocs(j.id).isComplete)
    } else if (this.filter === 'complete') {
      filteredJamaahs = filteredJamaahs.filter(j => this.getKelengkapanDocs(j.id).isComplete)
    }

    if (!filteredJamaahs.length) {
      return `
        <div class="card p-12 text-center">
          <div class="text-5xl mb-4">📋</div>
          <h3 class="font-semibold text-gray-800 mb-2">Tidak ada data</h3>
          <p class="text-gray-400 text-sm">Tidak ada jamaat yang sesuai filter.</p>
        </div>
      `
    }

    return filteredJamaahs.map(jamaah => {
      const kel = this.getKelengkapanDocs(jamaah.id)
      return this.renderJamaahCard(jamaah, kel)
    }).join('')
  }

  renderJamaahCard(jamaah, kel) {
    const statusColor = kel.isComplete ? 'border-green-200 bg-green-50' 
      : kel.expired > 0 ? 'border-orange-200 bg-orange-50'
      : 'border-red-200 bg-red-50'
    const badgeClass = kel.isComplete ? 'bg-green-100 text-green-700' 
      : kel.expired > 0 ? 'bg-orange-100 text-orange-700'
      : 'bg-red-100 text-red-700'

    return `
      <div class="card border-l-4 ${statusColor}">
        <div class="p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <a href="#/jamaah/${jamaah.id}" class="font-semibold text-gray-900 hover:text-primary-600">${jamaah.nama}</a>
                ${!kel.isComplete ? '<span class="w-2 h-2 rounded-full bg-red-500" title="Dokumen tidak lengkap"></span>' : ''}
                <span class="badge ${badgeClass}">${kel.percent}%</span>
              </div>
              <p class="text-xs text-gray-400 mb-3">${jamaah.noJamaah} • ${jamaah.paketId || '-'}</p>
              
              <!-- Progress Bar -->
              <div class="mb-3">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Kelengkapan</span>
                  <span>${kel.uploaded}/${kel.total} dokumen</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all ${kel.isComplete ? 'bg-green-500' : kel.expired > 0 ? 'bg-orange-500' : 'bg-red-500'}" style="width: ${kel.percent}%"></div>
                </div>
              </div>

              <!-- Document Checklist -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                ${kel.details.map(d => `
                  <div class="flex items-center gap-1.5 text-xs ${d.status === 'uploaded' ? 'text-green-600' : d.status === 'expired' ? 'text-orange-600' : 'text-red-500'}">
                    ${d.status === 'uploaded' ? '✅' : d.status === 'expired' ? '⚠️' : '❌'}
                    <span>${d.jenis}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="text-right shrink-0">
              ${kel.missing > 0 ? `
                <p class="text-xs text-red-500 font-medium">${kel.missing} belum upload</p>
              ` : ''}
              ${kel.expired > 0 ? `
                <p class="text-xs text-orange-500 font-medium">${kel.expired} kadaluarsa</p>
              ` : ''}
              ${kel.isComplete ? `
                <p class="text-xs text-green-500 font-medium">✅ Lengkap</p>
              ` : ''}
              <a href="#/dokumen?jamaah=${jamaah.id}" class="btn-secondary text-xs mt-2 inline-block">
                Upload
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }

  attachEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('bg-primary-500', 'text-white')
          b.classList.add('text-gray-600', 'hover:bg-gray-100')
        })
        btn.classList.add('bg-primary-500', 'text-white')
        btn.classList.remove('text-gray-600', 'hover:bg-gray-100')
        document.getElementById('jamaah-list').innerHTML = this.renderJamaahList()
      })
    })
  }
}
