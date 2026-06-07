/**
 * Kuitansi View (T-24) - Print receipt via jsPDF
 */
import api from '../../api/api.js'
import { formatRupiah, formatDate, showToast } from '../../utils/helpers.js'

export default class KuitansiView {
  constructor({ params, query } = {}) {
    this.params = params
    this.transaksiId = params?.id
    this.previewMode = false
  }

  async mount(el) {
    this.el = el
    await this.loadData()
  }

  async loadData() {
    try {
      const [transaksis, jamaahs, pakets, settings] = await Promise.all([
        api.getTransaksi(),
        api.getJamaah(),
        api.getPaket(),
        api.getSettings?.() || {},
      ])

      this.transaksi = transaksis.find(t => t.id === this.transaksiId)
      this.jamaah = jamaahs.find(j => j.id === this.transaksi?.jamaahId)
      this.paket = pakets.find(p => p.id === this.transaksi?.paketId)
      this.settings = settings

      this.render()
    } catch (e) {
      showToast('Gagal memuat data', 'error')
    }
  }

  render() {
    if (!this.transaksi) {
      this.el.innerHTML = `<div class="text-center py-12 text-gray-400">Transaksi tidak ditemukan</div>`
      return
    }

    this.el.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Kuitansi Pembayaran</h2>
            <p class="text-gray-500 text-sm">No: ${this.transaksi.id}</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-print-preview" class="btn-secondary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Preview
            </button>
            <button id="btn-download" class="btn-primary">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download PDF
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div id="kuitansi-preview" class="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
          ${this.generateKuitansiHTML()}
        </div>
      </div>
    `

    this.attachEvents()
  }

  generateKuitansiHTML() {
    const t = this.transaksi
    const j = this.jamaah
    const p = this.paket
    const companyName = this.settings?.companyName || 'Nusantara Travel Umroh & Haji'
    const companyAddress = this.settings?.address || 'Jl. Sudirman No. 123, Jakarta Selatan'
    const companyPhone = this.settings?.phone || '021-1234567'

    return `
      <div class="text-center border-b-2 border-gray-200 pb-6 mb-6">
        <div class="flex items-center justify-center gap-4 mb-4">
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl">🕋</div>
          <div class="text-left">
            <h1 class="text-xl font-bold text-gray-900">${companyName}</h1>
            <p class="text-sm text-gray-500">${companyAddress}</p>
            <p class="text-sm text-gray-500">Telp: ${companyPhone}</p>
          </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">KUITANSI PEMBAYARAN</h2>
        <p class="text-gray-500">No: ${t.id}</p>
      </div>

      <div class="space-y-4 mb-8">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Telah terima dari</p>
            <p class="font-semibold text-lg">${j?.nama || '-'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal</p>
            <p class="font-semibold">${formatDate(t.tanggal, 'DD MMMM YYYY')}</p>
          </div>
        </div>

        <div>
          <p class="text-sm text-gray-500">Untuk Pembayaran</p>
          <p class="font-semibold">${p?.nama || '-'}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Jenis Pembayaran</p>
            <p class="font-semibold capitalize">${t.jenis || 'Pembayaran'}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Metode</p>
            <p class="font-semibold capitalize">${this.getMetodeLabel(t.metode)}</p>
          </div>
        </div>

        ${t.referensi ? `
          <div>
            <p class="text-sm text-gray-500">Nomor Referensi</p>
            <p class="font-semibold">${t.referensi}</p>
          </div>
        ` : ''}
      </div>

      <div class="bg-primary-50 rounded-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-600">Jumlah</span>
        </div>
        <p class="text-3xl font-bold text-gray-900">${formatRupiah(t.nominal)}</p>
        <p class="text-sm text-gray-500 mt-1">Terbilang: <em>${this.terbilang(t.nominal)}</em></p>
      </div>

      ${t.catatan ? `
        <div class="border-t border-gray-200 pt-4 mb-8">
          <p class="text-sm text-gray-500">Catatan:</p>
          <p class="text-sm">${t.catatan}</p>
        </div>
      ` : ''}

      <div class="grid grid-cols-3 gap-8 mt-12">
        <div class="text-center">
          <div class="h-16 border-b-2 border-gray-300 mb-2"></div>
          <p class="text-sm text-gray-500">Pemberi</p>
          <p class="text-sm font-medium">(${j?.nama || '-'})</p>
        </div>
        <div class="text-center">
          <div class="h-16 border-b-2 border-gray-300 mb-2"></div>
          <p class="text-sm text-gray-500">Mengetahui</p>
          <p class="text-sm font-medium">Admin</p>
        </div>
        <div class="text-center">
          <div class="h-16 border-b-2 border-gray-300 mb-2"></div>
          <p class="text-sm text-gray-500">Penerima</p>
          <p class="text-sm font-medium">Bendahara</p>
        </div>
      </div>

      <div class="text-center mt-8 pt-4 border-t border-gray-200">
        <p class="text-xs text-gray-400">Dicetak pada ${formatDate(new Date(), 'DD MMMM YYYY HH:mm')}</p>
      </div>
    `
  }

  getMetodeLabel(metode) {
    const labels = { transfer: 'Transfer Bank', tunai: 'Tunai', qris: 'QRIS' }
    return labels[metode] || metode
  }

  attachEvents() {
    document.getElementById('btn-download')?.addEventListener('click', () => this.downloadPDF())
    document.getElementById('btn-print-preview')?.addEventListener('click', () => this.printPreview())
  }

  async downloadPDF() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    const t = this.transaksi
    const j = this.jamaah
    const p = this.paket

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('KUITANSI PEMBAYARAN', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`No: ${t.id}`, 105, 28, { align: 'center' })

    // Line
    doc.setLineWidth(0.5)
    doc.line(20, 32, 190, 32)

    // Content
    let y = 45
    doc.setFontSize(10)
    doc.text('Telah terima dari:', 20, y)
    doc.setFont('helvetica', 'bold')
    doc.text(j?.nama || '-', 60, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.text('Tanggal:', 20, y)
    doc.text(formatDate(t.tanggal, 'DD MMMM YYYY'), 60, y)
    y += 8

    doc.text('Untuk Pembayaran:', 20, y)
    doc.setFont('helvetica', 'bold')
    doc.text(p?.nama || '-', 60, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.text('Metode:', 20, y)
    doc.text(this.getMetodeLabel(t.metode), 60, y)
    y += 8

    if (t.referensi) {
      doc.text('Referensi:', 20, y)
      doc.text(t.referensi, 60, y)
      y += 8
    }

    // Amount box
    y += 5
    doc.setFillColor(240, 248, 240)
    doc.rect(20, y - 5, 170, 25, 'F')
    doc.setFontSize(12)
    doc.text('Jumlah:', 25, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(formatRupiah(t.nominal), 25, y + 15)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(`Terbilang: ${this.terbilang(t.nominal)}`, 20, y + 35)

    // Signature
    y = 140
    doc.setFont('helvetica', 'normal')
    doc.text('Pemberi,'  , 30, y, { align: 'center' })
    doc.text('Admin,'     , 105, y, { align: 'center' })
    doc.text('Penerima,' , 175, y, { align: 'center' })

    y += 25
    doc.line(25, y, 55, y)
    doc.line(90, y, 120, y)
    doc.line(160, y, 190, y)

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Dicetak: ${formatDate(new Date(), 'DD MMMM YYYY HH:mm')}`, 105, 285, { align: 'center' })

    doc.save(`Kuitansi_${t.id}.pdf`)
    showToast('Kuitansi berhasil diunduh!', 'success')
  }

  printPreview() {
    const content = document.getElementById('kuitansi-preview')
    if (!content) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kuitansi ${this.transaksi.id}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css">
        <style>
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>${content.outerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Indonesian number to words
  terbatas(number) {
    return this.terbilang(number)
  }

  terbilang(angka) {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
    const n = Math.floor(angka)

    if (n < 12) return units[n]
    if (n < 20) return units[n - 10] + ' Belas'
    if (n < 100) return units[Math.floor(n / 10)] + ' Puluh ' + units[n % 10]
    if (n < 200) return 'Seratus ' + this.terbilang(n - 100)
    if (n < 1000) return units[Math.floor(n / 100)] + ' Ratus ' + this.terbilang(n % 100)
    if (n < 2000) return 'Seribu ' + this.terbilang(n - 1000)
    if (n < 1000000) return this.terbilang(Math.floor(n / 1000)) + ' Ribu ' + this.terbilang(n % 1000)
    if (n < 1000000000) return this.terbilang(Math.floor(n / 1000000)) + ' Juta ' + this.terbilang(n % 1000000)

    return n.toLocaleString('id-ID')
  }
}
