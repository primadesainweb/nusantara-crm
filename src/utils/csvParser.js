/**
 * CSV Parser Utility
 * Wrapper around PapaParse for consistent CSV handling
 */
import Papa from 'papaparse'

/**
 * Parse CSV file with PapaParse
 * @param {File} file - The CSV file to parse
 * @param {Function} callback - Called with { data, errors, meta } when complete
 */
export function parseCSV(file, callback) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
    complete: (results) => {
      callback({
        data: results.data,
        errors: results.errors,
        meta: results.meta
      })
    },
    error: (error) => {
      callback({
        data: [],
        errors: [error.message],
        meta: {}
      })
    }
  })
}

/**
 * Validate CSV data for Jamaah import
 * @param {Array} data - Array of parsed CSV objects
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateCSVData(data) {
  const errors = []
  const requiredFields = ['nama', 'nik', 'tanggalLahir', 'jenisKelamin', 'noHp', 'alamat']

  // Validate row count
  if (!data || data.length === 0) {
    errors.push('File CSV kosong atau tidak memiliki data')
    return { valid: false, errors }
  }

  // Validate headers
  const firstRow = data[0]
  const headers = Object.keys(firstRow)
  const missingHeaders = requiredFields.filter(f => !headers.includes(f))
  if (missingHeaders.length > 0) {
    errors.push(`Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}`)
  }

  // Validate each row
  data.forEach((row, idx) => {
    const rowNum = idx + 2 // +2 for 1-indexed and header row

    requiredFields.forEach(field => {
      const value = row[field]
      if (!value || value.toString().trim() === '') {
        errors.push(`Baris ${rowNum}: field "${field}" wajib diisi`)
      }
    })

    // NIK validation
    if (row.nik) {
      const nik = row.nik.toString().replace(/\s/g, '')
      if (!/^\d{16}$/.test(nik)) {
        errors.push(`Baris ${rowNum}: NIK harus 16 digit angka`)
      }
    }

    // Date validation
    if (row.tanggalLahir) {
      const date = new Date(row.tanggalLahir)
      if (isNaN(date.getTime())) {
        errors.push(`Baris ${rowNum}: format tanggal lahir tidak valid (gunakan YYYY-MM-DD)`)
      }
    }

    // Email validation
    if (row.email && row.email.toString().trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(row.email)) {
        errors.push(`Baris ${rowNum}: format email tidak valid`)
      }
    }

    // Jenis Kelamin validation
    if (row.jeniskelamin && !['laki-laki', 'perempuan'].includes(row.jeniskelamin.toString().toLowerCase())) {
      errors.push(`Baris ${rowNum}: jenis kelamin harus "Laki-laki" atau "Perempuan"`)
    }
  })

  // Limit error count to avoid huge lists
  const limitedErrors = errors.slice(0, 20)
  if (errors.length > 20) {
    limitedErrors.push(`...dan ${errors.length - 20} error lainnya (perbaiki error di atas terlebih dahulu)`)
  }

  return {
    valid: errors.length === 0,
    errors: limitedErrors
  }
}

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of header names (keys)
 * @returns {string} CSV string
 */
export function toCSV(data, headers) {
  const headerRow = headers.join(',')
  const dataRows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? ''
      // Escape quotes and wrap in quotes if contains comma
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects
 * @param {Array} headers - Array of { key, label } objects
 * @param {string} filename - Download filename
 */
export function downloadCSV(data, headers, filename = 'export.csv') {
  const headerRow = headers.map(h => h.label || h.key)
  const keys = headers.map(h => h.key)

  const csv = toCSV(data, keys)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default {
  parseCSV,
  validateCSVData,
  toCSV,
  downloadCSV
}
