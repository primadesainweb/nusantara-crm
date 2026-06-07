/**
 * EmptyState Component (T-16)
 * Display when no data is available
 */
export function EmptyState({
  icon = '📭',
  title = 'Belum ada data',
  description = '',
  action = null, // { label, onClick } or HTML string
  className = ''
}) {
  let actionHtml = ''
  if (action) {
    if (typeof action === 'string') {
      actionHtml = action
    } else if (action.label) {
      actionHtml = `<button class="btn-primary mt-4" onclick="${action.onClick ? `(${action.onClick})()` : ''}">${action.label}</button>`
    }
  }

  return `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center ${className}">
      <div class="text-6xl mb-4">${icon}</div>
      <h3 class="font-heading font-semibold text-gray-800 mb-2 text-lg">${title}</h3>
      ${description ? `<p class="text-gray-400 text-sm mb-4 max-w-sm">${description}</p>` : ''}
      ${actionHtml ? `<div class="mt-2">${actionHtml}</div>` : ''}
    </div>
  `
}

// Table-specific empty state (for inside tables)
export function TableEmptyState({
  cols = 5,
  icon = '📭',
  title = 'Tidak ada data',
  description = 'Tidak ada data yang cocok dengan filter Anda'
}) {
  return `
    <tr>
      <td colspan="${cols}" class="text-center py-12">
        ${EmptyState({ icon, title, description })}
      </td>
    </tr>
  `
}

// List-specific empty state
export function ListEmptyState({
  icon = '📋',
  title = 'Daftar kosong',
  description = 'Belum ada item di sini'
}) {
  return EmptyState({ icon, title, description })
}

// Search empty state
export function SearchEmptyState({
  query = '',
  suggestion = 'Coba gunakan kata kunci lain'
}) {
  return EmptyState({
    icon: '🔍',
    title: `Tidak ditemukan hasil untuk "${query}"`,
    description: suggestion
  })
}

export default EmptyState
