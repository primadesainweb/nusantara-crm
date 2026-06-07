/**
 * WhatsApp Message Templates (T-35)
 * Templates: Konfirmasi pendaftaran, Pengingat cicilan, Info dokumen kurang,
 *            Info keberangkatan, Ucapan selamat
 */
import { showToast, formatRupiah, formatDate, lsGet, lsSet } from '../../utils/helpers.js'

const DEFAULT_TEMPLATES = [
  {
    id: 'konfirmasi-daftar',
    name: 'Konfirmasi Pendaftaran',
    template: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Alhamdulillah, pendaftaran ${'{nama}'} untuk paket *${'{paket}'}* telah kami terima.

📋 Detail Pendaftaran:
• Jamaah: ${'{nama}'}
• Paket: ${'{paket}'}
• Tanggal Berangkat: ${'{tanggalBerangkat}'}

Terima kasih atas kepercayaan Anda menggunakan Nusantara Travel. Semoga ibadah kita lancar dan diterima Allah SWT. 🤲

Wassalamu'alaikum Warahmatullahi Wabarakatuh,
Nusantara Travel`,
    variables: ['nama', 'paket', 'tanggalBerangkat']
  },
  {
    id: 'pengingat-cicilan',
    name: 'Pengingat Cicilan',
    template: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. ${'{nama}'},

Berikut kami informasikan jadwal pembayaran cicilan Anda:

💰 Rincian:
• Paket: ${'{paket}'}
• Nominal: ${'{nominal}'}
• Jatuh Tempo: ${'{tanggal}'}
• Sisa Pembayaran: ${'{sisa}'}

Mohon untuk melakukan pembayaran sebelum jatuh tempo. Pembayaran dapat dilakukan melalui transfer ke rekening yang tertera di surat komitmen.

Jazakumullahu khairan,
Nusantara Travel`,
    variables: ['nama', 'paket', 'nominal', 'tanggal', 'sisa']
  },
  {
    id: 'info-dokumen-kurang',
    name: 'Info Dokumen Kurang',
    template: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. ${'{nama}'},

Semoga ibadah kita dalam kebaikan. Aamiin.

Berkaitan dengan persiapan keberangkatan paket *${'{paket}'}*, kami informasikan bahwa masih ada beberapa dokumen yang belum dilengkapi:

📄 Dokumen yang diperlukan:
${'{listDokumen}'}

Mohon segera melengkapi dokumen tersebut paling lambat 2 minggu sebelum keberangkatan agar proses visa dan akomodasi tidak terganggu.

Terima kasih atas kerjasamanya.

Wassalamu'alaikum,
Nusantara Travel`,
    variables: ['nama', 'paket', 'listDokumen']
  },
  {
    id: 'info-keberangkatan',
    name: 'Info Keberangkatan',
    template: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Yth. ${'{nama}'},

Alhamdulillah, berikut kami sampaikan informasi keberangkatan Anda:

✈️ Detail Keberangkatan:
• Paket: ${'{paket}'}
• Tanggal Berangkat: ${'{tanggalBerangkat}'}
• Maskapai: ${'{maskapai}'}
• Hotel: ${'{hotel}'}

Persiapan yang perlu dibawa:
• Paspor asli (minimal 7 bulan masa berlaku)
• KTP asli
• Dokumen pendukung lainnya

Kami akan informasikan lebih lanjut mengenai waktu dan tempat berkumpul.

Hujan doa agar ibadah kita lancar dan kembali dengan khusyuk. 🤲

Wassalamu'alaikum,
Nusantara Travel`,
    variables: ['nama', 'paket', 'tanggalBerangkat', 'maskapai', 'hotel']
  },
  {
    id: 'ucapan-selamat',
    name: 'Ucapan Selamat',
    template: `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Maha Besar Allah SWT yang telah memilih hamba-Nya untuk melaksanakan ibadah umroh/haji. Selamat ${'{nama}'}! 🎉

Semoga Allah SWT memberikan kemudahan dalam setiap langkah, kemudahan dalam ibadahnya, dan receives(ridho) seluruh amal perbuatannya.

Kami dari Nusantara Travel akan selalu mendoakan dan mendampingi Anda dalam persiapan hingga pulang kembali dengan hati yang bersih dan penuh berkah.

Aamiin Ya Rabbal 'Alamiin. 🤲

Wassalamu'alaikum,
Nusantara Travel`,
    variables: ['nama']
  }
]

export default class WhatsAppTemplatesView {
  constructor({ params, query } = {}) {
    this.params = params
    this.query = query
    this.templates = lsGet('wa_templates', DEFAULT_TEMPLATES)
    this.selectedTemplate = null
    this.variables = {}
  }

  mount(el) {
    this.el = el
    this.render()
  }

  render() {
    this.el.innerHTML = `
      <div class="space-y-4">
        <!-- Page Header -->
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">Template Pesan WA</h2>
            <p class="text-gray-500 text-sm mt-1">Template pesan WhatsApp untuk komunikasi dengan jamaah</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Template List -->
          <div class="lg:col-span-1 card">
            <div class="p-4 border-b">
              <h3 class="font-semibold text-gray-800">Pilih Template</h3>
            </div>
            <div class="divide-y" id="template-list">
              ${this.templates.map(t => `
                <div class="p-4 hover:bg-gray-50 cursor-pointer template-item ${this.selectedTemplate?.id === t.id ? 'bg-primary-50' : ''}" data-template-id="${t.id}">
                  <p class="font-medium text-gray-800">${t.name}</p>
                  <p class="text-xs text-gray-400 mt-1 truncate">${t.template.substring(0, 50)}...</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Template Editor / Preview -->
          <div class="lg:col-span-2 card">
            <div class="p-4 border-b flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">Preview & Edit</h3>
              <button id="btn-reset-template" class="text-xs text-gray-400 hover:text-gray-600">Reset ke Default</button>
            </div>
            
            <div id="template-content" class="p-4">
              ${this.selectedTemplate ? this.renderTemplateEditor() : `
                <div class="text-center text-gray-400 py-12">
                  <div class="text-5xl mb-4">💬</div>
                  <p>Pilih template di samping untuk melihat preview</p>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `

    this.attachEvents()
  }

  renderTemplateEditor() {
    const t = this.selectedTemplate
    return `
      <!-- Template Name -->
      <div class="mb-4">
        <label class="form-label">Nama Template</label>
        <input type="text" id="template-name" class="form-input w-full" value="${t.name}" />
      </div>

      <!-- Variables -->
      <div class="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Isi Variable</h4>
        <div class="grid grid-cols-2 gap-3">
          ${t.variables.map(v => `
            <div>
              <label class="text-xs text-gray-500">${'{' + v + '}'}</label>
              <input type="text" class="form-input text-sm w-full variable-input" data-var="${v}" placeholder="Masukkan nilai..." />
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Template Body -->
      <div class="mb-4">
        <label class="form-label">Isi Template</label>
        <textarea id="template-body" class="form-input w-full font-mono text-sm" rows="12">${t.template}</textarea>
      </div>

      <!-- Preview -->
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Preview Pesan</h4>
        <div id="message-preview" class="p-4 bg-green-50 rounded-lg border border-green-200 whitespace-pre-wrap text-sm font-mono">
          ${this.getPreviewText()}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-between items-center">
        <button id="btn-save-template" class="btn-primary">Simpan Template</button>
        <button id="btn-open-wa" class="btn-secondary flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Kirim via WhatsApp
        </button>
      </div>
    `
  }

  getPreviewText() {
    if (!this.selectedTemplate) return ''
    
    const nameInput = document.getElementById('template-name')
    const bodyInput = document.getElementById('template-body')
    
    let text = bodyInput ? bodyInput.value : this.selectedTemplate.template
    
    // Replace variables
    document.querySelectorAll('.variable-input').forEach(input => {
      const varName = input.dataset.var
      const value = input.value || '[' + varName + ']'
      text = text.replace(new RegExp('\\{' + varName + '\\}', 'g'), value)
    })
    
    return text
  }

  updatePreview() {
    const preview = document.getElementById('message-preview')
    if (preview) {
      preview.textContent = this.getPreviewText()
    }
  }

  saveTemplate() {
    const nameInput = document.getElementById('template-name')
    const bodyInput = document.getElementById('template-body')
    
    if (!nameInput || !bodyInput) return
    
    const idx = this.templates.findIndex(t => t.id === this.selectedTemplate.id)
    if (idx !== -1) {
      this.templates[idx] = {
        ...this.templates[idx],
        name: nameInput.value,
        template: bodyInput.value
      }
      lsSet('wa_templates', this.templates)
      showToast('Template disimpan!', 'success')
      this.render()
    }
  }

  resetTemplate() {
    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === this.selectedTemplate.id)
    if (defaultTemplate) {
      const idx = this.templates.findIndex(t => t.id === this.selectedTemplate.id)
      if (idx !== -1) {
        this.templates[idx] = { ...defaultTemplate }
        lsSet('wa_templates', this.templates)
        showToast('Template di-reset', 'info')
        this.render()
      }
    }
  }

  openWhatsApp() {
    const text = this.getPreviewText()
    const phone = this.variables.phone || '08xxxxxxxxxx' // Default placeholder
    const waUrl = `https://wa.me/62${phone.replace(/^0/, '')}?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  attachEvents() {
    // Template selection
    document.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', () => {
        const templateId = item.dataset.templateId
        this.selectedTemplate = this.templates.find(t => t.id === templateId)
        document.getElementById('template-content').innerHTML = this.renderTemplateEditor()
        this.attachEditorEvents()
      })
    })

    // Initial editor events if template already selected
    if (this.selectedTemplate) {
      this.attachEditorEvents()
    }
  }

  attachEditorEvents() {
    // Variable inputs - update preview on change
    document.querySelectorAll('.variable-input').forEach(input => {
      input.addEventListener('input', () => this.updatePreview())
    })

    // Template name/body changes
    document.getElementById('template-name')?.addEventListener('input', () => this.updatePreview())
    document.getElementById('template-body')?.addEventListener('input', () => this.updatePreview())

    // Save template
    document.getElementById('btn-save-template')?.addEventListener('click', () => this.saveTemplate())

    // Reset template
    document.getElementById('btn-reset-template')?.addEventListener('click', () => this.resetTemplate())

    // Open WhatsApp
    document.getElementById('btn-open-wa')?.addEventListener('click', () => this.openWhatsApp())
  }
}

// Helper function to send WA message (can be called from other modules)
export function sendWhatsAppMessage(phone, message) {
  const cleanPhone = phone.replace(/^0/, '')
  const waUrl = `https://wa.me/62${cleanPhone}?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank')
}

// Helper to fill template with data
export function fillTemplate(templateId, variables) {
  const templates = lsGet('wa_templates', DEFAULT_TEMPLATES)
  const template = templates.find(t => t.id === templateId)
  
  if (!template) return ''
  
  let text = template.template
  Object.entries(variables).forEach(([key, value]) => {
    text = text.replace(new RegExp('\\{' + key + '\\}', 'g'), value)
  })
  
  return text
}
