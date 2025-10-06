import { useMemo } from "react"
import { type LucideIcon, User, Smile, Heart, Zap, Star } from "lucide-react"
import clsx from "clsx"
import { getColorClasses, type ColorVariant } from "../../utils/colors"

export interface AvatarBadgeProps {
  name?: string
  imageUrl?: string
  color?: ColorVariant
  size?: number
  className?: string
  tooltip?: string
  fixedIcon?: boolean
}

function AvatarBadge({
  name,
  imageUrl,
  size = 48,
  color = "default",
  className,
}: AvatarBadgeProps) {
  // Extract initials from name
  const initials = useMemo(() => {
    if (!name) return null
    const parts = name.trim().split(" ")
    const first = parts[0]?.[0]?.toUpperCase() ?? ""
    const last =
      parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() : ""
    return `${first}${last}`
  }, [name])

  // Fallback icons pool
  const fallbackIcons: LucideIcon[] = [User, Smile, Heart, Zap, Star]
  const FallbackIcon =
    fallbackIcons[Math.floor(Math.random() * fallbackIcons.length)]

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full border shadow-sm aspect-square overflow-hidden",
        "select-none backdrop-blur-sm hover:shadow-md transition-all duration-150",
        getColorClasses(color),
        className
      )}
      style={{ width: size, height: size }}
      title={name || "Anonymous"}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || "Profile picture"}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="text-lg font-semibold">{initials}</span>
      ) : (
        <FallbackIcon className="w-1/2 h-1/2 opacity-70" />
      )}
    </div>
  )
}

export default AvatarBadge
