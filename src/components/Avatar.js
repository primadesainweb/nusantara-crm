/**
 * Avatar Component (T-16)
 * User avatar with image support and initials fallback
 */
import { getInitials, getAvatarColor } from '../utils/helpers.js'

export function Avatar({
  name = '',
  src = null,
  size = 'md',
  className = ''
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  }

  const sizeCls = sizes[size] || sizes.md
  const initials = getInitials(name)
  const colorCls = getAvatarColor(name)

  // If src is provided and valid, show image
  if (src) {
    return `<img src="${src}" alt="${name}" class="${sizeCls} rounded-full object-cover ${className}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
           <div class="${sizeCls} ${colorCls} rounded-full flex items-center justify-center font-semibold ${className}" style="display:none">${initials}</div>`
  }

  // Fallback to initials
  return `<div class="${sizeCls} ${colorCls} rounded-full flex items-center justify-center font-semibold ${className}">${initials}</div>`
}

// Avatar with online status indicator
export function AvatarWithStatus({
  name = '',
  src = null,
  size = 'md',
  status = null, // 'online', 'offline', 'away'
  className = ''
}) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
  }

  const statusSizeCls = size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const positionCls = size === 'xs' || size === 'sm' ? '-bottom-0.5 -right-0.5' : '-bottom-0.5 -right-0.5'

  const avatarHtml = Avatar({ name, src, size, className })

  if (status) {
    return `<div class="relative inline-block">
      ${avatarHtml}
      <span class="absolute ${positionCls} ${statusColors[status] || 'bg-gray-400'} rounded-full border-2 border-white ${statusSizeCls}"></span>
    </div>`
  }

  return avatarHtml
}

// Avatar group (stacked avatars)
export function AvatarGroup({
  avatars = [], // Array of { name, src }
  max = 4,
  size = 'md'
}) {
  const shown = avatars.slice(0, max)
  const remaining = avatars.length - max

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }
  const sizeCls = sizes[size] || sizes.md
  const overlapCls = size === 'xs' || size === 'sm' ? '-ml-2' : '-ml-3'

  return `<div class="flex items-center">
    ${shown.map((a, i) => `
      <div class="relative ${i > 0 ? overlapCls : ''}" style="z-index:${max - i}">
        ${Avatar({ name: a.name, src: a.src, size, className: 'ring-2 ring-white' })}
      </div>
    `).join('')}
    ${remaining > 0 ? `<div class="${sizeCls} ${overlapCls} bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">+${remaining}</div>` : ''}
  </div>`
}

export default Avatar
