/**
 * SkeletonLoader Component (T-16)
 * Loading placeholders for various content types
 */

// Base skeleton styles (add to tailwind config or use arbitrary values)
const BASE_CLASS = 'animate-pulse bg-gray-200 rounded'

// Generate skeleton row for tables
export function SkeletonRows(count = 5, cols = 4) {
  return Array(count).fill(0).map(() => `
    <tr class="border-b border-gray-100">
      ${Array(cols).fill(0).map(() => `
        <td class="px-4 py-3">
          <div class="${BASE_CLASS} h-4 w-full"></div>
        </td>
      `).join('')}
    </tr>
  `).join('')
}

// Skeleton for card content
export function SkeletonCard({ lines = 3, showAvatar = true }) {
  return `
    <div class="card p-4 space-y-3">
      ${showAvatar ? `
        <div class="flex items-center gap-3">
          <div class="${BASE_CLASS} w-10 h-10 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="${BASE_CLASS} h-3 w-1/3"></div>
            <div class="${BASE_CLASS} h-2 w-1/4"></div>
          </div>
        </div>
      ` : ''}
      ${Array(lines).fill(0).map((_, i) => `
        <div class="${BASE_CLASS} h-3 w-${['full', '5/6', '4/6', '3/6'][i % 4]}"></div>
      `).join('')}
    </div>
  `
}

// Skeleton for detail view
export function SkeletonDetail() {
  return `
    <div class="space-y-6 animate-pulse">
      <div class="flex items-center gap-4">
        <div class="${BASE_CLASS} w-12 h-12 rounded-full"></div>
        <div class="space-y-2">
          <div class="${BASE_CLASS} h-5 w-48"></div>
          <div class="${BASE_CLASS} h-3 w-32"></div>
        </div>
      </div>
      <div class="card p-6">
        <div class="grid grid-cols-3 gap-4">
          ${Array(6).fill(0).map(() => `
            <div class="space-y-1">
              <div class="${BASE_CLASS} h-2 w-16"></div>
              <div class="${BASE_CLASS} h-4 w-24"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

// Skeleton for list items
export function SkeletonList({ count = 5, avatar = true }) {
  return Array(count).fill(0).map((_, i) => `
    <div class="flex items-center gap-3 p-3 ${i < count - 1 ? 'border-b border-gray-100' : ''}">
      ${avatar ? `<div class="${BASE_CLASS} w-10 h-10 rounded-full shrink-0"></div>` : ''}
      <div class="flex-1 space-y-2">
        <div class="${BASE_CLASS} h-3 w-1/3"></div>
        <div class="${BASE_CLASS} h-2 w-1/4"></div>
      </div>
      <div class="${BASE_CLASS} h-8 w-8 rounded"></div>
    </div>
  `).join('')
}

// Text skeleton (for inline loading)
export function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return `<div class="${BASE_CLASS} ${height} ${width}"></div>`
}

// Circle skeleton (for avatars/icons)
export function SkeletonCircle({ size = 'w-10 h-10' }) {
  return `<div class="${BASE_CLASS} rounded-full ${size}"></div>`
}

// Button skeleton
export function SkeletonButton() {
  return `<div class="${BASE_CLASS} h-10 w-24 rounded-lg"></div>`
}

// Generic skeleton container
export function SkeletonLoader({ variant = 'card', count = 1, ...props }) {
  switch (variant) {
    case 'rows':
      return SkeletonRows(count, props.cols || 4)
    case 'card':
      return Array(count).fill(0).map(() => SkeletonCard(props.lines || 3, props.showAvatar !== false)).join('')
    case 'detail':
      return SkeletonDetail()
    case 'list':
      return SkeletonList(count)
    case 'text':
      return SkeletonText(props)
    case 'circle':
      return SkeletonCircle(props)
    case 'button':
      return SkeletonButton()
    default:
      return SkeletonCard()
  }
}

export default SkeletonLoader
