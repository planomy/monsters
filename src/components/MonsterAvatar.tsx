import { useState, type CSSProperties } from 'react'

interface MonsterAvatarProps {
  index: number
  name: string
  size?: number
}

const MONSTER_COLORS = [
  '#9333ea', '#a855f7', '#7c3aed', '#6d28d9', '#c084fc',
  '#8b5cf6', '#a78bfa', '#7e22ce', '#581c87', '#4c1d95',
]

// Bump when monster PNGs change — Safari caches image URLs aggressively.
const MONSTER_ASSET_VERSION = '2'

export function MonsterAvatar({ index, name, size }: MonsterAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const color = MONSTER_COLORS[index % MONSTER_COLORS.length]
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const src = `${window.location.origin}${import.meta.env.BASE_URL}monsters/${String(index).padStart(2, '0')}.png?v=${MONSTER_ASSET_VERSION}`
  const dimensionStyle = size
    ? ({ width: size, height: size, flexShrink: 0 } as CSSProperties)
    : undefined

  if (!imgError) {
    return (
      <img
        className="monster-avatar__img"
        src={src}
        alt={`${name}'s monster`}
        style={dimensionStyle}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className="monster-avatar__placeholder"
      style={{ '--monster-color': color, ...dimensionStyle } as CSSProperties}
    >
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <ellipse cx="40" cy="52" rx="28" ry="22" fill="var(--monster-color)" opacity="0.9" />
        <ellipse cx="40" cy="38" rx="22" ry="20" fill="var(--monster-color)" />
        <circle cx="30" cy="36" r="5" fill="#fff" />
        <circle cx="50" cy="36" r="5" fill="#fff" />
        <circle cx="31" cy="36" r="2.5" fill="#1a1a1a" />
        <circle cx="51" cy="36" r="2.5" fill="#1a1a1a" />
        <path d="M32 48 Q40 54 48 48" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        {(index % 3 === 0) && <ellipse cx="22" cy="28" rx="6" ry="10" fill="var(--monster-color)" />}
        {(index % 3 === 1) && <ellipse cx="58" cy="28" rx="6" ry="10" fill="var(--monster-color)" />}
        {(index % 3 === 2) && (
          <>
            <ellipse cx="22" cy="28" rx="5" ry="9" fill="var(--monster-color)" />
            <ellipse cx="58" cy="28" rx="5" ry="9" fill="var(--monster-color)" />
          </>
        )}
      </svg>
      <span className="monster-avatar__initial">{initial}</span>
    </div>
  )
}
