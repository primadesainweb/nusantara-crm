/**
 * Paket Manifest View (T-38) - Improved with grouping by tipe kamar
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class PaketManifestView {
  constructor({ params, query } = {}) {
    this.params = params
    this.paketId = params?.id
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [paket, jamaahs, pembayarans, dokumens] = await Promise.all([
        api.getPaketById(this.paketId),
        api.getJamaah(),
        api.getPembayaran(),
        api.getDokumen(),
      ])

      this.paket = paket
      // Filter jamaahs by this paket
      this.jamaahs = jamaahs.filter(j => j.paketId === this.paketId && !j.deletedAt)

      // Get pembayaran and dokumen for jamaahs
      const jamaatIds = this.jamaahs.map(j => j.id)
      this.pembayarans = pembayarans.filter(p => jamaatIds.includes(p.jamaahId))
      this.dokumens = dokumens.filter(d => jamaatIds.includes(d.jamaahId))

      // Create lookup maps
      this.pembayaranMap = Object.fromEntries(this.pembayarans.map(p => [p.jamaahId, p]))
      this.dokumenMap = {}
      this.dokumens.forEach(d => {
        if (!this.dokumenMap[d.jamaahId]) this.dokumenMap[d.jamaahId] = []
        this.dokumenMap[d.jamaahId].push(d)
      })

      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  getDokumenStatus(jamaahId) {
    const docs = this.dokumenMap[jamaahId] || []
    const required = ['KTP', 'Passport']
    const missing = required.filter(r => !docs.find(d => d.jenis === r && d.status === 'approved'))

    if (missing.length === 0) return { label: 'Lengkap', class: 'badge-success' }
    if (missing.length < required.length) return { label: `${missing.length} belum`, class: 'badge-warning' }
    return { label: 'Belum lengkap', class: 'badge-danger' }
  }

  getBayarStatus(pembayaran) {
    if (!pembayaran) return { label: 'Belum ada', class: 'badge-danger' }
    if (pembayaran.status === 'lunas') return { label: 'Lunas', class: 'badge-success' }
    if (pembayaran.status === 'cicilan') return { label: 'Cicilan', class: 'badge-info' }
    return { label: 'Pending', class: 'badge-warning' }
  }

  // Group jamaahs by tipe kamar
  groupByTipeKamar() {
    const groups = {}
    this.jamaahs.forEach(j => {
      const tipe = j.tipeKamar || 'Lainnya'
      if (!groups[tipe]) groups[tipe] = []
      groups[tipe].push(j)
    })
    return groups
  }

  render() {
    const p = this.paket

    // Summary stats
    const totalJamaah = this.jamaahs.length
    const lunasCount = this.pembayarans.filter(b => b.status === 'lunas').length
    const cicilanCount = this.pembayarans.filter(b => b.status === 'cicilan').length
    const docsComplete = this.jamaahs.filter(j => {
      const status = this.getDokumenStatus(j.id)
      return status.label === 'Lengkap'
    }).length

    // Group by tipe kamar
    const groupedJamaahs = this.groupByTipeKamar()

    this.el.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a href="#/paket/${p.id}" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </a>
            </div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Manifest Jama'ah</h2>
            <p class="text-gray-500 text-sm">${p.nama} - ${formatDate(p.tanggalBerangkat, 'DD MMM YYYY')}</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-export-pdf" class="btn-primary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Export PDF
            </button>
            <button id="btn-print" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-gray-900">${totalJamaah}</p>
            <p class="text-xs text-gray-500">Total Jama'ah</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-green-600">${lunasCount}</p>
            <p class="text-xs text-gray-500">Lunas</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-blue-600">${cicilanCount}</p>
            <p class="text-xs text-gray-500">Cicilan</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-3xl font-bold text-primary-600">${docsComplete}</p>
            <p class="text-xs text-gray-500">Dokumen Lengkap</p>
          </div>
        </div>

        <!-- Grouped by Tipe Kamar -->
        ${Object.entries(groupedJamaahs).map(([tipe, jamaats]) => `
          <div class="card overflow-hidden">
            <div class="p-4 bg-gray-50 border-b">
              <h3 class="font-semibold text-gray-800 capitalize">${tipe} - ${jamaats.length} Jama'ah</h3>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Jama'ah</th>
                  <th>NIK</th>
                  <th>No. Passport</th>
                  <th>Kontak Darurat</th>
                  <th>HP Darurat</th>
                  <th>Status Dokumen</th>
                  <th>Status Bayar</th>
                </tr>
              </thead>
              <tbody>
                ${jamaats.map((j, i) => {
                  const docs = this.dokumenMap[j.id] || []
                  const passport = docs.find(d => d.jenis === 'Passport')
                  const docStatus = this.getDokumenStatus(j.id)
                  const bayarStatus = this.getBayarStatus(this.pembayaranMap[j.id])

                  return `
                    <tr class="${i % 2 === 0 ? 'bg-gray-50' : ''}">
                      <td>${i + 1}</td>
                      <td>
                        <div>
                          <p class="font-medium">${j.nama}</p>
                          <p class="text-xs text-gray-400">${j.noJamaah || ''}</p>
                        </div>
                      </td>
                      <td class="font-mono text-sm">${j.nik || '-'}</td>
                      <td class="font-mono text-sm">${passport?.namaFile ? passport.namaFile.replace(/[^A-Z0-9]/gi, '').substring(0, 9) : '-'}</td>
                      <td class="text-sm">${j.kontakDarurat || '-'}</td>
                      <td class="text-sm">${j.hpDarurat || '-'}</td>
                      <td><span class="badge ${docStatus.class}">${docStatus.label}</span></td>
                      <td><span class="badge ${bayarStatus.class}">${bayarStatus.label}</span></td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <!-- Empty state -->
        ${this.jamaahs.length === 0 ? `
          <div class="card p-12 text-center">
            <div class="text-5xl mb-4">📋</div>
            <h3 class="font-semibold text-gray-800 mb-2">Belum Ada Jama'ah</h3>
            <p class="text-gray-500 text-sm">Belum ada jama'ah yang terdaftar di paket ini.</p>
          </div>
        ` : ''}
      </div>
    `

    this.attachEvents()
  }

  attachEvents() {
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportPDF())
    document.getElementById('btn-print')?.addEventListener('click', () => this.printManifest())
  }

  async exportPDF() {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF('l', 'mm', 'a4') // landscape
    const p = this.paket

    // Company Header
    doc.setFillColor(13, 124, 102) // primary green
    doc.rect(0, 0, 297, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('NUSANTARA TRAVEL', 148, 10, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Manifest Jamaah - ' + p.nama, 148, 17, { align: 'center' })

    // Sub header info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.text(`Berangkat: ${formatDate(p.tanggalBerangkat, 'DD MMMM YYYY')} - Kembali: ${formatDate(p.tanggalKembali, 'DD MMMM YYYY')}`, 148, 32, { align: 'center' })
    doc.text(`Hotel: ${p.hotel} | Maskapai: ${p.maskapai}`, 148, 37, { align: 'center' })

    // Group by tipe kamar
    const groupedJamaahs = this.groupByTipeKamar()
    let yPos = 45

    Object.entries(groupedJamaahs).forEach(([tipe, jamaats]) => {
      // Check if we need a new page
      if (yPos > 180) {
        doc.addPage()
        yPos = 20
      }

      // Group header
      doc.setFillColor(240, 240, 240)
      doc.rect(10, yPos - 4, 277, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`${tipe.toUpperCase()} - ${jamaats.length} Jamaah`, 12, yPos)
      yPos += 8

      // Table header
      doc.setFillColor(13, 124, 102)
      doc.rect(10, yPos - 4, 277, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')

      const headers = ['No', 'Nama', 'NIK', 'Passport', 'Kontak Darurat', 'HP Darurat', 'Dok', 'Bayar']
      const colWidths = [10, 50, 35, 30, 45, 35, 25, 25]
      let xPos = 12

      headers.forEach((h, i) => {
        doc.text(h, xPos, yPos)
        xPos += colWidths[i]
      })
      yPos += 5

      // Table body
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')

      jamaats.forEach((j, i) => {
        if (yPos > 185) {
          doc.addPage()
          yPos = 20
        }

        const docs = this.dokumenMap[j.id] || []
        const passport = docs.find(d => d.jenis === 'Passport')
        const docStatus = this.getDokumenStatus(j.id)
        const bayarStatus = this.getBayarStatus(this.pembayaranMap[j.id])

        // Alternate row background
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250)
          doc.rect(10, yPos - 3, 277, 5, 'F')
        }

        xPos = 12
        const row = [
          String(i + 1),
          (j.nama || '-').substring(0, 25),
          j.nik ? String(j.nik).substring(0, 16) : '-',
          passport ? 'Ada' : '-',
          (j.kontakDarurat || '-').substring(0, 25),
          j.hpDarurat || '-',
          docStatus.label,
          bayarStatus.label
        ]

        row.forEach((cell, j) => {
          doc.text(String(cell).substring(0, 20), xPos, yPos)
          xPos += colWidths[j]
        })

        yPos += 5
      })

      yPos += 5 // Gap between groups
    })

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Dicetak: ${formatDate(new Date(), 'DD MMMM YYYY HH:mm')} - Nusantara CRM`, 148, 200, { align: 'center' })

    doc.save(`Manifest_${p.id}_${formatDate(new Date(), 'YYYYMMDD')}.pdf`)
    showToast('Manifest berhasil diunduh!', 'success')
  }

  printManifest() {
    // Get the manifest content and open print dialog
    const printContent = this.el.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Manifest - ${this.paket.nama}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              .no-print { display: none !important; }
              .card { border: 1px solid #e5e7eb; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
              th { background: #0D7C66; color: white; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}
